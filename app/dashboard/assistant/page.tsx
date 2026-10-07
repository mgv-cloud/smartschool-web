'use client';
import { useState } from 'react';
import { apiRequest } from '@/lib/api';

interface ChatTurn { role: 'user' | 'assistant'; text: string }

export default function AssistantPage() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setError(null);
    setLoading(true);
    const question = input;
    setTurns((t) => [...t, { role: 'user', text: question }]);
    setInput('');
    try {
      const result = await apiRequest<{ reply: string; messages: any[] }>('/ai-assistant/chat', {
        method: 'POST',
        body: { message: question, history },
      });
      setTurns((t) => [...t, { role: 'assistant', text: result.reply }]);
      setHistory(result.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl flex flex-col h-[calc(100vh-2rem)]">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">✨ AI Assistant</h1>
      <p className="text-gray-500 mb-6">
        Ask about attendance, fees, timetables, or performance — answers are always scoped to what your role can see.
      </p>

      {error && <div className="bg-amber-50 text-amber-800 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <div className="flex-1 overflow-y-auto bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
        {turns.length === 0 && (
          <div className="text-sm text-gray-400 text-center py-8">
            Try: "How many students are absent today?" or "Which students have outstanding fees?"
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${t.role === 'user' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
              {t.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-gray-400">Thinking…</div>}
      </div>

      <form onSubmit={send} className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question…"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <button disabled={loading} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">
          Send
        </button>
      </form>
    </div>
  );
}
