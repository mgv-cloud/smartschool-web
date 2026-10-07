'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

interface Notification { id: string; type: string; title: string; body: string; readAt: string | null; createdAt: string; }

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);

  const load = () => apiRequest<Notification[]>('/notifications').then((n) => setItems(n.reverse())).catch(() => {});
  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await apiRequest(`/notifications/${id}/read`, { method: 'POST' });
    load();
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Notifications</h1>
      <p className="text-gray-500 mb-6">Absences, announcements, messages, and meeting invites all land here.</p>

      {items.length === 0 ? (
        <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl p-8 text-center">Nothing yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {items.map((n) => (
            <div key={n.id} className={`px-4 py-3 flex items-start justify-between gap-3 ${!n.readAt ? 'bg-brand-50/40' : ''}`}>
              <div>
                <div className="text-sm font-medium text-gray-800">{n.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{n.body}</div>
                <div className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()} · {n.type.replace(/_/g, ' ')}</div>
              </div>
              {!n.readAt && (
                <button onClick={() => markRead(n.id)} className="text-xs text-brand-600 hover:underline whitespace-nowrap">Mark read</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
