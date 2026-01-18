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
      console.log("Partial:", data.text);
    },
    onCommittedTranscript: async (data) => {
      console.log("Committed:", data.text);

      const config = configRef.current;

      // Handle keyword triggers via check-text endpoint
      if (config.keywordTriggers && config.keywordTriggers.length > 0) {
        for (const trigger of config.keywordTriggers) {
          try {
            const response = await fetch("http://localhost:8000/check-text", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: data.text,
                search_string: trigger.keyword,
                mode: trigger.action.mode,
                type: trigger.action.type,
              }),
            });
            const result = await response.json();
            if (result.exists) {
              console.log(
                `Keyword "${trigger.keyword}" detected - stimulus triggered`,
              );
            }
          } catch (error) {
            console.error("Error checking keyword:", error);
          }
        }
      }

      // Handle prompt triggers via Gemini
      if (config.promptTriggers && config.promptTriggers.length > 0) {
        const analysis = await analyseTranscript(
          data.text,
          config.promptTriggers,
        );
        console.log("Analysis:", analysis);
      }
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
