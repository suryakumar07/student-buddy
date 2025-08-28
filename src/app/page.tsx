'use client';
import { useState } from 'react';

export default function Home() {
  const [lang, setLang] = useState<'en'|'ta'>('en');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');

  async function ask() {
    if (!input.trim()) return;
    setLoading(true);
    setAnswer('');
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ prompt: input, lang }),
    });
    const data = await res.json();
    setResponse(data.text);
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold">Student Buddy</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-2 rounded-2xl border ${lang==='en' ? 'bg-black text-white' : ''}`}
          >English</button>
          <button
            onClick={() => setLang('ta')}
            className={`px-3 py-2 rounded-2xl border ${lang==='ta' ? 'bg-black text-white' : ''}`}
          >தமிழ்</button>
        </div>
        <textarea
          className="w-full p-3 border rounded-2xl"
          rows={4}
          placeholder={lang==='en' ? "Ask a study question..." : "ஒரு கேள்வியை கேளுங்கள்..."}
          value={input}
          onChange={(e)=>setInput(e.target.value)}
        />
        <button onClick={ask} disabled={loading} className="px-4 py-2 rounded-2xl bg-blue-600 text-white">
          {loading ? 'Thinking…' : (lang==='en' ? 'Ask' : 'கேள்')}
        </button>
        {!!answer && (
          <div className="p-4 bg-white border rounded-2xl whitespace-pre-wrap">{answer}</div>
        )}
      </div>
    </main>
  );
}


