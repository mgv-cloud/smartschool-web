'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, clearTokens } from '@/lib/api';

// Section 40 admin navigation. Phase 1 + Phase 2 items ship live; everything else is visible
// (so the whole product's shape is clear from day one, per "create the correct interface for
// it so it can be added later without rebuilding") but marked Coming Soon until its phase lands
// — never a dead click into a blank page.
const NAV_SECTIONS: { label: string; items: { label: string; href: string; live: boolean }[] }[] = [
  { label: '', items: [
    { label: 'Dashboard', href: '/dashboard', live: true },
    { label: '✨ AI Assistant', href: '/dashboard/assistant', live: true },
  ] },
  {
    label: 'School',
    items: [
      { label: 'School Profile', href: '/dashboard/school', live: true },
      { label: 'Campuses', href: '/dashboard/campuses', live: true },
      { label: 'Academic Sessions', href: '/dashboard/sessions', live: true },
      { label: 'Departments', href: '/dashboard/departments', live: true },
      { label: 'Classes', href: '/dashboard/classes', live: true },
      { label: 'Subjects', href: '/dashboard/subjects', live: true },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Students', href: '/dashboard/students', live: true },
      { label: 'Parents', href: '/dashboard/parents', live: true },
      { label: 'Teachers', href: '/dashboard/teachers', live: true },
      { label: 'Staff', href: '/dashboard/staff', live: true },
    ],
  },
  {
    label: 'Academics',
    items: [
      { label: 'Grading & CA/Exam Split', href: '/dashboard/grading', live: true },
      { label: 'Curriculum', href: '/dashboard/curriculum', live: true },
      { label: 'Lesson Plans', href: '/dashboard/lesson-plans', live: true },
      { label: 'Assignments', href: '/dashboard/assignments', live: true },
      { label: 'Question Bank', href: '/dashboard/questions', live: true },
      { label: 'Examinations', href: '/dashboard/examinations', live: true },
      { label: 'Results', href: '/dashboard/results', live: true },
    ],
  },
  {
    label: 'Timetable',
    items: [
      { label: 'Setup (Rooms & Periods)', href: '/dashboard/timetable-setup', live: true },
      { label: 'Class Subjects', href: '/dashboard/timetable-subjects', live: true },
      { label: 'Generate & Publish', href: '/dashboard/timetable', live: true },
    ],
  },
  {
    label: 'Attendance',
    items: [
      { label: 'Take Attendance', href: '/dashboard/attendance', live: true },
      { label: 'Staff Attendance', href: '/dashboard/staff-attendance', live: true },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Fee Structures & Scholarships', href: '/dashboard/finance-setup', live: true },
      { label: 'Invoices & Payments', href: '/dashboard/invoices', live: true },
      { label: 'Expenses & Summary', href: '/dashboard/finance-summary', live: true },
    ],
  },
  {
    label: 'Communication',
    items: [
      { label: 'Messages', href: '/dashboard/messages', live: true },
      { label: 'Announcements', href: '/dashboard/announcements', live: true },
      { label: 'Meetings', href: '/dashboard/meetings', live: true },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Health / Sickbay', href: '/dashboard/health', live: true },
      { label: 'Transport', href: '/dashboard/transport', live: true },
      { label: 'Hostel', href: '/dashboard/hostel', live: true },
      { label: 'Sports', href: '/dashboard/sports', live: true },
      { label: 'Meals', href: '/dashboard/meals', live: true },
      { label: 'Inventory', href: '/dashboard/inventory', live: true },
      { label: 'Recruitment', href: '/dashboard/recruitment', live: true },
      { label: 'HR (Leave & Reviews)', href: '/dashboard/hr', live: true },
      { label: 'Reception', href: '/dashboard/reception', live: true },
    ],
  },
];

// The platform owner has no school, so they get their own small menu instead of the school screens.
const PLATFORM_NAV: typeof NAV_SECTIONS = [
  { label: 'Platform', items: [
    { label: 'Overview', href: '/dashboard', live: true },
    { label: 'Schools & Subscriptions', href: '/dashboard/platform/schools', live: true },
    { label: 'Audit Log', href: '/dashboard/platform/audit', live: true },
  ] },
];

type Me = {
  user: { firstName: string; lastName: string };
  roles: string[];
  school: { name: string; subscription?: { state: string; daysLeft: number } } | null;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    apiRequest<Me>('/auth/me')
      .then(setMe)
      .catch(() => router.push('/login'));
  }, [router]);

  useEffect(() => {
    const loadCount = () => apiRequest<{ count: number }>('/notifications/unread-count').then((r) => setUnreadCount(r.count)).catch(() => {});
    loadCount();
    const interval = setInterval(loadCount, 30000); // poll every 30s — no websocket/push in this build yet
    return () => clearInterval(interval);
  }, []);

  const isPlatformOwner = Boolean(me && !me.school && me.roles.includes('SUPER_ADMIN'));
  const navSections = isPlatformOwner ? PLATFORM_NAV : NAV_SECTIONS;
  const sub = me?.school?.subscription;
  const showSubscriptionBanner = Boolean(sub && (sub.state === 'TRIAL' || sub.state === 'ACTIVE') && sub.daysLeft <= 14);

  const logout = () => {
    clearTokens();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <span className="font-bold text-brand-700">SmartSchool AI</span>
            {me?.school && <div className="text-xs text-gray-400 mt-0.5">{me.school.name}</div>}
          </div>
          <a href="/dashboard/notifications" className="relative text-gray-400 hover:text-brand-600" title="Notifications">
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </a>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {navSections.map((section, i) => (
            <div key={i} className="mb-3">
              {section.label && (
                <div className="px-5 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{section.label}</div>
              )}
              {section.items.map((item) => (
                <a
                  key={item.label}
                  href={item.live ? item.href : undefined}
                  className={`flex items-center justify-between px-5 py-2 text-sm ${
                    item.live ? 'text-gray-700 hover:bg-brand-50 hover:text-brand-700 cursor-pointer' : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {item.label}
                  {!item.live && <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Soon</span>}
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-gray-100">
          {me && (
            <div className="text-xs text-gray-500 mb-2">
              {me.user.firstName} {me.user.lastName} · {me.roles.join(', ')}
            </div>
          )}
          <button onClick={logout} className="text-xs text-red-600 hover:underline">Log out</button>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        {showSubscriptionBanner && sub && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm px-8 py-2.5">
            {sub.state === 'TRIAL' ? 'Your free trial' : 'Your subscription'} ends in <strong>{sub.daysLeft} day{sub.daysLeft === 1 ? '' : 's'}</strong>.
            Please contact SmartSchool support to {sub.state === 'TRIAL' ? 'subscribe' : 'renew'} so your school keeps its access.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
