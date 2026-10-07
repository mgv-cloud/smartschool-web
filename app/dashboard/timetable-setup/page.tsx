'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Room { id: string; name: string; type: string; capacity: number | null; }
interface Period { id: string; name: string; startTime: string; endTime: string; isTeachingPeriod: boolean; sortOrder: number; }

const ROOM_TYPES = ['CLASSROOM', 'LAB', 'HALL', 'SPORTS', 'OTHER'];

export default function TimetableSetupPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [roomForm, setRoomForm] = useState({ name: '', type: 'CLASSROOM', capacity: 40 });
  const [periodForm, setPeriodForm] = useState({ name: '', startTime: '08:00', endTime: '08:50', isTeachingPeriod: true, sortOrder: 1 });
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiRequest<Room[]>('/timetable/rooms').then(setRooms).catch(() => {});
    apiRequest<Period[]>('/timetable/periods').then(setPeriods).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const addRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/timetable/rooms', { method: 'POST', body: roomForm });
      setRoomForm({ name: '', type: 'CLASSROOM', capacity: 40 });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  const addPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/timetable/periods', { method: 'POST', body: periodForm });
      setPeriodForm({ ...periodForm, name: '', sortOrder: periodForm.sortOrder + 1 });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Timetable Setup</h1>
      <p className="text-gray-500 mb-6">Rooms and periods — the building blocks the generator schedules into.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Periods</h2>
      <p className="text-xs text-gray-400 mb-2">Mark Assembly/Break/Lunch as non-teaching — the generator will never schedule a lesson there.</p>
      <form onSubmit={addPeriod} className="grid grid-cols-5 gap-2 bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <input value={periodForm.name} onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })} placeholder="e.g. Period 1" required className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <input type="time" value={periodForm.startTime} onChange={(e) => setPeriodForm({ ...periodForm, startTime: e.target.value })} className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <input type="time" value={periodForm.endTime} onChange={(e) => setPeriodForm({ ...periodForm, endTime: e.target.value })} className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <label className="flex items-center gap-1 text-sm text-gray-600">
          <input type="checkbox" checked={periodForm.isTeachingPeriod} onChange={(e) => setPeriodForm({ ...periodForm, isTeachingPeriod: e.target.checked })} /> Teaching
        </label>
        <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 rounded-lg">Add</button>
      </form>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-8">
        {periods.map((p) => (
          <div key={p.id} className="px-4 py-2 text-sm text-gray-700 flex justify-between">
            <span>{p.name}</span>
            <span className="text-gray-400">{p.startTime}–{p.endTime} {!p.isTeachingPeriod && <span className="text-amber-600">· non-teaching</span>}</span>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Rooms</h2>
      <form onSubmit={addRoom} className="grid grid-cols-4 gap-2 bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <input value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} placeholder="e.g. Science Lab 1" required className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <select value={roomForm.type} onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })} className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="number" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })} className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 rounded-lg">Add</button>
      </form>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {rooms.map((r) => (
          <div key={r.id} className="px-4 py-2 text-sm text-gray-700 flex justify-between">
            <span>{r.name}</span>
            <span className="text-gray-400">{r.type} · cap {r.capacity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
