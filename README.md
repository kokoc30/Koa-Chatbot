# Koa-Chatbot
Designed and implemented Koa, a machine-learning chat assistant featuring a FastAPI inference backend, configurable JSON-based system prompts, and a responsive light/dark-mode web UI with profile controls and voice input, delivering fast, streaming-style conversational responses and a clean path to web deployment.

## Features
- FastAPI inference server with a simple chat API
- Streaming-friendly chat flow (designed for responsive UX)
- Responsive frontend with light/dark mode
- Voice input support in the web UI
- JSONL-based sample data for quick testing

## Repo Structure
- `frontend/` — Web UI (HTML/CSS/JS)
- `inference/` — FastAPI server + chat logic
- `data/` — Small sample data (JSONL)
- `requirements.txt` — Python dependencies

## Demo


YouTube Link:
  - `[Watch the demo video]([PASTE_LINK_HERE](https://youtu.be/QX3a01UH3ik))`

## Quick Start (Local)
### 1) Backend (FastAPI)
```bash
pip install -r requirements.txt
python inference/api_server.py
