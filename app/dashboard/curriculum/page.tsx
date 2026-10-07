'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Item { id: string; topic: string; description: string | null; }
interface Subject { id: string; name: string; }
interface ClassItem { id: string; name: string; }

export default function CurriculumPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [form, setForm] = useState({ subjectId: '', classId: '', topic: '', description: '' });
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiRequest<Item[]>('/academics/curriculum').then(setItems).catch(() => {});
    apiRequest<Subject[]>('/academic-structure/subjects').then(setSubjects).catch(() => {});
    apiRequest<ClassItem[]>('/academic-structure/classes').then(setClasses).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/academics/curriculum', { method: 'POST', body: { ...form, description: form.description || undefined } });
      setForm({ ...form, topic: '', description: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Curriculum</h1>
      <p className="text-gray-500 mb-6">Topics your school covers, by subject and class.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} required className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Subject…</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} required className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Class…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Topic, e.g. Fractions and Decimals" required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Add topic</button>
      </form>

      {items.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">No curriculum items yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {items.map((i) => (
            <div key={i.id} className="px-4 py-3 text-sm">
              <div className="text-gray-800 font-medium">{i.topic}</div>
              {i.description && <div className="text-gray-400 text-xs mt-0.5">{i.description}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
