'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Config { caMax: number; examMax: number; }
interface GradingSystem { id: string; name: string; isActive: boolean; }

export default function GradingPage() {
  const [config, setConfig] = useState<Config>({ caMax: 40, examMax: 60 });
  const [systems, setSystems] = useState<GradingSystem[]>([]);
  const [gsForm, setGsForm] = useState({ name: '', bandsText: 'A,75,100,Excellent\nB,65,74,Very Good\nC,55,64,Good\nD,45,54,Pass\nF,0,44,Fail' });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    apiRequest<Config>('/assessment/config').then(setConfig).catch(() => {});
    apiRequest<GradingSystem[]>('/assessment/grading-systems').then(setSystems).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiRequest('/assessment/config', { method: 'PATCH', body: config });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const createSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const bands = gsForm.bandsText.split('\n').filter(Boolean).map((line) => {
        const [letter, minScore, maxScore, remark] = line.split(',');
        return { letter: letter.trim(), minScore: Number(minScore), maxScore: Number(maxScore), remark: remark?.trim() };
      });
      await apiRequest('/assessment/grading-systems', { method: 'POST', body: { name: gsForm.name, isActive: true, bands } });
      setGsForm({ ...gsForm, name: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Grading</h1>
      <p className="text-gray-500 mb-6">Configure your CA/Exam split and grade bands — nothing here is hard-coded.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      <form onSubmit={saveConfig} className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">CA / Exam split (must add up to 100)</h2>
        <div className="flex gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500">CA max</label>
            <input type="number" value={config.caMax} onChange={(e) => setConfig({ ...config, caMax: Number(e.target.value) })}
              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Exam max</label>
            <input type="number" value={config.examMax} onChange={(e) => setConfig({ ...config, examMax: Number(e.target.value) })}
              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <button disabled={saving} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg h-[38px]">
            Save
          </button>
        </div>
      </form>

      <h2 className="text-sm font-semibold text-gray-700 mb-2">Grading systems</h2>
      {systems.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-6 text-center mb-6">None yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-6">
          {systems.map((s) => (
            <div key={s.id} className="px-4 py-3 text-sm text-gray-700 flex justify-between">
              <span>{s.name}</span>
              {s.isActive && <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded">Active</span>}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={createSystem} className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">New grading system</h2>
        <input value={gsForm.name} onChange={(e) => setGsForm({ ...gsForm, name: e.target.value })} placeholder="e.g. Standard Grading" required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-2" />
        <label className="text-xs text-gray-500">Bands (letter,min,max,remark — one per line)</label>
        <textarea value={gsForm.bandsText} onChange={(e) => setGsForm({ ...gsForm, bandsText: e.target.value })} rows={5}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono mb-2" />
        <button className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg">Create & activate</button>
      </form>
    </div>
  );
}
