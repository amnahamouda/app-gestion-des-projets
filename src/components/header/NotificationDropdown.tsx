import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface Notification {
  id: string;
  type: 'task_assigned' | 'deadline_reminder' | 'risk_alert' | 'project_update';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
  priority?: 'high' | 'medium' | 'low';
}

const allNotifications: Record<string, Notification[]> = {
  chef_projet: [
    { id: 'N1', type: 'risk_alert', title: 'Alerte risque élevé', message: 'API authentification — Score de risque: 85%', time: 'Il y a 5 min', read: false, icon: '🔴', priority: 'high' },
    { id: 'N2', type: 'deadline_reminder', title: 'Deadline dans 2 jours', message: 'Maquette page accueil — Échéance: 20 Mar 2025', time: 'Il y a 1h', read: false, icon: '⏰', priority: 'high' },
    { id: 'N3', type: 'project_update', title: 'Projet mis à jour', message: 'Refonte e-commerce — Avancement: 65%', time: 'Il y a 2h', read: false, icon: '📁', priority: 'medium' },
    { id: 'N4', type: 'risk_alert', title: 'Alerte risque moyen', message: 'Tests performance — Score de risque: 55%', time: 'Il y a 3h', read: true, icon: '🟡', priority: 'medium' },
    { id: 'N5', type: 'deadline_reminder', title: 'Deadline dans 2 jours', message: 'Intégration Stripe — Échéance: 10 Avr 2025', time: 'Il y a 5h', read: true, icon: '⏰', priority: 'medium' },
  ],
  employe: [
    { id: 'N1', type: 'task_assigned', title: 'Nouvelle tâche assignée', message: 'Maquette page accueil — Refonte e-commerce', time: 'Il y a 10 min', read: false, icon: '✅', priority: 'high' },
    { id: 'N2', type: 'deadline_reminder', title: 'Deadline dans 2 jours', message: 'Tests module RH — Échéance: 01 Avr 2025', time: 'Il y a 1h', read: false, icon: '⏰', priority: 'high' },
    { id: 'N3', type: 'project_update', title: 'Projet mis à jour', message: 'App mobile RH — Avancement: 20%', time: 'Il y a 3h', read: true, icon: '📁', priority: 'low' },
  ],
  admin: [
    { id: 'N1', type: 'project_update', title: 'Nouveau projet créé', message: 'Portail client B2B — Chef: Amine Belhadj', time: 'Il y a 30 min', read: false, icon: '📁', priority: 'medium' },
    { id: 'N2', type: 'risk_alert', title: 'Alerte risque élevé', message: '3 tâches en situation critique', time: 'Il y a 2h', read: false, icon: '🔴', priority: 'high' },
    { id: 'N3', type: 'task_assigned', title: 'Membre ajouté', message: 'Nouveau compte créé: Mehdi Rahali', time: 'Il y a 4h', read: true, icon: '👤', priority: 'low' },
  ],
};

const typeConfig: Record<string, { bg: string; color: string }> = {
  risk_alert: { bg: '#fef2f2', color: '#991b1b' },
  deadline_reminder: { bg: '#fff7ed', color: '#9a3412' },
  task_assigned: { bg: '#eff6ff', color: '#1e40af' },
  project_update: { bg: '#f0fdf4', color: '#166534' },
};

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>(
    allNotifications[user?.role ?? 'employe'] ?? []
  );
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const filtered = activeFilter === 'unread' ? notifs.filter((n) => !n.read) : notifs;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  const deleteNotif = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bouton */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '2px', right: '2px', width: '17px', height: '17px', background: '#ef4444', color: '#fff', borderRadius: '50%', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', width: '360px', zIndex: 1000, overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Notifications</h3>
                {unreadCount > 0 && (
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 7px', borderRadius: '20px', background: '#fee2e2', color: '#be123c' }}>
                    {unreadCount} nouvelles
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ fontSize: '12px', color: '#1e40af', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  Tout marquer lu
                </button>
              )}
            </div>

            {/* Filtres */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { key: 'all', label: 'Toutes' },
                { key: 'unread', label: `Non lues (${unreadCount})` },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key as 'all' | 'unread')}
                  style={{
                    padding: '4px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                    background: activeFilter === f.key ? '#1e3a8a' : '#f1f5f9',
                    color: activeFilter === f.key ? '#fff' : '#64748b',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Liste */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔔</div>
                <p style={{ fontSize: '13px', margin: 0 }}>Aucune notification</p>
              </div>
            ) : filtered.map((n) => {
              const tc = typeConfig[n.type] ?? { bg: '#f8fafc', color: '#475569' };
              return (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  style={{ display: 'flex', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', background: n.read ? '#fff' : '#fafbff', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = n.read ? '#fff' : '#fafbff'}
                >
                  {/* Icon */}
                  <div style={{ width: '38px', height: '38px', background: tc.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    {n.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontSize: '13px', fontWeight: n.read ? 500 : 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                        {n.title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {!n.read && <div style={{ width: '7px', height: '7px', background: '#1d4ed8', borderRadius: '50%' }} />}
                        <button
                          onClick={(e) => deleteNotif(n.id, e)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '14px', padding: '0 2px', lineHeight: 1 }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.message}
                    </p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '3px 0 0 0' }}>{n.time}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{notifs.length} notifications au total</span>
              <button
                onClick={() => setNotifs([])}
                style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
              >
                Tout effacer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}