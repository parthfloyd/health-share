import React, { useState } from "react";
import "./ChatAssistant.css";
import API_URL from "../apis/api";

const ChatAssistant = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = { role: "user", text: query };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/ragchat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      const data = await res.json();
      const botMessage = { role: "bot", text: data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Error: Unable to fetch response." },
      ]);
    }

    setQuery("");
    setIsLoading(false);
  };

  return (
    <div className="chat-assistant-container">
      {open && (
        <div className="chat-box">
          <button className="chat-close-button" onClick={() => setOpen(false)}>×</button>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-bubble ${msg.role === "user" ? "user" : "bot"}`}
              >
                <strong>{msg.role === "user" ? "You" : "Assistant"}:</strong> {msg.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="chat-form">
            <textarea
              rows="2"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask me anything"
              className="chat-input"
            />
            <button type="submit" disabled={isLoading} className="chat-button">
              {isLoading ? "Thinking..." : "Send"}
            </button>
          </form>
        </div>
      )}

      {!open && (
        <button className="chat-toggle-button" onClick={() => setOpen(true)}>
          💬
        </button>
      )}

    </div>
  );
};

export default ChatAssistant;
