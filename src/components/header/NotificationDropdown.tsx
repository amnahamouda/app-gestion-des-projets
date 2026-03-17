import { useState, useRef, useEffect } from 'react';

const notifications = [
  { id: 1, title: 'Nouvelle tâche assignée', message: 'Maquette page accueil — Refonte e-commerce', time: 'Il y a 5 min', read: false, icon: '✅' },
  { id: 2, title: 'Projet mis à jour', message: 'Application mobile RH — Avancement 20%', time: 'Il y a 1h', read: false, icon: '📁' },
  { id: 3, title: 'Commentaire ajouté', message: 'Karim O. a commenté sur API auth', time: 'Il y a 2h', read: true, icon: '💬' },
  { id: 4, title: 'Échéance proche', message: 'Tests module RH — dans 2 jours', time: 'Il y a 3h', read: true, icon: '⏰' },
];

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifs, setNotifs] = useState(notifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bouton */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <span style={{ fontSize: '20px' }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px',
            width: '16px', height: '16px',
            background: '#be123c', color: '#fff',
            borderRadius: '50%', fontSize: '10px',
            fontWeight: 700, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          background: '#fff', borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          width: '320px', zIndex: 1000, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Notifications</h3>
              {unreadCount > 0 && (
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 7px', borderRadius: '20px', background: '#fee2e2', color: '#be123c' }}>
                  {unreadCount} nouvelles
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{ fontSize: '12px', color: '#1e40af', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
              >
                Tout lire
              </button>
            )}
          </div>

          {/* Liste */}
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {notifs.map((n) => (
              <div
                key={n.id}
                onClick={() => setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                style={{
                  display: 'flex', gap: '12px', padding: '12px 16px',
                  borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                  background: n.read ? '#fff' : '#f8fafc',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.background = n.read ? '#fff' : '#f8fafc'}
              >
                <div style={{ width: '36px', height: '36px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                  {n.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: '13px', fontWeight: n.read ? 500 : 700, color: '#0f172a', margin: 0 }}>{n.title}</p>
                    {!n.read && (
                      <div style={{ width: '7px', height: '7px', background: '#1d4ed8', borderRadius: '50%', flexShrink: 0, marginTop: '3px', marginLeft: '6px' }} />
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '3px 0 0 0' }}>{n.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
            <button style={{ fontSize: '13px', color: '#1e40af', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              Voir toutes les notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}