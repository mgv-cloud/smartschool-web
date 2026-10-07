'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Subject { id: string; name: string; }
interface Question { id: string; body: string; type: string; difficulty: string; marks: number; aiGenerated: boolean; }

const TYPES = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'SHORT_ANSWER', 'STRUCTURED', 'ESSAY', 'PRACTICAL'];

export default function QuestionsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [form, setForm] = useState({ topic: '', type: 'MULTIPLE_CHOICE', body: '', answer: '', marks: 1 });
  const [gen, setGen] = useState({ topic: '', className: 'JSS 2', count: 5 });
  const [error, setError] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { apiRequest<Subject[]>('/academic-structure/subjects').then((s) => { setSubjects(s); if (s[0]) setSubjectId(s[0].id); }).catch(() => {}); }, []);
  const load = () => { if (subjectId) apiRequest<Question[]>(`/academics/questions?subjectId=${subjectId}`).then(setQuestions).catch(() => {}); };
  useEffect(() => { load(); }, [subjectId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiRequest('/academics/questions', { method: 'POST', body: { subjectId, ...form } });
      setForm({ topic: '', type: 'MULTIPLE_CHOICE', body: '', answer: '', marks: 1 });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAiNotice(null);
    setLoading(true);
    try {
      const subject = subjects.find((s) => s.id === subjectId);
      await apiRequest('/academics/questions/generate', {
        method: 'POST',
        body: { subjectId, subjectName: subject?.name ?? '', className: gen.className, topic: gen.topic, type: 'MULTIPLE_CHOICE', count: gen.count },
      });
    } catch (err) {
      setAiNotice(err instanceof Error ? err.message : 'AI generation is not available.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Question Bank</h1>
      <p className="text-gray-500 mb-6">Manual entry, or AI-assisted drafts you review before saving.</p>

      <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="mb-4 rounded-lg border border-gray-300 px-3 py-2 text-sm">
        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-2">
        <div className="font-medium text-sm text-gray-700 mb-1">Add a question manually</div>
        <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Topic" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Question text" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Answer" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input type="number" min={1} value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button disabled={loading} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">Add</button>
      </form>

      <form onSubmit={generate} className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 space-y-2">
        <div className="font-medium text-sm text-amber-900 mb-1">✨ Generate with AI (draft, review before saving)</div>
        <input value={gen.topic} onChange={(e) => setGen({ ...gen, topic: e.target.value })} placeholder="Topic" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input type="number" min={1} max={20} value={gen.count} onChange={(e) => setGen({ ...gen, count: Number(e.target.value) })} className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button disabled={loading} className="bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">Generate</button>
        {aiNotice && <div className="text-xs text-amber-800">{aiNotice}</div>}
      </form>

      {questions.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">No questions yet for this subject.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {questions.map((q) => (
            <div key={q.id} className="px-4 py-3 text-sm text-gray-700">
              <div>{q.body} {q.aiGenerated && <span className="text-xs text-amber-600">✨ AI</span>}</div>
              <div className="text-xs text-gray-400">{q.type.replace(/_/g, ' ')} · {q.difficulty} · {q.marks} mark(s)</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
