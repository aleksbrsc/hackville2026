import { GoogleGenAI, Type } from "@google/genai";

const buildSystemPrompt = (triggerConfig) => {
  const triggerList = triggerConfig
    .map((t) => {
      return `- ${t.prompt} -> mode: "${t.action.mode}", type: "${t.action.type}"`;
    })
    .join("\n");

  return `You are a system that will be helping Neurodivergent people have more natural conversations in social contexts. You will be fed transcripts of conversations that a neurodivergent user is having, and will have to help them in different ways. The way to help the user is by signalling different things to them that you can notice but may be hard for them to notice due to their neurodivergence. 

Different users have different things that they need help with, so they have defined a list of "triggers" for you to notice, accompanied by the signals that you should give when each trigger happens. The signals happen through a wearable device that can either vibrate on the user's wrist or emit a sound. 

You have been provided with a function that you can call. Your main task is to analyze the transcript given to you, check if there are any triggers, and if there are, call the trigger stimulus function with the parameter values that were given to you.

Below are the triggers for the current user:
${triggerList || "No triggers configured"}`;
};

const triggerStimulusFunctionDeclaration = {
  name: "trigger_stimulus",
  description:
    "Triggers a stimulus on the user's wearable device (vibration or sound) when a conversational trigger is detected.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      mode: {
        type: Type.STRING,
        description:
          'The type of stimulus: "vibe" for vibration or "beep" for sound',
        enum: ["vibe", "beep"],
      },
      type: {
        type: Type.STRING,
        description:
          'The stimulus pattern: "single" for one pulse, "double" for two pulses, "triple" for three pulses, "long" for a sustained pulse, "heartbeat" for a heartbeat pattern, or "breathing" for a breathing exercise pattern',
        enum: ["single", "double", "triple", "long", "heartbeat", "breathing"],
      },
    },
    required: ["mode", "type"],
  },
};

const triggerStimulusServer = async (mode, type) => {
  await fetch("http://localhost:8000/trigger-stimulus", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode,
      type,
    }),
  });
};

export async function analyseTranscript(text, triggerConfig = []) {
  const systemPrompt = buildSystemPrompt(triggerConfig);
  console.log(systemPrompt);
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: `${systemPrompt}\n\nTranscript: "${text}"`,
    config: {
      tools: [
        {
          functionDeclarations: [triggerStimulusFunctionDeclaration],
        },
      ],
    },
  });

  // Check for function calls in the response
  if (response.functionCalls && response.functionCalls.length > 0) {
    for (const functionCall of response.functionCalls) {
      if (functionCall.name === "trigger_stimulus") {
        console.log(
          `Triggering stimulus: ${JSON.stringify(functionCall.args)}`,
        );
        const { mode, type } = functionCall.args;
        await triggerStimulusServer(mode, type);
      }
    }
    return `Triggered ${response.functionCalls.length} stimulus(es)`;
  } else {
    console.log("No triggers detected in transcript");
    return "No triggers detected";
  }
}
