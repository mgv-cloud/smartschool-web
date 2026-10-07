'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Plan { id: string; name: string; }
interface Menu { id: string; mealPlanId: string; dayOfWeek: number; mealType: string; description: string; }
interface Student { id: string; firstName: string; lastName: string; }
interface DietaryReq { id: string; studentId: string; requirement: string; }

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function MealsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [dietary, setDietary] = useState<DietaryReq[]>([]);
  const [planName, setPlanName] = useState('');
  const [menuForm, setMenuForm] = useState({ mealPlanId: '', dayOfWeek: 1, mealType: 'BREAKFAST', description: '' });
  const [dietForm, setDietForm] = useState({ studentId: '', requirement: '' });
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiRequest<Plan[]>('/meals/plans').then((p) => { setPlans(p); if (p[0]) setMenuForm((f) => ({ ...f, mealPlanId: f.mealPlanId || p[0].id })); }).catch(() => {});
    apiRequest<Menu[]>('/meals/menus').then(setMenus).catch(() => {});
    apiRequest<{ data: Student[] }>('/people/students?limit=200').then((r) => setStudents(r.data)).catch(() => {});
    apiRequest<DietaryReq[]>('/meals/dietary-requirements').then(setDietary).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const addPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/meals/plans', { method: 'POST', body: { name: planName } });
      setPlanName('');
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
  };

  const addMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/meals/menus', { method: 'POST', body: menuForm });
      setMenuForm({ ...menuForm, description: '' });
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
  };

  const addDietary = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/meals/dietary-requirements', { method: 'POST', body: dietForm });
      setDietForm({ ...dietForm, requirement: '' });
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
  };

  const planName_ = (id: string) => plans.find((p) => p.id === id)?.name ?? '—';
  const studentName = (id: string) => { const s = students.find((x) => x.id === id); return s ? `${s.firstName} ${s.lastName}` : '—'; };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Meals</h1>
      <p className="text-gray-500 mb-6">Meal plans, weekly menus, and dietary requirements.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={addPlan} className="flex gap-2 mb-4">
        <input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="e.g. Standard Boarding Plan" required className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Add Plan</button>
      </form>

      <form onSubmit={addMenu} className="grid grid-cols-4 gap-2 bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <select value={menuForm.mealPlanId} onChange={(e) => setMenuForm({ ...menuForm, mealPlanId: e.target.value })} required className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={menuForm.dayOfWeek} onChange={(e) => setMenuForm({ ...menuForm, dayOfWeek: Number(e.target.value) })} className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          {[1,2,3,4,5,6,7].map((d) => <option key={d} value={d}>{DAYS[d]}</option>)}
        </select>
        <select value={menuForm.mealType} onChange={(e) => setMenuForm({ ...menuForm, mealType: e.target.value })} className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option>BREAKFAST</option><option>LUNCH</option><option>DINNER</option>
        </select>
        <input value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} placeholder="Menu" required className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <button className="col-span-4 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium py-2 rounded-lg">Add Menu Item</button>
      </form>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-8">
        {menus.length === 0 ? <div className="px-4 py-3 text-sm text-gray-400">No menus yet.</div> : menus.map((m) => (
          <div key={m.id} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
            <span>{planName_(m.mealPlanId)} — {DAYS[m.dayOfWeek]} {m.mealType}</span>
            <span className="text-gray-400">{m.description}</span>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Dietary Requirements</h2>
      <form onSubmit={addDietary} className="flex gap-2 mb-4">
        <select value={dietForm.studentId} onChange={(e) => setDietForm({ ...dietForm, studentId: e.target.value })} required className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option value="">Student…</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
        </select>
        <input value={dietForm.requirement} onChange={(e) => setDietForm({ ...dietForm, requirement: e.target.value })} placeholder="e.g. Nut allergy" required className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg">Add</button>
      </form>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {dietary.length === 0 ? <div className="px-4 py-3 text-sm text-gray-400">None recorded yet.</div> : dietary.map((d) => (
          <div key={d.id} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
            <span>{studentName(d.studentId)}</span>
            <span className="text-amber-600">{d.requirement}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
