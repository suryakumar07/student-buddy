"use client";
import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");  // ✅ add this
  const [loading, setLoading] = useState(false); // ✅ add this

  const handleAsk = async () => {
    setLoading(true);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    setResponse(data.text); // ✅ now works
    setLoading(false);
  };

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">AI Study Buddy</h1>
      <textarea
        className="border p-2 w-full mt-4"
        rows={3}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask me anything..."
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
        onClick={handleAsk}
        disabled={loading}
      >
        {loading ? "Thinking..." : "Ask"}
      </button>

      {response && (
        <div className="mt-4 p-3 border rounded bg-gray-100">
          <strong>Answer:</strong>
          <p>{response}</p>
        </div>
      )}
    </main>
  );
}
