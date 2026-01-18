import { useState } from "react";
import WorkflowEditor from "./components/WorkflowEditor";
import { useScribeRecorder } from "./components/ScribeRecorder";

function App() {
<<<<<<< HEAD
  const { isConnected, startRecording, stopRecording, setSessionId: setScribeSessionId, setActiveNodesCallback, setExecutedNodesCallback } = useScribeRecorder();
  const [sessionId, setSessionId] = useState(null);
  const [activeNodes, setActiveNodes] = useState([]);
  const [executedNodes, setExecutedNodes] = useState([]);
  const [executedEdges, setExecutedEdges] = useState([]);
  const [isStarting, setIsStarting] = useState(false);

  // Set callbacks for node state updates
  setActiveNodesCallback(setActiveNodes);
  setExecutedNodesCallback(setExecutedNodes);

  const handleResetVisualFeedback = () => {
    setActiveNodes([]);
    setExecutedNodes([]);
    setExecutedEdges([]);
    window.__executedEdges = [];
  };

  const handleStartSession = async (workflow) => {
    try {
      setIsStarting(true);
      
      // Clear previous execution state
      setExecutedNodes([]);
      setExecutedEdges([]);
      window.__executedEdges = [];
      
      // Start workflow session on backend
      const response = await fetch('http://localhost:8000/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow })
      });
      
      const data = await response.json();
      setSessionId(data.session_id);
      setScribeSessionId(data.session_id);
      
      // Set start trigger as active (yellow)
      const startNode = workflow.nodes.find(n => n.data.isStart);
      if (startNode) {
        setActiveNodes([startNode.id]);
      }
      
      // Start audio recording
      await startRecording();
      
      setIsStarting(false);
    } catch (error) {
      console.error('Failed to start session:', error);
      setIsStarting(false);
    }
  };

  const handleStopSession = async () => {
    try {
      // Stop recording first
      await stopRecording();
      
      // Stop backend session
      if (sessionId) {
        await fetch('http://localhost:8000/api/session/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        });
        setSessionId(null);
        setScribeSessionId(null);
      }
      
      // Clear visual feedback
      setActiveNodes([]);
      setExecutedNodes([]);
      setExecutedEdges([]);
      window.__executedEdges = [];
    } catch (error) {
      console.error('Failed to stop session:', error);
    }
=======
  const [triggerConfig, setTriggerConfig] = useState([]);
  const { isConnected, startRecording, stopRecording } = useScribeRecorder(triggerConfig);

  const handleStartSession = async (config) => {
    setTriggerConfig(config);
    // Wait for next tick to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 0));
    await startRecording();
>>>>>>> ca03dc2 (feat(frontend): prompt type trigger done)
  };

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      <WorkflowEditor
        onStartSession={handleStartSession}
<<<<<<< HEAD
        onStopSession={handleStopSession}
=======
        onStopSession={stopRecording}
>>>>>>> ca03dc2 (feat(frontend): prompt type trigger done)
        isSessionActive={isConnected}
        isStarting={isStarting}
        sessionId={sessionId}
        activeNodes={activeNodes}
        executedNodes={executedNodes}
        setActiveNodes={setActiveNodes}
        onResetVisualFeedback={handleResetVisualFeedback}
      />
    </div>
  );
}

export default App;
