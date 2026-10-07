'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface ClassArm { id: string; classId: string; name: string; }
interface ClassItem { id: string; name: string; }
interface Student { id: string; firstName: string; lastName: string; classArmId: string | null; }
interface AttendanceRecord { entityId: string; status: string; }

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-700 border-green-300',
  ABSENT: 'bg-red-100 text-red-700 border-red-300',
  LATE: 'bg-amber-100 text-amber-700 border-amber-300',
  EXCUSED: 'bg-blue-100 text-blue-700 border-blue-300',
};

export default function AttendancePage() {
  const [arms, setArms] = useState<ClassArm[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [armId, setArmId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest<ClassArm[]>('/academic-structure/class-arms').then((a) => { setArms(a); if (a[0]) setArmId(a[0].id); }).catch(() => {});
    apiRequest<ClassItem[]>('/academic-structure/classes').then(setClasses).catch(() => {});
    apiRequest<{ data: Student[] }>('/people/students?limit=200').then((r) => setStudents(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!armId || !date) return;
    setSaved(false);
    apiRequest<AttendanceRecord[]>(`/attendance/students?classArmId=${armId}&date=${date}`)
      .then((records) => {
        const m: Record<string, string> = {};
        for (const r of records) m[r.entityId] = r.status;
        setMarks(m);
      })
      .catch(() => setMarks({}));
  }, [armId, date]);

  const classStudents = students.filter((s) => s.classArmId === armId);
  const armLabel = (id: string) => {
    const arm = arms.find((a) => a.id === id);
    const cls = classes.find((c) => c.id === arm?.classId);
    return arm ? `${cls?.name ?? ''}${arm.name}` : '';
  };

  const save = async () => {
    setError(null);
    setLoading(true);
    try {
      const records = classStudents.map((s) => ({ studentId: s.id, status: marks[s.id] ?? 'PRESENT' }));
      await apiRequest('/attendance/students', { method: 'POST', body: { classArmId: armId, date, records } });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Take Attendance</h1>
      <p className="text-gray-500 mb-6">Defaults to Present — tap a student's status to change it.</p>

      <div className="flex gap-3 mb-6">
        <select value={armId} onChange={(e) => setArmId(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          {arms.map((a) => <option key={a.id} value={a.id}>{armLabel(a.id)}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
      {saved && <div className="bg-green-50 text-green-800 text-sm rounded-lg px-3 py-2 mb-4">Attendance saved. ✓</div>}

      {classStudents.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">No students in this class yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-4">
          {classStudents.map((s) => (
            <div key={s.id} className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-700">{s.firstName} {s.lastName}</span>
              <div className="flex gap-1">
                {STATUSES.map((st) => (
                  <button
                    key={st}
                    onClick={() => { setMarks({ ...marks, [s.id]: st }); setSaved(false); }}
                    className={`text-xs px-2 py-1 rounded border ${(marks[s.id] ?? 'PRESENT') === st ? STATUS_COLORS[st] : 'bg-white border-gray-200 text-gray-400'}`}
                  >
                    {st[0]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {classStudents.length > 0 && (
        <button onClick={save} disabled={loading} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-lg">
          {loading ? 'Saving…' : 'Save Attendance'}
        </button>
      )}
    </div>
  );
}
