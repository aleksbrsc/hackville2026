import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import TriggerNode from "./nodes/TriggerNode";
import ActionNode from "./nodes/ActionNode";
import ConditionalNode from "./nodes/ConditionalNode";
import Sidebar from "./Sidebar";
import styles from "../styles/workflow_editor.module.css";

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  conditional: ConditionalNode,
};

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

export default function WorkflowEditor({
  onStartSession,
  onStopSession,
  isSessionActive,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [executionState, setExecutionState] = useState({});
  const [activeNodeIds, setActiveNodeIds] = useState([]);
  const startNodeId = useRef(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  // Keep refs in sync with state
  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  // Helper function to find closest ancestor trigger node
  const getAncestorTrigger = useCallback((nodeId) => {
    const currentEdges = edgesRef.current;
    const currentNodes = nodesRef.current;

    let currentNodeId = nodeId;
    const visited = new Set();

    while (currentNodeId && !visited.has(currentNodeId)) {
      visited.add(currentNodeId);

      const incomingEdge = currentEdges.find((e) => e.target === currentNodeId);
      if (!incomingEdge) return null;

      const parentNode = currentNodes.find((n) => n.id === incomingEdge.source);
      if (!parentNode) return null;

      if (parentNode.type === "trigger") {
        return parentNode;
      }

      currentNodeId = parentNode.id;
    }

    return null;
  }, []);

  // Helper function to get available parameters from ancestor trigger node
  const getParentParameters = useCallback(
    (nodeId) => {
      const trigger = getAncestorTrigger(nodeId);
      if (!trigger) return [];

      const params = [];
      // Only triggers have dynamic parameters worth evaluating
      params.push({ id: "seconds", label: "Seconds" });
      return params;
    },
    [getAncestorTrigger],
  );

  const onConnect = useCallback(
    (params) => {
      // Check if source is a conditional node and add label
      const sourceNode = nodes.find((n) => n.id === params.source);
      const edgeLabel =
        sourceNode?.type === "conditional" && params.sourceHandle
          ? params.sourceHandle
          : "";

      const newEdge = {
        ...params,
        label: edgeLabel,
        labelStyle: { fill: "var(--light)", fontWeight: 500 },
        labelBgStyle: { fill: "var(--foreground)" },
      };

      setEdges((eds) => addEdge(newEdge, eds));

      // Update conditional nodes with new parent parameters
      const targetNode = nodes.find((n) => n.id === params.target);
      if (targetNode?.type === "conditional") {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === params.target && node.type === "conditional") {
              return {
                ...node,
                data: {
                  ...node.data,
                  getParentParameters: () => getParentParameters(node.id),
                },
              };
            }
            return node;
          }),
        );
      }
    },
    [setEdges, nodes, setNodes, getParentParameters],
  );

  // Initialize with a start trigger node
  useEffect(() => {
    if (nodes.length === 0) {
      const id = getNodeId();
      startNodeId.current = id;
      const startNode = {
        id,
        type: "trigger",
        position: { x: 0, y: 0 },
        data: {
          onChange: (nodeId, field, value) => {
            setNodes((nds) =>
              nds.map((node) => {
                if (node.id === nodeId) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      [field]: value,
                    },
                  };
                }
                return node;
              }),
            );
          },
          triggerType: "timer",
          seconds: 5,
          isStart: true,
        },
      };
      setNodes([startNode]);
    }
  }, []);

  // Custom nodes change handler to prevent deletion of start trigger
  const handleNodesChange = useCallback(
    (changes) => {
      // Filter out any attempts to delete the start trigger
      const filteredChanges = changes.filter((c) => {
        if (c.type === "remove") {
          const node = nodes.find((n) => n.id === c.id);
          // Prevent deletion if it's the start trigger
          return !(node && node.data?.isStart);
        }
        return true;
      });
      onNodesChange(filteredChanges);
    },
    [nodes, onNodesChange],
  );

  const onNodeDataChange = useCallback(
    (nodeId, field, value) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                [field]: value,
              },
            };
          }
          return node;
        }),
      );
    },
    [setNodes],
  );

  const handleReset = useCallback(() => {
    // Reset node ID counter
    nodeId = 0;
    // Create fresh start node
    const id = getNodeId();
    startNodeId.current = id;
    const startNode = {
      id,
      type: "trigger",
      position: { x: 0, y: 0 },
      data: {
        onChange: onNodeDataChange,
        triggerType: "timer",
        seconds: 5,
        isStart: true,
      },
    };
    // Reset to initial state with just the start node
    setNodes([startNode]);
    setEdges([]);
  }, [setNodes, setEdges, onNodeDataChange]);

  const addNode = useCallback(
    (type) => {
      const id = getNodeId();

      // Find the rightmost node position
      const rightmostX =
        nodes.length > 0
          ? Math.max(...nodes.map((node) => node.position.x))
          : 0;

      // Position new node to the right of the rightmost node with spacing
      const newNode = {
        id,
        type,
        position: {
          x: rightmostX + 300,
          y: Math.random() * 100,
        },
        data: {
          onChange: onNodeDataChange,
          getParentParameters:
            type === "conditional" ? () => getParentParameters(id) : undefined,
          ...(type === "trigger"
            ? { triggerType: "timer", seconds: 5, isStart: false }
            : {}),
          ...(type === "action" ? { actionType: "vibe", value: 50 } : {}),
          ...(type === "conditional"
            ? { parameter: "value", operator: ">", compareValue: "50" }
            : {}),
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, onNodeDataChange, nodes, getParentParameters],
  );

  return (
    <div className={styles.workflow_editor}>
      <Sidebar
        onAddNode={addNode}
        onReset={handleReset}
        onStartSession={onStartSession}
        onStopSession={onStopSession}
        isSessionActive={isSessionActive}
      />
      <div className={styles.flow_container}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 250, y: 250, zoom: 0.8 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
