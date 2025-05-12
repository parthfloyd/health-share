import React, { useState } from "react";
import "./LLMChat.css";
import API_URL from "../apis/api";

function LLMChat() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    const res = await fetch(`${API_URL}/ragchat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: query }),
    });
    console.log(res);
    const data = await res.json();
    setResponse(data.reply);
    setIsLoading(false);
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-box">
        <form onSubmit={handleSubmit} className="chat-form">
          <textarea
            rows="3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask something to Ollama..."
            className="chat-input"
          />
          <button type="submit" className="chat-button" disabled={isLoading}>
            {isLoading ? "Thinking..." : "Send"}
          </button>
        </form>

        <div className="chat-messages">
          {query && (
            <div className="chat-bubble user">
              <strong>You:</strong> {query}
            </div>
          )}
          {response && (
            <div className="chat-bubble bot">
              <strong>Ollama:</strong> {response}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LLMChat;
