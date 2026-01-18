from fastapi import Request, FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from elevenlabs.client import ElevenLabs
from pymongo import MongoClient
from dotenv import load_dotenv

import os

from pavfunctions import stimulate
from presets import single, double, triple, long, heartbeat, breathing

load_dotenv()
mongo_uri = os.getenv("MONGO_DB_URI")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

elevenlabs = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))


class Stimulus(BaseModel):
    mode: str
    type: str  # single, double, triple, long, heartbeat, breathing
    value: int = None
    repeats: int = None
    interval: float = None


class TextSearchRequest(BaseModel):
    text: str
    search_string: str
    mode: str
    type: str


@app.post("/check-text")
async def check_text(request: TextSearchRequest):
    exists = request.search_string.lower() in request.text.lower()

    if exists:
        # Map type to the appropriate preset function
        type_handlers = {
            "single": single,
            "double": double,
            "triple": triple,
            "long": long,
            "heartbeat": heartbeat,
            "breathing": breathing,
        }

        handler = type_handlers.get(request.type)
        if handler:
            handler(request.mode)

    return {"exists": exists}


@app.post("/trigger-stimulus")
async def trigger_stimulus(stimulus: Stimulus):
    # Map type to the appropriate preset function
    type_handlers = {
        "single": single,
        "double": double,
        "triple": triple,
        "long": long,
        "heartbeat": heartbeat,
        "breathing": breathing,
    }

    handler = type_handlers.get(stimulus.type)
    if handler:
        handler(stimulus.mode)
    else:
        # Fallback to direct stimulate call if type is not recognized
        stimulate(stimulus.mode, stimulus.value, stimulus.repeats, stimulus.interval)

    return "Ok"


@app.get("/scribe-token")
async def get_scribe_token():
    token = elevenlabs.tokens.single_use.create("realtime_scribe")
    return token


@app.get("/triggers")
async def get_triggers():
    client = MongoClient(mongo_uri)

    try:
        database = client.get_database("haptix_db")
        triggers = database.get_collection("triggers")

        trigger_list = []
        for trigger in triggers.find():
            trigger_dict = dict(trigger)
            if "_id" in trigger_dict:
                trigger_dict["_id"] = str(trigger_dict["_id"])
            trigger_list.append(trigger_dict)

        return trigger_list
    except Exception as e:
        print(f"Error fetching triggers: {e}")
        return {"error": str(e)}
    finally:
        client.close()
