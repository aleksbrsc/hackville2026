import { GoogleGenAI } from "@google/genai";

SYSTEM_PROMPT = ``;

const triggerStimulusServer = async () => {
    await fetch('http://localhost:8000/trigger-stimulus', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            mode: "vibe",
            value: 100,
            repeats: 1,
            interval: 0
        }),
    });
}

async function analyseTranscript(text) {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: "Explain how AI works in a few words",
    });
    console.log(response.text);
}

