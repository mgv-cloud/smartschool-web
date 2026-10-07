'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Exam { id: string; name: string; status: string; }
interface Subject { id: string; name: string; }
interface ClassItem { id: string; name: string; }
interface ExamSubject { id: string; subjectId: string; classId: string; examDate: string | null; durationMinutes: number | null; }

export default function ExaminationsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [name, setName] = useState('');
  const [scheduleForm, setScheduleForm] = useState({ subjectId: '', classId: '', examDate: '', durationMinutes: 60 });
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiRequest<Exam[]>('/academics/examinations').then(setExams).catch(() => {});
    apiRequest<Subject[]>('/academic-structure/subjects').then(setSubjects).catch(() => {});
    apiRequest<ClassItem[]>('/academic-structure/classes').then(setClasses).catch(() => {});
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (selectedExam) apiRequest<ExamSubject[]>(`/academics/examinations/${selectedExam}/subjects`).then(setExamSubjects).catch(() => {}); }, [selectedExam]);

  const createExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/academics/examinations', { method: 'POST', body: { name } });
      setName('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  const schedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest(`/academics/examinations/${selectedExam}/subjects`, {
        method: 'POST',
        body: { ...scheduleForm, examDate: scheduleForm.examDate ? new Date(scheduleForm.examDate).toISOString() : undefined },
      });
      const rows = await apiRequest<ExamSubject[]>(`/academics/examinations/${selectedExam}/subjects`);
      setExamSubjects(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  const nameFor = (list: { id: string; name: string }[], id: string) => list.find((x) => x.id === id)?.name ?? '—';

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Examinations</h1>
      <p className="text-gray-500 mb-6">Scheduling automatically blocks double-booking a class at the same date/time.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={createExam} className="flex gap-2 mb-6">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. First Term Examinations" required
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Create</button>
      </form>

      <div className="flex flex-wrap gap-2 mb-6">
        {exams.map((e) => (
          <button key={e.id} onClick={() => setSelectedExam(e.id)}
            className={`text-xs px-3 py-1.5 rounded-lg border ${selectedExam === e.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-gray-300 text-gray-600'}`}>
            {e.name}
          </button>
        ))}
      </div>

      {selectedExam && (
        <>
          <form onSubmit={schedule} className="bg-white border border-gray-200 rounded-xl p-4 mb-4 grid grid-cols-2 gap-2">
            <select value={scheduleForm.subjectId} onChange={(e) => setScheduleForm({ ...scheduleForm, subjectId: e.target.value })} required className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
              <option value="">Subject…</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={scheduleForm.classId} onChange={(e) => setScheduleForm({ ...scheduleForm, classId: e.target.value })} required className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
              <option value="">Class…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="datetime-local" value={scheduleForm.examDate} onChange={(e) => setScheduleForm({ ...scheduleForm, examDate: e.target.value })} className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
            <input type="number" value={scheduleForm.durationMinutes} onChange={(e) => setScheduleForm({ ...scheduleForm, durationMinutes: Number(e.target.value) })} className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
            <button className="col-span-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium py-2 rounded-lg">Schedule</button>
          </form>

          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {examSubjects.map((es) => (
              <div key={es.id} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
                <span>{nameFor(subjects, es.subjectId)} — {nameFor(classes, es.classId)}</span>
                <span className="text-gray-400">{es.examDate ? new Date(es.examDate).toLocaleString() : '—'}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
