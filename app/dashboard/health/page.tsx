'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Student { id: string; firstName: string; lastName: string; }
interface HealthRecord { id: string; studentFirstName: string; studentLastName: string; visitDate: string; symptoms: string | null; severity: string; }

const SEVERITY_COLORS: Record<string, string> = { MINOR: 'bg-gray-100 text-gray-600', MODERATE: 'bg-amber-100 text-amber-700', SEVERE: 'bg-red-100 text-red-700' };

export default function HealthPage() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState({ studentId: '', symptoms: '', treatment: '', medicationGiven: '', severity: 'MINOR' });
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => {
    apiRequest<HealthRecord[]>('/health/records').then(setRecords).catch((e) => {
      if (e instanceof Error && e.message.includes('permission')) setForbidden(true);
    });
    apiRequest<{ data: Student[] }>('/people/students?limit=200').then((r) => setStudents(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiRequest('/health/records', { method: 'POST', body: form });
      setForm({ ...form, symptoms: '', treatment: '', medicationGiven: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (forbidden) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Health / Sickbay</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mt-4">
          Medical records are restricted to School Admins and designated Health Officers only — this keeps sensitive health
          information away from broader staff access by default, per standard student-privacy practice.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Health / Sickbay</h1>
      <p className="text-gray-500 mb-6">Restricted access — visible only to School Admins and Health Officers.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-2">
        <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">Student…</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
        </select>
        <input value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} placeholder="Symptoms" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} placeholder="Treatment given" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={form.medicationGiven} onChange={(e) => setForm({ ...form, medicationGiven: e.target.value })} placeholder="Medication (optional)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="MINOR">Minor</option><option value="MODERATE">Moderate</option><option value="SEVERE">Severe</option>
        </select>
        <button disabled={loading} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">
          {loading ? 'Saving…' : 'Log Visit'}
        </button>
      </form>

      {records.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">No visits logged yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {records.map((r) => (
            <div key={r.id} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
              <span>{r.studentFirstName} {r.studentLastName} — {r.symptoms}</span>
              <span className={`text-xs px-2 py-0.5 rounded h-fit ${SEVERITY_COLORS[r.severity]}`}>{r.severity}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
