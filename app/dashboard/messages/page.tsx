'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Message { id: string; senderId: string; recipientId: string; subject: string | null; body: string; readAt: string | null; createdAt: string; }
interface Teacher { id: string; firstName: string; lastName: string; }
interface Parent { id: string; firstName: string; lastName: string; userId: string | null; }

export default function MessagesPage() {
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [inbox, setInbox] = useState<Message[]>([]);
  const [sent, setSent] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<{ id: string; label: string }[]>([]);
  const [form, setForm] = useState({ recipientId: '', subject: '', body: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    apiRequest<Message[]>('/messages/inbox').then((m) => setInbox(m.reverse())).catch(() => {});
    apiRequest<Message[]>('/messages/sent').then((m) => setSent(m.reverse())).catch(() => {});
  };
  useEffect(() => {
    load();
    // Best-effort contact list — teachers are always fetchable; parents may 403 for non-admin
    // roles, which is fine, the recipient dropdown just shows whichever succeed.
    apiRequest<Teacher[]>('/people/teachers').then((ts) => setContacts((c) => [...c, ...ts.map((t) => ({ id: t.id, label: `${t.firstName} ${t.lastName} (Teacher)` }))])).catch(() => {});
  }, []);

  const markRead = async (id: string) => { await apiRequest(`/messages/${id}/read`, { method: 'POST' }); load(); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiRequest('/messages', { method: 'POST', body: form });
      setForm({ recipientId: '', subject: '', body: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const list = tab === 'inbox' ? inbox : sent;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Messages</h1>
      <p className="text-gray-500 mb-6">Direct messages between any two accounts at your school.</p>

      <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-2">
        <div className="font-medium text-sm text-gray-700 mb-1">New message</div>
        {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <input value={form.recipientId} onChange={(e) => setForm({ ...form, recipientId: e.target.value })} placeholder="Recipient user ID" required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <p className="text-xs text-gray-400">Paste a user ID (e.g. from Teachers/Parents) — a contact picker is a natural next step here.</p>
        <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject (optional)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Message" required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} />
        <button disabled={loading} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">
          {loading ? 'Sending…' : 'Send'}
        </button>
      </form>

      <div className="flex gap-2 mb-3">
        <button onClick={() => setTab('inbox')} className={`text-xs px-3 py-1.5 rounded-lg ${tab === 'inbox' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Inbox ({inbox.filter((m) => !m.readAt).length} unread)</button>
        <button onClick={() => setTab('sent')} className={`text-xs px-3 py-1.5 rounded-lg ${tab === 'sent' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Sent</button>
      </div>

      {list.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">Nothing here yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {list.map((m) => (
            <div key={m.id} className={`px-4 py-3 ${tab === 'inbox' && !m.readAt ? 'bg-brand-50/40' : ''}`}>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-800">{m.subject || '(no subject)'}</span>
                {tab === 'inbox' && !m.readAt && <button onClick={() => markRead(m.id)} className="text-xs text-brand-600 hover:underline">Mark read</button>}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{m.body}</div>
              <div className="text-[10px] text-gray-400 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
