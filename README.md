# Haptix

A no-code programming platform for haptic accessibility devices.

## Purpose

Create custom voice-triggered workflows that deliver haptic feedback through wearable devices. Build automation chains with keyword/prompt triggers, conditional logic, and haptic actions.

## Tech Stack

**Frontend**
- React + Vite
- React Flow (workflow editor)
- ElevenLabs Scribe v2 (real-time speech-to-text)

**Backend**
- FastAPI
- MongoDB
- Pavlok API (haptic device control)
- Google Gemini (prompt-based trigger analysis)

## Prerequisites

- Node.js 18+
- Python 3.11+
- Pavlok wearable device (only supported haptic device for MVP due to online delivery times of other wearable haptic devices)
- ElevenLabs API key
- Google Gemini API key
- MongoDB instance

## Setup

### Backend

```bash
cd backend
cp .env.example .env
# Add your API keys to .env
uv sync
uv run fastapi dev main.py
```

Runs on `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`

## Environment Variables

**Backend `.env`**
```
ELEVENLABS_API_KEY=your_key
GEMINI_API_KEY=your_key
MONGO_DB_URI=your_mongodb_uri
PAVLOK_AUTH_TOKEN=your_pavlok_token
```
