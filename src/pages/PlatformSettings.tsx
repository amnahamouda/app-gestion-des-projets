// src/pages/Settings/PlatformSettings.tsx

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token') || '';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabId = 'general' | 'users' | 'security' | 'email' | 'appearance' |
             'notifications' | 'integrations' | 'backup' | 'system' | 'logs';

type SaveStatus = { show: boolean; message: string; type: 'success' | 'error' };

// ─── Sub-components ───────────────────────────────────────────────────────────
const Toggle = ({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={!disabled ? onChange : undefined}
    style={{
      display: 'flex',
      alignItems: 'center',
      width: 44,
      height: 24,
      background: checked ? '#2563eb' : '#cbd5e1',
      borderRadius: 99,
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      padding: 2,
      transition: 'background 0.2s',
      flexShrink: 0,
      opacity: disabled ? 0.4 : 1,
    }}
  >
    <span
      style={{
        width: 20,
        height: 20,
        background: '#fff',
        borderRadius: '50%',
        transform: checked ? 'translateX(20px)' : 'translateX(0)',
        transition: 'transform 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        display: 'block',
      }}
    />
  </button>
);

const Field = ({
  label,
  hint,
  children,
  half,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  half?: boolean;
}) => (
  <div style={{ gridColumn: half ? undefined : undefined }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>
      {label}
    </label>
    {hint && <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6, marginTop: -2 }}>{hint}</p>}
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 14,
  color: '#111827',
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  backgroundSize: 16,
  paddingRight: 32,
};

const SwitchRow = ({
  icon,
  label,
  description,
  checked,
  onChange,
  danger,
  disabled,
}: {
  icon?: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  danger?: boolean;
  disabled?: boolean;
}) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '14px 16px',
    background: '#fafafa',
    border: '1px solid #f0f0f0',
    borderRadius: 10,
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      {icon && <span style={{ fontSize: 18, lineHeight: 1, marginTop: 1 }}>{icon}</span>}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: danger ? '#dc2626' : '#111827' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{description}</div>
      </div>
    </div>
    <Toggle checked={checked} onChange={onChange} disabled={disabled} />
  </div>
);

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div style={{ marginBottom: 24 }}>
    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>{title}</h3>
    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{description}</p>
  </div>
);

const SaveBar = ({ onSave, loading }: { onSave: () => void; loading: boolean }) => (
  <div style={{
    padding: '14px 28px',
    borderTop: '1px solid #f3f4f6',
    background: '#fafafa',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
  }}>
    <button
      style={{ padding: '8px 18px', fontSize: 13, color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}
    >
      Annuler
    </button>
    <button
      onClick={onSave}
      disabled={loading}
      style={{
        padding: '8px 22px',
        fontSize: 13,
        fontWeight: 600,
        color: 'white',
        background: loading ? '#93c5fd' : '#2563eb',
        border: 'none',
        borderRadius: 8,
        cursor: loading ? 'wait' : 'pointer',
        transition: 'background 0.15s',
      }}
    >
      {loading ? 'Sauvegarde…' : 'Sauvegarder les modifications'}
    </button>
  </div>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
    {children}
  </div>
);

const CardBody = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: '28px 28px 24px' }}>{children}</div>
);

