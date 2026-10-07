'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, setTokens } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await apiRequest<{ accessToken: string; refreshToken: string }>('/auth/login', {
        method: 'POST',
        auth: false,
        body: { email, password, subdomain: subdomain || undefined },
      });
      setTokens(result.accessToken, result.refreshToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="max-w-sm w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Log in</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your school's subdomain if you're not a platform Super Admin.</p>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

        <label className="block">
          <span className="text-sm font-medium text-gray-700">School subdomain (optional)</span>
          <input value={subdomain} onChange={(e) => setSubdomain(e.target.value)} placeholder="greenfield"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </label>

        <button type="submit" disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition">
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
