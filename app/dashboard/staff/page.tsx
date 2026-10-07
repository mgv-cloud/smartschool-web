'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface StaffMember { id: string; firstName: string; lastName: string; email: string; roleTitle: string | null; staffNo: string | null; }

const ROLE_OPTIONS = ['ACCOUNTANT', 'HR_ADMIN', 'EXAM_OFFICER', 'RECEPTION'];

export default function StaffPage() {
  const [items, setItems] = useState<StaffMember[]>([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', roleTitle: '', roleName: 'ACCOUNTANT' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => apiRequest<StaffMember[]>('/people/staff').then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiRequest('/people/staff', { method: 'POST', body: { ...form, roleTitle: form.roleTitle || undefined } });
      setForm({ firstName: '', lastName: '', email: '', password: '', roleTitle: '', roleName: 'ACCOUNTANT' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Staff</h1>
      <p className="text-gray-500 mb-6">Non-teaching staff — Accountants, HR, Exam Officers, Reception. Created directly (no approval step).</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={submit} className="grid grid-cols-2 gap-3 bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="Email" required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" placeholder="Password" required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={form.roleTitle} onChange={(e) => setForm({ ...form, roleTitle: e.target.value })} placeholder="Title, e.g. Bursar (optional)"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <select value={form.roleName} onChange={(e) => setForm({ ...form, roleName: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
        <button disabled={loading} className="col-span-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg">
          {loading ? 'Adding…' : 'Add staff member'}
        </button>
      </form>

      {items.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">No staff yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {items.map((s) => (
            <div key={s.id} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
              <span>{s.firstName} {s.lastName} {s.roleTitle && <span className="text-gray-400">· {s.roleTitle}</span>}</span>
              <span className="text-gray-400">{s.staffNo}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
