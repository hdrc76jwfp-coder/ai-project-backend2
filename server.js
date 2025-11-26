import express from "express";
import cors from "cors";

const app = express();

// allow frontend to call this backend
app.use(cors());
app.use(express.json());

// health check route
app.get("/health", (req, res) => {
  res.send("OK");
});

// main chat route
app.post("/chat", (req, res) => {
  const { text, message } = req.body || {};
  const userMessage = text || message;

  console.log("Received message:", userMessage);

  res.json({
    reply: "Backend is working. You said: " + (userMessage || "<no message>")
  });
});

// PORT from Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
