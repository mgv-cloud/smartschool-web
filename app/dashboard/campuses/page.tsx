'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Campus { id: string; name: string; address: string | null; isMain: boolean; }

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
const btn = 'bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg';

export default function CampusesPage() {
  const [items, setItems] = useState<Campus[]>([]);
  const [form, setForm] = useState({ name: '', address: '', isMain: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: '', address: '', isMain: false });

  const load = () => apiRequest<Campus[]>('/onboarding/campuses').then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const run = async (fn: () => Promise<void>, ok: string) => {
    setError(null); setNotice(null); setBusy(true);
    try { await fn(); await load(); setNotice(ok); }
    catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
    finally { setBusy(false); }
  };

  const add = (e: React.FormEvent) => { e.preventDefault(); run(async () => {
    const body: Record<string, unknown> = { name: form.name, isMain: form.isMain };
    if (form.address.trim()) body.address = form.address.trim();
    await apiRequest('/onboarding/campuses', { method: 'POST', body });
    setForm({ name: '', address: '', isMain: false });
  }, 'Campus added.'); };

  const startEdit = (c: Campus) => { setEditId(c.id); setEdit({ name: c.name, address: c.address ?? '', isMain: c.isMain }); setError(null); setNotice(null); };

  const save = (id: string) => run(async () => {
    await apiRequest(`/onboarding/campuses/${id}`, { method: 'PATCH', body: { name: edit.name, address: edit.address, isMain: edit.isMain } });
    setEditId(null);
  }, 'Campus updated.');

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Campuses</h1>
      <p className="text-gray-500 mb-6">The physical sites your school operates from.</p>

      <form onSubmit={add} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-3">
        <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Campus name, e.g. Junior Campus" required minLength={2} />
        <input className={input} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address (optional)" />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={form.isMain} onChange={(e) => setForm({ ...form, isMain: e.target.checked })} /> This is the main campus
        </label>
        <button disabled={busy} className={btn}>{busy ? 'Saving…' : 'Add campus'}</button>
      </form>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
      {notice && <div className="bg-green-50 text-green-700 text-sm rounded-lg px-3 py-2 mb-4">{notice}</div>}

      {items.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">No campuses yet. Add your first one above.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {items.map((c) => editId === c.id ? (
            <div key={c.id} className="p-4 space-y-3">
              <input className={input} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} minLength={2} required />
              <input className={input} value={edit.address} onChange={(e) => setEdit({ ...edit, address: e.target.value })} placeholder="Address (leave empty to clear)" />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={edit.isMain} disabled={c.isMain} onChange={(e) => setEdit({ ...edit, isMain: e.target.checked })} />
                Main campus {c.isMain && <span className="text-xs text-gray-400">(to change it, mark another campus as main)</span>}
              </label>
              <div className="flex gap-2">
                <button disabled={busy || edit.name.trim().length < 2} onClick={() => save(c.id)} className={btn}>Save</button>
                <button onClick={() => setEditId(null)} className="text-sm text-gray-600 px-4 py-2 rounded-lg border border-gray-300">Cancel</button>
              </div>
            </div>
          ) : (
            <div key={c.id} className="px-4 py-3 text-sm flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-gray-800">{c.name} {c.isMain && <span className="ml-2 text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">Main</span>}</div>
                {c.address && <div className="text-gray-500">{c.address}</div>}
              </div>
              <button onClick={() => startEdit(c)} className="text-brand-600 hover:underline shrink-0">Edit</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
