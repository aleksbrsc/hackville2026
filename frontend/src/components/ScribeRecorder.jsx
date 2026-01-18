import { useScribe } from "@elevenlabs/react";
import { analyseTranscript } from "../lib/GeminiAnalysis";

export function useScribeRecorder() {
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: "vad",
    vadSilenceThresholdSecs: 1,
    onPartialTranscript: (data) => {
      console.log("Partial:", data.text);
    },
    onCommittedTranscript: async (data) => {
      console.log("Committed:", data.text);
      const analysis = await analyseTranscript(data.text);
      console.log("Analysis:", analysis);
    },
  });

  const fetchTokenFromServer = async () => {
    const response = await fetch("http://localhost:8000/scribe-token");
    const data = await response.json();
    return data.token;
  };

  const handleStart = async () => {
    const token = await fetchTokenFromServer();

    await scribe.connect({
      token,
      microphone: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
  };

  return {
    isConnected: scribe.isConnected,
    startRecording: handleStart,
    stopRecording: scribe.disconnect,
  };
}
