import WorkflowEditor from "./components/WorkflowEditor";
import { useScribeRecorder } from "./components/ScribeRecorder";

function App() {
  const { isConnected, startRecording, stopRecording } = useScribeRecorder();

  return (
    <div>
      <WorkflowEditor
        onStartSession={startRecording}
        onStopSession={stopRecording}
        isSessionActive={isConnected}
      />
    </div>
  );
}

export default App;
