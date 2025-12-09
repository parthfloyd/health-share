import React, { useEffect, useRef, useState } from "react";
import "./ChatAssistant.css";
import API_URL from "../apis/api";

const DISCLAIMER_KEY = "chatDisclaimerAccepted:v1";
const LONG_MSG_THRESHOLD = 600;

// === Demo data for now ===
const DEMO_SOURCES = ["CNN", "Twitter", "Medium"];
const SOURCE_COLORS = {
  CNN: "#fddede",        // light red
  Twitter: "#d5ecff",    // light blue
  Medium: "#e1f7e7"    // light green
};

const ChatAssistant = () => {
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(new Set());

  const messagesEndRef = useRef(null);

  // === Load disclaimer ===
  useEffect(() => {
    const saved = localStorage.getItem(DISCLAIMER_KEY);
    if (saved === "true") setAccepted(true);
    if (messages.length > 0) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    const saved = localStorage.getItem("chatMessages");
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  // === Auto-scroll to bottom ===
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // === Handle send ===
  const handleSend = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = { role: "user", text: query, ts: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/ragchat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });
      const data = await res.json();

      // Random demo source
      const randomSource = DEMO_SOURCES[Math.floor(Math.random() * DEMO_SOURCES.length)];

      const botMessage = {
        role: "bot",
        text: data?.reply ?? "No response.",
        source: randomSource,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      const randomSource = DEMO_SOURCES[Math.floor(Math.random() * DEMO_SOURCES.length)];
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Error: Unable to fetch response.", source: randomSource, ts: Date.now() },
      ]);
    } finally {
      setQuery("");
      setIsLoading(false);
    }
  };

  // === Toggle long message ===
  const toggleExpand = (idx) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(idx)) n.delete(idx);
      else n.add(idx);
      return n;
    });
  };

  return (
    <div className="chat-assistant-container">
      {open && (
        <div className="chat-box" role="dialog" aria-modal="true" aria-label="Research Chat">
          <button className="chat-close-button" onClick={() => setOpen(false)} aria-label="Close">×</button>

          {!accepted ? (
            <div className="chat-intro">
              <h3 className="chat-intro-title">Before you start</h3>
              <p className="chat-intro-text">
                This chat summarizes information from third-party sources (e.g., Twitter/X, CNN, Medium).  
                It’s for research purposes only and may be incomplete or outdated.
              </p>
              <ul className="chat-intro-bullets">
                <li>Information may be biased or partial.</li>
                <li>Please verify important facts independently.</li>
              </ul>
              <div className="chat-intro-actions">
                <button
                  className="chat-button"
                  onClick={() => {
                    setAccepted(true);
                    localStorage.setItem(DISCLAIMER_KEY, "true");
                  }}
                >
                  I Understand, Start Chat
                </button>
                <button className="chat-secondary-button" onClick={() => setOpen(false)}>Close</button>
              </div>
            </div>
          ) : (
            <>
              {/* === Static source legend bar === */}
              <div className="chat-source-legend">
                {Object.entries(SOURCE_COLORS).map(([source, color]) => (
                  <div key={source} className="source-label" style={{ backgroundColor: color }}>
                    {source}
                  </div>
                ))}
              </div>

              <div className="chat-messages" role="log" aria-live="polite">
                {messages.map((msg, index) => {
                  const isLong = (msg.text?.length || 0) > LONG_MSG_THRESHOLD;
                  const isExpanded = expanded.has(index);
                  const visibleText = isLong && !isExpanded
                    ? msg.text.slice(0, LONG_MSG_THRESHOLD) + "…"
                    : msg.text;

                  const bubbleStyle =
                    msg.role === "bot" && msg.source
                      ? { backgroundColor: SOURCE_COLORS[msg.source] || "#f1f1f1" }
                      : {};

                  return (
                    <div
                      key={msg.ts ?? index}
                      className={`chat-bubble ${msg.role === "user" ? "user" : "bot"}`}
                      style={bubbleStyle}
                    >
                      <div className="chat-bubble-header">
                        <strong>{msg.role === "user" ? "You" : "Assistant"}</strong>
                      </div>

                      <div className="chat-bubble-body">{visibleText}</div>

                      {isLong && (
                        <button
                          type="button"
                          className="chat-toggle-more"
                          onClick={() => toggleExpand(index)}
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="chat-form">
                <textarea
                  rows="2"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask me anything"
                  className="chat-input"
                  aria-label="Message input"
                />
                <button type="submit" disabled={isLoading} className="chat-button">
                  {isLoading ? "Thinking..." : "Send"}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {!open && (
        <button className="chat-toggle-button" onClick={() => setOpen(true)} aria-label="Open research chat">
          💬
        </button>
      )}
    </div>
  );
};

export default ChatAssistant;
