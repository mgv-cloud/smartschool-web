'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface LeaveRequest { id: string; leaveType: string; startDate: string; endDate: string; status: string; reason: string | null; firstName?: string; lastName?: string; }

export default function HrPage() {
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [form, setForm] = useState({ leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' });
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(true);

  const load = () => {
    apiRequest<LeaveRequest[]>('/hr/leave-requests/my').then(setMyRequests).catch(() => {});
    apiRequest<LeaveRequest[]>('/hr/leave-requests').then(setAllRequests).catch(() => setIsAdmin(false));
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/hr/leave-requests', { method: 'POST', body: { ...form, reason: form.reason || undefined } });
      setForm({ leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' });
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
  };

  const decide = async (id: string, status: string) => {
    setError(null);
    try {
      await apiRequest(`/hr/leave-requests/${id}/decide`, { method: 'POST', body: { status } });
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">HR — Leave</h1>
      <p className="text-gray-500 mb-6">Any staff member can request leave; School Admin/HR decide.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={submit} className="grid grid-cols-2 gap-2 bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <select value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option>ANNUAL</option><option>SICK</option><option>MATERNITY</option><option>PATERNITY</option><option>OTHER</option>
        </select>
        <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason (optional)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button className="col-span-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 rounded-lg">Request Leave</button>
      </form>

      <h2 className="text-sm font-semibold text-gray-700 mb-2">My Requests</h2>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-6">
        {myRequests.length === 0 ? <div className="px-4 py-3 text-sm text-gray-400">None yet.</div> : myRequests.map((r) => (
          <div key={r.id} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
            <span>{r.leaveType} — {r.startDate} to {r.endDate}</span>
            <span className={`text-xs px-2 py-0.5 rounded h-fit ${r.status === 'APPROVED' ? 'bg-green-100 text-green-700' : r.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
          </div>
        ))}
      </div>

      {isAdmin && (
        <>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">All Requests (Admin)</h2>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {allRequests.length === 0 ? <div className="px-4 py-3 text-sm text-gray-400">None yet.</div> : allRequests.map((r) => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-700">{r.firstName} {r.lastName} — {r.leaveType}</div>
                  <div className="text-xs text-gray-400">{r.startDate} to {r.endDate}</div>
                </div>
                {r.status === 'PENDING' ? (
                  <div className="flex gap-1">
                    <button onClick={() => decide(r.id, 'APPROVED')} className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-2 py-1 rounded">Approve</button>
                    <button onClick={() => decide(r.id, 'REJECTED')} className="text-xs bg-white border border-gray-300 text-red-600 px-2 py-1 rounded">Reject</button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">{r.status}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
