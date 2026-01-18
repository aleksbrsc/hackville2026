import { useScribe } from "@elevenlabs/react";
import { useRef, useEffect } from "react";
import { analyseTranscript } from "../lib/GeminiAnalysis";

export function useScribeRecorder(triggerConfig = []) {
  const configRef = useRef(triggerConfig);

  // Keep ref in sync with prop
  useEffect(() => {
    configRef.current = triggerConfig;
  }, [triggerConfig]);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: "vad",
    vadSilenceThresholdSecs: 1,
    onPartialTranscript: (data) => {
      // Partial transcripts - no logging to improve performance
    },
    onCommittedTranscript: async (data) => {
      console.log("Committed:", data.text);
      const analysis = await analyseTranscript(data.text, configRef.current);
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

  const setSessionId = (id) => {
    sessionIdRef.current = id;
  };

  const setActiveNodesCallback = (callback) => {
    setActiveNodesRef.current = callback;
  };

  const setExecutedNodesCallback = (callback) => {
    setExecutedNodesRef.current = callback;
  };

  return {
    isConnected: scribe.isConnected,
    startRecording: handleStart,
    stopRecording: scribe.disconnect,
    setSessionId,
    setActiveNodesCallback,
    setExecutedNodesCallback,
  };
}
