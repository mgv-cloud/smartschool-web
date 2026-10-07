'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Teacher { id: string; firstName: string; lastName: string; }
interface StaffMember { id: string; firstName: string; lastName: string; }
interface AttendanceRecord { entityId: string; status: string; }

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-700 border-green-300',
  ABSENT: 'bg-red-100 text-red-700 border-red-300',
  LATE: 'bg-amber-100 text-amber-700 border-amber-300',
  EXCUSED: 'bg-blue-100 text-blue-700 border-blue-300',
};

export default function StaffAttendancePage() {
  const [entityType, setEntityType] = useState<'TEACHER' | 'STAFF'>('TEACHER');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest<Teacher[]>('/people/teachers').then(setTeachers).catch(() => {});
    apiRequest<StaffMember[]>('/people/staff').then(setStaffList).catch(() => {});
  }, []);

  useEffect(() => {
    setSaved(false);
    apiRequest<AttendanceRecord[]>(`/attendance/staff?entityType=${entityType}&date=${date}`)
      .then((records) => {
        const m: Record<string, string> = {};
        for (const r of records) m[r.entityId] = r.status;
        setMarks(m);
      })
      .catch(() => setMarks({}));
  }, [entityType, date]);

  const list = entityType === 'TEACHER' ? teachers : staffList;

  const save = async () => {
    setError(null);
    setLoading(true);
    try {
      const records = list.map((p) => ({ entityId: p.id, status: marks[p.id] ?? 'PRESENT' }));
      await apiRequest('/attendance/staff', { method: 'POST', body: { entityType, date, records } });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Staff Attendance</h1>
      <p className="text-gray-500 mb-6">Track teacher and non-teaching staff attendance separately from student records.</p>

      <div className="flex gap-3 mb-6">
        <select value={entityType} onChange={(e) => setEntityType(e.target.value as 'TEACHER' | 'STAFF')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="TEACHER">Teachers</option>
          <option value="STAFF">Non-teaching Staff</option>
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
      {saved && <div className="bg-green-50 text-green-800 text-sm rounded-lg px-3 py-2 mb-4">Attendance saved. ✓</div>}

      {list.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">No {entityType === 'TEACHER' ? 'teachers' : 'staff'} yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-4">
          {list.map((p) => (
            <div key={p.id} className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-700">{p.firstName} {p.lastName}</span>
              <div className="flex gap-1">
                {STATUSES.map((st) => (
                  <button
                    key={st}
                    onClick={() => { setMarks({ ...marks, [p.id]: st }); setSaved(false); }}
                    className={`text-xs px-2 py-1 rounded border ${(marks[p.id] ?? 'PRESENT') === st ? STATUS_COLORS[st] : 'bg-white border-gray-200 text-gray-400'}`}
                  >
                    {st[0]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {list.length > 0 && (
        <button onClick={save} disabled={loading} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2.5 rounded-lg">
          {loading ? 'Saving…' : 'Save Attendance'}
        </button>
      )}
    </div>
  );
}
