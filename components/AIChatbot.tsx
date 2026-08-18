"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hi! I'm the FlowIQ Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput("");
    
    const newMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I am having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          background: "#1C1B19",
          color: "#fff",
          border: "none",
          display: isOpen ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          cursor: "pointer",
          zIndex: 9999,
          transition: "transform 0.2s ease"
        }}
        className="active-scale"
      >
        <MessageCircle size={26} strokeWidth={2.5} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: "fixed",
          bottom: 90,
          right: 24,
          width: "calc(100vw - 48px)",
          maxWidth: 380,
          height: 500,
          maxHeight: "calc(100vh - 48px)",
          background: "#fff",
          borderRadius: 24,
          boxShadow: "0 12px 48px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          zIndex: 9999,
          overflow: "hidden",
          animation: "fadein 0.2s ease"
        }}>
          {/* Header */}
          <div style={{
            padding: "16px 20px",
            background: "#FBF9F5",
            borderBottom: "1px solid #EBE9E4",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 16, background: "#1C1B19", display: "flex", alignItems: "center", justifyContent: "center", color: "#FBF9F5" }}>
                <Bot size={18} />
              </div>
              <div>
                <div className="fiq-mono" style={{ fontSize: 13, fontWeight: 700, color: "#1C1B19" }}>FlowIQ Support</div>
                <div style={{ fontSize: 11, color: "#8E8B82" }}>Powered by Groq</div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#8E8B82" }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "85%",
                    background: isUser ? "#1C1B19" : "#F5F3EC",
                    color: isUser ? "#fff" : "#1C1B19",
                    padding: "12px 16px",
                    borderRadius: 20,
                    borderBottomRightRadius: isUser ? 4 : 20,
                    borderBottomLeftRadius: isUser ? 20 : 4,
                    fontSize: 14,
                    lineHeight: 1.4
                  }}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: "#F5F3EC", padding: "12px 16px", borderRadius: 20, borderBottomLeftRadius: 4, fontSize: 14, color: "#8E8B82" }}>
                  Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: "16px", borderTop: "1px solid #EBE9E4", background: "#fff", display: "flex", gap: 10 }}>
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything..."
              style={{
                flex: 1,
                background: "#FBF9F5",
                border: "1px solid #EBE9E4",
                borderRadius: 99,
                padding: "12px 20px",
                fontSize: 14,
                outline: "none",
                color: "#1C1B19"
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                background: input.trim() && !isLoading ? "#1C1B19" : "#EBE9E4",
                color: input.trim() && !isLoading ? "#fff" : "#8E8B82",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: input.trim() && !isLoading ? "pointer" : "default",
                transition: "background 0.2s"
              }}
            >
              <Send size={18} style={{ marginLeft: -2 }} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
