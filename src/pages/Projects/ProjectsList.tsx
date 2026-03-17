import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

interface Project {
  id: string;
  name: string;
  description: string;
  chef: string;
  status: string;
  priority: string;
  progress: number;
  startDate: string;
  endDate: string;
  tasks: number;
}

const initialProjects: Project[] = [
  { id: 'PRJ-001', name: 'Refonte site e-commerce', description: 'Refonte complète du site.', chef: 'Amine Belhadj', status: 'En cours', priority: 'Haute', progress: 65, startDate: '2025-01-10', endDate: '2025-04-30', tasks: 18 },
  { id: 'PRJ-002', name: 'Application mobile RH', description: 'App mobile pour la gestion RH.', chef: 'Sara Mansouri', status: 'En cours', priority: 'Moyenne', progress: 20, startDate: '2025-03-01', endDate: '2025-07-15', tasks: 12 },
  { id: 'PRJ-003', name: 'Dashboard analytique', description: 'Dashboard de visualisation de données.', chef: 'Karim Ouali', status: 'Terminé', priority: 'Basse', progress: 100, startDate: '2024-10-01', endDate: '2025-01-31', tasks: 24 },
  { id: 'PRJ-004', name: 'Portail client B2B', description: 'Portail pour les clients B2B.', chef: 'Amine Belhadj', status: 'En attente', priority: 'Haute', progress: 5, startDate: '2025-02-15', endDate: '2025-06-30', tasks: 9 },
];

const members = [
  { id: 'U1', name: 'Amine Belhadj' },
  { id: 'U2', name: 'Sara Mansouri' },
  { id: 'U3', name: 'Karim Ouali' },
  { id: 'U4', name: 'Nadia Bouzid' },
];

const statusColor: Record<string, { bg: string; color: string }> = {
  'En cours': { bg: '#dbeafe', color: '#1e40af' },
  'Terminé': { bg: '#dcfce7', color: '#166534' },
  'En attente': { bg: '#fef9c3', color: '#854d0e' },
  'Annulé': { bg: '#fee2e2', color: '#991b1b' },
};

const priorityColor: Record<string, { bg: string; color: string }> = {
  'Haute': { bg: '#fee2e2', color: '#991b1b' },
  'Moyenne': { bg: '#fef9c3', color: '#854d0e' },
  'Basse': { bg: '#dcfce7', color: '#166534' },
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #e2e8f0', borderRadius: '10px',
  fontSize: '14px', color: '#0f172a',
  background: '#f8fafc', outline: 'none', boxSizing: 'border-box',
};

export default function ProjectsList() {
  const { isChef, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Project | null>(null);
  const [editError, setEditError] = useState('');

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Confirmer la suppression de ce projet ?')) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const openEdit = (project: Project) => {
    setEditForm({ ...project });
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditSave = () => {
    if (!editForm) return;
    if (!editForm.name.trim()) { setEditError('Le nom est obligatoire.'); return; }
    if (!editForm.endDate || !editForm.startDate) { setEditError('Les dates sont obligatoires.'); return; }
    if (new Date(editForm.endDate) <= new Date(editForm.startDate)) { setEditError('La date de fin doit être après la date de début.'); return; }
    setProjects((prev) => prev.map((p) => p.id === editForm.id ? editForm : p));
    setShowEditModal(false);
  };

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>Projets</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>{projects.length} projets au total</p>
        </div>
        {(isChef || isAdmin) && (
          <button
            onClick={() => navigate('/projects/new')}
            style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(30,58,138,0.25)' }}
          >
            + Nouveau projet
          </button>
        )}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Rechercher un projet..."
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
          <option value="En cours">En cours</option>
          <option value="En attente">En attente</option>
          <option value="Terminé">Terminé</option>
          <option value="Annulé">Annulé</option>
        </select>
      </div>

      {/* Tableau */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Projet', 'Chef', 'Statut', 'Priorité', 'Avancement', 'Échéance', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '13px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const sc = statusColor[p.status] ?? { bg: '#f1f5f9', color: '#475569' };
                const pc = priorityColor[p.priority] ?? { bg: '#f1f5f9', color: '#475569' };
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <Link to={`/projects/${p.id}`} style={{ fontWeight: 600, color: '#0f172a', textDecoration: 'none', display: 'block' }}>
                        {p.name}
                      </Link>
                      <p style={{ color: '#94a3b8', fontSize: '11px', margin: '2px 0 0 0' }}>{p.id} · {p.tasks} tâches</p>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{p.chef}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: sc.bg, color: sc.color }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: pc.bg, color: pc.color }}>{p.priority}</span>
                    </td>
                    <td style={{ padding: '14px 16px', minWidth: '140px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${p.progress}%`, background: p.progress === 100 ? '#16a34a' : '#1d4ed8', borderRadius: '999px' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{p.progress}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>{p.endDate}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link to={`/projects/${p.id}`} style={{ padding: '5px 10px', background: '#eff6ff', color: '#1e40af', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
                          Ouvrir
                        </Link>
                        {(isChef || isAdmin) && (
                          <>
                            <button
                              onClick={() => openEdit(p)}
                              style={{ padding: '5px 10px', background: '#f0fdf4', color: '#166534', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              style={{ padding: '5px 10px', background: '#fff1f2', color: '#be123c', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Supprimer
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Modification */}
      {showEditModal && editForm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '520px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Modifier le projet</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            {editError && (
              <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '10px', color: '#c53030', fontSize: '13px', marginBottom: '16px' }}>
                ⚠️ {editError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Nom */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Nom du projet <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => p ? { ...p, name: e.target.value } : p)}
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => p ? { ...p, description: e.target.value } : p)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>

              {/* Chef + Statut */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Chef de projet</label>
                  <select
                    value={editForm.chef}
                    onChange={(e) => setEditForm((p) => p ? { ...p, chef: e.target.value } : p)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Statut</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((p) => p ? { ...p, status: e.target.value } : p)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="En attente">En attente</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                    <option value="Annulé">Annulé</option>
                  </select>
                </div>
              </div>

              {/* Priorité */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Priorité</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { value: 'Haute', color: '#ef4444', bg: '#fee2e2' },
                    { value: 'Moyenne', color: '#f59e0b', bg: '#fef9c3' },
                    { value: 'Basse', color: '#16a34a', bg: '#dcfce7' },
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setEditForm((prev) => prev ? { ...prev, priority: p.value } : prev)}
                      style={{
                        padding: '8px', borderRadius: '8px', border: `2px solid ${editForm.priority === p.value ? p.color : '#e2e8f0'}`,
                        background: editForm.priority === p.value ? p.bg : '#f8fafc',
                        color: editForm.priority === p.value ? p.color : '#64748b',
                        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {p.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    Date de début <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm((p) => p ? { ...p, startDate: e.target.value } : p)}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    Date de fin <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm((p) => p ? { ...p, endDate: e.target.value } : p)}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                  />
                </div>
              </div>

              {/* Avancement */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Avancement : {editForm.progress}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={editForm.progress}
                  onChange={(e) => setEditForm((p) => p ? { ...p, progress: Number(e.target.value) } : p)}
                  style={{ width: '100%', accentColor: '#1d4ed8' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>0%</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>100%</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ flex: 1, padding: '11px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fff', color: '#475569', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={handleEditSave}
                style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}