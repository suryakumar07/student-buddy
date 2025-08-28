"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: input }]);
    setLoading(true);

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: input }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessages((prev) => [...prev, { role: "ai", text: data.text }]);
    } else {
      setMessages((prev) => [...prev, { role: "ai", text: "⚠️ " + (data.error || "Something went wrong") }]);
    }

    setInput("");
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="p-4 bg-blue-600 text-white font-bold text-lg shadow-md text-center">
        AI Study Buddy 📘
      </header>

      {/* Chat Panel */}
      <div className="flex-1 flex justify-center p-6 bg-gray-50">
        <div className="w-full max-w-4xl rounded-2xl shadow-lg bg-white border border-gray-200 flex flex-col">
          
          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white ml-auto"
                    : "bg-green-100 text-green-900 prose max-w-none"
                }`}
              >
                {msg.role === "user" ? (
                  msg.text
                ) : (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                )}
              </div>
            ))}

            {loading && (
              <div className="p-3 rounded-2xl bg-green-100 text-green-900 w-fit">
                ✍️ Thinking...
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Input Area */}
      <div className="p-4 border-t bg-white flex gap-2 justify-center">
        <div className="w-full max-w-3xl flex gap-2">
          <input
            type="text"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-700"
          />
          <button
            onClick={handleAsk}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
          >
            {loading ? "..." : "Ask"}
          </button>
        </div>
      </div>
    </div>
  );
}