from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from agent import Copilot
import google.generativeai as genai
from PIL import Image
import io
import base64
import os

# Load env vars (GOOGLE_API_KEY)
load_dotenv()

# Configure Gemini (used for vision – Copilot also configures for text)
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

app = FastAPI()

# CORS: allow your frontend to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # if you want, you can restrict this to your site URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----- MODELS -----
class ChatRequest(BaseModel):
    text: str

# ----- INIT YOUR CUSTOM AI -----
bot = Copilot()   # this is your personal AI brain from agent.py

# ----- HEALTH (for uptime pings) -----
@app.get("/health")
async def health():
    return {"status": "ok"}

# ----- TEXT CHAT -----
@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Frontend sends: { "text": "user message" }
    We pass it into your Copilot and return its reply.
    """
    user_text = request.text
    reply = bot.run(user_text)
    return {"reply": reply}

# ----- VISION (IMAGE) -----
@app.post("/vision")
async def vision(file: UploadFile = File(...)):
    """
    Frontend sends an image file (field name "file").
    We send it to Gemini Vision and return the description.
    """
    # Read file bytes
    content = await file.read()

    # (Optional) load via PIL to ensure it's an image
    try:
        Image.open(io.BytesIO(content))
    except Exception:
        return {"reply": "That doesn't look like a valid image file."}

    # Base64-encode the image content
    image_data = base64.b64encode(content).decode("utf-8")

    # Use Gemini vision-capable model
    model = genai.GenerativeModel("gemini-1.5-flash")

    response = model.generate_content(
        contents=[
            {
                "role": "user",
                "parts": [
                    "You are My Copilot. Explain this image in detail in a helpful, clear way:",
                    {"mime_type": file.content_type, "data": image_data},
                ],
            }
        ]
    )

    return {"reply": response.text}
