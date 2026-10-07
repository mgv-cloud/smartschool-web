'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface ClassItem { id: string; name: string; }
interface Subject { id: string; name: string; requiresRoomType: string | null; }
interface ClassSubject { classId: string; subjectId: string; weeklyFrequency: string; }

export default function TimetableSubjectsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [links, setLinks] = useState<ClassSubject[]>([]);
  const [form, setForm] = useState({ classId: '', subjectId: '', weeklyFrequency: 3 });
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiRequest<ClassItem[]>('/academic-structure/classes').then(setClasses).catch(() => {});
    apiRequest<Subject[]>('/academic-structure/subjects').then(setSubjects).catch(() => {});
    apiRequest<ClassSubject[]>('/academic-structure/class-subjects').then(setLinks).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/academic-structure/class-subjects', { method: 'POST', body: form });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  const nameFor = (list: { id: string; name: string }[], id: string) => list.find((x) => x.id === id)?.name ?? '—';

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Class Subjects</h1>
      <p className="text-gray-500 mb-6">How many periods/week each class studies each subject — this is exactly what the Timetable generator fills in.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={submit} className="grid grid-cols-4 gap-2 bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} required className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option value="">Class…</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} required className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option value="">Subject…</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}{s.requiresRoomType ? ` (${s.requiresRoomType})` : ''}</option>)}
        </select>
        <input type="number" min={1} max={20} value={form.weeklyFrequency} onChange={(e) => setForm({ ...form, weeklyFrequency: Number(e.target.value) })} className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 rounded-lg">Save</button>
      </form>

      {links.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">No class-subject frequencies set yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {links.map((l, i) => (
            <div key={i} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
              <span>{nameFor(classes, l.classId)} — {nameFor(subjects, l.subjectId)}</span>
              <span className="text-gray-400">{l.weeklyFrequency}x/week</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
