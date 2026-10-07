'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Department { id: string; name: string; createdAt: string; }

export default function DepartmentsPage() {
  const [items, setItems] = useState<Department[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => apiRequest<Department[]>('/academic-structure/departments').then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiRequest('/academic-structure/departments', { method: 'POST', body: { name } });
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Departments</h1>
      <p className="text-gray-500 mb-6">Group classes and staff under academic departments.</p>

      <form onSubmit={submit} className="flex gap-2 mb-6">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sciences" required
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <button disabled={loading} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">
          {loading ? 'Adding…' : 'Add'}
        </button>
      </form>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      {items.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">No departments yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {items.map((d) => <div key={d.id} className="px-4 py-3 text-sm text-gray-700">{d.name}</div>)}
        </div>
      )}
    </div>
  );
}
