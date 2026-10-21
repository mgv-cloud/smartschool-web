'use client';
import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { naira, nairaToKobo, dateOnly, dateTime, STATE_STYLE } from '@/lib/format';

interface Payment { id: string; amount: number; method: string; reference: string | null; note: string | null; paidAt: string; paidUntilAfter: string; }
interface School {
  id: string; name: string; subdomain: string; status: string; createdAt: string;
  planName: string; planPrice: number; paidUntil: string | null; trialEndsAt: string;
  suspensionReason: string | null; accessState: string; daysLeft: number;
  userCount?: number; studentCount?: number; payments?: Payment[];
}
interface Page { data: School[]; pagination: { page: number; limit: number; total: number; totalPages: number } }

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
const btn = 'bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg';
const ghost = 'text-sm text-gray-600 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-60';
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function PlatformSchoolsPage() {
  const [list, setList] = useState<Page | null>(null);
  const [q, setQ] = useState('');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (q.trim()) params.set('q', q.trim());
    if (state) params.set('state', state);
    return apiRequest<Page>(`/platform/schools?${params}`).then(setList).catch((e) => setError(e instanceof Error ? e.message : 'Could not load schools.'));
  }, [q, state, page]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Schools &amp; Subscriptions</h1>
      <p className="text-gray-500 mb-6">Every school on the platform. Record payments, extend trials, and suspend or reactivate a school.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <div className="flex flex-wrap gap-3 mb-4">
        <input className={`${input} max-w-xs`} placeholder="Search by school name or subdomain" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select className={`${input} max-w-[11rem]`} value={state} onChange={(e) => { setState(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active (paid)</option>
          <option value="TRIAL">On trial</option>
          <option value="EXPIRED">Expired</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {!list ? <div className="text-sm text-gray-400">Loading…</div> : list.data.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">No schools match.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {list.data.map((s) => (
            <div key={s.id}>
              <div className="px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-gray-800">{s.name} <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${STATE_STYLE[s.accessState]}`}>{s.accessState}</span></div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    {s.subdomain} · {s.planName}{s.planPrice > 0 ? ` (${naira(s.planPrice)}/term)` : ''} · {s.userCount ?? 0} users · {s.studentCount ?? 0} students ·{' '}
                    {s.accessState === 'ACTIVE' ? `paid until ${dateOnly(s.paidUntil)}` : s.accessState === 'TRIAL' ? `trial ends ${dateOnly(s.trialEndsAt)}` : `since ${dateOnly(s.paidUntil ?? s.trialEndsAt)}`}
                    {(s.accessState === 'ACTIVE' || s.accessState === 'TRIAL') && ` (${s.daysLeft} day${s.daysLeft === 1 ? '' : 's'} left)`}
                  </div>
                </div>
                <button onClick={() => setOpenId(openId === s.id ? null : s.id)} className="text-brand-600 hover:underline shrink-0">{openId === s.id ? 'Close' : 'Manage'}</button>
              </div>
              {openId === s.id && <ManagePanel id={s.id} onChanged={load} />}
            </div>
          ))}
        </div>
      )}

      {list && list.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Page {list.pagination.page} of {list.pagination.totalPages} · {list.pagination.total} schools</span>
          <div className="flex gap-2">
            <button className={ghost} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <button className={ghost} disabled={page >= list.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ManagePanel({ id, onChanged }: { id: string; onChanged: () => void }) {
  const [s, setS] = useState<School | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [plan, setPlan] = useState({ name: '', price: '' });
  const [trialDays, setTrialDays] = useState('14');
  const [pay, setPay] = useState({ amount: '', method: 'BANK_TRANSFER', reference: '', note: '', extendDays: '120', paidAt: todayStr() });
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    const d = await apiRequest<School>(`/platform/schools/${id}`);
    setS(d);
    setPlan({ name: d.planName, price: d.planPrice ? String(d.planPrice / 100) : '' });
  }, [id]);
  useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : 'Could not load this school.')); }, [load]);

  const run = async (fn: () => Promise<string | void>, ok: string) => {
    setError(null); setNotice(null); setBusy(true);
    try { const extra = await fn(); await load(); onChanged(); setNotice(extra || ok); }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.'); }
    finally { setBusy(false); }
  };

  if (!s) return <div className="px-4 pb-4 text-sm text-gray-400">{error ?? 'Loading…'}</div>;

  const payKobo = nairaToKobo(pay.amount);
  const payAmountOk = payKobo > 0 && /^\d+$/.test(pay.extendDays.trim()) && parseInt(pay.extendDays, 10) >= 1;
  const planKobo = plan.price.trim() ? nairaToKobo(plan.price) : 0;

  return (
    <div className="px-4 pb-5 pt-1 bg-gray-50/60 border-t border-gray-100 space-y-5 text-sm">
      {error && <div className="bg-red-50 text-red-700 rounded-lg px-3 py-2">{error}</div>}
      {notice && <div className="bg-green-50 text-green-700 rounded-lg px-3 py-2">{notice}</div>}
      {s.status === 'SUSPENDED' && (
        <div className="bg-red-50 text-red-700 rounded-lg px-3 py-2">Suspended {s.suspensionReason ? `— ${s.suspensionReason}` : ''}. Its users cannot log in.</div>
      )}

      <section>
        <h3 className="font-semibold text-gray-700 mb-2">Plan</h3>
        <div className="flex flex-wrap gap-2 items-end">
          <label className="flex-1 min-w-[9rem]"><span className="text-xs text-gray-500">Plan name</span><input className={input} value={plan.name} onChange={(e) => setPlan({ ...plan, name: e.target.value })} /></label>
          <label className="w-44"><span className="text-xs text-gray-500">Price per term (₦)</span><input className={input} inputMode="decimal" value={plan.price} onChange={(e) => setPlan({ ...plan, price: e.target.value })} placeholder="e.g. 50000" />{Number.isNaN(planKobo) && <span className="text-xs text-red-600">Enter a plain amount, like 50000</span>}</label>
          <button disabled={busy || plan.name.trim().length < 2 || Number.isNaN(planKobo)} className={btn} onClick={() => run(async () => { await apiRequest(`/platform/schools/${id}/plan`, { method: 'PATCH', body: { planName: plan.name.trim(), planPrice: planKobo } }); }, 'Plan saved.')}>Save plan</button>
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-gray-700 mb-2">Record a payment</h3>
        <p className="text-xs text-gray-500 mb-2">Use this when the school has paid you (for example by bank transfer). It adds the days below to their access, counted from today or their current paid-until date, whichever is later.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <label><span className="text-xs text-gray-500">Amount paid (₦)</span><input className={input} inputMode="decimal" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />{pay.amount.trim() !== '' && Number.isNaN(payKobo) && <span className="text-xs text-red-600">Enter a plain amount, like 50000</span>}</label>
          <label><span className="text-xs text-gray-500">Method</span>
            <select className={input} value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
              <option value="BANK_TRANSFER">Bank transfer</option><option value="CASH">Cash</option><option value="OTHER">Other</option>
            </select></label>
          <label><span className="text-xs text-gray-500">Days of access</span><input className={input} inputMode="numeric" value={pay.extendDays} onChange={(e) => setPay({ ...pay, extendDays: e.target.value })} /></label>
          <label><span className="text-xs text-gray-500">Paid on</span><input className={input} type="date" value={pay.paidAt} onChange={(e) => setPay({ ...pay, paidAt: e.target.value })} /></label>
          <label className="col-span-2"><span className="text-xs text-gray-500">Reference (optional)</span><input className={input} value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} /></label>
          <label className="col-span-2"><span className="text-xs text-gray-500">Note (optional)</span><input className={input} value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} /></label>
        </div>
        <button disabled={busy || !payAmountOk} className={`${btn} mt-2`} onClick={() => {
          if (!window.confirm(`Record ${naira(payKobo)} from ${s.name} and add ${pay.extendDays} days of access?\n\nPayments are permanent records — a mistake is corrected by recording a new entry, not by editing this one.`)) return;
          run(async () => {
            const body: Record<string, unknown> = { amount: payKobo, method: pay.method, extendDays: parseInt(pay.extendDays, 10), paidAt: pay.paidAt };
            if (pay.reference.trim()) body.reference = pay.reference.trim();
            if (pay.note.trim()) body.note = pay.note.trim();
            await apiRequest(`/platform/schools/${id}/payments`, { method: 'POST', body });
            setPay({ ...pay, amount: '', reference: '', note: '' });
          }, 'Payment recorded and access extended.');
        }}>Record payment</button>
      </section>

      <section>
        <h3 className="font-semibold text-gray-700 mb-2">Extend free trial</h3>
        <div className="flex gap-2 items-end">
          <label className="w-32"><span className="text-xs text-gray-500">Days to add</span><input className={input} inputMode="numeric" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} /></label>
          <button disabled={busy || !(parseInt(trialDays, 10) >= 1)} className={ghost} onClick={() => run(async () => { await apiRequest(`/platform/schools/${id}/extend-trial`, { method: 'POST', body: { days: parseInt(trialDays, 10) } }); }, 'Trial extended.')}>Extend trial</button>
          <span className="text-xs text-gray-500 pb-2">Trial ends {dateOnly(s.trialEndsAt)}</span>
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-gray-700 mb-2">{s.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}</h3>
        {s.status === 'SUSPENDED' ? (
          <button disabled={busy} className={btn} onClick={() => {
            if (!window.confirm(`Reactivate ${s.name}?\n\nThis lifts the suspension. If their subscription has also run out they will still be blocked until you record a payment or extend their trial.`)) return;
            run(async () => {
              const r = await apiRequest<School>(`/platform/schools/${id}/reactivate`, { method: 'POST' });
              if (r.accessState === 'EXPIRED') return 'Suspension lifted, but their subscription has expired — record a payment or extend the trial to let them in.';
            }, 'School reactivated.');
          }}>Reactivate school</button>
        ) : (
          <div className="flex gap-2 items-end">
            <label className="flex-1"><span className="text-xs text-gray-500">Reason (optional, kept in the audit log)</span><input className={input} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
            <button disabled={busy} className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg" onClick={() => {
              if (!window.confirm(`Suspend ${s.name}?\n\nEveryone at this school will be signed out and unable to log in until you reactivate it. No data is deleted.`)) return;
              run(async () => { await apiRequest(`/platform/schools/${id}/suspend`, { method: 'POST', body: reason.trim() ? { reason: reason.trim() } : {} }); setReason(''); }, 'School suspended.');
            }}>Suspend school</button>
          </div>
        )}
      </section>

      <section>
        <h3 className="font-semibold text-gray-700 mb-2">Payment history</h3>
        {!s.payments || s.payments.length === 0 ? <div className="text-gray-400">No payments recorded yet.</div> : (
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {s.payments.map((p) => (
              <div key={p.id} className="px-3 py-2 flex flex-wrap justify-between gap-2">
                <div><span className="font-medium text-gray-800">{naira(p.amount)}</span> <span className="text-gray-500">· {p.method.replace('_', ' ').toLowerCase()}{p.reference ? ` · ${p.reference}` : ''}</span>{p.note && <div className="text-xs text-gray-400">{p.note}</div>}</div>
                <div className="text-xs text-gray-500 text-right">paid {dateOnly(p.paidAt)}<br />access until {dateOnly(p.paidUntilAfter)}</div>
              </div>
            ))}
          </div>
        )}
        <div className="text-xs text-gray-400 mt-2">Registered {dateTime(s.createdAt)}</div>
      </section>
    </div>
  );
}
