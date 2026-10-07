'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Assignment { id: string; title: string; description: string | null; dueDate: string | null; }
interface Subject { id: string; name: string; }
interface ClassArm { id: string; name: string; }

export default function AssignmentsPage() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [arms, setArms] = useState<ClassArm[]>([]);
  const [form, setForm] = useState({ classArmId: '', subjectId: '', title: '', description: '', dueDate: '' });
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiRequest<Assignment[]>('/academics/assignments/my').then(setItems).catch(() => {});
    apiRequest<Subject[]>('/academic-structure/subjects').then(setSubjects).catch(() => {});
    apiRequest<ClassArm[]>('/academic-structure/class-arms').then(setArms).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/academics/assignments', {
        method: 'POST',
        body: { ...form, description: form.description || undefined, dueDate: form.dueDate || undefined },
      });
      setForm({ ...form, title: '', description: '', dueDate: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Assignments</h1>
      <p className="text-gray-500 mb-6">Your own assignments — students in the class see these automatically.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <select value={form.classArmId} onChange={(e) => setForm({ ...form, classArmId: e.target.value })} required className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Class arm…</option>
            {arms.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} required className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Subject…</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Post assignment</button>
      </form>

      {items.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">No assignments yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {items.map((a) => (
            <div key={a.id} className="px-4 py-3 text-sm">
              <div className="text-gray-800 font-medium">{a.title}</div>
              {a.dueDate && <div className="text-gray-400 text-xs">Due {new Date(a.dueDate).toLocaleDateString()}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
