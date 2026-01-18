import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_PROMPT = `You are a system that will be helping Neurodivergent people have more natural conversations in social contexts. You will be fed transcripts of conversations that a neurodivergent user is having, and will have to help them in different ways. The way to help the user is by signalling different things to them that you can notice but may be hard for them to notice due to their neurodivergence. 

Different users have different things that they need help with, so they have defined a list of "triggers" for you to notice, accompanied by the signals that you should give when each trigger happens. The signals happen through a wearable device that can either vibrate on the user's wrist or emit a sound. 

You have been provided with a function that you can call. Your main task is to analyze the transcript given to you, check if there are any triggers, and if there are, call the trigger stimulus function with the parameter values that were given to you.

Below are the triggers for the current user:
- "Politics have been brought up" -> mode: "vibe", value: 100, repeats: 1, interval: 0
- "Sexual topics have been brought up" -> mode: "beep", value: 50, repeats: 1, interval: 0`;

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
      value: {
        type: Type.NUMBER,
        description:
          "The strength (for vibration) or loudness (for sound), range 0-100",
      },
      repeats: {
        type: Type.NUMBER,
        description: "How many times to emit the stimulus",
      },
      interval: {
        type: Type.NUMBER,
        description: "Seconds between repeats",
      },
    },
    required: ["mode", "value", "repeats", "interval"],
  },
};

const triggerStimulusServer = async (mode, value, repeats, interval) => {
  await fetch("http://localhost:8000/trigger-stimulus", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode,
      value,
      repeats,
      interval,
    }),
  });
};

export async function analyseTranscript(text) {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: `${SYSTEM_PROMPT}\n\nTranscript: "${text}"`,
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
        const { mode, value, repeats, interval } = functionCall.args;
        await triggerStimulusServer(mode, value, repeats, interval);
      }
    }
    return `Triggered ${response.functionCalls.length} stimulus(es)`;
  } else {
    console.log("No triggers detected in transcript");
    return "No triggers detected";
  }
}
