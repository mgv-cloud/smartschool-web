'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface School { id: string; name: string; subdomain: string; logoUrl: string | null; currency: string; timezone: string; status: string; }
interface Status { school?: School | null; steps: { schoolInfo: boolean; campus: boolean; academicSession: boolean } }

const CURRENCIES = ['NGN', 'GHS', 'KES', 'ZAR', 'USD'];

export default function SchoolProfilePage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [form, setForm] = useState({ name: '', logoUrl: '', currency: 'NGN', timezone: 'Africa/Lagos' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [noSchool, setNoSchool] = useState(false); // platform owner: signed in, but not attached to a school

  const load = () =>
    apiRequest<Status>('/onboarding/status')
      .then((s) => {
        if (!s.school) { setStatus(null); setNoSchool(true); return; }
        setStatus(s);
        setForm({ name: s.school.name, logoUrl: s.school.logoUrl ?? '', currency: s.school.currency, timezone: s.school.timezone });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load the school profile.'))
      .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSaved(false); setSaving(true);
    try {
      const body: Record<string, string> = { name: form.name, currency: form.currency, timezone: form.timezone };
      if (form.logoUrl.trim()) body.logoUrl = form.logoUrl.trim();
      await apiRequest('/onboarding/school-info', { method: 'PATCH', body });
      setSaved(true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally { setSaving(false); }
  };

  const input = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">School Profile</h1>
      <p className="text-gray-500 mb-6">Your school's name, currency and time zone. These appear across invoices, reports and timetables.</p>

      {loading && <div className="text-sm text-gray-400">Loading…</div>}
      {noSchool && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
          You're signed in as the platform owner, which doesn't belong to a school. Sign in with a school admin account to view or edit a school's profile.
        </div>
      )}
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
      {saved && <div className="bg-green-50 text-green-700 text-sm rounded-lg px-3 py-2 mb-4">Profile saved.</div>}

      {status && status.school && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 text-sm text-gray-600 grid grid-cols-2 gap-3">
            <div><div className="text-xs text-gray-400">Login subdomain</div><div className="font-medium text-gray-800">{status.school.subdomain}</div></div>
            <div><div className="text-xs text-gray-400">Status</div><div className="font-medium text-gray-800">{status.school.status}</div></div>
            <div><div className="text-xs text-gray-400">Campuses</div><div className="font-medium text-gray-800">{status.steps.campus ? 'Set up' : 'None yet'}</div></div>
            <div><div className="text-xs text-gray-400">Academic session</div><div className="font-medium text-gray-800">{status.steps.academicSession ? 'Set up' : 'None yet'}</div></div>
          </div>

          <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <label className="block"><span className="text-sm font-medium text-gray-700">School name</span>
              <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label className="block"><span className="text-sm font-medium text-gray-700">Logo URL (optional)</span>
              <input className={input} value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://…" /></label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block"><span className="text-sm font-medium text-gray-700">Currency</span>
                <select className={input} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select></label>
              <label className="block"><span className="text-sm font-medium text-gray-700">Time zone</span>
                <input className={input} value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} /></label>
            </div>
            <button disabled={saving} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
