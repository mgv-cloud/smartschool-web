'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

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

  if (isPlatformOwner) {
    return (
      <div className="p-8 max-w-3xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Welcome, platform owner 👋</h1>
        <p className="text-gray-500 mb-6">You're signed in with the platform-level account.</p>
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600 space-y-3">
          <p>
            This account owns the SmartSchool AI platform, so it doesn't belong to any one school and has no school
            data of its own. The school screens in the sidebar are for each school's own administrators.
          </p>
          <p>
            To work inside a school, sign out and sign in with that school's admin email, password and subdomain.
            Platform-wide management screens (schools, subscriptions) aren't built yet.
          </p>
        </div>
      </div>
    );
  }

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
