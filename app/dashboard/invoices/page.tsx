'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Invoice { id: string; studentFirstName: string; studentLastName: string; feeName: string; originalAmount: number; discountAmount: number; amountDue: number; amountPaid: number; status: string; }

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  PARTIAL: 'bg-amber-100 text-amber-700',
  PAID: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payForm, setPayForm] = useState<{ invoiceId: string; amountNaira: number; method: string; reference: string }>({ invoiceId: '', amountNaira: 0, method: 'Cash', reference: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => apiRequest<Invoice[]>('/finance/invoices').then(setInvoices).catch(() => {});
  useEffect(() => { load(); }, []);

  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiRequest('/finance/payments', {
        method: 'POST',
        body: { invoiceId: payForm.invoiceId, amount: Math.round(payForm.amountNaira * 100), method: payForm.method, reference: payForm.reference || undefined },
      });
      setPayForm({ invoiceId: '', amountNaira: 0, method: 'Cash', reference: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Invoices & Payments</h1>
      <p className="text-gray-500 mb-6">Record a payment against any invoice — overpayment beyond the remaining balance is blocked automatically.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-3 py-2">Student</th>
              <th className="text-left px-3 py-2">Fee</th>
              <th className="text-left px-3 py-2">Due</th>
              <th className="text-left px-3 py-2">Paid</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setPayForm({ ...payForm, invoiceId: inv.id })}>
                <td className="px-3 py-2">{inv.studentFirstName} {inv.studentLastName}</td>
                <td className="px-3 py-2">{inv.feeName}{inv.discountAmount > 0 && <span className="text-xs text-green-600 ml-1">(-{naira(inv.discountAmount)})</span>}</td>
                <td className="px-3 py-2">{naira(inv.amountDue)}</td>
                <td className="px-3 py-2">{naira(inv.amountPaid)}</td>
                <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[inv.status] ?? ''}`}>{inv.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={recordPayment} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <div className="font-medium text-sm text-gray-700 mb-1">Record a payment</div>
        <select value={payForm.invoiceId} onChange={(e) => setPayForm({ ...payForm, invoiceId: e.target.value })} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">Select an invoice (or click a row above)…</option>
          {invoices.map((inv) => <option key={inv.id} value={inv.id}>{inv.studentFirstName} {inv.studentLastName} — {inv.feeName} ({naira(inv.amountDue - inv.amountPaid)} remaining)</option>)}
        </select>
        <div className="grid grid-cols-3 gap-2">
          <input type="number" value={payForm.amountNaira} onChange={(e) => setPayForm({ ...payForm, amountNaira: Number(e.target.value) })} placeholder="₦ amount" required className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <select value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option>Cash</option><option>Bank Transfer</option><option>Card</option><option>Online</option>
          </select>
          <input value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} placeholder="Reference (optional)" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <button disabled={loading} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">
          {loading ? 'Recording…' : 'Record Payment'}
        </button>
      </form>
    </div>
  );
}
