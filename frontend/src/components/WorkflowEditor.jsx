import { useCallback, useEffect, useRef, useState, useMemo } from "react";
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
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Prevent deletion of start trigger node
  const onNodesChange = useCallback(
    (changes) => {
      const filteredChanges = changes.filter((change) => {
        if (change.type === "remove") {
          const nodeToRemove = nodes.find((n) => n.id === change.id);
          if (nodeToRemove?.data?.isStart) {
            return false; // Prevent deletion of start trigger
          }
        }
        return true;
      });
      onNodesChangeInternal(filteredChanges);
    },
    [nodes, onNodesChangeInternal],
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeNodeIds, setActiveNodeIds] = useState([]);
  const [activeEdgeIds, setActiveEdgeIds] = useState([]);
  const startNodeId = useRef(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const executionAbortRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  // Evaluate conditional expression
  const evaluateCondition = useCallback(
    (parameter, operator, compareValue, triggerData) => {
      const actualValue = triggerData[parameter];
      const compareNum = parseFloat(compareValue);
      const actualNum = parseFloat(actualValue);

      switch (operator) {
        case ">":
          return actualNum > compareNum;
        case "<":
          return actualNum < compareNum;
        case ">=":
          return actualNum >= compareNum;
        case "<=":
          return actualNum <= compareNum;
        case "===":
          return actualValue === compareValue;
        case "!==":
          return actualValue !== compareValue;
        default:
          return false;
      }
    },
    [],
  );

  // Execute workflow starting from start trigger
  const executeWorkflow = useCallback(async () => {
    const startNode = nodes.find((n) => n.data.isStart);
    if (!startNode) {
      console.error("No start trigger found");
      return;
    }

    setIsExecuting(true);
    executionAbortRef.current = false;
    setActiveNodeIds([]);
    setActiveEdgeIds([]);

    // Get trigger data from start node
    const triggerData = {
      seconds: startNode.data.seconds || 0,
      triggerType: startNode.data.triggerType,
    };

    // Recursive function to execute nodes
    const executeNode = async (nodeId, currentTriggerData) => {
      if (executionAbortRef.current) return;

      const node = nodesRef.current.find((n) => n.id === nodeId);
      if (!node) return;

      // Highlight active node
      setActiveNodeIds([nodeId]);
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (node.type === "action") {
        // Execute action via backend API
        try {
          const response = await fetch(
            "http://localhost:8000/trigger-stimulus",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mode: node.data.actionType,
                type: node.data.stimulusType || "single",
              }),
            },
          );
          if (!response.ok) {
            console.error("Action execution failed:", await response.text());
          }
        } catch (error) {
          console.error("Action execution error:", error);
        }

        await new Promise((resolve) => setTimeout(resolve, 300));
      } else if (node.type === "conditional") {
        // Evaluate condition
        const result = evaluateCondition(
          node.data.parameter,
          node.data.operator,
          node.data.compareValue,
          currentTriggerData,
        );

        // Find the correct branch edge
        const branchEdge = edgesRef.current.find(
          (e) =>
            e.source === nodeId &&
            e.sourceHandle === (result ? "true" : "false"),
        );

        if (branchEdge) {
          // Highlight the taken branch
          setActiveEdgeIds([branchEdge.id]);
          await new Promise((resolve) => setTimeout(resolve, 300));
          await executeNode(branchEdge.target, currentTriggerData);
        }
        return;
      } else if (node.type === "trigger" && !node.data.isStart) {
        // Non-start trigger: update trigger data
        currentTriggerData = {
          seconds: node.data.seconds || 0,
          triggerType: node.data.triggerType,
        };
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // Find outgoing edges (skip for conditionals as they're handled above)
      if (node.type !== "conditional") {
        const outgoingEdges = edgesRef.current.filter(
          (e) => e.source === nodeId,
        );
        for (const edge of outgoingEdges) {
          if (executionAbortRef.current) break;
          setActiveEdgeIds([edge.id]);
          await new Promise((resolve) => setTimeout(resolve, 200));
          await executeNode(edge.target, currentTriggerData);
        }
      }
    };

    await executeNode(startNode.id, triggerData);

    // Clear highlights
    setActiveNodeIds([]);
    setActiveEdgeIds([]);
    setIsExecuting(false);
  }, [nodes, edges, evaluateCondition]);

  // Stop execution
  const stopExecution = useCallback(() => {
    executionAbortRef.current = true;
    setActiveNodeIds([]);
    setActiveEdgeIds([]);
    setIsExecuting(false);
  }, []);

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
        position: { x: 250, y: 150 },
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
          triggerType: "prompt",
          prompt: "",
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
      position: { x: 250, y: 150 },
      data: {
        onChange: onNodeDataChange,
        triggerType: "prompt",
        prompt: "",
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
            ? { triggerType: "prompt", prompt: "", isStart: false }
            : {}),
          ...(type === "action"
            ? { actionType: "vibe", stimulusType: "single", seconds: 15 }
            : {}),
          ...(type === "conditional"
            ? { parameter: "value", operator: ">", compareValue: "50" }
            : {}),
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, onNodeDataChange, nodes, getParentParameters],
  );

  // Build trigger configuration from workflow nodes
  const buildTriggerConfig = useCallback(() => {
    const config = {
      keywordTriggers: [],
      promptTriggers: [],
    };

    // Find all trigger nodes
    const triggerNodes = nodes.filter((n) => n.type === "trigger");
    console.log("Found trigger nodes:", triggerNodes);

    triggerNodes.forEach((triggerNode) => {
      // Find connected action nodes
      const outgoingEdges = edges.filter((e) => e.source === triggerNode.id);

      outgoingEdges.forEach((edge) => {
        const actionNode = nodes.find(
          (n) => n.id === edge.target && n.type === "action",
        );

        if (actionNode) {
          const action = {
            mode: actionNode.data.actionType,
            type: actionNode.data.stimulusType || "single",
          };

          if (
            triggerNode.data.triggerType === "keyword" &&
            triggerNode.data.keyword
          ) {
            config.keywordTriggers.push({
              keyword: triggerNode.data.keyword,
              action,
            });
          } else if (
            triggerNode.data.triggerType === "prompt" &&
            triggerNode.data.prompt
          ) {
            config.promptTriggers.push({
              prompt: triggerNode.data.prompt,
              action,
            });
          }
        }
      });
    });

    console.log("Final triggers config:", config);
    return config;
  }, [nodes, edges]);

  // Check if any action node is reachable from start trigger
  const canExecute = useMemo(() => {
    const startNode = nodes.find((n) => n.data.isStart);
    if (!startNode) return false;

    // Traverse graph to find if any action node is reachable
    const visited = new Set();
    const queue = [startNode.id];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const currentNode = nodes.find((n) => n.id === currentId);
      if (currentNode?.type === "action") {
        return true; // Found an action node
      }

      // Add connected nodes to queue
      const outgoingEdges = edges.filter((e) => e.source === currentId);
      outgoingEdges.forEach((edge) => queue.push(edge.target));
    }

    return false; // No action node found
  }, [nodes, edges]);

  // Apply active class to nodes
  const nodesWithActiveClass = nodes.map((node) => ({
    ...node,
    className: activeNodeIds.includes(node.id) ? "active" : "",
  }));

  // Apply active class to edges
  const edgesWithActiveClass = edges.map((edge) => ({
    ...edge,
    className: activeEdgeIds.includes(edge.id) ? "active" : "",
  }));

  const handleStartSession = useCallback(() => {
    const config = buildTriggerConfig();
    console.log("Starting session with config:", config);
    onStartSession(config);
  }, [buildTriggerConfig, onStartSession]);

  return (
    <div className={styles.workflow_editor}>
      <Sidebar
        onAddNode={addNode}
        onReset={handleReset}
        onStartSession={handleStartSession}
        onStopSession={onStopSession}
        isSessionActive={isSessionActive}
        onExecute={executeWorkflow}
        onStop={stopExecution}
        isExecuting={isExecuting}
        canExecute={canExecute}
      />
      <div className={styles.flow_container}>
        <ReactFlow
          nodes={nodesWithActiveClass}
          edges={edgesWithActiveClass}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 250, y: 150, zoom: 1 }}
          minZoom={0.5}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="var(--canvas_dots)" gap={16} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
