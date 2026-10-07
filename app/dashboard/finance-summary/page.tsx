'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Expense { id: string; category: string; amount: number; date: string; description: string | null; }
interface Summary { totalInvoiced: number; totalCollected: number; totalOutstanding: number; totalExpenses: number; }

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

export default function FinanceSummaryPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState({ category: '', amountNaira: 0, date: new Date().toISOString().slice(0, 10), description: '' });
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiRequest<Summary>('/finance/invoices/summary').then(setSummary).catch(() => {});
    apiRequest<Expense[]>('/finance/expenses').then(setExpenses).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/finance/expenses', { method: 'POST', body: { ...form, amount: Math.round(form.amountNaira * 100), description: form.description || undefined } });
      setForm({ category: '', amountNaira: 0, date: form.date, description: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Finance Summary</h1>
      <p className="text-gray-500 mb-6">School-wide financial position at a glance.</p>

      {summary && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard label="Total Invoiced" value={naira(summary.totalInvoiced)} />
          <StatCard label="Total Collected" value={naira(summary.totalCollected)} accent="text-green-600" />
          <StatCard label="Outstanding" value={naira(summary.totalOutstanding)} accent="text-amber-600" />
          <StatCard label="Total Expenses" value={naira(summary.totalExpenses)} accent="text-red-600" />
        </div>
      )}

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Record an Expense</h2>
      <form onSubmit={submit} className="grid grid-cols-2 gap-2 bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category, e.g. Utilities" required className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input type="number" value={form.amountNaira} onChange={(e) => setForm({ ...form, amountNaira: Number(e.target.value) })} placeholder="₦ amount" required className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button className="col-span-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 rounded-lg">Add Expense</button>
      </form>

      {expenses.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">No expenses recorded yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {expenses.map((e) => (
            <div key={e.id} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
              <span>{e.category}{e.description && <span className="text-gray-400"> — {e.description}</span>}</span>
              <span className="text-gray-400">{naira(e.amount)} · {e.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-semibold mt-1 ${accent ?? 'text-gray-800'}`}>{value}</div>
    </div>
  );
}
