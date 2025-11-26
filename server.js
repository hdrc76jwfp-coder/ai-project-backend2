
import express from "express";
import cors from "cors";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

// allow frontend to call this backend
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// for image uploads
const upload = multer();

// make sure the API key exists
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set");
}

// init Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// text model (you can change to gemini-1.5-pro if you want)
const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// same model handles vision
const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// health check route
app.get("/health", (req, res) => {
  res.send("OK");
});

// TEXT CHAT -----------------------------------------
app.post("/chat", async (req, res) => {
  try {
    const { text, message } = req.body || {};
    const userMessage = text || message;

    if (!userMessage) {
      return res.status(400).json({ error: "No message provided" });
    }

    console.log("💬 User:", userMessage);

    const result = await textModel.generateContent(userMessage);
    const reply = result.response.text();

    console.log("🤖 Bot:", reply);

    res.json({ reply });
  } catch (err) {
    console.error("Error in /chat:", err);
    res.status(500).json({ error: "Error talking to Gemini" });
  }
});

// IMAGE / VISION ------------------------------------
app.post("/vision", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const image = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    const prompt = "You are My Copilot. Analyse this image and explain it clearly.";

    const result = await visionModel.generateContent([prompt, image]);
    const reply = result.response.text();

    res.json({ reply });
  } catch (err) {
    console.error("Error in /vision:", err);
    res.status(500).json({ error: "Error analyzing image with Gemini" });
  }
});

// PORT from Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
