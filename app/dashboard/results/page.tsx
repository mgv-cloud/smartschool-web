'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Student { id: string; firstName: string; lastName: string; }
interface Subject { id: string; name: string; }
interface Score { id: string; subjectId: string; caScore: number; examScore: number; total: number; grade: string | null; remark: string | null; }

export default function ResultsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studentId, setStudentId] = useState('');
  const [scores, setScores] = useState<Score[]>([]);
  const [form, setForm] = useState({ subjectId: '', caScore: 0, examScore: 0 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest<{ data: Student[] }>('/people/students?limit=200').then((r) => { setStudents(r.data); if (r.data[0]) setStudentId(r.data[0].id); }).catch(() => {});
    apiRequest<Subject[]>('/academic-structure/subjects').then(setSubjects).catch(() => {});
  }, []);

  const load = () => { if (studentId) apiRequest<Score[]>(`/academics/scores/student/${studentId}`).then(setScores).catch(() => {}); };
  useEffect(() => { load(); }, [studentId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const termId = await getCurrentTermId();
      await apiRequest('/academics/scores', {
        method: 'POST',
        body: { studentId, subjectId: form.subjectId, termId, caScore: form.caScore, examScore: form.examScore },
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  async function getCurrentTermId(): Promise<string> {
    const termsList = await apiRequest<{ id: string; isCurrent: boolean }[]>('/onboarding/terms');
    const current = termsList.find((t) => t.isCurrent) ?? termsList[0];
    if (!current) throw new Error('No term is set up yet for the current academic session.');
    return current.id;
  }

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? '—';

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Results</h1>
      <p className="text-gray-500 mb-6">Grades are computed automatically from the school's configured CA/Exam split and active grading system.</p>

      <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="mb-4 rounded-lg border border-gray-300 px-3 py-2 text-sm">
        {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
      </select>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={submit} className="grid grid-cols-4 gap-2 bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} required className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option value="">Subject…</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="number" placeholder="CA" value={form.caScore} onChange={(e) => setForm({ ...form, caScore: Number(e.target.value) })} className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <input type="number" placeholder="Exam" value={form.examScore} onChange={(e) => setForm({ ...form, examScore: Number(e.target.value) })} className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <button disabled={loading} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg">Save</button>
      </form>

      {scores.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">No scores recorded yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {scores.map((s) => (
            <div key={s.id} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
              <span>{subjectName(s.subjectId)}</span>
              <span className="text-gray-400">{s.caScore} + {s.examScore} = {s.total} · <span className="font-medium text-gray-700">{s.grade}</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
