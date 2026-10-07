'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface House { id: string; name: string; color: string | null; totalPoints: number; }

export default function SportsPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [houseForm, setHouseForm] = useState({ name: '', color: '' });
  const [pointsForm, setPointsForm] = useState({ houseId: '', points: 0, reason: '' });
  const [error, setError] = useState<string | null>(null);

  const load = () => apiRequest<House[]>('/sports/houses/standings').then(setHouses).catch(() => {});
  useEffect(() => { load(); }, []);

  const addHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/sports/houses', { method: 'POST', body: { name: houseForm.name, color: houseForm.color || undefined } });
      setHouseForm({ name: '', color: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  const awardPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/sports/houses/points', { method: 'POST', body: pointsForm });
      setPointsForm({ ...pointsForm, points: 0, reason: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Sports & Houses</h1>
      <p className="text-gray-500 mb-6">House standings update automatically as points are awarded.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-6">
        {houses.length === 0 ? <div className="px-4 py-3 text-sm text-gray-400">No houses yet.</div> : houses.map((h, i) => (
          <div key={h.id} className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-700">{i === 0 && '🏆 '}{h.name} {h.color && <span className="text-xs text-gray-400">({h.color})</span>}</span>
            <span className="text-sm font-semibold text-brand-700">{h.totalPoints} pts</span>
          </div>
        ))}
      </div>

      <form onSubmit={addHouse} className="flex gap-2 mb-4">
        <input value={houseForm.name} onChange={(e) => setHouseForm({ ...houseForm, name: e.target.value })} placeholder="House name" required className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={houseForm.color} onChange={(e) => setHouseForm({ ...houseForm, color: e.target.value })} placeholder="Color (optional)" className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Add House</button>
      </form>

      <form onSubmit={awardPoints} className="grid grid-cols-4 gap-2 bg-white border border-gray-200 rounded-xl p-4">
        <select value={pointsForm.houseId} onChange={(e) => setPointsForm({ ...pointsForm, houseId: e.target.value })} required className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option value="">House…</option>
          {houses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        <input type="number" value={pointsForm.points} onChange={(e) => setPointsForm({ ...pointsForm, points: Number(e.target.value) })} placeholder="Points" required className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <input value={pointsForm.reason} onChange={(e) => setPointsForm({ ...pointsForm, reason: e.target.value })} placeholder="Reason" className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <button className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium py-2 rounded-lg">Award Points</button>
      </form>
    </div>
  );
}
