from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
from pydantic import BaseModel
from dotenv import load_dotenv
from agent import Copilot

# Load environment variables (for GOOGLE_API_KEY)
load_dotenv()

# Configure the Gemini API
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# FastAPI app
app = FastAPI()

# CORS so your web UI can call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # you can restrict later
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your custom Copilot brain (uses prompts.py + memory_manager.py)
bot = Copilot()

# --- Models ----
class ChatRequest(BaseModel):
    text: str

# --- Health check (for uptime robot / “is it awake?”) ---
@app.get("/health")
async def health():
    return {"status": "ok"}

# --- TEXT CHAT ---
@app.post("/chat")
async def chat(request: ChatRequest):
    reply = bot.run(request.text)
    return {"reply": reply}

# --- IMAGE / VISION ---
@app.post("/vision")
async def vision(file: UploadFile = File(...)):
    image_data = await file.read()

    model = genai.GenerativeModel("models/gemini-2.5-pro")

    response = model.generate_content(
        contents=[
            {
                "role": "user",
                "parts": [
                    "Explain this image in detail:",
                    {"mime_type": file.content_type, "data": image_data},
                ],
            }
        ]
    )

    return {"reply": response.text}
