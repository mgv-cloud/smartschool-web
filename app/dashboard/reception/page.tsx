'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Visitor { id: string; name: string; phone: string | null; purpose: string | null; checkInAt: string; checkOutAt: string | null; }

export default function ReceptionPage() {
  const [onSite, setOnSite] = useState<Visitor[]>([]);
  const [all, setAll] = useState<Visitor[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', purpose: '' });
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiRequest<Visitor[]>('/reception/visitors/on-site').then(setOnSite).catch(() => {});
    apiRequest<Visitor[]>('/reception/visitors').then((v) => setAll(v.reverse())).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const checkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/reception/visitors/check-in', { method: 'POST', body: { name: form.name, phone: form.phone || undefined, purpose: form.purpose || undefined } });
      setForm({ name: '', phone: '', purpose: '' });
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
  };

  const checkOut = async (id: string) => {
    await apiRequest(`/reception/visitors/${id}/check-out`, { method: 'POST' });
    load();
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Reception</h1>
      <p className="text-gray-500 mb-6">Visitor check-in and check-out.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={checkIn} className="grid grid-cols-3 gap-2 bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Visitor name" required className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (optional)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Purpose (optional)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button className="col-span-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 rounded-lg">Check In</button>
      </form>

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Currently On-Site ({onSite.length})</h2>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-6">
        {onSite.length === 0 ? <div className="px-4 py-3 text-sm text-gray-400">No one currently on-site.</div> : onSite.map((v) => (
          <div key={v.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-700">{v.name}</div>
              <div className="text-xs text-gray-400">{v.purpose} · in at {new Date(v.checkInAt).toLocaleTimeString()}</div>
            </div>
            <button onClick={() => checkOut(v.id)} className="text-xs bg-gray-800 hover:bg-gray-900 text-white px-3 py-1.5 rounded-lg">Check Out</button>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Visitor Log</h2>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {all.map((v) => (
          <div key={v.id} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
            <span>{v.name}</span>
            <span className="text-xs text-gray-400">{v.checkOutAt ? 'Checked out' : 'On-site'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
