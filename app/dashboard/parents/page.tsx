'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Parent { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; }
interface Student { id: string; firstName: string; lastName: string; }

export default function ParentsPage() {
  const [parentsList, setParentsList] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [linkForm, setLinkForm] = useState({ studentId: '', parentId: '', relationship: 'Mother' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    apiRequest<Parent[]>('/people/parents').then(setParentsList).catch(() => {});
    apiRequest<{ data: Student[] }>('/people/students?limit=200').then((r) => setStudents(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiRequest('/people/parents', { method: 'POST', body: { ...form, email: form.email || undefined, phone: form.phone || undefined } });
      setForm({ firstName: '', lastName: '', email: '', phone: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const link = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest(`/people/students/${linkForm.studentId}/parents`, {
        method: 'POST',
        body: { parentId: linkForm.parentId, relationship: linkForm.relationship, isPrimaryContact: true },
      });
      setLinkForm({ studentId: '', parentId: '', relationship: 'Mother' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Parents</h1>
      <p className="text-gray-500 mb-6">Add a contact-only parent record, or add an email + password to give them a login.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={submit} className="grid grid-cols-2 gap-3 bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" required
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (optional)"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email (optional)"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button disabled={loading} className="col-span-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg">
          {loading ? 'Adding…' : 'Add parent'}
        </button>
      </form>

      {parentsList.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center mb-6">No parents yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-6">
          {parentsList.map((p) => (
            <div key={p.id} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
              <span>{p.firstName} {p.lastName}</span>
              <span className="text-gray-400">{p.email ?? p.phone ?? '—'}</span>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Link a parent to a student</h2>
      <form onSubmit={link} className="grid grid-cols-3 gap-2 bg-white border border-gray-200 rounded-xl p-4">
        <select value={linkForm.studentId} onChange={(e) => setLinkForm({ ...linkForm, studentId: e.target.value })} required className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option value="">Student…</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
        </select>
        <select value={linkForm.parentId} onChange={(e) => setLinkForm({ ...linkForm, parentId: e.target.value })} required className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option value="">Parent…</option>
          {parentsList.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
        </select>
        <select value={linkForm.relationship} onChange={(e) => setLinkForm({ ...linkForm, relationship: e.target.value })} className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option>Mother</option><option>Father</option><option>Guardian</option>
        </select>
        <button className="col-span-3 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium py-2 rounded-lg">Link</button>
      </form>
    </div>
  );
}
