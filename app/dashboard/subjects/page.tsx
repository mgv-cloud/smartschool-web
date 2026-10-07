'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Subject { id: string; name: string; code: string | null; isCore: boolean; }

export default function SubjectsPage() {
  const [items, setItems] = useState<Subject[]>([]);
  const [form, setForm] = useState({ name: '', code: '', isCore: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => apiRequest<Subject[]>('/academic-structure/subjects').then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiRequest('/academic-structure/subjects', { method: 'POST', body: form });
      setForm({ name: '', code: '', isCore: true });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Subjects</h1>
      <p className="text-gray-500 mb-6">The subjects taught across your school.</p>

      <form onSubmit={submit} className="flex gap-2 mb-6 items-end">
        <div className="flex-1">
          <label className="text-xs text-gray-500">Subject name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mathematics" required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div className="w-24">
          <label className="text-xs text-gray-500">Code</label>
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="MTH"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <button disabled={loading} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg h-[38px]">
          {loading ? 'Adding…' : 'Add'}
        </button>
      </form>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      {items.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">No subjects yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {items.map((s) => (
            <div key={s.id} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
              <span>{s.name}</span>
              <span className="text-gray-400">{s.code}{s.isCore ? ' · Core' : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
