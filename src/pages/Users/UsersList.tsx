import { useState } from 'react';
import { Link } from 'react-router';

type UserRole = 'chef_projet' | 'employe' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

const initialUsers: User[] = [
  { id: 'U1', name: 'Amine Belhadj', email: 'chef@maisonweb.com', role: 'chef_projet', department: 'Développement' },
  { id: 'U2', name: 'Sara Mansouri', email: 'employe@maisonweb.com', role: 'employe', department: 'Développement' },
  { id: 'U3', name: 'Karim Ouali', email: 'karim@maisonweb.com', role: 'chef_projet', department: 'Développement' },
  { id: 'U4', name: 'Nadia Bouzid', email: 'nadia@maisonweb.com', role: 'employe', department: 'Design' },
];

const recentProjects = [
  { id: 'PRJ-001', name: 'Refonte site e-commerce', progress: 65, status: 'En cours', chef: 'Amine B.' },
  { id: 'PRJ-002', name: 'Application mobile RH', progress: 20, status: 'En cours', chef: 'Karim O.' },
  { id: 'PRJ-003', name: 'Dashboard analytique', progress: 100, status: 'Terminé', chef: 'Karim O.' },
  { id: 'PRJ-004', name: 'Portail client B2B', progress: 5, status: 'En attente', chef: 'Amine B.' },
];

const statusColor: Record<string, { bg: string; color: string }> = {
  'En cours': { bg: '#dbeafe', color: '#1e40af' },
  'Terminé': { bg: '#dcfce7', color: '#166534' },
  'En attente': { bg: '#fef9c3', color: '#854d0e' },
};

const roleColor: Record<string, { bg: string; color: string }> = {
  admin: { bg: '#f3e8ff', color: '#6b21a8' },
  chef_projet: { bg: '#dbeafe', color: '#1e40af' },
  employe: { bg: '#dcfce7', color: '#166534' },
};

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  chef_projet: 'Chef de projet',
  employe: 'Employé',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid #e2e8f0',
  borderRadius: '10px',
  fontSize: '14px',
  color: '#0f172a',
  background: '#f8fafc',
  outline: 'none',
  boxSizing: 'border-box',
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employe', department: '' });
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const stats = [
    { label: 'Total projets', value: recentProjects.length, sub: '1 en retard', icon: '📁', color: '#1e3a8a', light: '#eff6ff' },
    { label: 'Membres équipe', value: users.length + 1, sub: 'actifs', icon: '👥', color: '#0369a1', light: '#f0f9ff' },
    { label: 'Tâches actives', value: 24, sub: '8 urgentes', icon: '✅', color: '#166534', light: '#f0fdf4' },
    { label: 'Projets terminés', value: recentProjects.filter((p) => p.status === 'Terminé').length, sub: 'ce trimestre', icon: '🏆', color: '#854d0e', light: '#fefce8' },
  ];

  const handleCreate = () => {
    if (!form.name || !form.email || !form.password || !form.department) {
      setFormError('Tous les champs sont obligatoires.');
      return;
    }
    const newUser: User = {
      id: `U${Date.now()}`,
      name: form.name,
      email: form.email,
      role: form.role as UserRole,
      department: form.department,
    };
    setUsers((prev) => [...prev, newUser]);
    setShowModal(false);
    setForm({ name: '', email: '', password: '', role: 'employe', department: '' });
    setFormError('');
    setSuccessMsg(`✅ Utilisateur "${newUser.name}" créé avec succès !`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            Tableau de bord — Admin
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            Vue globale de Maison du Web
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(''); }}
          style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(30,58,138,0.25)' }}
        >
          + Nouvel utilisateur
        </button>
      </div>

      {/* Message succès */}
      {successMsg && (
        <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '10px', color: '#166534', fontSize: '14px', fontWeight: 500 }}>
          {successMsg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 8px 0', fontWeight: 500 }}>{s.label}</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0', lineHeight: 1 }}>{s.value}</p>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>{s.sub}</p>
              </div>
              <div style={{ width: '44px', height: '44px', background: s.light, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Projets + Équipe */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Projets récents */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '15px' }}>Projets récents</h2>
            <Link to="/projects" style={{ fontSize: '13px', color: '#1e40af', textDecoration: 'none', fontWeight: 500 }}>
              Voir tout →
            </Link>
          </div>
          <div>
            {recentProjects.map((p) => {
              const sc = statusColor[p.status];
              return (
                <div key={p.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <Link to={`/projects/${p.id}`} style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </Link>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: sc.bg, color: sc.color, flexShrink: 0, marginLeft: '8px' }}>
                        {p.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '5px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${p.progress}%`, background: p.progress === 100 ? '#16a34a' : '#1d4ed8', borderRadius: '999px' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>{p.progress}%</span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0 0' }}>Chef : {p.chef}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Équipe */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '15px' }}>
              Équipe ({users.length + 1} membres)
            </h2>
            <Link to="/users" style={{ fontSize: '13px', color: '#1e40af', textDecoration: 'none', fontWeight: 500 }}>
              Gérer →
            </Link>
          </div>
          <div>
            {users.slice(0, 5).map((u) => {
              const rc = roleColor[u.role];
              return (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                    {u.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                    <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>{u.department}</p>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: rc.bg, color: rc.color, flexShrink: 0 }}>
                    {roleLabel[u.role]}
                  </span>
                </div>
              );
            })}
            {users.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                Aucun membre — créez des utilisateurs ci-dessus
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal Création Utilisateur ── */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '460px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Créer un utilisateur</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>×</button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '10px', color: '#c53030', fontSize: '13px', marginBottom: '16px' }}>
                ⚠️ {formError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Nom complet', key: 'name', type: 'text', placeholder: 'Ex: Jean Dupont' },
                { label: 'Adresse email', key: 'email', type: 'email', placeholder: 'email@maisonweb.com' },
                { label: 'Mot de passe', key: 'password', type: 'password', placeholder: '••••••••' },
                { label: 'Département', key: 'department', type: 'text', placeholder: 'Ex: Développement' },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,58,138,0.08)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              ))}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Rôle</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="employe">Employé</option>
                  <option value="chef_projet">Chef de projet</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '11px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fff', color: '#475569', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(30,58,138,0.25)' }}
              >
                Créer l'utilisateur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}