'use client';
import { useState } from 'react';
import { apiRequest } from '@/lib/api';

export default function TeacherApplyPage() {
  const [form, setForm] = useState({ subdomain: '', email: '', password: '', firstName: '', lastName: '' });
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiRequest('/people/teachers/apply', { method: 'POST', body: form, auth: false });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Application submitted 🎉</h1>
          <p className="text-sm text-gray-500">Your school's admin will review your application. You'll be able to log in once approved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="max-w-sm w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Apply to teach</h1>
          <p className="text-sm text-gray-500 mt-1">Your School Admin will review and approve your account.</p>
        </div>
        {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <Field label="School subdomain" value={form.subdomain} onChange={update('subdomain')} placeholder="greenfield" required />
        <Field label="Email" type="email" value={form.email} onChange={update('email')} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" value={form.firstName} onChange={update('firstName')} required />
          <Field label="Last name" value={form.lastName} onChange={update('lastName')} required />
        </div>
        <Field label="Password" type="password" value={form.password} onChange={update('password')} required hint="At least 8 characters." />
        <button type="submit" disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition">
          {loading ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input {...props} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      {hint && <span className="text-xs text-gray-400 mt-1 block">{hint}</span>}
    </label>
  );
}
