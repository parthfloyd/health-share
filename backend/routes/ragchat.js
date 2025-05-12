const express = require("express");
const router = express.Router();
const axios = require("axios");
const { QdrantClient } = require("@qdrant/js-client-rest");
const { execSync } = require("child_process");
const path = require("path");

// === Qdrant Client ===
const qdrant = new QdrantClient({ url: "http://localhost:6333" });

router.post("/", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required." });
  }

  try {
    // === 1. Generate embedding using Python ===
    const escaped = message.replace(/"/g, '\\"');
    const scriptPath = path.join(__dirname, "../embedding/generate_embedding.py");
    const embeddingJSON = execSync(`python3 "${scriptPath}" "${escaped}"`).toString();
    const embedding = JSON.parse(embeddingJSON);

    // === 2. Check if collection exists
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some((c) => c.name === "healthshare");

    let context = "";

    if (exists) {
      // === 3. Search Qdrant with fuzzy threshold
      let searchResult = [];

      try {
        const result = await qdrant.search({
          collection_name: "healthshare",
          vector: embedding,
          limit: 5,
          with_payload: true,
          score_threshold: 0.05, 
        });

        searchResult = Array.isArray(result) ? result : result?.result ?? [];

        console.log("Qdrant search results:", searchResult);
      } catch (searchErr) {
        console.warn("Qdrant search failed. Falling back to plain LLM. Error:", searchErr.message);
      }

      // === 4. Extract context from search result
      context = searchResult
        .map((point) => point?.payload?.text)
        .filter(Boolean)
        .join("\n\n");
    }

    // === 5. Build final prompt
    const prompt = context
      ? `Context:\n${context}\n\nUser: ${message}\nAnswer:`
      : message; // fallback to plain message if no context

    // === 6. Call Ollama
    const response = await axios.post("http://127.0.0.1:11434/api/chat", {
      model: "llama3.2",
      messages: [{ role: "user", content: prompt }],
      stream: false,
    });

    res.json({ reply: response.data.message.content });

  } catch (err) {
    console.error("RAG Error:", err.message);
    res.status(500).json({ error: "RAG response failed." });
  }
});

module.exports = router;
