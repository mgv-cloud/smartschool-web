'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface ClassItem { id: string; name: string; }
interface ClassArm { id: string; classId: string; name: string; }

export default function ClassesPage() {
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [arms, setArms] = useState<ClassArm[]>([]);
  const [className, setClassName] = useState('');
  const [armForm, setArmForm] = useState({ classId: '', name: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    apiRequest<ClassItem[]>('/academic-structure/classes').then(setClassesList).catch(() => {});
    apiRequest<ClassArm[]>('/academic-structure/class-arms').then(setArms).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const submitClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiRequest('/academic-structure/classes', { method: 'POST', body: { name: className } });
      setClassName('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const submitArm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/academic-structure/class-arms', { method: 'POST', body: armForm });
      setArmForm({ classId: '', name: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Classes</h1>
      <p className="text-gray-500 mb-6">Classes (e.g. "JSS 2") and their arms (e.g. "A", "B").</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={submitClass} className="flex gap-2 mb-4">
        <input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. JSS 2" required
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <button disabled={loading} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">
          Add class
        </button>
      </form>

      {classesList.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center mb-6">No classes yet.</div>
      ) : (
        <div className="space-y-3 mb-6">
          {classesList.map((c) => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="font-medium text-gray-800 text-sm mb-2">{c.name}</div>
              <div className="flex flex-wrap gap-2">
                {arms.filter((a) => a.classId === c.id).map((a) => (
                  <span key={a.id} className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded">{c.name}{a.name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submitArm} className="flex gap-2 items-end bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex-1">
          <label className="text-xs text-gray-500">Class</label>
          <select value={armForm.classId} onChange={(e) => setArmForm({ ...armForm, classId: e.target.value })} required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Select a class…</option>
            {classesList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="w-24">
          <label className="text-xs text-gray-500">Arm name</label>
          <input value={armForm.name} onChange={(e) => setArmForm({ ...armForm, name: e.target.value })} placeholder="A" required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <button className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg h-[38px]">Add arm</button>
      </form>
    </div>
  );
}
