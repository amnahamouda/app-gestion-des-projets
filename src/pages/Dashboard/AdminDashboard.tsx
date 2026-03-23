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
  { id: 'U5', name: 'Mehdi Rahali', email: 'mehdi@maisonweb.com', role: 'employe', department: 'QA' },
];

const projects = [
  { id: 'PRJ-001', name: 'Refonte site e-commerce', status: 'En cours', progress: 65, chef: 'Amine B.' },
  { id: 'PRJ-002', name: 'Application mobile RH', status: 'En cours', progress: 20, chef: 'Karim O.' },
  { id: 'PRJ-003', name: 'Dashboard analytique', status: 'Terminé', progress: 100, chef: 'Karim O.' },
  { id: 'PRJ-004', name: 'Portail client B2B', status: 'En attente', progress: 5, chef: 'Amine B.' },
];

const tasks = [
  { assignee: 'Nadia Bouzid', status: 'En cours' },
  { assignee: 'Karim Ouali', status: 'En cours' },
  { assignee: 'Sara Mansouri', status: 'En révision' },
  { assignee: 'Karim Ouali', status: 'Terminé' },
  { assignee: 'Karim Ouali', status: 'À faire' },
  { assignee: 'Nadia Bouzid', status: 'À faire' },
  { assignee: 'Sara Mansouri', status: 'Terminé' },
  { assignee: 'Mehdi Rahali', status: 'En cours' },
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

const statusColors: Record<string, { bg: string; color: string; dot: string }> = {
  'En cours': { bg: '#eff6ff', color: '#1e40af', dot: '#3b82f6' },
  'Terminé': { bg: '#f0fdf4', color: '#166534', dot: '#22c55e' },
  'En attente': { bg: '#fefce8', color: '#854d0e', dot: '#eab308' },
  'Annulé': { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444' },
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1px solid #e5e7eb', borderRadius: '8px',
  fontSize: '14px', color: '#111827',
  background: '#f9fafb', outline: 'none', boxSizing: 'border-box',
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employe', department: '' });
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const totalProjects = projects.length;
  const inProgress = projects.filter((p) => p.status === 'En cours').length;
  const completed = projects.filter((p) => p.status === 'Terminé').length;
  const late = projects.filter((p) => p.status === 'En cours' && p.progress < 30).length;
  const totalTasks = tasks.length;
  const tasksDone = tasks.filter((t) => t.status === 'Terminé').length;
  const completionRate = Math.round((tasksDone / totalTasks) * 100);

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
    setSuccessMsg(`Utilisateur "${newUser.name}" créé avec succès`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px 0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Vue d'ensemble
          </p>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>
            Tableau de bord
          </h1>
        </div>
      </div>

      {/* Success */}
      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', color: '#166534', fontSize: '14px' }}>
          <span>✓</span> {successMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total projets', value: totalProjects, sub: `${inProgress} en cours`, icon: '📁', trend: '+2 ce mois', trendUp: true },
          { label: 'Projets terminés', value: completed, sub: `sur ${totalProjects} projets`, icon: '✅', trend: `${Math.round((completed / totalProjects) * 100)}% du total`, trendUp: true },
          { label: 'En retard', value: late, sub: 'nécessitent attention', icon: '⚠️', trend: 'avancement < 30%', trendUp: false },
          { label: 'Membres actifs', value: users.length + 1, sub: "dans l'équipe", icon: '👥', trend: `+${users.filter((u) => u.role === 'employe').length} employés`, trendUp: true },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '14px', padding: '20px 24px', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(30,58,138,0.10)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: 0, fontWeight: 500 }}>{s.label}</p>
              <div style={{ width: '36px', height: '36px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', border: '1px solid #dbeafe' }}>
                {s.icon}
              </div>
            </div>
            <p style={{ fontSize: '2.2rem', fontWeight: 700, color: '#111827', margin: '0 0 4px 0', lineHeight: 1 }}>{s.value}</p>
            <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 8px 0' }}>{s.sub}</p>
            <span style={{ fontSize: '11px', color: s.trendUp ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
              {s.trendUp ? '↑' : '↓'} {s.trend}
            </span>
          </div>
        ))}
      </div>

      {/* Performance */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontWeight: 700, color: '#111827', margin: '0 0 4px 0', fontSize: '15px' }}>Performance globale</h2>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>Répartition des tâches de l'équipe</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: '#1d4ed8', margin: 0, lineHeight: 1 }}>{completionRate}%</p>
            <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>taux de complétion</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Tâches terminées', value: tasksDone, total: totalTasks, color: '#059669' },
            { label: 'En cours', value: tasks.filter((t) => t.status === 'En cours').length, total: totalTasks, color: '#1d4ed8' },
            { label: 'À faire', value: tasks.filter((t) => t.status === 'À faire').length, total: totalTasks, color: '#d97706' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500, minWidth: '140px' }}>{item.label}</span>
              <div style={{ flex: 1, height: '8px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(item.value / item.total) * 100}%`, background: item.color, borderRadius: '999px' }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: item.color, minWidth: '50px', textAlign: 'right' }}>
                {item.value}/{item.total}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Projets + Équipe */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Projets */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f9fafb' }}>
            <div>
              <h2 style={{ fontWeight: 700, color: '#111827', margin: 0, fontSize: '15px' }}>Projets récents</h2>
              <p style={{ color: '#9ca3af', fontSize: '12px', margin: '2px 0 0 0' }}>{projects.length} projets au total</p>
            </div>
            <Link to="/projects" style={{ fontSize: '13px', color: '#1d4ed8', textDecoration: 'none', fontWeight: 600 }}>Voir tout →</Link>
          </div>
          <div>
            {projects.map((p, idx) => {
              const sc = statusColors[p.status] ?? { bg: '#f9fafb', color: '#374151', dot: '#9ca3af' };
              return (
                <div key={p.id} style={{ padding: '14px 24px', borderBottom: idx < projects.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <Link to={`/projects/${p.id}`} style={{ fontWeight: 600, color: '#111827', fontSize: '13px', textDecoration: 'none' }}>{p.name}</Link>
                      <p style={{ color: '#9ca3af', fontSize: '11px', margin: '2px 0 0 0' }}>Chef : {p.chef}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', background: sc.bg }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: sc.color }}>{p.status}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '5px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p.progress}%`, background: p.progress === 100 ? '#059669' : '#1d4ed8', borderRadius: '999px' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{p.progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Équipe */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f9fafb' }}>
            <div>
              <h2 style={{ fontWeight: 700, color: '#111827', margin: 0, fontSize: '15px' }}>Équipe</h2>
              <p style={{ color: '#9ca3af', fontSize: '12px', margin: '2px 0 0 0' }}>{users.length + 1} membres actifs</p>
            </div>
            <Link to="/users" style={{ fontSize: '13px', color: '#1d4ed8', textDecoration: 'none', fontWeight: 600 }}>Gérer →</Link>
          </div>
          <div>
            {users.slice(0, 5).map((u, idx) => {
              const rc = roleColor[u.role];
              return (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', borderBottom: idx < 4 ? '1px solid #f9fafb' : 'none' }}>
                  <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                    {u.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, color: '#111827', margin: 0, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                    <p style={{ color: '#9ca3af', fontSize: '11px', margin: 0 }}>{u.department}</p>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: rc.bg, color: rc.color, flexShrink: 0 }}>
                    {roleLabel[u.role]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vue globale système */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', borderRadius: '14px', padding: '24px', color: '#fff' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontWeight: 700, color: '#fff', margin: '0 0 4px 0', fontSize: '15px' }}>Vue globale du système</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>Statistiques générales de la plateforme</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Utilisateurs actifs', value: users.length + 1, icon: '👤' },
            { label: 'Projets créés', value: projects.length, icon: '📁' },
            { label: 'Tâches créées', value: tasks.length, icon: '✅' },
            { label: 'Chefs de projet', value: users.filter((u) => u.role === 'chef_projet').length, icon: '🎯' },
            { label: 'Employés', value: users.filter((u) => u.role === 'employe').length, icon: '💼' },
          ].map((s) => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '16px', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{s.icon}</div>
              <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.4 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(4px)' }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '460px', padding: '28px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>Créer un utilisateur</h2>
                <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>Remplissez les informations du nouveau membre</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: '32px', height: '32px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>×</button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>
                {formError}
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,58,138,0.08)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.boxShadow = 'none'; }}
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
                        border: `2px solid ${form.role === r.value ? '#1e3a8a' : '#e5e7eb'}`,
                        background: form.role === r.value ? '#eff6ff' : '#f9fafb',
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

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={handleCreate} style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(30,58,138,0.25)' }}>
                Créer l'utilisateur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}