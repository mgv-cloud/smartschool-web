'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Vacancy { id: string; title: string; status: string; }
interface Candidate { id: string; vacancyId: string; firstName: string; lastName: string; email: string | null; status: string; }

const STATUSES = ['APPLIED', 'SHORTLISTED', 'INTERVIEWED', 'OFFERED', 'REJECTED', 'HIRED'];

export default function RecruitmentPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiRequest<Vacancy[]>('/recruitment/vacancies').then(setVacancies).catch(() => {});
    apiRequest<Candidate[]>('/recruitment/candidates').then(setCandidates).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const addVacancy = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/recruitment/vacancies', { method: 'POST', body: { title } });
      setTitle('');
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
  };

  const updateStatus = async (candidateId: string, status: string) => {
    setError(null);
    try {
      await apiRequest(`/recruitment/candidates/${candidateId}/status`, { method: 'POST', body: { status } });
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
  };

  const vacancyTitle = (id: string) => vacancies.find((v) => v.id === id)?.title ?? '—';

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Recruitment</h1>
      <p className="text-gray-500 mb-6">Candidates apply publicly against an open vacancy; you review and decide here.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={addVacancy} className="flex gap-2 mb-6">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mathematics Teacher" required className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Post Vacancy</button>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-6">
        {vacancies.length === 0 ? <div className="px-4 py-3 text-sm text-gray-400">No vacancies yet.</div> : vacancies.map((v) => (
          <div key={v.id} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
            <span>{v.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${v.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{v.status}</span>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Candidates</h2>
      {candidates.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">No applications yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {candidates.map((c) => (
            <div key={c.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-700">{c.firstName} {c.lastName}</div>
                <div className="text-xs text-gray-400">{vacancyTitle(c.vacancyId)} {c.email && `· ${c.email}`}</div>
              </div>
              <select value={c.status} onChange={(e) => updateStatus(c.id, e.target.value)} className="text-xs rounded border border-gray-300 px-2 py-1">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
