import { useScribe } from "@elevenlabs/react";

function ScribeRecorder() {
    const scribe = useScribe({
        modelId: "scribe_v2_realtime",
        onPartialTranscript: (data) => {
            console.log("Partial:", data.text);
        },
        onCommittedTranscript: (data) => {
            console.log("Committed:", data.text);
        },
        onCommittedTranscriptWithTimestamps: (data) => {
            console.log("Committed with timestamps:", data.text);
            console.log("Timestamps:", data.words);
        },
    });

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

    const fetchTokenFromServer = async () => {
        const response = await fetch('http://localhost:8000/scribe-token');
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

    return (
        <div>
            <button onClick={handleStart} disabled={scribe.isConnected}>
                Start Recording
            </button>
            <button onClick={scribe.disconnect} disabled={!scribe.isConnected}>
                Stop
            </button>

            {scribe.partialTranscript && <p>Live: {scribe.partialTranscript}</p>}

            <div>
                {scribe.committedTranscripts.map((t) => (
                    <p key={t.id}>{t.text}</p>
                ))}
            </div>
        </div>
    );
}

export default ScribeRecorder;
