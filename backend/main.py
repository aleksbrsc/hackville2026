from fastapi import Request, FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv
from typing import List, Dict, Any
import asyncio

import os

from pavfunctions import stimulate 
from workflow_engine import (
    Workflow, 
    create_session, 
    get_session, 
    delete_session
)

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

elevenlabs = ElevenLabs(
    api_key=os.getenv("ELEVENLABS_API_KEY")
)

class Stimulus(BaseModel):
    mode: str
    value: int
    repeats: int
    interval: float


class TextSearchRequest(BaseModel):
    text: str
    search_string: str
    mode: str
    value: int
    repeats: int
    interval: float


@app.post("/check-text")
async def check_text(request: TextSearchRequest):
    exists = request.search_string.lower() in request.text.lower()
    
    if exists:
        stimulate(request.mode, request.value, request.repeats, request.interval)
    
    return {"exists": exists}


@app.post("/trigger-stimulus")
async def trigger_stimulus(stimulus: Stimulus):
    print(f"🔔 STIMULUS TRIGGERED: mode={stimulus.mode}, value={stimulus.value}, repeats={stimulus.repeats}, interval={stimulus.interval}")
    stimulate(stimulus.mode, stimulus.value, stimulus.repeats, stimulus.interval)

    return "Ok"

@app.get("/scribe-token")
async def get_scribe_token():
    token = elevenlabs.tokens.single_use.create("realtime_scribe")
    return token

class SessionStartRequest(BaseModel):
    workflow: Workflow

class SessionStartResponse(BaseModel):
    session_id: str

class TranscriptRequest(BaseModel):
    session_id: str
    transcript: str

class TranscriptResponse(BaseModel):
    actions_executed: int
    actions: List[Dict[str, Any]]
    active_nodes: List[str]  # Nodes currently listening (yellow)
    executed_nodes: List[str]  # Nodes just executed (green)
    executed_edges: List[str]  # Edges just traversed (green)

@app.post("/api/session/start")
async def start_session(request: SessionStartRequest) -> SessionStartResponse:
    """Start a new workflow execution session"""
    session_id = create_session(request.workflow)
    return SessionStartResponse(session_id=session_id)

@app.post("/api/session/transcript")
async def process_transcript(request: TranscriptRequest) -> TranscriptResponse:
    """Process transcript against active workflow triggers"""
    session = get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Process transcript and get actions + executed nodes/edges
    actions, executed_node_ids, executed_edge_ids = session.process_transcript(request.transcript)
    
    # Execute actions
    for action in actions:
        if action['type'] == 'stimulus':
            stimulate(
                action['mode'],
                action['value'],
                action['repeats'],
                action['interval']
            )
        elif action['type'] == 'wait':
            await asyncio.sleep(action['seconds'])
    
    return TranscriptResponse(
        actions_executed=len(actions),
        actions=actions,
        active_nodes=session.active_nodes,  # Currently listening triggers (yellow)
        executed_nodes=executed_node_ids,  # Just executed nodes (green)
        executed_edges=executed_edge_ids  # Just traversed edges (green)
    )

class SessionStopRequest(BaseModel):
    session_id: str

@app.post("/api/session/stop")
async def stop_session(request: SessionStopRequest):
    """Stop and delete a workflow execution session"""
    success = delete_session(request.session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "stopped"}

