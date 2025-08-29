// app/page.tsx

"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  // NextAuth session hook
  const { data: session, status } = useSession();

  // Your existing state from page.tsx 
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Your existing handleAsk function from page.tsx 
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

  // 1. Handle the authentication loading state
  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  // 2. Handle the unauthenticated state (user is not signed in)
  if (!session) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-100">
        <div className="p-8 bg-white rounded-2xl shadow-lg text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to AI Study Buddy 📘</h1>
          <p className="text-gray-600 mb-6">Please sign in to continue.</p>
          <button
            onClick={() => signIn("google")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow font-semibold hover:bg-blue-700 transition"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // 3. Main app view (user is signed in)
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Modified Header */}
      <header className="p-4 bg-blue-600 text-white shadow-md flex justify-between items-center">
        <h1 className="font-bold text-lg">AI Study Buddy 📘</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm hidden sm:block">{session.user?.email}</p>
          <button
            onClick={() => signOut()}
            className="bg-white text-blue-600 px-3 py-1 rounded-md text-sm font-semibold hover:bg-gray-200 transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Your existing Chat Panel from page.tsx  */}
      <div className="flex-1 flex justify-center p-6 bg-gray-50">
        <div className="w-full max-w-4xl rounded-2xl shadow-lg bg-white border border-gray-200 flex flex-col">
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

      {/* Your existing Input Area from page.tsx  */}
      <div className="p-4 border-t bg-white flex gap-2 justify-center">
        <div className="w-full max-w-3xl flex gap-2">
          <input
            type="text"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleAsk()}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-700"
            disabled={loading}
          />
          <button
            onClick={handleAsk}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "..." : "Ask"}
          </button>
        </div>
      </div>
    </div>
  );
}