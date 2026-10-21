'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { dateTime } from '@/lib/format';

interface Row { id: string; action: string; entity: string; newValue: Record<string, unknown> | null; createdAt: string; schoolName: string | null; schoolSubdomain: string | null; userEmail: string | null; }
interface Result { data: Row[]; pagination: { page: number; limit: number; total: number; totalPages: number } }

const ACTIONS = ['', 'LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'PUBLISH'];
const ghost = 'text-sm text-gray-600 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-60';

// A short human summary of what happened, built from the stored change (never the raw JSON).
function summary(r: Row) {
  const v = r.newValue ?? {};
  const op = typeof v.operation === 'string' ? v.operation : null;
  if (op === 'SUSPEND') return `Suspended${v.reason ? ` — ${v.reason}` : ''}`;
  if (op === 'REACTIVATE') return 'Reactivated';
  if (op === 'EXTEND_TRIAL') return `Trial extended by ${v.days} days`;
  if (op === 'UPDATE_PLAN') return `Plan set to ${v.planName}`;
  if (r.entity === 'SubscriptionPayment') return `Payment recorded (${v.method}, +${v.extendDays} days)`;
  return '';
}

export default function PlatformAuditPage() {
  const [res, setRes] = useState<Result | null>(null);
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (action) params.set('action', action);
    apiRequest<Result>(`/platform/audit-logs?${params}`).then(setRes).catch((e) => setError(e instanceof Error ? e.message : 'Could not load the audit log.'));
  }, [action, page]);

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Audit Log</h1>
      <p className="text-gray-500 mb-6">Who did what, across every school. Newest first.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
      <select className="mb-4 rounded-lg border border-gray-300 px-3 py-2 text-sm" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
        {ACTIONS.map((a) => <option key={a} value={a}>{a || 'All actions'}</option>)}
      </select>
      {!res ? <div className="text-sm text-gray-400">Loading…</div> : res.data.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">Nothing recorded yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {res.data.map((r) => (
            <div key={r.id} className="px-4 py-2.5 text-sm flex flex-wrap justify-between gap-2">
              <div>
                <span className="font-medium text-gray-800">{r.action}</span> <span className="text-gray-600">{r.entity}</span>
                {summary(r) && <span className="text-gray-500"> · {summary(r)}</span>}
                <div className="text-xs text-gray-400">{r.schoolName ?? 'Platform'}{r.schoolSubdomain ? ` (${r.schoolSubdomain})` : ''} · {r.userEmail ?? 'unknown user'}</div>
              </div>
              <div className="text-xs text-gray-400">{dateTime(r.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
      {res && res.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Page {res.pagination.page} of {res.pagination.totalPages}</span>
          <div className="flex gap-2">
            <button className={ghost} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <button className={ghost} disabled={page >= res.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
