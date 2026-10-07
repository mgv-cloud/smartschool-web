'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Announcement { id: string; scope: string; title: string; body: string; createdAt: string; notifiedCount?: number; }
interface ClassArm { id: string; name: string; classId: string; }
interface Department { id: string; name: string; }

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [arms, setArms] = useState<ClassArm[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({ scope: 'SCHOOL', classArmId: '', departmentId: '', title: '', body: '' });
  const [error, setError] = useState<string | null>(null);
  const [lastNotified, setLastNotified] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    apiRequest<Announcement[]>('/announcements').then((a) => setItems(a.reverse())).catch(() =>
      apiRequest<Announcement[]>('/announcements/my').then((a) => setItems(a.reverse())).catch(() => {}),
    );
    apiRequest<ClassArm[]>('/academic-structure/class-arms').then(setArms).catch(() => {});
    apiRequest<Department[]>('/academic-structure/departments').then(setDepartments).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await apiRequest<Announcement>('/announcements', {
        method: 'POST',
        body: { scope: form.scope, classArmId: form.classArmId || undefined, departmentId: form.departmentId || undefined, title: form.title, body: form.body },
      });
      setLastNotified(result.notifiedCount ?? null);
      setForm({ ...form, title: '', body: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Announcements</h1>
      <p className="text-gray-500 mb-6">Everyone in scope gets notified automatically — school-wide, one class, or one department.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
      {lastNotified !== null && <div className="bg-green-50 text-green-800 text-sm rounded-lg px-3 py-2 mb-4">Sent — {lastNotified} people notified.</div>}

      <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-2">
        <select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="SCHOOL">Whole school</option>
          <option value="CLASS">One class</option>
          <option value="DEPARTMENT">One department</option>
        </select>
        {form.scope === 'CLASS' && (
          <select value={form.classArmId} onChange={(e) => setForm({ ...form, classArmId: e.target.value })} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Select class…</option>
            {arms.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
        {form.scope === 'DEPARTMENT' && (
          <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Select department…</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Message" required rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button disabled={loading} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">
          {loading ? 'Sending…' : 'Send Announcement'}
        </button>
      </form>

      {items.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">No announcements yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {items.map((a) => (
            <div key={a.id} className="px-4 py-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-800">{a.title}</span>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded h-fit">{a.scope}</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{a.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
