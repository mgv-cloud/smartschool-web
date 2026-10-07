'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Hostel { id: string; name: string; }
interface Room { id: string; hostelId: string; name: string; capacity: number; }
interface Student { id: string; firstName: string; lastName: string; }
interface Allocation { id: string; hostelRoomId: string; status: string; studentFirstName: string; studentLastName: string; }

export default function HostelPage() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [selectedHostel, setSelectedHostel] = useState('');
  const [hostelName, setHostelName] = useState('');
  const [roomForm, setRoomForm] = useState({ name: '', capacity: 4 });
  const [allocForm, setAllocForm] = useState({ studentId: '', hostelRoomId: '' });
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiRequest<Hostel[]>('/hostel/hostels').then(setHostels).catch(() => {});
    apiRequest<{ data: Student[] }>('/people/students?limit=200').then((r) => setStudents(r.data)).catch(() => {});
    apiRequest<Allocation[]>('/hostel/allocations').then(setAllocations).catch(() => {});
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (selectedHostel) apiRequest<Room[]>(`/hostel/hostels/${selectedHostel}/rooms`).then(setRooms).catch(() => {}); }, [selectedHostel]);

  const addHostel = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    try { await apiRequest('/hostel/hostels', { method: 'POST', body: { name: hostelName } }); setHostelName(''); load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
  };
  const addRoom = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    try { await apiRequest(`/hostel/hostels/${selectedHostel}/rooms`, { method: 'POST', body: roomForm }); setRoomForm({ name: '', capacity: 4 }); apiRequest<Room[]>(`/hostel/hostels/${selectedHostel}/rooms`).then(setRooms); }
    catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
  };
  const allocate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    try { await apiRequest('/hostel/allocations', { method: 'POST', body: allocForm }); load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
  };
  const checkout = async (id: string) => {
    setError(null);
    try { await apiRequest(`/hostel/allocations/${id}/checkout`, { method: 'POST' }); load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
  };

  const roomLabel = (id: string) => rooms.find((r) => r.id === id)?.name ?? hostels.length ? '—' : '—';

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Hostel</h1>
      <p className="text-gray-500 mb-6">Room capacity is enforced automatically — a full room can't accept another student.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={addHostel} className="flex gap-2 mb-4">
        <input value={hostelName} onChange={(e) => setHostelName(e.target.value)} placeholder="e.g. Unity House" required className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Add Hostel</button>
      </form>

      <div className="flex flex-wrap gap-2 mb-4">
        {hostels.map((h) => (
          <button key={h.id} onClick={() => setSelectedHostel(h.id)} className={`text-xs px-3 py-1.5 rounded-lg border ${selectedHostel === h.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-gray-300 text-gray-600'}`}>{h.name}</button>
        ))}
      </div>

      {selectedHostel && (
        <>
          <form onSubmit={addRoom} className="grid grid-cols-3 gap-2 bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <input value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} placeholder="e.g. Room 12" required className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
            <input type="number" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })} className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
            <button className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium py-2 rounded-lg">Add Room</button>
          </form>
          <div className="flex flex-wrap gap-2 mb-6">
            {rooms.map((r) => <span key={r.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{r.name} (cap {r.capacity})</span>)}
          </div>
        </>
      )}

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Allocate a Student</h2>
      <form onSubmit={allocate} className="grid grid-cols-3 gap-2 bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <select value={allocForm.studentId} onChange={(e) => setAllocForm({ ...allocForm, studentId: e.target.value })} required className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option value="">Student…</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
        </select>
        <select value={allocForm.hostelRoomId} onChange={(e) => setAllocForm({ ...allocForm, hostelRoomId: e.target.value })} required className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option value="">Room…</option>
          {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium py-2 rounded-lg">Allocate</button>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {allocations.map((a) => (
          <div key={a.id} className="px-4 py-2 text-sm text-gray-700 flex justify-between items-center">
            <span>{a.studentFirstName} {a.studentLastName} <span className="text-gray-400">— {roomLabel(a.hostelRoomId)}</span></span>
            {a.status === 'ACTIVE' ? (
              <button onClick={() => checkout(a.id)} className="text-xs text-red-600 hover:underline">Check out</button>
            ) : (
              <span className="text-xs text-gray-400">Checked out</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