const Grid = ({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${cols === 1 ? 100 : 240}px, 1fr))`, gap: 18 }}>
    {children}
  </div>
);

const Divider = () => <div style={{ height: 1, background: '#f3f4f6', margin: '20px 0' }} />;

// ─── Badge de statut ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: 'ok' | 'warn' | 'error' }) => {
  const map = {
    ok:    { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e', label: 'Opérationnel' },
    warn:  { bg: '#fffbeb', color: '#b45309', dot: '#f59e0b', label: 'Attention' },
    error: { bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444', label: 'Erreur' },
  };
  const s = map[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 99, background: s.bg, color: s.color, fontSize: 12, fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label}
    </span>
  );
};

// ─── Permissions ─────────────────────────────────────────────────────────────
type Role = 'admin' | 'chef_projet' | 'employe';

/**
 * Defines which tabs each role can see.
 * admin        → everything
 * chef_projet  → general (read-only), notifications, appearance
 * employe      → appearance, notifications only
 */
const TAB_PERMISSIONS: Record<TabId, Role[]> = {
  general:       ['admin'],
  users:         ['admin'],
  security:      ['admin'],
  email:         ['admin'],
  appearance:    ['admin', 'chef_projet', 'employe'],
  notifications: ['admin', 'chef_projet', 'employe'],
  integrations:  ['admin'],
  backup:        ['admin'],
  system:        ['admin'],
  logs:          ['admin'],
};

/**
 * Within a tab, some sections are read-only for non-admins.
 * If a role is NOT in this list it means full edit access.
 */
const READ_ONLY_ROLES: Partial<Record<TabId, Role[]>> = {
  appearance:    ['chef_projet', 'employe'],
  notifications: ['chef_projet', 'employe'],
};

const canAccess = (tab: TabId, role: Role) => TAB_PERMISSIONS[tab].includes(role);
const isReadOnly = (tab: TabId, role: Role) => READ_ONLY_ROLES[tab]?.includes(role) ?? false;

// ─── Read-only wrapper ────────────────────────────────────────────────────────
const ReadOnlyBanner = () => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 16px', marginBottom: 20,
    background: '#fffbeb', border: '1px solid #fde68a',
    borderRadius: 10, fontSize: 13, color: '#92400e',
  }}>
    <span>👁️</span>
    <span>Vous consultez ces paramètres en lecture seule. Contactez un administrateur pour les modifier.</span>
  </div>
);

// ─── Access Denied ────────────────────────────────────────────────────────────
const AccessDenied = ({ tab }: { tab: string }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '60px 20px', background: 'white', borderRadius: 14, border: '1px solid #e5e7eb',
    textAlign: 'center',
  }}>
    <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Accès restreint</div>
    <div style={{ fontSize: 14, color: '#6b7280', maxWidth: 340 }}>
      Vous n'avez pas les permissions nécessaires pour accéder à la section <strong>{tab}</strong>.
      Seuls les administrateurs peuvent gérer ces paramètres.
    </div>
  </div>
);

// ─── Composant principal ──────────────────────────────────────────────────────
export default function PlatformSettings() {
  const { user } = useAuth();
  const role: Role = (user?.role as Role) ?? 'employe';

  // Default to first accessible tab for the role
  const firstAccessibleTab = (['appearance', 'notifications', 'general'] as TabId[])
    .find(t => canAccess(t, role)) ?? 'appearance';

  const [activeTab, setActiveTab] = useState<TabId>(firstAccessibleTab);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ show: false, message: '', type: 'success' });

  // ── General ──
  const [general, setGeneral] = useState({
    platform_name: 'Gestion Projet',
    company_name: 'Maison du Web',
    company_email: 'contact@maisondoweb.com',
    company_phone: '+216 70 000 000',
    support_url: 'https://support.maisondoweb.com',
    timezone: 'Africa/Tunis',
    date_format: 'DD/MM/YYYY',
    time_format: '24h',
    language: 'fr',
    currency: 'TND',
    maintenance_mode: false,
    announcement: '',
  });

  // ── Users ──
  const [users, setUsers] = useState({
    registration_enabled: true,
    email_verification: true,
    require_admin_approval: false,
    default_role: 'employe',
    max_users: 100,
    idle_timeout: 30,
    session_timeout: 480,
    allow_user_deletion: false,
    allow_profile_edit: true,
    concurrent_sessions: 3,
  });

  // ── Security ──
  const [security, setSecurity] = useState({
    two_factor_auth: false,
    two_factor_method: 'totp',
    password_expiry_days: 90,
    min_password_length: 8,
    require_uppercase: true,
    require_numbers: true,
    require_special_chars: true,
    password_history: 5,
    max_login_attempts: 5,
    lockout_duration: 15,
    login_notifications: true,
    block_ip_after_attempts: true,
    ip_whitelist_enabled: false,
    ip_whitelist: '',
    force_https: true,
    cors_enabled: true,
  });

  // ── Email ──
  const [email, setEmail] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    from_email: 'noreply@maisondoweb.com',
    from_name: 'Gestion Projet',
    use_tls: true,
    use_ssl: false,
    connection_timeout: 30,
    email_footer: 'Cet email a été envoyé par Gestion Projet, Maison du Web.',
    test_email: '',
  });

  // ── Appearance ──
  const [appearance, setAppearance] = useState({
    theme: 'light',
    primary_color: '#2563eb',
    accent_color: '#0ea5e9',
    danger_color: '#ef4444',
    sidebar_collapsed: false,
    animations: true,
    compact_view: false,
    font_size: 'medium',
    border_radius: 'medium',
    sidebar_style: 'full',
    density: 'comfortable',
  });

  // ── Notifications ──
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: true,
    in_app_notifications: true,
    task_assigned: true,
    task_completed: true,
    task_overdue: true,
    project_updates: true,
    comment_mentions: true,
    weekly_report: false,
    daily_digest: false,
    deadline_reminder_days: 2,
  });

  // ── Integrations ──
  const [integrations, setIntegrations] = useState({
    slack_enabled: false,
    slack_webhook: '',
    slack_channel: '#general',
    google_calendar: false,
    google_client_id: '',
    github_integration: false,
    github_token: '',
    api_rate_limit: 100,
    webhook_url: '',
    webhook_secret: '',
    webhook_events: ['task.created', 'task.completed'],
  });

  // ── Backup ──
  const [backup, setBackup] = useState({
    auto_backup: true,
    backup_frequency: 'daily',
    backup_time: '02:00',
    backup_retention_days: 30,
    backup_location: 'local',
    s3_bucket: '',
    s3_region: 'eu-west-1',
    include_attachments: true,
    compress_backup: true,
    encrypt_backup: false,
    last_backup: '15/12/2024 à 02:00',
    last_backup_size: '145 MB',
    last_backup_status: 'ok' as 'ok' | 'warn' | 'error',
  });

  // ── System ──
  const [system, setSystem] = useState({
    debug_mode: false,
    log_level: 'info',
    log_retention_days: 90,
    cache_enabled: true,
    cache_driver: 'redis',
    cache_duration: 3600,
    queue_driver: 'database',
    api_version: 'v1',
    enable_audit_logs: true,
    maintenance_ips: '127.0.0.1',
    max_upload_size: 10,
    allowed_file_types: 'pdf,doc,docx,xls,xlsx,png,jpg,zip',
  });

  // ── Logs (fake) ──
  const fakeLogs = [
    { level: 'INFO',  time: '2024-12-15 14:32:01', msg: 'Paramètres système mis à jour par admin@maisondoweb.com', ip: '41.230.1.45' },
    { level: 'WARN',  time: '2024-12-15 13:17:44', msg: 'Tentative de connexion échouée (3/5) — user: test@test.com', ip: '105.100.8.22' },
    { level: 'INFO',  time: '2024-12-15 12:00:00', msg: 'Sauvegarde automatique créée (145 MB)', ip: 'localhost' },
    { level: 'INFO',  time: '2024-12-15 09:45:12', msg: 'Utilisateur "Ahmed Bensalem" créé par admin', ip: '41.230.1.45' },
    { level: 'ERROR', time: '2024-12-14 23:11:06', msg: 'Échec envoi email SMTP — connection timeout (smtp.gmail.com:587)', ip: 'localhost' },
    { level: 'INFO',  time: '2024-12-14 18:30:00', msg: 'Cache vidé manuellement', ip: '41.230.1.45' },
    { level: 'INFO',  time: '2024-12-14 17:02:55', msg: 'Système démarré (v2.1.0)', ip: 'localhost' },
    { level: 'WARN',  time: '2024-12-14 16:50:30', msg: 'Utilisation disque > 80% (82.4 GB / 100 GB)', ip: 'localhost' },
    { level: 'INFO',  time: '2024-12-14 14:22:10', msg: 'Projet "Refonte Site Web" archivé par chef_projet', ip: '41.230.0.12' },
    { level: 'INFO',  time: '2024-12-13 11:00:00', msg: 'Sauvegarde automatique créée (142 MB)', ip: 'localhost' },
  ];

  const handleSave = async (section: string) => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700)); // Simulate API call
    setSaving(false);
    setSaveStatus({ show: true, message: `${section} sauvegardé avec succès`, type: 'success' });
    setTimeout(() => setSaveStatus({ show: false, message: '', type: 'success' }), 3500);
  };

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'general',       label: 'Général',        icon: '⚙️' },
    { id: 'users',         label: 'Utilisateurs',   icon: '👥' },
    { id: 'security',      label: 'Sécurité',       icon: '🔒' },
    { id: 'email',         label: 'Email',          icon: '📧' },
    { id: 'appearance',    label: 'Apparence',      icon: '🎨' },
    { id: 'notifications', label: 'Notifications',  icon: '🔔' },
    { id: 'integrations',  label: 'Intégrations',   icon: '🔌' },
    { id: 'backup',        label: 'Sauvegarde',     icon: '💾' },
    { id: 'system',        label: 'Système',        icon: '🖥️' },
    { id: 'logs',          label: 'Logs',           icon: '📋' },
  ];

  const logColor = (level: string) => {
    if (level === 'INFO')  return '#22c55e';
    if (level === 'WARN')  return '#f59e0b';
    if (level === 'ERROR') return '#ef4444';
    return '#60a5fa';
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* ── Toast ── */}
      {saveStatus.show && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: saveStatus.type === 'success' ? '#16a34a' : '#dc2626',
          color: 'white', padding: '12px 20px', borderRadius: 10,
          fontSize: 14, fontWeight: 600,
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          animation: 'slideIn 0.25s ease',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {saveStatus.type === 'success' ? '✓' : '✕'} {saveStatus.message}
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        input:focus, select:focus, textarea:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12) !important; background: #fff !important; }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
        input[type=color] { padding: 2px !important; }
        .tab-btn { transition: all 0.15s; }
        .tab-btn:hover { background: #f3f4f6 !important; color: #111827 !important; }
        .tab-btn.active { background: #2563eb !important; color: white !important; }
        .tag-close:hover { background: #dbeafe; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, background: '#2563eb', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⚙️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Paramètres</h1>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Configuration globale de la plateforme</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 14px' }}>
          <div style={{ width: 32, height: 32, background: '#2563eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13 }}>
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{user?.name || 'Admin'}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>
              {user?.role === 'admin' ? 'Administrateur' : user?.role === 'chef_projet' ? 'Chef de projet' : 'Employé'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* ── Sidebar Tabs ── */}
        <nav style={{
          width: 200,
          flexShrink: 0,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 14,
          overflow: 'hidden',
          position: 'sticky',
          top: 20,
        }}>
          <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Navigation</span>
          </div>
          <div style={{ padding: '6px 8px' }}>
            {tabs.map(tab => {
              const accessible = canAccess(tab.id, role);
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`tab-btn${active ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={!accessible ? 'Accès restreint aux administrateurs' : undefined}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '8px 10px',
                    background: active ? '#2563eb' : 'transparent',
                    color: active ? 'white' : accessible ? '#374151' : '#9ca3af',
                    border: 'none', borderRadius: 8,
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    cursor: accessible ? 'pointer' : 'not-allowed',
                    textAlign: 'left', marginBottom: 2,
                    opacity: accessible ? 1 : 0.5,
                  }}
                >
                  <span style={{ fontSize: 15 }}>{tab.icon}</span>
                  <span style={{ flex: 1 }}>{tab.label}</span>
                  {!accessible && <span style={{ fontSize: 10 }}>🔒</span>}
                </button>
              );
            })}
          </div>
          {/* Role badge */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #f3f4f6' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', borderRadius: 8,
              background: role === 'admin' ? '#eff6ff' : role === 'chef_projet' ? '#f0fdf4' : '#f9fafb',
              border: `1px solid ${role === 'admin' ? '#bfdbfe' : role === 'chef_projet' ? '#bbf7d0' : '#e5e7eb'}`,
            }}>
              <span style={{ fontSize: 14 }}>{role === 'admin' ? '👑' : role === 'chef_projet' ? '📋' : '👤'}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: role === 'admin' ? '#1d4ed8' : role === 'chef_projet' ? '#15803d' : '#374151' }}>
                  {role === 'admin' ? 'Administrateur' : role === 'chef_projet' ? 'Chef de projet' : 'Employé'}
                </div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>
                  {role === 'admin' ? 'Accès complet' : '2 sections accessibles'}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* ── Main Content ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Access denied fallback for locked tabs */}
          {!canAccess(activeTab, role) && <AccessDenied tab={tabs.find(t => t.id === activeTab)?.label ?? activeTab} />}

          {/* ════ GÉNÉRAL ════ */}
          {activeTab === 'general' && canAccess('general', role) && (() => {
            const ro = isReadOnly('general', role);
            return (
            <Card>
              <CardBody>
                {ro && <ReadOnlyBanner />}
                <SectionHeader title="Informations générales" description="Configurez les informations de base de la plateforme" />
                <Grid>
                  <Field label="Nom de la plateforme">
                    <input style={inputStyle} type="text" value={general.platform_name} readOnly={ro} onChange={e => !ro && setGeneral({ ...general, platform_name: e.target.value })} />
                  </Field>
                  <Field label="Nom de l'entreprise">
                    <input style={inputStyle} type="text" value={general.company_name} readOnly={ro} onChange={e => !ro && setGeneral({ ...general, company_name: e.target.value })} />
                  </Field>
                  <Field label="Email de contact">
                    <input style={inputStyle} type="email" value={general.company_email} readOnly={ro} onChange={e => !ro && setGeneral({ ...general, company_email: e.target.value })} />
                  </Field>
                  <Field label="Téléphone">
                    <input style={inputStyle} type="text" value={general.company_phone} readOnly={ro} onChange={e => !ro && setGeneral({ ...general, company_phone: e.target.value })} />
                  </Field>
                  <Field label="URL support">
                    <input style={inputStyle} type="url" value={general.support_url} readOnly={ro} onChange={e => !ro && setGeneral({ ...general, support_url: e.target.value })} />
                  </Field>
                </Grid>

                <Divider />
                <SectionHeader title="Régionalisation" description="Fuseau horaire, langue et formats" />
                <Grid>
                  <Field label="Fuseau horaire">
                    <select style={{ ...selectStyle, pointerEvents: ro ? 'none' : 'auto' }} value={general.timezone} onChange={e => !ro && setGeneral({ ...general, timezone: e.target.value })}>
                      <option value="Africa/Tunis">Afrique/Tunis (UTC+1)</option>
                      <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (UTC-5/-4)</option>
                    </select>
                  </Field>
                  <Field label="Langue">
                    <select style={{ ...selectStyle, pointerEvents: ro ? 'none' : 'auto' }} value={general.language} onChange={e => !ro && setGeneral({ ...general, language: e.target.value })}>
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                    </select>
                  </Field>
                  <Field label="Format de date">
                    <select style={{ ...selectStyle, pointerEvents: ro ? 'none' : 'auto' }} value={general.date_format} onChange={e => !ro && setGeneral({ ...general, date_format: e.target.value })}>
                      <option value="DD/MM/YYYY">DD/MM/YYYY — 31/12/2024</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY — 12/31/2024</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD — 2024-12-31</option>
                    </select>
                  </Field>
                  <Field label="Format heure">
                    <select style={{ ...selectStyle, pointerEvents: ro ? 'none' : 'auto' }} value={general.time_format} onChange={e => !ro && setGeneral({ ...general, time_format: e.target.value })}>
                      <option value="24h">24h — 14:30</option>
                      <option value="12h">12h — 2:30 PM</option>
                    </select>
                  </Field>
                  <Field label="Devise">
                    <select style={{ ...selectStyle, pointerEvents: ro ? 'none' : 'auto' }} value={general.currency} onChange={e => !ro && setGeneral({ ...general, currency: e.target.value })}>
                      <option value="TND">TND — Dinar tunisien</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="USD">USD — Dollar américain</option>
                    </select>
                  </Field>
                </Grid>

                <Divider />
                <SectionHeader title="Annonce système" description="Afficher un message en haut de l'interface pour tous les utilisateurs" />
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                  placeholder="Ex : Maintenance prévue le 25/12 de 02h à 04h (UTC+1)."
                  value={general.announcement}
                  readOnly={ro}
                  onChange={e => !ro && setGeneral({ ...general, announcement: e.target.value })}
                />

                <Divider />
                <SwitchRow
                  icon="🚧"
                  label="Mode maintenance"
                  description="Désactive l'accès pour tous les utilisateurs non-admin"
                  checked={general.maintenance_mode}
                  onChange={() => !ro && setGeneral({ ...general, maintenance_mode: !general.maintenance_mode })}
                  danger={general.maintenance_mode}
                  disabled={ro}
                />
              </CardBody>
              {!ro && <SaveBar onSave={() => handleSave('Général')} loading={saving} />}
            </Card>
            );
          })()}

          {/* ════ UTILISATEURS ════ */}
          {activeTab === 'users' && canAccess('users', role) && (() => {
            const ro = isReadOnly('users', role);
            return (
            <Card>
              <CardBody>
                {ro && <ReadOnlyBanner />}
                <SectionHeader title="Gestion des comptes" description="Règles d'inscription, sessions et permissions" />
                <Grid>
                  <Field label="Rôle par défaut">
                    <select style={{ ...selectStyle, pointerEvents: ro ? 'none' : 'auto' }} value={users.default_role} onChange={e => !ro && setUsers({ ...users, default_role: e.target.value })}>
                      <option value="employe">Employé</option>
                      <option value="chef_projet">Chef de projet</option>
                    </select>
                  </Field>
                  <Field label="Nombre max d'utilisateurs">
                    <input style={inputStyle} type="number" value={users.max_users} min={1} readOnly={ro} onChange={e => !ro && setUsers({ ...users, max_users: +e.target.value })} />
                  </Field>
                  <Field label="Timeout inactivité (min)" hint="Déconnecter après X minutes d'inactivité">
                    <input style={inputStyle} type="number" value={users.idle_timeout} min={5} readOnly={ro} onChange={e => !ro && setUsers({ ...users, idle_timeout: +e.target.value })} />
                  </Field>
                  <Field label="Durée de session (min)" hint="Session maximale par connexion">
                    <input style={inputStyle} type="number" value={users.session_timeout} min={30} readOnly={ro} onChange={e => !ro && setUsers({ ...users, session_timeout: +e.target.value })} />
                  </Field>
                  <Field label="Sessions simultanées max">
                    <input style={inputStyle} type="number" value={users.concurrent_sessions} min={1} max={10} readOnly={ro} onChange={e => !ro && setUsers({ ...users, concurrent_sessions: +e.target.value })} />
                  </Field>
                </Grid>

                <Divider />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SwitchRow icon="📝" label="Inscription ouverte" description="Permettre aux nouveaux utilisateurs de créer un compte" checked={users.registration_enabled} onChange={() => !ro && setUsers({ ...users, registration_enabled: !users.registration_enabled })} disabled={ro} />
                  <SwitchRow icon="✉️" label="Vérification email obligatoire" description="L'utilisateur doit confirmer son adresse email" checked={users.email_verification} onChange={() => !ro && setUsers({ ...users, email_verification: !users.email_verification })} disabled={ro} />
                  <SwitchRow icon="👮" label="Approbation admin requise" description="Un admin doit valider chaque nouveau compte avant activation" checked={users.require_admin_approval} onChange={() => !ro && setUsers({ ...users, require_admin_approval: !users.require_admin_approval })} disabled={ro} />
                  <SwitchRow icon="✏️" label="Modification de profil" description="Les utilisateurs peuvent modifier leurs propres informations" checked={users.allow_profile_edit} onChange={() => !ro && setUsers({ ...users, allow_profile_edit: !users.allow_profile_edit })} disabled={ro} />
                  <SwitchRow icon="🗑️" label="Suppression de compte autorisée" description="Les utilisateurs peuvent supprimer leur propre compte" checked={users.allow_user_deletion} onChange={() => !ro && setUsers({ ...users, allow_user_deletion: !users.allow_user_deletion })} danger disabled={ro} />
                </div>
              </CardBody>
              {!ro && <SaveBar onSave={() => handleSave('Utilisateurs')} loading={saving} />}
            </Card>
            );
          })()}

          {/* ════ SÉCURITÉ ════ */}
          {activeTab === 'security' && canAccess('security', role) && (() => {
            const ro = isReadOnly('security', role);
            return (
            <Card>
              <CardBody>
                {ro && <ReadOnlyBanner />}
                <SectionHeader title="Politique de mot de passe" description="Règles appliquées lors de la création ou modification d'un mot de passe" />
                <Grid>
                  <Field label="Longueur minimale">
                    <input style={inputStyle} type="number" value={security.min_password_length} min={6} max={32} readOnly={ro} onChange={e => !ro && setSecurity({ ...security, min_password_length: +e.target.value })} />
                  </Field>
                  <Field label="Expiration (jours)" hint="0 = jamais">
                    <input style={inputStyle} type="number" value={security.password_expiry_days} min={0} readOnly={ro} onChange={e => !ro && setSecurity({ ...security, password_expiry_days: +e.target.value })} />
                  </Field>
                  <Field label="Historique mots de passe" hint="Empêcher la réutilisation des N derniers">
                    <input style={inputStyle} type="number" value={security.password_history} min={0} max={24} readOnly={ro} onChange={e => !ro && setSecurity({ ...security, password_history: +e.target.value })} />
                  </Field>
                </Grid>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                  <SwitchRow icon="🔠" label="Majuscules obligatoires" description="Au moins une lettre majuscule" checked={security.require_uppercase} onChange={() => !ro && setSecurity({ ...security, require_uppercase: !security.require_uppercase })} disabled={ro} />
                  <SwitchRow icon="🔢" label="Chiffres obligatoires" description="Au moins un chiffre" checked={security.require_numbers} onChange={() => !ro && setSecurity({ ...security, require_numbers: !security.require_numbers })} disabled={ro} />
                  <SwitchRow icon="✳️" label="Caractères spéciaux" description="Au moins un caractère spécial (!, @, #, …)" checked={security.require_special_chars} onChange={() => !ro && setSecurity({ ...security, require_special_chars: !security.require_special_chars })} disabled={ro} />
                </div>

                <Divider />
                <SectionHeader title="Contrôle d'accès" description="Tentatives de connexion, blocage et double authentification" />
                <Grid>
                  <Field label="Tentatives max avant blocage">
                    <input style={inputStyle} type="number" value={security.max_login_attempts} min={3} max={20} readOnly={ro} onChange={e => !ro && setSecurity({ ...security, max_login_attempts: +e.target.value })} />
                  </Field>
                  <Field label="Durée de blocage (min)">
                    <input style={inputStyle} type="number" value={security.lockout_duration} min={1} readOnly={ro} onChange={e => !ro && setSecurity({ ...security, lockout_duration: +e.target.value })} />
                  </Field>
                </Grid>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                  <SwitchRow icon="🔐" label="Authentification 2 facteurs (2FA)" description="Obligatoire pour tous les comptes admin" checked={security.two_factor_auth} onChange={() => !ro && setSecurity({ ...security, two_factor_auth: !security.two_factor_auth })} disabled={ro} />
                  <SwitchRow icon="📬" label="Notifications de connexion" description="Envoyer un email lors d'une nouvelle connexion" checked={security.login_notifications} onChange={() => !ro && setSecurity({ ...security, login_notifications: !security.login_notifications })} disabled={ro} />
                  <SwitchRow icon="🚫" label="Blocage IP automatique" description="Bloquer les IPs après trop de tentatives" checked={security.block_ip_after_attempts} onChange={() => !ro && setSecurity({ ...security, block_ip_after_attempts: !security.block_ip_after_attempts })} disabled={ro} />
                  <SwitchRow icon="🌐" label="Liste blanche IP" description="Restreindre l'accès aux adresses IP autorisées uniquement" checked={security.ip_whitelist_enabled} onChange={() => !ro && setSecurity({ ...security, ip_whitelist_enabled: !security.ip_whitelist_enabled })} disabled={ro} />
                </div>
                {security.ip_whitelist_enabled && (
                  <Field label="Adresses IP autorisées" hint="Une IP par ligne (ex: 192.168.1.0/24)">
                    <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical', marginTop: 12 }} value={security.ip_whitelist} readOnly={ro} onChange={e => !ro && setSecurity({ ...security, ip_whitelist: e.target.value })} placeholder="192.168.1.0/24&#10;41.230.1.45" />
                  </Field>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                  <SwitchRow icon="🔒" label="Forcer HTTPS" description="Rediriger automatiquement HTTP vers HTTPS" checked={security.force_https} onChange={() => !ro && setSecurity({ ...security, force_https: !security.force_https })} disabled={ro} />
                  <SwitchRow icon="🔗" label="CORS activé" description="Autoriser les requêtes cross-origin (API)" checked={security.cors_enabled} onChange={() => !ro && setSecurity({ ...security, cors_enabled: !security.cors_enabled })} disabled={ro} />
                </div>
              </CardBody>
              {!ro && <SaveBar onSave={() => handleSave('Sécurité')} loading={saving} />}
            </Card>
            );
          })()}

          {/* ════ EMAIL ════ */}
          {activeTab === 'email' && canAccess('email', role) && (() => {
            const ro = isReadOnly('email', role);
            return (
            <Card>
              <CardBody>
                {ro && <ReadOnlyBanner />}
                <SectionHeader title="Serveur SMTP" description="Configuration de l'envoi d'emails depuis la plateforme" />
                <Grid>
                  <Field label="Hôte SMTP">
                    <input style={inputStyle} type="text" value={email.smtp_host} readOnly={ro} onChange={e => !ro && setEmail({ ...email, smtp_host: e.target.value })} placeholder="smtp.gmail.com" />
                  </Field>
                  <Field label="Port SMTP">
                    <input style={inputStyle} type="number" value={email.smtp_port} readOnly={ro} onChange={e => !ro && setEmail({ ...email, smtp_port: +e.target.value })} />
                  </Field>
                  <Field label="Utilisateur SMTP">
                    <input style={inputStyle} type="text" value={email.smtp_user} readOnly={ro} onChange={e => !ro && setEmail({ ...email, smtp_user: e.target.value })} placeholder="noreply@maisondoweb.com" />
                  </Field>
                  <Field label="Mot de passe SMTP">
                    <input style={inputStyle} type="password" value={email.smtp_password} readOnly={ro} onChange={e => !ro && setEmail({ ...email, smtp_password: e.target.value })} placeholder="••••••••••••" />
                  </Field>
                  <Field label="Délai de connexion (s)">
                    <input style={inputStyle} type="number" value={email.connection_timeout} min={5} readOnly={ro} onChange={e => !ro && setEmail({ ...email, connection_timeout: +e.target.value })} />
                  </Field>
                </Grid>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <SwitchRow icon="🔒" label="TLS" description="Chiffrement STARTTLS (port 587)" checked={email.use_tls} onChange={() => !ro && setEmail({ ...email, use_tls: !email.use_tls, use_ssl: false })} disabled={ro} />
                </div>

                <Divider />
                <SectionHeader title="Expéditeur" description="Nom et adresse affichés dans les emails sortants" />
                <Grid>
                  <Field label="Nom expéditeur">
                    <input style={inputStyle} type="text" value={email.from_name} readOnly={ro} onChange={e => !ro && setEmail({ ...email, from_name: e.target.value })} />
                  </Field>
                  <Field label="Email expéditeur">
                    <input style={inputStyle} type="email" value={email.from_email} readOnly={ro} onChange={e => !ro && setEmail({ ...email, from_email: e.target.value })} />
                  </Field>
                </Grid>
                <div style={{ marginTop: 16 }}>
                  <Field label="Pied de page email">
                    <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 64 }} value={email.email_footer} readOnly={ro} onChange={e => !ro && setEmail({ ...email, email_footer: e.target.value })} />
                  </Field>
                </div>

                <Divider />
                <SectionHeader title="Test de configuration" description="Envoyer un email de test pour vérifier la configuration SMTP" />
                <div style={{ display: 'flex', gap: 10 }}>
                  <input style={{ ...inputStyle, flex: 1 }} type="email" value={email.test_email} readOnly={ro} onChange={e => !ro && setEmail({ ...email, test_email: e.target.value })} placeholder="destinataire@exemple.com" />
                  <button disabled={ro} style={{ padding: '9px 18px', background: ro ? '#f3f4f6' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: ro ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', color: ro ? '#9ca3af' : '#374151', opacity: ro ? 0.5 : 1 }}>
                    Envoyer test
                  </button>
                </div>
              </CardBody>
              {!ro && <SaveBar onSave={() => handleSave('Email')} loading={saving} />}
            </Card>
            );
          })()}

          {/* ════ APPARENCE ════ */}
          {activeTab === 'appearance' && canAccess('appearance', role) && (() => {
            const ro = isReadOnly('appearance', role);
            return (
            <Card>
              <CardBody>
                {ro && <ReadOnlyBanner />}
                <SectionHeader title="Thème" description="Apparence globale de l'interface" />
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, pointerEvents: ro ? 'none' : 'auto', opacity: ro ? 0.7 : 1 }}>
                  {[
                    { id: 'light', label: 'Clair', icon: '☀️', bg: '#ffffff', border: '#e5e7eb', text: '#111827' },
                    { id: 'dark',  label: 'Sombre', icon: '🌙', bg: '#1e293b', border: '#334155', text: '#f1f5f9' },
                  ].map(t => (
                    <div
                      key={t.id}
                      onClick={() => !ro && setAppearance({ ...appearance, theme: t.id })}
                      style={{
                        flex: 1, padding: '16px 20px', background: t.bg, color: t.text,
                        border: `2px solid ${appearance.theme === t.id ? '#2563eb' : t.border}`,
                        borderRadius: 10, cursor: ro ? 'default' : 'pointer', textAlign: 'center', transition: 'border-color 0.15s',
                      }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{t.label}</div>
                      {appearance.theme === t.id && <div style={{ fontSize: 11, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>Actif</div>}
                    </div>
                  ))}
                </div>

                <Grid>
                  <Field label="Couleur principale">
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="color" value={appearance.primary_color} disabled={ro} onChange={e => !ro && setAppearance({ ...appearance, primary_color: e.target.value })} style={{ ...inputStyle, width: 46, padding: 4, cursor: ro ? 'not-allowed' : 'pointer' }} />
                      <input type="text" value={appearance.primary_color} readOnly={ro} onChange={e => !ro && setAppearance({ ...appearance, primary_color: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                    </div>
                  </Field>
                  <Field label="Couleur accentuation">
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="color" value={appearance.accent_color} disabled={ro} onChange={e => !ro && setAppearance({ ...appearance, accent_color: e.target.value })} style={{ ...inputStyle, width: 46, padding: 4, cursor: ro ? 'not-allowed' : 'pointer' }} />
                      <input type="text" value={appearance.accent_color} readOnly={ro} onChange={e => !ro && setAppearance({ ...appearance, accent_color: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                    </div>
                  </Field>
                  <Field label="Taille de police">
                    <select style={{ ...selectStyle, pointerEvents: ro ? 'none' : 'auto' }} value={appearance.font_size} onChange={e => !ro && setAppearance({ ...appearance, font_size: e.target.value })}>
                      <option value="small">Petite — 13px</option>
                      <option value="medium">Moyenne — 14px</option>
                      <option value="large">Grande — 16px</option>
                    </select>
                  </Field>
                  <Field label="Arrondi des éléments">
                    <select style={{ ...selectStyle, pointerEvents: ro ? 'none' : 'auto' }} value={appearance.border_radius} onChange={e => !ro && setAppearance({ ...appearance, border_radius: e.target.value })}>
                      <option value="none">Aucun — carré</option>
                      <option value="small">Petit — 4px</option>
                      <option value="medium">Moyen — 8px</option>
                      <option value="large">Grand — 12px</option>
                    </select>
                  </Field>
                  <Field label="Style de la sidebar">
                    <select style={{ ...selectStyle, pointerEvents: ro ? 'none' : 'auto' }} value={appearance.sidebar_style} onChange={e => !ro && setAppearance({ ...appearance, sidebar_style: e.target.value })}>
                      <option value="full">Complète avec labels</option>
                      <option value="icons">Icônes uniquement</option>
                      <option value="mini">Mini collapsed</option>
                    </select>
                  </Field>
                  <Field label="Densité d'affichage">
                    <select style={{ ...selectStyle, pointerEvents: ro ? 'none' : 'auto' }} value={appearance.density} onChange={e => !ro && setAppearance({ ...appearance, density: e.target.value })}>
                      <option value="comfortable">Confortable</option>
                      <option value="compact">Compacte</option>
                    </select>
                  </Field>
                </Grid>

                <Divider />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SwitchRow icon="✨" label="Animations" description="Transitions et micro-interactions dans l'interface" checked={appearance.animations} onChange={() => !ro && setAppearance({ ...appearance, animations: !appearance.animations })} disabled={ro} />
                </div>
              </CardBody>
              {!ro && <SaveBar onSave={() => handleSave('Apparence')} loading={saving} />}
            </Card>
            );
          })()}

          {/* ════ NOTIFICATIONS ════ */}
          {activeTab === 'notifications' && canAccess('notifications', role) && (() => {
            const ro = isReadOnly('notifications', role);
            return (
            <Card>
              <CardBody>
                {ro && <ReadOnlyBanner />}
                <SectionHeader title="Canaux de notification" description="Modes de livraison des alertes" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SwitchRow icon="📧" label="Notifications par email" description="Envoi d'emails pour les événements importants" checked={notifications.email_notifications} onChange={() => !ro && setNotifications({ ...notifications, email_notifications: !notifications.email_notifications })} disabled={ro} />
                  <SwitchRow icon="🔔" label="Notifications push (navigateur)" description="Notifications en temps réel dans le navigateur" checked={notifications.push_notifications} onChange={() => !ro && setNotifications({ ...notifications, push_notifications: !notifications.push_notifications })} disabled={ro} />
                  <SwitchRow icon="💬" label="Notifications in-app" description="Badge et centre de notifications interne" checked={notifications.in_app_notifications} onChange={() => !ro && setNotifications({ ...notifications, in_app_notifications: !notifications.in_app_notifications })} disabled={ro} />
                </div>

                <Divider />
                <SectionHeader title="Événements déclencheurs" description="Choisir quels événements génèrent une notification" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SwitchRow label="Tâche assignée" description="Notifier l'utilisateur quand une tâche lui est assignée" checked={notifications.task_assigned} onChange={() => !ro && setNotifications({ ...notifications, task_assigned: !notifications.task_assigned })} disabled={ro} />
                  <SwitchRow label="Tâche complétée" description="Notifier le créateur quand une tâche est terminée" checked={notifications.task_completed} onChange={() => !ro && setNotifications({ ...notifications, task_completed: !notifications.task_completed })} disabled={ro} />
                  <SwitchRow label="Tâche en retard" description="Alerte quand la date limite est dépassée" checked={notifications.task_overdue} onChange={() => !ro && setNotifications({ ...notifications, task_overdue: !notifications.task_overdue })} disabled={ro} />
                  <SwitchRow label="Mises à jour de projet" description="Modifications du statut ou du chef de projet" checked={notifications.project_updates} onChange={() => !ro && setNotifications({ ...notifications, project_updates: !notifications.project_updates })} disabled={ro} />
                  <SwitchRow label="Mentions dans les commentaires" description="Notifier quand quelqu'un utilise @mention" checked={notifications.comment_mentions} onChange={() => !ro && setNotifications({ ...notifications, comment_mentions: !notifications.comment_mentions })} disabled={ro} />
                </div>

                <Divider />
                <SectionHeader title="Rapports périodiques" description="Résumés automatiques envoyés par email" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SwitchRow label="Résumé quotidien" description="Email de synthèse chaque matin à 08h00" checked={notifications.daily_digest} onChange={() => !ro && setNotifications({ ...notifications, daily_digest: !notifications.daily_digest })} disabled={ro} />
                  <SwitchRow label="Rapport hebdomadaire" description="Email récapitulatif chaque lundi matin" checked={notifications.weekly_report} onChange={() => !ro && setNotifications({ ...notifications, weekly_report: !notifications.weekly_report })} disabled={ro} />
                </div>

                <Divider />
                <Field label="Rappel d'échéance (jours avant)" hint="Envoyer un rappel N jours avant la date limite">
                  <input style={{ ...inputStyle, width: 120 }} type="number" value={notifications.deadline_reminder_days} min={0} max={30} readOnly={ro} onChange={e => !ro && setNotifications({ ...notifications, deadline_reminder_days: +e.target.value })} />
                </Field>
              </CardBody>
              {!ro && <SaveBar onSave={() => handleSave('Notifications')} loading={saving} />}
            </Card>
            );
          })()}

          {/* ════ INTÉGRATIONS ════ */}
          {activeTab === 'integrations' && canAccess('integrations', role) && (
            <Card>
              <CardBody>
                <SectionHeader title="Slack" description="Recevoir des notifications directement dans vos channels Slack" />
                <SwitchRow icon="🤖" label="Intégration Slack" description="Activer les notifications Slack" checked={integrations.slack_enabled} onChange={() => setIntegrations({ ...integrations, slack_enabled: !integrations.slack_enabled })} />
                {integrations.slack_enabled && (
                  <Grid>
                    <Field label="Webhook URL" hint="Trouvable dans votre espace Slack → Apps → Incoming Webhooks">
                      <input style={inputStyle} type="url" value={integrations.slack_webhook} onChange={e => setIntegrations({ ...integrations, slack_webhook: e.target.value })} placeholder="https://hooks.slack.com/services/…" />
                    </Field>
                    <Field label="Channel par défaut">
                      <input style={inputStyle} type="text" value={integrations.slack_channel} onChange={e => setIntegrations({ ...integrations, slack_channel: e.target.value })} placeholder="#general" />
                    </Field>
                  </Grid>
                )}

                <Divider />
                <SectionHeader title="Google Calendar" description="Synchroniser les échéances de projets" />
                <SwitchRow icon="📅" label="Google Calendar" description="Synchroniser les dates limites des projets et tâches" checked={integrations.google_calendar} onChange={() => setIntegrations({ ...integrations, google_calendar: !integrations.google_calendar })} />
                {integrations.google_calendar && (
                  <Field label="Google OAuth Client ID">
                    <input style={inputStyle} type="text" value={integrations.google_client_id} onChange={e => setIntegrations({ ...integrations, google_client_id: e.target.value })} placeholder="xxxxxxxxxx.apps.googleusercontent.com" />
                  </Field>
                )}

                <Divider />
                <SectionHeader title="Webhooks sortants" description="Envoyer des événements vers un endpoint externe" />
                <Grid>
                  <Field label="URL du webhook">
                    <input style={inputStyle} type="url" value={integrations.webhook_url} onChange={e => setIntegrations({ ...integrations, webhook_url: e.target.value })} placeholder="https://mon-service.com/webhook" />
                  </Field>
                  <Field label="Secret de signature" hint="Utilisé pour vérifier les requêtes (HMAC SHA-256)">
                    <input style={inputStyle} type="password" value={integrations.webhook_secret} onChange={e => setIntegrations({ ...integrations, webhook_secret: e.target.value })} placeholder="••••••••••••" />
                  </Field>
                </Grid>

                <Divider />
                <Field label="Limite de débit API (req/min)" hint="Par clé API ou utilisateur">
                  <input style={{ ...inputStyle, width: 140 }} type="number" value={integrations.api_rate_limit} min={10} onChange={e => setIntegrations({ ...integrations, api_rate_limit: +e.target.value })} />
                </Field>
              </CardBody>
              <SaveBar onSave={() => handleSave('Intégrations')} loading={saving} />
            </Card>
          )}

          {/* ════ SAUVEGARDE ════ */}
          {activeTab === 'backup' && canAccess('backup', role) && (
            <Card>
              <CardBody>
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Dernière sauvegarde</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{backup.last_backup} · {backup.last_backup_size}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusBadge status={backup.last_backup_status} />
                    <button style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Sauvegarder maintenant
                    </button>
                  </div>
                </div>

                <SectionHeader title="Planification" description="Automatiser les sauvegardes à intervalles réguliers" />
                <SwitchRow icon="⏰" label="Sauvegarde automatique" description="Planifier des sauvegardes régulières" checked={backup.auto_backup} onChange={() => setBackup({ ...backup, auto_backup: !backup.auto_backup })} />
                <Grid>
                  <Field label="Fréquence">
                    <select style={selectStyle} value={backup.backup_frequency} onChange={e => setBackup({ ...backup, backup_frequency: e.target.value })}>
                      <option value="hourly">Toutes les heures</option>
                      <option value="daily">Quotidienne</option>
                      <option value="weekly">Hebdomadaire</option>
                      <option value="monthly">Mensuelle</option>
                    </select>
                  </Field>
                  <Field label="Heure d'exécution">
                    <input style={inputStyle} type="time" value={backup.backup_time} onChange={e => setBackup({ ...backup, backup_time: e.target.value })} />
                  </Field>
                  <Field label="Rétention (jours)" hint="Supprimer les sauvegardes plus anciennes">
                    <input style={inputStyle} type="number" value={backup.backup_retention_days} min={1} onChange={e => setBackup({ ...backup, backup_retention_days: +e.target.value })} />
                  </Field>
                </Grid>

                <Divider />
                <SectionHeader title="Destination" description="Où stocker les fichiers de sauvegarde" />
                <Grid>
                  <Field label="Destination">
                    <select style={selectStyle} value={backup.backup_location} onChange={e => setBackup({ ...backup, backup_location: e.target.value })}>
                      <option value="local">Serveur local</option>
                      <option value="s3">Amazon S3</option>
                      <option value="ftp">FTP</option>
                    </select>
                  </Field>
                  {backup.backup_location === 's3' && (
                    <>
                      <Field label="Nom du bucket S3">
                        <input style={inputStyle} type="text" value={backup.s3_bucket} onChange={e => setBackup({ ...backup, s3_bucket: e.target.value })} placeholder="mon-bucket-backups" />
                      </Field>
                      <Field label="Région S3">
                        <select style={selectStyle} value={backup.s3_region} onChange={e => setBackup({ ...backup, s3_region: e.target.value })}>
                          <option value="eu-west-1">EU (Irlande) — eu-west-1</option>
                          <option value="eu-central-1">EU (Francfort) — eu-central-1</option>
                          <option value="us-east-1">US East — us-east-1</option>
                        </select>
                      </Field>
                    </>
                  )}
                </Grid>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                  <SwitchRow icon="🗜️" label="Compression" description="Réduire la taille des fichiers de sauvegarde (gzip)" checked={backup.compress_backup} onChange={() => setBackup({ ...backup, compress_backup: !backup.compress_backup })} />
                  <SwitchRow icon="🔐" label="Chiffrement AES-256" description="Chiffrer les sauvegardes pour une sécurité maximale" checked={backup.encrypt_backup} onChange={() => setBackup({ ...backup, encrypt_backup: !backup.encrypt_backup })} />
                  <SwitchRow icon="📎" label="Inclure les pièces jointes" description="Sauvegarder les fichiers uploadés par les utilisateurs" checked={backup.include_attachments} onChange={() => setBackup({ ...backup, include_attachments: !backup.include_attachments })} />
                </div>
              </CardBody>
              <SaveBar onSave={() => handleSave('Sauvegarde')} loading={saving} />
            </Card>
          )}

          {/* ════ SYSTÈME ════ */}
          {activeTab === 'system' && canAccess('system', role) && (
            <Card>
              <CardBody>
                <SectionHeader title="Performance" description="Cache, queue et optimisations" />
                <Grid>
                  <Field label="Driver de cache">
                    <select style={selectStyle} value={system.cache_driver} onChange={e => setSystem({ ...system, cache_driver: e.target.value })}>
                      <option value="file">Fichier (par défaut)</option>
                      <option value="redis">Redis (recommandé)</option>
                      <option value="memcached">Memcached</option>
                      <option value="database">Base de données</option>
                    </select>
                  </Field>
                  <Field label="TTL cache (secondes)">
                    <input style={inputStyle} type="number" value={system.cache_duration} min={60} onChange={e => setSystem({ ...system, cache_duration: +e.target.value })} />
                  </Field>
                  <Field label="Driver de queue">
                    <select style={selectStyle} value={system.queue_driver} onChange={e => setSystem({ ...system, queue_driver: e.target.value })}>
                      <option value="sync">Synchrone (développement)</option>
                      <option value="database">Base de données</option>
                      <option value="redis">Redis</option>
                    </select>
                  </Field>
                </Grid>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                  <SwitchRow icon="⚡" label="Cache activé" description="Mettre en cache les requêtes fréquentes pour améliorer les performances" checked={system.cache_enabled} onChange={() => setSystem({ ...system, cache_enabled: !system.cache_enabled })} />
                </div>

                <Divider />
                <SectionHeader title="Logs & Débogage" description="Niveaux de log et outils de diagnostic" />
                <Grid>
                  <Field label="Niveau de log">
                    <select style={selectStyle} value={system.log_level} onChange={e => setSystem({ ...system, log_level: e.target.value })}>
                      <option value="debug">Debug — tout enregistrer</option>
                      <option value="info">Info (recommandé)</option>
                      <option value="warn">Warning — erreurs et alertes</option>
                      <option value="error">Error — erreurs uniquement</option>
                    </select>
                  </Field>
                  <Field label="Rétention des logs (jours)">
                    <input style={inputStyle} type="number" value={system.log_retention_days} min={7} onChange={e => setSystem({ ...system, log_retention_days: +e.target.value })} />
                  </Field>
                </Grid>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                  <SwitchRow icon="🐛" label="Mode debug" description="Afficher les traces d'erreurs détaillées (ne pas activer en production)" checked={system.debug_mode} onChange={() => setSystem({ ...system, debug_mode: !system.debug_mode })} danger />
                  <SwitchRow icon="📋" label="Audit logs" description="Enregistrer toutes les actions des utilisateurs (RGPD)" checked={system.enable_audit_logs} onChange={() => setSystem({ ...system, enable_audit_logs: !system.enable_audit_logs })} />
                </div>

                <Divider />
                <SectionHeader title="Fichiers uploadés" description="Limites et types autorisés" />
                <Grid>
                  <Field label="Taille max d'upload (MB)">
                    <input style={inputStyle} type="number" value={system.max_upload_size} min={1} max={500} onChange={e => setSystem({ ...system, max_upload_size: +e.target.value })} />
                  </Field>
                  <Field label="Extensions autorisées" hint="Séparées par des virgules">
                    <input style={inputStyle} type="text" value={system.allowed_file_types} onChange={e => setSystem({ ...system, allowed_file_types: e.target.value })} />
                  </Field>
                </Grid>

                <Divider />
                <SectionHeader title="API" description="Version et IPs autorisées pendant la maintenance" />
                <Grid>
                  <Field label="Version API active">
                    <select style={selectStyle} value={system.api_version} onChange={e => setSystem({ ...system, api_version: e.target.value })}>
                      <option value="v1">v1 — Stable</option>
                      <option value="v2">v2 — Bêta</option>
                    </select>
                  </Field>
                  <Field label="IPs autorisées en maintenance" hint="Une IP par ligne">
                    <input style={inputStyle} type="text" value={system.maintenance_ips} onChange={e => setSystem({ ...system, maintenance_ips: e.target.value })} placeholder="127.0.0.1" />
                  </Field>
                </Grid>
              </CardBody>
              <SaveBar onSave={() => handleSave('Système')} loading={saving} />
            </Card>
          )}

          {/* ════ LOGS ════ */}
          {activeTab === 'logs' && canAccess('logs', role) && (
            <Card>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#111827' }}>Logs système</h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Historique des actions et événements ({fakeLogs.length} entrées)</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ padding: '7px 14px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>📥 Exporter</button>
                    <button style={{ padding: '7px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#dc2626' }}>🗑️ Vider</button>
                  </div>
                </div>

                <div style={{ background: '#0f172a', borderRadius: 10, padding: '16px', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 12, overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
                  {fakeLogs.map((log, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: i < fakeLogs.length - 1 ? '1px solid #1e293b' : 'none', alignItems: 'flex-start' }}>
                      <span style={{ color: logColor(log.level), fontWeight: 700, minWidth: 50, flexShrink: 0, fontSize: 11 }}>[{log.level}]</span>
                      <span style={{ color: '#64748b', flexShrink: 0, fontSize: 11 }}>{log.time}</span>
                      <span style={{ color: '#e2e8f0', flex: 1 }}>{log.msg}</span>
                      <span style={{ color: '#475569', flexShrink: 0, fontSize: 10 }}>{log.ip}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
