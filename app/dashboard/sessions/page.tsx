'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Session { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean; }
interface Term { id: string; sessionId: string; name: string; startDate: string; endDate: string; isCurrent: boolean; }

// Dates are stored as UTC midnight, so always read/format them in UTC to avoid off-by-one-day shifts.
const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const day = (d: string) => d.slice(0, 10);
const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
const btn = 'bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg';
const ghost = 'text-sm text-gray-600 px-4 py-2 rounded-lg border border-gray-300';

type Draft = { name: string; startDate: string; endDate: string };

function EditRow({ draft, setDraft, onSave, onCancel, busy }: { draft: Draft; setDraft: (d: Draft) => void; onSave: () => void; onCancel: () => void; busy: boolean }) {
  const bad = draft.name.trim().length < 2 || !draft.startDate || !draft.endDate || draft.endDate <= draft.startDate;
  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input className={input} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input className={input} type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
        <input className={input} type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} />
      </div>
      {draft.startDate && draft.endDate && draft.endDate <= draft.startDate && <div className="text-xs text-red-600">End date must be after the start date.</div>}
      <div className="flex gap-2">
        <button disabled={busy || bad} onClick={onSave} className={btn}>Save</button>
        <button onClick={onCancel} className={ghost}>Cancel</button>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editSession, setEditSession] = useState<string | null>(null);
  const [editTerm, setEditTerm] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ name: '', startDate: '', endDate: '' });
  const [sForm, setSForm] = useState({ name: '', startDate: '', endDate: '', isCurrent: true });
  const [tForm, setTForm] = useState({ name: '', startDate: '', endDate: '', isCurrent: false });

  const loadSessions = async () => {
    const s = await apiRequest<Session[]>('/onboarding/academic-sessions').catch(() => [] as Session[]);
    setSessions(s);
    setSelectedId((prev) => (prev && s.some((x) => x.id === prev) ? prev : (s.find((x) => x.isCurrent) ?? s[0])?.id ?? null));
  };
  useEffect(() => { loadSessions(); }, []);

  const loadTerms = async (sid: string | null) => {
    if (!sid) { setTerms([]); return; }
    setTerms(await apiRequest<Term[]>(`/onboarding/terms?sessionId=${sid}`).catch(() => [] as Term[]));
  };
  useEffect(() => { loadTerms(selectedId); setEditTerm(null); }, [selectedId]);

  const run = async (fn: () => Promise<void>, ok: string) => {
    setError(null); setNotice(null); setBusy(true);
    try { await fn(); await loadSessions(); await loadTerms(selectedId); setNotice(ok); }
    catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
    finally { setBusy(false); }
  };

  const selected = sessions.find((s) => s.id === selectedId) ?? null;
  const sorted = [...sessions].sort((a, b) => b.startDate.localeCompare(a.startDate));

  const addSession = (e: React.FormEvent) => { e.preventDefault(); run(async () => {
    await apiRequest('/onboarding/academic-sessions', { method: 'POST', body: sForm });
    setSForm({ name: '', startDate: '', endDate: '', isCurrent: true });
  }, 'Session added.'); };

  const startEditSession = (s: Session) => { setEditSession(s.id); setDraft({ name: s.name, startDate: day(s.startDate), endDate: day(s.endDate) }); setError(null); setNotice(null); };
  const saveSession = (id: string) => run(async () => {
    await apiRequest(`/onboarding/academic-sessions/${id}`, { method: 'PATCH', body: draft });
    setEditSession(null);
  }, 'Session updated.');

  const makeSessionCurrent = (s: Session) => {
    if (!window.confirm(`Make ${s.name} the current session?\n\nResults, invoices and timetables will default to this session's terms. Nothing is deleted, and you can switch back any time.`)) return;
    run(async () => { await apiRequest(`/onboarding/academic-sessions/${s.id}/set-current`, { method: 'POST' }); }, `${s.name} is now the current session.`);
  };

  const addTerm = (e: React.FormEvent) => { e.preventDefault(); if (!selected) return; run(async () => {
    await apiRequest('/onboarding/terms', { method: 'POST', body: { ...tForm, sessionId: selected.id } });
    setTForm({ name: '', startDate: '', endDate: '', isCurrent: false });
  }, 'Term added.'); };

  const startEditTerm = (t: Term) => { setEditTerm(t.id); setDraft({ name: t.name, startDate: day(t.startDate), endDate: day(t.endDate) }); setError(null); setNotice(null); };
  const saveTerm = (id: string) => run(async () => {
    await apiRequest(`/onboarding/terms/${id}`, { method: 'PATCH', body: draft });
    setEditTerm(null);
  }, 'Term updated.');

  const makeTermCurrent = (t: Term) => {
    if (!window.confirm(`Make ${t.name} the current term?\n\nNothing is deleted, and you can switch back any time.`)) return;
    run(async () => { await apiRequest(`/onboarding/terms/${t.id}/set-current`, { method: 'POST' }); }, `${t.name} is now the current term.`);
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Academic Sessions</h1>
      <p className="text-gray-500 mb-6">School years and the terms inside them. Only one session is current at a time.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
      {notice && <div className="bg-green-50 text-green-700 text-sm rounded-lg px-3 py-2 mb-4">{notice}</div>}

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Sessions</h2>
      <form onSubmit={addSession} className="bg-white border border-gray-200 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input className={input} value={sForm.name} onChange={(e) => setSForm({ ...sForm, name: e.target.value })} placeholder="2026/2027" required minLength={2} />
        <input className={input} type="date" value={sForm.startDate} onChange={(e) => setSForm({ ...sForm, startDate: e.target.value })} required />
        <input className={input} type="date" value={sForm.endDate} onChange={(e) => setSForm({ ...sForm, endDate: e.target.value })} required />
        <label className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
          <input type="checkbox" checked={sForm.isCurrent} onChange={(e) => setSForm({ ...sForm, isCurrent: e.target.checked })} /> Make this the current session
        </label>
        <button disabled={busy} className={btn}>Add session</button>
      </form>

      {sorted.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center mb-8">No academic sessions yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-8">
          {sorted.map((s) => editSession === s.id ? (
            <EditRow key={s.id} draft={draft} setDraft={setDraft} busy={busy} onSave={() => saveSession(s.id)} onCancel={() => setEditSession(null)} />
          ) : (
            <div key={s.id} className={`px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-2 ${selectedId === s.id ? 'bg-brand-50/40' : ''}`}>
              <div>
                <div className="font-medium text-gray-800">{s.name} {s.isCurrent && <span className="ml-2 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Current</span>}</div>
                <div className="text-gray-500">{fmt(s.startDate)} – {fmt(s.endDate)}</div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedId(s.id)} className="text-brand-600 hover:underline">{selectedId === s.id ? 'Viewing terms' : 'View terms'}</button>
                <button onClick={() => startEditSession(s)} className="text-brand-600 hover:underline">Edit</button>
                {!s.isCurrent && <button disabled={busy} onClick={() => makeSessionCurrent(s)} className="text-brand-600 hover:underline">Make current</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Terms {selected && <span className="font-normal text-gray-400">in {selected.name}</span>}</h2>
      {!selected ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-6 text-center">Add a session first, then you can add its terms.</div>
      ) : (
        <>
          <form onSubmit={addTerm} className="bg-white border border-gray-200 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input className={input} value={tForm.name} onChange={(e) => setTForm({ ...tForm, name: e.target.value })} placeholder="e.g. Second Term" required minLength={2} />
            <input className={input} type="date" value={tForm.startDate} onChange={(e) => setTForm({ ...tForm, startDate: e.target.value })} required />
            <input className={input} type="date" value={tForm.endDate} onChange={(e) => setTForm({ ...tForm, endDate: e.target.value })} required />
            <label className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
              <input type="checkbox" checked={tForm.isCurrent} onChange={(e) => setTForm({ ...tForm, isCurrent: e.target.checked })} /> Make this the current term
            </label>
            <button disabled={busy} className={btn}>Add term</button>
          </form>
          {terms.length === 0 ? (
            <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-6 text-center">No terms in this session yet.</div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {terms.map((t) => editTerm === t.id ? (
                <EditRow key={t.id} draft={draft} setDraft={setDraft} busy={busy} onSave={() => saveTerm(t.id)} onCancel={() => setEditTerm(null)} />
              ) : (
                <div key={t.id} className="px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium text-gray-800">{t.name} {t.isCurrent && <span className="ml-2 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Current</span>}</div>
                    <div className="text-gray-500">{fmt(t.startDate)} – {fmt(t.endDate)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => startEditTerm(t)} className="text-brand-600 hover:underline">Edit</button>
                    {!t.isCurrent && <button disabled={busy} onClick={() => makeTermCurrent(t)} className="text-brand-600 hover:underline">Make current</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
