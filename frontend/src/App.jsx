import { useState } from "react";
import WorkflowEditor from "./components/WorkflowEditor";
import { useScribeRecorder } from "./components/ScribeRecorder";

function App() {
  const [triggerConfig, setTriggerConfig] = useState({ keywordTriggers: [], promptTriggers: [] });
  const { isConnected, startRecording, stopRecording } = useScribeRecorder(triggerConfig);

  const handleStartSession = async (config) => {
    setTriggerConfig(config);
    // Wait for next tick to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 0));
    await startRecording();
  };

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      <WorkflowEditor
        onStartSession={handleStartSession}
        onStopSession={stopRecording}
        isSessionActive={isConnected}
      />
    </div>
  );
}

export default App;
