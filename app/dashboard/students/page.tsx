'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Student { id: string; firstName: string; lastName: string; admissionNo: string; classArmId: string | null; gender: string | null; }
interface ClassArm { id: string; classId: string; name: string; }
interface ClassItem { id: string; name: string; }
interface Pagination { page: number; limit: number; total: number; totalPages: number; }

const PAGE_SIZE = 20;

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [arms, setArms] = useState<ClassArm[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', classArmId: '', gender: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = (targetPage = page) => {
    apiRequest<{ data: Student[]; pagination: Pagination }>(`/people/students?page=${targetPage}&limit=${PAGE_SIZE}`)
      .then((r) => { setStudents(r.data); setPagination(r.pagination); })
      .catch(() => {});
    apiRequest<ClassArm[]>('/academic-structure/class-arms').then(setArms).catch(() => {});
    apiRequest<ClassItem[]>('/academic-structure/classes').then(setClasses).catch(() => {});
  };
  useEffect(() => { load(1); }, []);

  const goToPage = (p: number) => { setPage(p); load(p); };

  const armLabel = (armId: string | null) => {
    const arm = arms.find((a) => a.id === armId);
    if (!arm) return '—';
    const cls = classes.find((c) => c.id === arm.classId);
    return `${cls?.name ?? ''}${arm.name}`;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiRequest('/people/students', {
        method: 'POST',
        body: { ...form, classArmId: form.classArmId || undefined, gender: form.gender || undefined },
      });
      setForm({ firstName: '', lastName: '', classArmId: '', gender: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Students</h1>
      <p className="text-gray-500 mb-6">Admission numbers are generated automatically.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={submit} className="grid grid-cols-2 gap-3 bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <select value={form.classArmId} onChange={(e) => setForm({ ...form, classArmId: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">No class yet</option>
          {arms.map((a) => <option key={a.id} value={a.id}>{armLabel(a.id)}</option>)}
        </select>
        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">Gender (optional)</option>
          <option value="FEMALE">Female</option>
          <option value="MALE">Male</option>
        </select>
        <button disabled={loading} className="col-span-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg">
          {loading ? 'Adding…' : 'Add student'}
        </button>
      </form>

      {students.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">No students yet.</div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {students.map((s) => (
              <div key={s.id} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
                <span>{s.firstName} {s.lastName}</span>
                <span className="text-gray-400">{s.admissionNo} · {armLabel(s.classArmId)}</span>
              </div>
            ))}
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-gray-400">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} student{pagination.total === 1 ? '' : 's'} total
              </span>
              <div className="flex gap-2">
                <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed">
                  Previous
                </button>
                <button onClick={() => goToPage(page + 1)} disabled={page >= pagination.totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
