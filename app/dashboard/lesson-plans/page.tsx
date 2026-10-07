'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Plan { id: string; topic: string; status: string; aiGenerated: boolean; content: any; }
interface Subject { id: string; name: string; }
interface ClassArm { id: string; name: string; }

export default function LessonPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [arms, setArms] = useState<ClassArm[]>([]);
  const [form, setForm] = useState({ subjectId: '', classArmId: '', topic: '' });
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>(null);

  const load = () => {
    apiRequest<Plan[]>('/academics/lesson-plans/my').then(setPlans).catch(() => {});
    apiRequest<Subject[]>('/academic-structure/subjects').then(setSubjects).catch(() => {});
    apiRequest<ClassArm[]>('/academic-structure/class-arms').then(setArms).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? '';

  const generateDraft = async () => {
    setAiError(null);
    setAiLoading(true);
    setDraft(null);
    try {
      const result = await apiRequest('/academics/lesson-plans/generate', {
        method: 'POST',
        body: { subjectId: form.subjectId, subjectName: subjectName(form.subjectId), classArmId: form.classArmId, topic: form.topic, className: 'Class' },
      });
      setDraft(result);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI generation failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const saveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/academics/lesson-plans', {
        method: 'POST',
        body: { subjectId: form.subjectId, classArmId: form.classArmId, topic: form.topic, content: draft ?? { notes: 'Manually created — add details here.' } },
      });
      setForm({ ...form, topic: '' });
      setDraft(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Lesson Plans</h1>
      <p className="text-gray-500 mb-6">Your own lesson plans — write manually, or let AI draft one for you to review.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={saveManual} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} required className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Subject…</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={form.classArmId} onChange={(e) => setForm({ ...form, classArmId: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Class arm (optional)…</option>
            {arms.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Topic, e.g. Fractions" required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />

        <div className="flex gap-2">
          <button type="button" onClick={generateDraft} disabled={aiLoading || !form.subjectId || !form.topic}
            className="bg-white border border-gray-300 hover:border-brand-500 disabled:opacity-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg">
            {aiLoading ? 'Asking AI…' : '✨ Draft with AI'}
          </button>
          <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            {draft ? 'Save AI draft' : 'Save manually'}
          </button>
        </div>
        {aiError && <div className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{aiError}</div>}
        {draft && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
            <div className="font-medium text-gray-800 mb-1">AI draft ready — review before saving:</div>
            <pre className="whitespace-pre-wrap">{JSON.stringify(draft, null, 2)}</pre>
          </div>
        )}
      </form>

      {plans.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">No lesson plans yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {plans.map((p) => (
            <div key={p.id} className="px-4 py-3 text-sm flex justify-between">
              <span className="text-gray-800">{p.topic}</span>
              <span className="text-xs text-gray-400">{p.aiGenerated ? 'AI-assisted' : 'Manual'} · {p.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
