'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { naira } from '@/lib/format';

interface OnboardingStatus {
  // Absent for the platform owner (SUPER_ADMIN), who doesn't belong to any one school.
  school?: { name: string; status: string } | null;
  steps: { schoolInfo: boolean; campus: boolean; academicSession: boolean };
}

export default function DashboardHome() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);

  useEffect(() => {
    apiRequest<OnboardingStatus>('/onboarding/status').then(setStatus).catch(() => {});
  }, []);

  const isPlatformOwner = Boolean(status && !status.school);
  const allDone = status && Object.values(status.steps).every(Boolean);

  if (isPlatformOwner) return <PlatformOverview />;

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">
        Welcome{status?.school ? `, ${status.school.name}` : ''} 👋
      </h1>
      <p className="text-gray-500 mb-8">Here's where things stand.</p>

      {!allDone && status && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
          <h2 className="font-medium text-amber-900 mb-2">Finish setting up your school</h2>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>{status.steps.schoolInfo ? '✅' : '⬜️'} School information</li>
            <li>{status.steps.campus ? '✅' : '⬜️'} At least one campus</li>
            <li>{status.steps.academicSession ? '✅' : '⬜️'} An academic session</li>
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Students" value="—" note="Arrives in Phase 2" />
        <StatCard label="Teachers" value="—" note="Arrives in Phase 2" />
        <StatCard label="Attendance today" value="—" note="Arrives in Phase 5" />
      </div>

      <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-500">
        This is the Phase 1 foundation: authentication, your school's identity, roles &amp;
        permissions, and the audit trail are all live underneath this dashboard. The cards above
        light up as each later phase (People, Timetable, Attendance, Finance…) ships.
      </div>
    </div>
  );
}

function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold text-gray-800 mt-1">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{note}</div>
    </div>
  );
}

interface Overview {
  schools: { total: number; ACTIVE: number; TRIAL: number; EXPIRED: number; SUSPENDED: number; endingWithin14Days: number; newLast30Days: number };
  people: { schoolUsers: number; students: number };
  payments: { totalKobo: number; last30DaysKobo: number };
}

function PlatformOverview() {
  const [o, setO] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    apiRequest<Overview>('/platform/overview').then(setO).catch((e) => setError(e instanceof Error ? e.message : 'Could not load the overview.'));
  }, []);

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Platform overview</h1>
      <p className="text-gray-500 mb-6">Every school on SmartSchool AI, at a glance.</p>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
      {!o && !error && <div className="text-sm text-gray-400">Loading…</div>}
      {o && (
        <>
          {(o.schools.endingWithin14Days > 0 || o.schools.EXPIRED > 0) && (
            <a href="/dashboard/platform/schools" className="block bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-900 hover:bg-amber-100">
              {o.schools.EXPIRED > 0 && <div><strong>{o.schools.EXPIRED}</strong> school{o.schools.EXPIRED === 1 ? ' has' : 's have'} an expired subscription and can't log in.</div>}
              {o.schools.endingWithin14Days > 0 && <div><strong>{o.schools.endingWithin14Days}</strong> school{o.schools.endingWithin14Days === 1 ? '' : 's'} will expire within 14 days.</div>}
              <div className="mt-1 underline">Review schools →</div>
            </a>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Stat label="Schools" value={o.schools.total} note={`${o.schools.newLast30Days} new in 30 days`} />
            <Stat label="Paying" value={o.schools.ACTIVE} note="active subscriptions" />
            <Stat label="On trial" value={o.schools.TRIAL} note="free trial" />
            <Stat label="Blocked" value={o.schools.EXPIRED + o.schools.SUSPENDED} note={`${o.schools.EXPIRED} expired · ${o.schools.SUSPENDED} suspended`} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Payments (30 days)" value={naira(o.payments.last30DaysKobo)} note="recorded by you" />
            <Stat label="Payments (all time)" value={naira(o.payments.totalKobo)} note="recorded by you" />
            <Stat label="School users" value={o.people.schoolUsers} note="across all schools" />
            <Stat label="Students" value={o.people.students} note="across all schools" />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
      <div className="text-xl font-semibold text-gray-800 mt-1">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{note}</div>
    </div>
  );
}
