import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

type UserRole = 'chef_projet' | 'employe' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'Actif' | 'Inactif';
}

const initialUsers: User[] = [
  { id: 'U1', name: 'Amine Belhadj', email: 'chef@maisonweb.com', role: 'chef_projet', department: 'Développement', status: 'Actif' },
  { id: 'U2', name: 'Sara Mansouri', email: 'employe@maisonweb.com', role: 'employe', department: 'Développement', status: 'Actif' },
  { id: 'U3', name: 'Karim Ouali', email: 'karim@maisonweb.com', role: 'chef_projet', department: 'Développement', status: 'Actif' },
  { id: 'U4', name: 'Nadia Bouzid', email: 'nadia@maisonweb.com', role: 'employe', department: 'Design', status: 'Actif' },
  { id: 'U5', name: 'Mehdi Rahali', email: 'mehdi@maisonweb.com', role: 'employe', department: 'QA', status: 'Actif' },
];

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  chef_projet: 'Chef de projet',
  employe: 'Employé',
};

const roleColor: Record<string, { bg: string; color: string }> = {
  admin: { bg: '#f3e8ff', color: '#6b21a8' },
  chef_projet: { bg: '#dbeafe', color: '#1e40af' },
  employe: { bg: '#dcfce7', color: '#166534' },
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #e2e8f0', borderRadius: '10px',
  fontSize: '14px', color: '#0f172a',
  background: '#f8fafc', outline: 'none', boxSizing: 'border-box',
};

export default function UsersList() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employe', department: '' });
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

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
      status: 'Actif',
    };
    setUsers((prev) => [...prev, newUser]);
    setShowModal(false);
    setForm({ name: '', email: '', password: '', role: 'employe', department: '' });
    setFormError('');
    setSuccessMsg(`Utilisateur "${newUser.name}" créé avec succès`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Confirmer la suppression ?')) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const handleToggleStatus = (id: string) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: u.status === 'Actif' ? 'Inactif' : 'Actif' } : u));
  };

  if (!isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⛔</div>
        <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Accès refusé</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>Utilisateurs</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>{users.length} utilisateurs au total</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(''); }}
          style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(30,58,138,0.25)' }}
        >
          + Nouvel utilisateur
        </button>
      </div>

      {/* Success */}
      {successMsg && (
        <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', color: '#166534', fontSize: '14px' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Rechercher un utilisateur..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...inputStyle, maxWidth: '320px' }}
        onFocus={(e) => e.currentTarget.style.borderColor = '#1e3a8a'}
        onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
      />

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Utilisateur', 'Email', 'Rôle', 'Département', 'Statut', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '13px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const rc = roleColor[u.role];
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                          {u.name[0]}
                        </div>
                        <p style={{ fontWeight: 600, color: '#0f172a', margin: 0 }}>{u.name}</p>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontSize: '13px' }}>{u.email}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: rc.bg, color: rc.color }}>
                        {roleLabel[u.role]}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontSize: '13px' }}>{u.department}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: u.status === 'Actif' ? '#dcfce7' : '#f1f5f9', color: u.status === 'Actif' ? '#166534' : '#475569' }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          style={{ padding: '5px 10px', background: '#eff6ff', color: '#1e40af', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          {u.status === 'Actif' ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          style={{ padding: '5px 10px', background: '#fff1f2', color: '#be123c', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '460px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Créer un utilisateur</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '10px', color: '#c53030', fontSize: '13px', marginBottom: '16px' }}>
                ⚠️ {formError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Nom complet', key: 'name', type: 'text', placeholder: 'Ex: Jean Dupont' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'email@maisonweb.com' },
                { label: 'Mot de passe', key: 'password', type: 'password', placeholder: '••••••••' },
                { label: 'Département', key: 'department', type: 'text', placeholder: 'Ex: Développement' },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                  />
                </div>
              ))}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Rôle</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { value: 'employe', label: 'Employé', icon: '💼' },
                    { value: 'chef_projet', label: 'Chef', icon: '🎯' },
                    { value: 'admin', label: 'Admin', icon: '⚙️' },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, role: r.value }))}
                      style={{
                        padding: '10px 8px', borderRadius: '8px',
                        border: `2px solid ${form.role === r.value ? '#1e3a8a' : '#e2e8f0'}`,
                        background: form.role === r.value ? '#eff6ff' : '#f8fafc',
                        color: form.role === r.value ? '#1e3a8a' : '#374151',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer', textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '16px', marginBottom: '4px' }}>{r.icon}</div>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fff', color: '#475569', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={handleCreate} style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}