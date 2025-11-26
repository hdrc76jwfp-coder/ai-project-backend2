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
  const { message } = req.body || {};
  console.log("Received message:", message);

  // simple reply so we know it's working
  res.json({
    reply: "Backend is working. You said: " + (message || "<no message>")
  });
});

// PORT from Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
