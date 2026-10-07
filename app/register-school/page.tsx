'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, setTokens } from '@/lib/api';

export default function RegisterSchoolPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    schoolName: '',
    subdomain: '',
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await apiRequest<{ accessToken: string; refreshToken: string }>(
        '/auth/register-school',
        { method: 'POST', body: form, auth: false },
      );
      setTokens(result.accessToken, result.refreshToken);
      router.push('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Set up your school</h1>
          <p className="text-sm text-gray-500 mt-1">Step 1 of the onboarding wizard — this creates your school and your admin account.</p>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

        <Field label="School name" value={form.schoolName} onChange={update('schoolName')} placeholder="Greenfield College" required />
        <Field label="Subdomain" value={form.subdomain} onChange={update('subdomain')} placeholder="greenfield" required
          hint="Lowercase letters, numbers, and hyphens only." />
        <Field label="Your email (School Admin)" type="email" value={form.adminEmail} onChange={update('adminEmail')} placeholder="admin@greenfield.ng" required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" value={form.adminFirstName} onChange={update('adminFirstName')} required />
          <Field label="Last name" value={form.adminLastName} onChange={update('adminLastName')} required />
        </div>
        <Field label="Password" type="password" value={form.adminPassword} onChange={update('adminPassword')} required hint="At least 8 characters." />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
        >
          {loading ? 'Creating your school…' : 'Continue'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label, hint, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />
      {hint && <span className="text-xs text-gray-400 mt-1 block">{hint}</span>}
    </label>
  );
}
