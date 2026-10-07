'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Term { id: string; name: string; isCurrent: boolean; }
interface Period { id: string; name: string; isTeachingPeriod: boolean; }
interface Room { id: string; name: string; type: string; }
interface Teacher { id: string; firstName: string; lastName: string; }
interface ClassArm { id: string; name: string; classId: string; }
interface Subject { id: string; name: string; }

interface Slot {
  classArmId: string; subjectId: string; teacherId: string | null; roomId: string | null;
  dayOfWeek: number; periodId: string;
}
interface Conflict { type: string; description: string; dayOfWeek?: number; periodId?: string; classArmId?: string; }
interface ValidationReport { valid: boolean; conflictCount: number; conflicts: Conflict[]; }

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TimetablePage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [termId, setTermId] = useState('');
  const [periods, setPeriods] = useState<Period[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [arms, setArms] = useState<ClassArm[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState<any>(null);

  useEffect(() => {
    apiRequest<Term[]>('/onboarding/terms').then((t) => { setTerms(t); const cur = t.find((x) => x.isCurrent) ?? t[0]; if (cur) setTermId(cur.id); }).catch(() => {});
    apiRequest<Period[]>('/timetable/periods').then(setPeriods).catch(() => {});
    apiRequest<Room[]>('/timetable/rooms').then(setRooms).catch(() => {});
    apiRequest<Teacher[]>('/people/teachers').then(setTeachers).catch(() => {});
    apiRequest<ClassArm[]>('/academic-structure/class-arms').then(setArms).catch(() => {});
    apiRequest<Subject[]>('/academic-structure/subjects').then(setSubjects).catch(() => {});
  }, []);

  const generate = async () => {
    setError(null);
    setLoading(true);
    setReport(null);
    try {
      const result = await apiRequest<{ slots: Slot[]; validationReport: ValidationReport }>('/timetable/generate', { method: 'POST', body: { termId } });
      setSlots(result.slots);
      setReport(result.validationReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const recheck = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await apiRequest<ValidationReport>('/timetable/validate', { method: 'POST', body: { slots } });
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const publish = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await apiRequest('/timetable/publish', { method: 'POST', body: { termId, slots } });
      setPublished(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const updateSlot = (i: number, patch: Partial<Slot>) => {
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
    setReport(null); // stale until re-checked
  };

  const nameFor = (list: { id: string; name?: string; firstName?: string; lastName?: string }[], id: string | null) => {
    if (!id) return '— none —';
    const item = list.find((x) => x.id === id);
    if (!item) return '—';
    return item.name ?? `${item.firstName} ${item.lastName}`;
  };

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Generate & Publish Timetable</h1>
      <p className="text-gray-500 mb-6">
        AI proposes a full draft. Nothing is saved until you review it and Publish — and Publish is blocked while any conflict remains.
      </p>

      <div className="flex items-center gap-3 mb-6">
        <select value={termId} onChange={(e) => setTermId(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button onClick={generate} disabled={loading || !termId} className="bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">
          ✨ {loading ? 'Working…' : 'Generate with AI'}
        </button>
        {slots.length > 0 && (
          <button onClick={recheck} disabled={loading} className="bg-gray-700 hover:bg-gray-800 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">
            Re-check
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
      {published && <div className="bg-green-50 text-green-800 text-sm rounded-lg px-3 py-2 mb-4">Published as version {published.version} — {published.slotCount} slots. 🎉</div>}

      {report && (
        <div className={`rounded-xl p-4 mb-4 border ${report.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`font-medium text-sm mb-1 ${report.valid ? 'text-green-800' : 'text-red-800'}`}>
            {report.valid ? '✓ No conflicts — ready to publish' : `⚠ ${report.conflictCount} conflict(s) found`}
          </div>
          {!report.valid && (
            <ul className="text-xs text-red-700 space-y-1 mt-2">
              {report.conflicts.map((c, i) => (
                <li key={i}>
                  <span className="font-medium">{c.type}</span>
                  {c.dayOfWeek ? ` · ${DAYS[c.dayOfWeek]}` : ''}
                  {c.periodId ? ` · ${nameFor(periods, c.periodId)}` : ''} — {c.description}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {slots.length > 0 && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-3 py-2">Class</th>
                  <th className="text-left px-3 py-2">Subject</th>
                  <th className="text-left px-3 py-2">Day</th>
                  <th className="text-left px-3 py-2">Period</th>
                  <th className="text-left px-3 py-2">Teacher</th>
                  <th className="text-left px-3 py-2">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {slots.map((s, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{nameFor(arms, s.classArmId)}</td>
                    <td className="px-3 py-2">{nameFor(subjects, s.subjectId)}</td>
                    <td className="px-3 py-2">
                      <select value={s.dayOfWeek} onChange={(e) => updateSlot(i, { dayOfWeek: Number(e.target.value) })} className="rounded border border-gray-300 px-1 py-1 text-xs">
                        {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{DAYS[d]}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select value={s.periodId} onChange={(e) => updateSlot(i, { periodId: e.target.value })} className="rounded border border-gray-300 px-1 py-1 text-xs">
                        {periods.filter((p) => p.isTeachingPeriod).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select value={s.teacherId ?? ''} onChange={(e) => updateSlot(i, { teacherId: e.target.value || null })} className="rounded border border-gray-300 px-1 py-1 text-xs">
                        <option value="">— none —</option>
                        {teachers.map((t) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select value={s.roomId ?? ''} onChange={(e) => updateSlot(i, { roomId: e.target.value || null })} className="rounded border border-gray-300 px-1 py-1 text-xs">
                        <option value="">— none —</option>
                        {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={publish}
            disabled={loading || !report?.valid}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-6 py-2.5 rounded-lg"
            title={!report?.valid ? 'Resolve all conflicts (and Re-check) before publishing' : ''}
          >
            Publish
          </button>
        </>
      )}
    </div>
  );
}
