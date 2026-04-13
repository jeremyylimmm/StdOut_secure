const express = require("express");
const router = express.Router();

const VOICES = ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse"];

router.get("/session", async (req, res) => {
  try {
    const voice = VOICES[Math.floor(Math.random() * VOICES.length)];
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview",
        voice,
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Realtime session error:", err);
    res.status(500).json({ error: "Failed to create realtime session" });
  }
});

module.exports = router;