import { useState } from 'react';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  activeTasks: number;
  doneTasks: number;
  totalTasks: number;
  status: 'Disponible' | 'Occupé' | 'Surchargé';
}

const OVERLOAD_THRESHOLD = 3;
const BUSY_THRESHOLD = 2;

const initialMembers: Member[] = [
  { id: 'U1', name: 'Amine Belhadj', email: 'chef@maisonweb.com', role: 'chef_projet', department: 'Développement', activeTasks: 2, doneTasks: 5, totalTasks: 7 },
  { id: 'U2', name: 'Sara Mansouri', email: 'employe@maisonweb.com', role: 'employe', department: 'Développement', activeTasks: 1, doneTasks: 3, totalTasks: 4 },
  { id: 'U3', name: 'Karim Ouali', email: 'karim@maisonweb.com', role: 'chef_projet', department: 'Développement', activeTasks: 4, doneTasks: 2, totalTasks: 6 },
  { id: 'U4', name: 'Nadia Bouzid', email: 'nadia@maisonweb.com', role: 'employe', department: 'Design', activeTasks: 2, doneTasks: 1, totalTasks: 3 },
  { id: 'U5', name: 'Mehdi Rahali', email: 'mehdi@maisonweb.com', role: 'employe', department: 'QA', activeTasks: 1, doneTasks: 2, totalTasks: 3 },
].map((m) => ({
  ...m,
  status: m.activeTasks >= OVERLOAD_THRESHOLD ? 'Surchargé' : m.activeTasks >= BUSY_THRESHOLD ? 'Occupé' : 'Disponible',
})) as Member[];

const roleLabel: Record<string, string> = {
  chef_projet: 'Chef de projet',
  employe: 'Employé',
  admin: 'Admin',
};

const roleColor: Record<string, { bg: string; color: string }> = {
  chef_projet: { bg: '#dbeafe', color: '#1e40af' },
  employe: { bg: '#dcfce7', color: '#166534' },
  admin: { bg: '#f3e8ff', color: '#6b21a8' },
};

