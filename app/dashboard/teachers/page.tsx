'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Teacher { id: string; firstName: string; lastName: string; email: string; staffNo?: string | null; }

export default function TeachersPage() {
  const [pending, setPending] = useState<Teacher[]>([]);
  const [active, setActive] = useState<Teacher[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    apiRequest<Teacher[]>('/people/teachers/pending').then(setPending).catch(() => {});
    apiRequest<Teacher[]>('/people/teachers').then(setActive).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setError(null);
    setBusyId(id);
    try {
      await apiRequest(`/people/teachers/${id}/${action}`, { method: 'POST' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Teachers</h1>
      <p className="text-gray-500 mb-6">
        Teachers self-register, then wait here for your approval before they can log in.
      </p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-amber-800 mb-2">Pending approval ({pending.length})</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl divide-y divide-amber-100">
            {pending.map((t) => (
              <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-800">{t.firstName} {t.lastName}</div>
                  <div className="text-xs text-gray-500">{t.email}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => act(t.id, 'approve')} disabled={busyId === t.id}
                    className="text-xs bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium px-3 py-1.5 rounded-lg"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => act(t.id, 'reject')} disabled={busyId === t.id}
                    className="text-xs bg-white border border-gray-300 hover:border-red-400 text-red-600 font-medium px-3 py-1.5 rounded-lg"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Active teachers ({active.length})</h2>
      {active.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">
          No approved teachers yet. Share your school's subdomain with teachers so they can apply at /teachers/apply.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {active.map((t) => (
            <div key={t.id} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
              <span>{t.firstName} {t.lastName}</span>
              <span className="text-gray-400">{t.staffNo}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
