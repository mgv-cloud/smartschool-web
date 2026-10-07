'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Meeting { id: string; title: string; agenda: string | null; scheduledAt: string | null; location: string | null; notes: string | null; }
interface Participant { userId: string; responseStatus: string; firstName: string; lastName: string; }
interface ActionPoint { id: string; description: string; isDone: boolean; }
interface Teacher { id: string; firstName: string; lastName: string; }

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [actionPoints, setActionPoints] = useState<ActionPoint[]>([]);
  const [form, setForm] = useState({ title: '', agenda: '', scheduledAt: '', location: '', participantIds: [] as string[] });
  const [actionForm, setActionForm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    apiRequest<Meeting[]>('/meetings/my').then(setMeetings).catch(() => {});
    apiRequest<Teacher[]>('/people/teachers').then(setTeachers).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selected) return;
    apiRequest<Participant[]>(`/meetings/${selected}/participants`).then(setParticipants).catch(() => {});
    apiRequest<ActionPoint[]>(`/meetings/${selected}/action-points`).then(setActionPoints).catch(() => {});
  }, [selected]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiRequest('/meetings', {
        method: 'POST',
        body: { ...form, scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined },
      });
      setForm({ title: '', agenda: '', scheduledAt: '', location: '', participantIds: [] });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const addActionPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiRequest(`/meetings/${selected}/action-points`, { method: 'POST', body: { description: actionForm } });
    setActionForm('');
    apiRequest<ActionPoint[]>(`/meetings/${selected}/action-points`).then(setActionPoints).catch(() => {});
  };

  const toggleParticipant = (id: string) => {
    setForm((f) => ({ ...f, participantIds: f.participantIds.includes(id) ? f.participantIds.filter((p) => p !== id) : [...f.participantIds, id] }));
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Meetings</h1>
      <p className="text-gray-500 mb-6">Invited participants are notified automatically.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-2">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} placeholder="Agenda (optional)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location / link (optional)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Invite teachers:</div>
          <div className="flex flex-wrap gap-1">
            {teachers.map((t) => (
              <button type="button" key={t.id} onClick={() => toggleParticipant(t.id)}
                className={`text-xs px-2 py-1 rounded border ${form.participantIds.includes(t.id) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-gray-300 text-gray-600'}`}>
                {t.firstName} {t.lastName}
              </button>
            ))}
          </div>
        </div>
        <button disabled={loading} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">
          {loading ? 'Creating…' : 'Create Meeting'}
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mb-4">
        {meetings.map((m) => (
          <button key={m.id} onClick={() => setSelected(m.id)} className={`text-xs px-3 py-1.5 rounded-lg border ${selected === m.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-gray-300 text-gray-600'}`}>
            {m.title}
          </button>
        ))}
      </div>

      {selected && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Participants</h2>
            {participants.map((p) => (
              <div key={p.userId} className="text-sm text-gray-600 flex justify-between py-1">
                <span>{p.firstName} {p.lastName}</span>
                <span className="text-xs text-gray-400">{p.responseStatus}</span>
              </div>
            ))}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Action Points</h2>
            {actionPoints.map((a) => <div key={a.id} className="text-sm text-gray-600 py-1">• {a.description}</div>)}
            <form onSubmit={addActionPoint} className="flex gap-2 mt-2">
              <input value={actionForm} onChange={(e) => setActionForm(e.target.value)} placeholder="Add an action point…" className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
              <button className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg">Add</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
