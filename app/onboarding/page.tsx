'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

type Step = 'campus' | 'session' | 'term' | 'done';

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('campus');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [campus, setCampus] = useState({ name: '', address: '' });
  const [session, setSession] = useState({ name: '', startDate: '', endDate: '' });
  const [term, setTerm] = useState({ name: 'First Term', startDate: '', endDate: '' });

  const steps: { key: Step; label: string }[] = [
    { key: 'campus', label: 'Campus' },
    { key: 'session', label: 'Academic Session' },
    { key: 'term', label: 'Term' },
    { key: 'done', label: 'Finish' },
  ];
  const currentIndex = steps.findIndex((s) => s.key === step);

  const runStep = async (fn: () => Promise<void>) => {
    setError(null);
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const submitCampus = () =>
    runStep(async () => {
      await apiRequest('/onboarding/campuses', { method: 'POST', body: { name: campus.name, address: campus.address, isMain: true } });
      setStep('session');
    });

  const submitSession = () =>
    runStep(async () => {
      const created = await apiRequest<{ id: string }>('/onboarding/academic-sessions', {
        method: 'POST',
        body: { ...session, isCurrent: true },
      });
      setSessionId(created.id);
      setStep('term');
    });

  const submitTerm = () =>
    runStep(async () => {
      await apiRequest('/onboarding/terms', {
        method: 'POST',
        body: { ...term, sessionId, isCurrent: true },
      });
      setStep('done');
    });

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        {/* Progress indicator — Section 54 */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex-1 flex items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium
                  ${i <= currentIndex ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'}`}
              >
                {i + 1}
              </div>
              <span className="text-xs ml-2 text-gray-600 hidden sm:inline">{s.label}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < currentIndex ? 'bg-brand-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

          {step === 'campus' && (
            <StepForm title="Add your first campus" onSubmit={submitCampus} loading={loading}>
              <Field label="Campus name" value={campus.name} onChange={(v) => setCampus({ ...campus, name: v })} placeholder="Main Campus" required />
              <Field label="Address (optional)" value={campus.address} onChange={(v) => setCampus({ ...campus, address: v })} />
            </StepForm>
          )}

          {step === 'session' && (
            <StepForm title="Set up your current academic session" onSubmit={submitSession} loading={loading}>
              <Field label="Session name" value={session.name} onChange={(v) => setSession({ ...session, name: v })} placeholder="2025/2026" required />
              <Field label="Start date" type="date" value={session.startDate} onChange={(v) => setSession({ ...session, startDate: v })} required />
              <Field label="End date" type="date" value={session.endDate} onChange={(v) => setSession({ ...session, endDate: v })} required />
            </StepForm>
          )}

          {step === 'term' && (
            <StepForm title="Set up your first term" onSubmit={submitTerm} loading={loading}>
              <Field label="Term name" value={term.name} onChange={(v) => setTerm({ ...term, name: v })} required />
              <Field label="Start date" type="date" value={term.startDate} onChange={(v) => setTerm({ ...term, startDate: v })} required />
              <Field label="End date" type="date" value={term.endDate} onChange={(v) => setTerm({ ...term, endDate: v })} required />
            </StepForm>
          )}

          {step === 'done' && (
            <div className="text-center py-6">
              <h2 className="text-lg font-semibold text-gray-900">You're all set! 🎉</h2>
              <p className="text-sm text-gray-500 mt-2 mb-6">
                Your school, campus, academic session, and term are ready. Students, teachers, timetable, and the
                rest of SmartSchool AI arrive in the phases after this one.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 px-6 rounded-lg transition"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepForm({
  title, onSubmit, loading, children,
}: { title: string; onSubmit: () => void; loading: boolean; children: React.ReactNode }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {children}
      <button type="submit" disabled={loading}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition">
        {loading ? 'Saving…' : 'Continue'}
      </button>
    </form>
  );
}

function Field({
  label, value, onChange, ...props
}: { label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </label>
  );
}