const statusConfig: Record<string, { bg: string; color: string; dot: string; icon: string }> = {
  'Disponible': { bg: '#f0fdf4', color: '#166534', dot: '#22c55e', icon: '🟢' },
  'Occupé': { bg: '#fefce8', color: '#854d0e', dot: '#eab308', icon: '🟡' },
  'Surchargé': { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444', icon: '🔴' },
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #e2e8f0', borderRadius: '10px',
  fontSize: '14px', color: '#0f172a',
  background: '#f8fafc', outline: 'none', boxSizing: 'border-box',
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'employe', department: '' });
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const filtered = members.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.department.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Stats globales
  const available = members.filter((m) => m.status === 'Disponible').length;
  const busy = members.filter((m) => m.status === 'Occupé').length;
  const overloaded = members.filter((m) => m.status === 'Surchargé').length;
  const avgPerformance = Math.round(
    members.reduce((acc, m) => acc + (m.totalTasks > 0 ? (m.doneTasks / m.totalTasks) * 100 : 0), 0) / members.length
  );

  const handleDelete = (id: string) => {
    if (window.confirm('Confirmer la suppression de ce membre ?')) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setSuccessMsg('Membre supprimé avec succès');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleCreate = () => {
    if (!form.name || !form.email || !form.department) {
      setFormError('Tous les champs sont obligatoires.');
      return;
    }
    const newMember: Member = {
      id: `U${Date.now()}`,
      name: form.name,
      email: form.email,
      role: form.role,
      department: form.department,
      activeTasks: 0,
      doneTasks: 0,
      totalTasks: 0,
      status: 'Disponible',
    };
    setMembers((prev) => [...prev, newMember]);
    setShowModal(false);
    setForm({ name: '', email: '', role: 'employe', department: '' });
    setFormError('');
    setSuccessMsg(`Membre "${newMember.name}" ajouté avec succès`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <>
      <PageMeta title="Gestion de l'équipe | Maison du Web" description="Gestion de l'équipe" />
      <PageBreadcrumb pageTitle="Gestion de l'équipe" />

      <div style={{ fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>Gestion de l'équipe</h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>{members.length} membres au total</p>
          </div>
          <button
            onClick={() => { setShowModal(true); setFormError(''); }}
            style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(30,58,138,0.25)' }}
          >
            + Ajouter un membre
          </button>
        </div>

        {/* Success */}
        {successMsg && (
          <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', color: '#166534', fontSize: '14px' }}>
            ✓ {successMsg}
          </div>
        )}

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Disponibles', value: available, icon: '🟢', bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
            { label: 'Occupés', value: busy, icon: '🟡', bg: '#fefce8', color: '#854d0e', border: '#fde68a' },
            { label: 'Surchargés', value: overloaded, icon: '🔴', bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
            { label: 'Performance moy.', value: `${avgPerformance}%`, icon: '📊', bg: '#eff6ff', color: '#1e40af', border: '#dbeafe' },
          ].map((s) => (
            <div key={s.label} style={{ background: s.bg, borderRadius: '14px', padding: '16px 20px', border: `1.5px solid ${s.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px' }}>{s.icon}</span>
                <p style={{ color: s.color, fontSize: '13px', margin: 0, fontWeight: 500 }}>{s.label}</p>
              </div>
              <p style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, maxWidth: '280px' }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#1e3a8a'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fff', cursor: 'pointer' }}
          >
            <option value="all">Tous les statuts</option>
            <option value="Disponible">🟢 Disponible</option>
            <option value="Occupé">🟡 Occupé</option>
            <option value="Surchargé">🔴 Surchargé</option>
          </select>
        </div>

        {/* Grille membres */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filtered.map((m) => {
            const rc = roleColor[m.role] ?? { bg: '#f1f5f9', color: '#475569' };
            const sc = statusConfig[m.status];
            const performance = m.totalTasks > 0 ? Math.round((m.doneTasks / m.totalTasks) * 100) : 0;
            const loadPercent = Math.min((m.activeTasks / OVERLOAD_THRESHOLD) * 100, 100);

            return (
              <div key={m.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(30,58,138,0.10)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)')}
              >
                {/* Card header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
                    {m.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: '#0f172a', margin: 0, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                    <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>{m.email}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: sc.bg, flexShrink: 0 }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: sc.color }}>{m.status}</span>
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: rc.bg, color: rc.color }}>{roleLabel[m.role]}</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>📂 {m.department}</span>
                  </div>

                  {/* Charge */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>Charge de travail</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: m.status === 'Surchargé' ? '#ef4444' : '#0f172a' }}>
                        {m.activeTasks}/{OVERLOAD_THRESHOLD} tâches actives
                      </span>
                    </div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${loadPercent}%`, background: m.status === 'Surchargé' ? '#ef4444' : m.status === 'Occupé' ? '#f59e0b' : '#1d4ed8', borderRadius: '999px' }} />
                    </div>
                  </div>

                  {/* Performance */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>Performance</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#166534' }}>{performance}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${performance}%`, background: '#059669', borderRadius: '999px' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                      {m.doneTasks} terminées · {m.totalTasks} au total
                    </p>
                  </div>
                </div>

                {/* Card footer */}
                <div style={{ padding: '10px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setSelectedMember(m)}
                    style={{ flex: 1, padding: '7px', background: '#eff6ff', color: '#1e40af', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Voir détail
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    style={{ padding: '7px 14px', background: '#fff1f2', color: '#be123c', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Détail Membre */}
        {selectedMember && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setSelectedMember(null)}>
            <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '20px' }}>
                    {selectedMember.name[0]}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>{selectedMember.name}</h2>
                    <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>{selectedMember.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedMember(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Infos */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { label: 'Rôle', value: roleLabel[selectedMember.role] },
                    { label: 'Département', value: selectedMember.department },
                    { label: 'Statut', value: selectedMember.status },
                    { label: 'Tâches actives', value: String(selectedMember.activeTasks) },
                  ].map((info) => (
                    <div key={info.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px' }}>
                      <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: 600 }}>{info.label}</p>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{info.value}</p>
                    </div>
                  ))}
                </div>

                {/* Performance détaillée */}
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: '0 0 12px 0' }}>Performance</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    {[
                      { label: 'Total tâches', value: selectedMember.totalTasks, color: '#1d4ed8' },
                      { label: 'Terminées', value: selectedMember.doneTasks, color: '#059669' },
                      { label: 'Actives', value: selectedMember.activeTasks, color: '#f59e0b' },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <p style={{ fontSize: '1.8rem', fontWeight: 700, color: stat.color, margin: 0, lineHeight: 1 }}>{stat.value}</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0 0' }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px', color: '#475569' }}>Taux d'efficacité</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>
                        {selectedMember.totalTasks > 0 ? Math.round((selectedMember.doneTasks / selectedMember.totalTasks) * 100) : 0}%
                      </span>
                    </div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${selectedMember.totalTasks > 0 ? (selectedMember.doneTasks / selectedMember.totalTasks) * 100 : 0}%`, background: '#059669', borderRadius: '999px' }} />
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => setSelectedMember(null)} style={{ width: '100%', marginTop: '16px', padding: '11px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fff', color: '#475569', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Modal Ajout Membre */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowModal(false)}>
            <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Ajouter un membre</h2>
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
                  { label: 'Département', key: 'department', type: 'text', placeholder: 'Ex: Développement' },
                ].map((f) => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>{f.label} <span style={{ color: '#ef4444' }}>*</span></label>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { value: 'employe', label: 'Employé', icon: '💼' },
                      { value: 'chef_projet', label: 'Chef de projet', icon: '🎯' },
                    ].map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, role: r.value }))}
                        style={{
                          padding: '10px', borderRadius: '8px',
                          border: `2px solid ${form.role === r.value ? '#1e3a8a' : '#e2e8f0'}`,
                          background: form.role === r.value ? '#eff6ff' : '#f8fafc',
                          color: form.role === r.value ? '#1e3a8a' : '#374151',
                          fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: '18px', marginBottom: '4px' }}>{r.icon}</div>
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
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}