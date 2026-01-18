import { useState } from "react";
import WorkflowEditor from "./components/WorkflowEditor";
import { useScribeRecorder } from "./components/ScribeRecorder";

function App() {
  const [triggerConfig, setTriggerConfig] = useState({
    keywordTriggers: [],
    promptTriggers: [],
  });
  const { isConnected, startRecording, stopRecording } =
    useScribeRecorder(triggerConfig);

  const handleStartSession = async (config) => {
    setTriggerConfig(config);
    // Wait for next tick to ensure state is updated
    await new Promise((resolve) => setTimeout(resolve, 0));
    await startRecording();
  };

  // Check if running on deployment URL (no backend)
  const isDeployment = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  return (
    <div style={{ height: "100%", display: "flex", position: "relative" }}>
      {isDeployment && (
        <div
          style={{
            position: "fixed",
            top: "16px",
            right: "16px",
            backgroundColor: "var(--accent)",
            color: "var(--background)",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "600",
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          }}
        >
          Frontend Demo Only
        </div>
      )}
      <WorkflowEditor
        onStartSession={handleStartSession}
        onStopSession={stopRecording}
        isSessionActive={isConnected}
      />
    </div>
  );
}

export default App;
