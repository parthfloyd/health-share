const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await axios.post("http://127.0.0.1:11434/api/chat", {
      model: "llama3.2",
      messages: [{ role: "user", content: message }],
      stream: false
    });

    res.json({ reply: response.data.message.content });
  } catch (error) {
    console.error("Ollama error:", error.message);
    res.status(500).json({ error: "Failed to get response from LLM" });
  }
});

module.exports = router;
