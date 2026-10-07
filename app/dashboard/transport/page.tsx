'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Vehicle { id: string; name: string; capacity: number | null; driverName: string | null; }
interface Route { id: string; name: string; vehicleId: string | null; }
interface Student { id: string; firstName: string; lastName: string; }
interface Assignment { id: string; routeId: string; studentFirstName: string; studentLastName: string; }

export default function TransportPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [vehicleForm, setVehicleForm] = useState({ name: '', capacity: 30, driverName: '', driverPhone: '' });
  const [routeForm, setRouteForm] = useState({ name: '', vehicleId: '' });
  const [assignForm, setAssignForm] = useState({ studentId: '', routeId: '' });
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiRequest<Vehicle[]>('/transport/vehicles').then(setVehicles).catch(() => {});
    apiRequest<Route[]>('/transport/routes').then(setRoutes).catch(() => {});
    apiRequest<{ data: Student[] }>('/people/students?limit=200').then((r) => setStudents(r.data)).catch(() => {});
    apiRequest<Assignment[]>('/transport/assignments').then(setAssignments).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const addVehicle = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    try { await apiRequest('/transport/vehicles', { method: 'POST', body: vehicleForm }); setVehicleForm({ ...vehicleForm, name: '' }); load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
  };
  const addRoute = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    try { await apiRequest('/transport/routes', { method: 'POST', body: { name: routeForm.name, vehicleId: routeForm.vehicleId || undefined } }); setRouteForm({ name: '', vehicleId: '' }); load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
  };
  const assign = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    try { await apiRequest('/transport/assignments', { method: 'POST', body: assignForm }); load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
  };

  const routeName = (id: string) => routes.find((r) => r.id === id)?.name ?? '—';

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Transport</h1>
      <p className="text-gray-500 mb-6">Vehicles, routes, and student assignments — re-assigning a student updates their existing assignment.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Vehicles</h2>
      <form onSubmit={addVehicle} className="grid grid-cols-4 gap-2 bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <input value={vehicleForm.name} onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })} placeholder="e.g. Bus 1" required className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <input type="number" value={vehicleForm.capacity} onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: Number(e.target.value) })} className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <input value={vehicleForm.driverName} onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })} placeholder="Driver name" className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 rounded-lg">Add</button>
      </form>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-6">
        {vehicles.map((v) => <div key={v.id} className="px-4 py-2 text-sm text-gray-700 flex justify-between"><span>{v.name}</span><span className="text-gray-400">{v.driverName} · cap {v.capacity}</span></div>)}
      </div>

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Routes</h2>
      <form onSubmit={addRoute} className="grid grid-cols-3 gap-2 bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <input value={routeForm.name} onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })} placeholder="e.g. Route A - Aba Road" required className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <select value={routeForm.vehicleId} onChange={(e) => setRouteForm({ ...routeForm, vehicleId: e.target.value })} className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option value="">No vehicle yet</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <button className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium py-2 rounded-lg">Add Route</button>
      </form>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-6">
        {routes.map((r) => <div key={r.id} className="px-4 py-2 text-sm text-gray-700">{r.name}</div>)}
      </div>

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Assign a Student</h2>
      <form onSubmit={assign} className="grid grid-cols-3 gap-2 bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <select value={assignForm.studentId} onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })} required className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option value="">Student…</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
        </select>
        <select value={assignForm.routeId} onChange={(e) => setAssignForm({ ...assignForm, routeId: e.target.value })} required className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option value="">Route…</option>
          {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium py-2 rounded-lg">Assign</button>
      </form>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {assignments.map((a) => <div key={a.id} className="px-4 py-2 text-sm text-gray-700 flex justify-between"><span>{a.studentFirstName} {a.studentLastName}</span><span className="text-gray-400">{routeName(a.routeId)}</span></div>)}
      </div>
    </div>
  );
}
