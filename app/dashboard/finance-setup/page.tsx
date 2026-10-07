'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Term { id: string; name: string; isCurrent: boolean; }
interface ClassItem { id: string; name: string; }
interface Student { id: string; firstName: string; lastName: string; }
interface FeeStructure { id: string; name: string; amount: number; classId: string | null; }
interface Scholarship { id: string; studentId: string; name: string; discountType: string; value: number; isActive: boolean; }

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

export default function FinanceSetupPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [feeForm, setFeeForm] = useState({ termId: '', classId: '', name: '', amountNaira: 0 });
  const [scholarshipForm, setScholarshipForm] = useState({ studentId: '', name: '', discountType: 'PERCENTAGE', value: 0 });
  const [error, setError] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    apiRequest<Term[]>('/onboarding/terms').then((t) => { setTerms(t); const cur = t.find((x) => x.isCurrent) ?? t[0]; if (cur) setFeeForm((f) => ({ ...f, termId: cur.id })); }).catch(() => {});
    apiRequest<ClassItem[]>('/academic-structure/classes').then(setClasses).catch(() => {});
    apiRequest<{ data: Student[] }>('/people/students?limit=200').then((r) => setStudents(r.data)).catch(() => {});
    apiRequest<FeeStructure[]>('/finance/fee-structures').then(setFeeStructures).catch(() => {});
    apiRequest<Scholarship[]>('/finance/scholarships').then(setScholarships).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const addFeeStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/finance/fee-structures', {
        method: 'POST',
        body: { termId: feeForm.termId, classId: feeForm.classId || undefined, name: feeForm.name, amount: Math.round(feeForm.amountNaira * 100) },
      });
      setFeeForm({ ...feeForm, name: '', amountNaira: 0 });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  const addScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/finance/scholarships', {
        method: 'POST',
        body: { ...scholarshipForm, value: scholarshipForm.discountType === 'FIXED' ? Math.round(scholarshipForm.value * 100) : scholarshipForm.value },
      });
      setScholarshipForm({ ...scholarshipForm, name: '', value: 0 });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  const generateInvoices = async () => {
    setError(null);
    setGenResult(null);
    setLoading(true);
    try {
      const result = await apiRequest<{ message: string }>('/finance/invoices/generate', { method: 'POST', body: { termId: feeForm.termId } });
      setGenResult(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const classNameFor = (id: string | null) => (id ? classes.find((c) => c.id === id)?.name ?? '—' : 'All classes');
  const studentNameFor = (id: string) => { const s = students.find((x) => x.id === id); return s ? `${s.firstName} ${s.lastName}` : '—'; };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Fee Structures & Scholarships</h1>
      <p className="text-gray-500 mb-6">Set these up, then generate invoices — discounts are applied automatically, and it's always safe to re-run.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Fee Structures</h2>
      <form onSubmit={addFeeStructure} className="grid grid-cols-4 gap-2 bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <select value={feeForm.termId} onChange={(e) => setFeeForm({ ...feeForm, termId: e.target.value })} required className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={feeForm.classId} onChange={(e) => setFeeForm({ ...feeForm, classId: e.target.value })} className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option value="">All classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input value={feeForm.name} onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })} placeholder="e.g. Tuition" required className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <input type="number" value={feeForm.amountNaira} onChange={(e) => setFeeForm({ ...feeForm, amountNaira: Number(e.target.value) })} placeholder="₦ amount" required className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <button className="col-span-4 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 rounded-lg">Add Fee Structure</button>
      </form>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-8">
        {feeStructures.length === 0 ? <div className="px-4 py-3 text-sm text-gray-400">None yet.</div> : feeStructures.map((f) => (
          <div key={f.id} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
            <span>{f.name} — {classNameFor(f.classId)}</span>
            <span className="text-gray-400">{naira(f.amount)}</span>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Scholarships / Discounts</h2>
      <form onSubmit={addScholarship} className="grid grid-cols-4 gap-2 bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <select value={scholarshipForm.studentId} onChange={(e) => setScholarshipForm({ ...scholarshipForm, studentId: e.target.value })} required className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option value="">Student…</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
        </select>
        <input value={scholarshipForm.name} onChange={(e) => setScholarshipForm({ ...scholarshipForm, name: e.target.value })} placeholder="e.g. Merit Scholarship" required className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <select value={scholarshipForm.discountType} onChange={(e) => setScholarshipForm({ ...scholarshipForm, discountType: e.target.value })} className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
          <option value="PERCENTAGE">% off</option>
          <option value="FIXED">₦ off</option>
        </select>
        <input type="number" value={scholarshipForm.value} onChange={(e) => setScholarshipForm({ ...scholarshipForm, value: Number(e.target.value) })} placeholder={scholarshipForm.discountType === 'PERCENTAGE' ? '0-100' : '₦ amount'} required className="rounded-lg border border-gray-300 px-2 py-2 text-sm" />
        <button className="col-span-4 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium py-2 rounded-lg">Add Scholarship</button>
      </form>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-8">
        {scholarships.length === 0 ? <div className="px-4 py-3 text-sm text-gray-400">None yet.</div> : scholarships.map((s) => (
          <div key={s.id} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
            <span>{studentNameFor(s.studentId)} — {s.name}</span>
            <span className="text-gray-400">{s.discountType === 'PERCENTAGE' ? `${s.value}% off` : naira(s.value) + ' off'}</span>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="font-medium text-sm text-amber-900 mb-1">Generate Invoices</div>
        <p className="text-xs text-amber-800 mb-3">
          Creates an invoice for every active student matching each fee structure's class, automatically applying any scholarships. Safe to run again any time — e.g. after a new student joins — it only ever adds missing invoices, never changes existing ones.
        </p>
        <button onClick={generateInvoices} disabled={loading || !feeForm.termId} className="bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">
          {loading ? 'Generating…' : 'Generate Invoices for This Term'}
        </button>
        {genResult && <div className="text-xs text-amber-900 mt-2">{genResult}</div>}
      </div>
    </div>
  );
}
