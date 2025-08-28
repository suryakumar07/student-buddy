// components/ChatBox.tsx
"use client";
import { useState } from "react";

export default function ChatBox() {
  const [lang, setLang] = useState("en");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");

  const askAI = async () => {
    setResponse("Thinking...");
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, lang }),
    });
    const data = await res.json();
    setResponse(data.text);
  };

  return (
    <div className="max-w-2xl mx-auto mt-20 bg-white p-6 rounded-2xl shadow-xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">🎓 Student Buddy</h1>

      {/* Language toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setLang("en")}
          className={`px-4 py-2 rounded-lg ${
            lang === "en" ? "bg-black text-white" : "bg-gray-200"
          }`}
        >
          English
        </button>
        <button
          onClick={() => setLang("ta")}
          className={`px-4 py-2 rounded-lg ${
            lang === "ta" ? "bg-black text-white" : "bg-gray-200"
          }`}
        >
          தமிழ்
        </button>
      </div>

      {/* Input */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask me anything..."
        className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500"
      />

      <button
        onClick={askAI}
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition"
      >
        Ask AI
      </button>

      {/* Response */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl border text-gray-800 whitespace-pre-line">
        {response || "No response yet."}
      </div>
    </div>
  );
}
