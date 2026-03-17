import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';

interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  project: string;
  projectId: string;
  assignee: string;
  priority: string;
  status: string;
  due: string;
  progress: number;
  comments: Comment[];
}

const initialTasks: Task[] = [
  { id: 'T-001', title: 'Maquette page accueil', description: 'Créer la maquette de la page accueil.', project: 'Refonte e-commerce', projectId: 'PRJ-001', assignee: 'Nadia Bouzid', priority: 'Haute', status: 'En cours', due: '2025-03-20', progress: 60, comments: [] },
  { id: 'T-002', title: 'API authentification', description: 'Développer l\'API d\'authentification JWT.', project: 'Refonte e-commerce', projectId: 'PRJ-001', assignee: 'Karim Ouali', priority: 'Haute', status: 'En cours', due: '2025-03-25', progress: 40, comments: [] },
  { id: 'T-003', title: 'Tests module RH', description: 'Tests unitaires du module RH.', project: 'App mobile RH', projectId: 'PRJ-002', assignee: 'Sara Mansouri', priority: 'Moyenne', status: 'En révision', due: '2025-04-01', progress: 80, comments: [] },
  { id: 'T-004', title: 'Setup Next.js', description: 'Configuration initiale du projet.', project: 'Dashboard analytique', projectId: 'PRJ-003', assignee: 'Karim Ouali', priority: 'Basse', status: 'Terminé', due: '2025-01-15', progress: 100, comments: [] },
  { id: 'T-005', title: 'Intégration Stripe', description: 'Intégrer le paiement Stripe.', project: 'Refonte e-commerce', projectId: 'PRJ-001', assignee: 'Karim Ouali', priority: 'Haute', status: 'À faire', due: '2025-04-10', progress: 0, comments: [] },
  { id: 'T-006', title: 'Charte graphique B2B', description: 'Définir la charte graphique du portail.', project: 'Portail B2B', projectId: 'PRJ-004', assignee: 'Nadia Bouzid', priority: 'Moyenne', status: 'À faire', due: '2025-04-05', progress: 0, comments: [] },
];

const members = [
  { id: 'U1', name: 'Amine Belhadj' },
  { id: 'U2', name: 'Sara Mansouri' },
  { id: 'U3', name: 'Karim Ouali' },
  { id: 'U4', name: 'Nadia Bouzid' },
  { id: 'U5', name: 'Mehdi Rahali' },
];

const projects = [
  { id: 'PRJ-001', name: 'Refonte e-commerce' },
  { id: 'PRJ-002', name: 'App mobile RH' },
  { id: 'PRJ-003', name: 'Dashboard analytique' },
  { id: 'PRJ-004', name: 'Portail B2B' },
];

const statusColor: Record<string, { bg: string; color: string }> = {
  'En cours': { bg: '#dbeafe', color: '#1e40af' },
  'En révision': { bg: '#fef9c3', color: '#854d0e' },
  'Terminé': { bg: '#dcfce7', color: '#166534' },
  'À faire': { bg: '#f1f5f9', color: '#475569' },
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

export default function TasksList() {
  const { isChef, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');
  const [form, setForm] = useState({ title: '', description: '', projectId: '', assignee: '', priority: 'Moyenne', status: 'À faire', due: '' });
  const [formError, setFormError] = useState('');

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleCreate = () => {
    if (!form.title || !form.projectId || !form.assignee || !form.due) {
      setFormError('Tous les champs sont obligatoires.');
      return;
    }
    const project = projects.find((p) => p.id === form.projectId);
    const newTask: Task = {
      id: `T-${String(tasks.length + 1).padStart(3, '0')}`,
      title: form.title,
      description: form.description,
      project: project?.name ?? '',
      projectId: form.projectId,
      assignee: form.assignee,
      priority: form.priority,
      status: form.status,
      due: form.due,
      progress: 0,
      comments: [],
    };
    setTasks((prev) => [newTask, ...prev]);
    setShowCreateModal(false);
    setForm({ title: '', description: '', projectId: '', assignee: '', priority: 'Moyenne', status: 'À faire', due: '' });
    setFormError('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Confirmer la suppression ?')) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (selectedTask?.id === id) setShowDetailModal(false);
    }
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      const progress = newStatus === 'Terminé' ? 100 : newStatus === 'À faire' ? 0 : t.progress;
      return { ...t, status: newStatus, progress };
    }));
    setSelectedTask((prev) => prev ? { ...prev, status: newStatus, progress: newStatus === 'Terminé' ? 100 : newStatus === 'À faire' ? 0 : prev.progress } : prev);
  };

  const handleProgressChange = (taskId: string, progress: number) => {
    const status = progress === 100 ? 'Terminé' : progress === 0 ? 'À faire' : 'En cours';
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, progress, status } : t));
    setSelectedTask((prev) => prev ? { ...prev, progress, status } : prev);
  };

  const handleAddComment = (taskId: string) => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: `C-${Date.now()}`,
      author: user?.name ?? 'Utilisateur',
      text: newComment.trim(),
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
    };
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, comments: [...t.comments, comment] } : t));
    setSelectedTask((prev) => prev ? { ...prev, comments: [...prev.comments, comment] } : prev);
    setNewComment('');
  };

  const openDetail = (task: Task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
    setNewComment('');
  };

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>Tâches</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>{tasks.length} tâches au total</p>
        </div>
        {isChef && (
          <button
            onClick={() => { setShowCreateModal(true); setFormError(''); }}
            style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(30,58,138,0.25)' }}
          >
            + Nouvelle tâche
          </button>
        )}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Rechercher une tâche..."
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
          <option value="À faire">À faire</option>
          <option value="En cours">En cours</option>
          <option value="En révision">En révision</option>
          <option value="Terminé">Terminé</option>
        </select>
      </div>

      {/* Tableau */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Tâche', 'Projet', 'Assigné à', 'Priorité', 'Statut', 'Avancement', 'Échéance', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '13px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const sc = statusColor[t.status];
                const pc = priorityColor[t.priority];
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, cursor: 'pointer' }} onClick={() => openDetail(t)}>{t.title}</p>
                      <p style={{ color: '#94a3b8', fontSize: '11px', margin: '2px 0 0 0' }}>{t.id} · {t.comments.length} commentaire{t.comments.length !== 1 ? 's' : ''}</p>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <Link to={`/projects/${t.projectId}`} style={{ color: '#1e40af', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>{t.project}</Link>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{t.assignee}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: pc.bg, color: pc.color }}>{t.priority}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        style={{ fontSize: '12px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', background: sc.bg, color: sc.color, border: 'none', cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="À faire">À faire</option>
                        <option value="En cours">En cours</option>
                        <option value="En révision">En révision</option>
                        <option value="Terminé">Terminé</option>
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px', minWidth: '120px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${t.progress}%`, background: t.progress === 100 ? '#16a34a' : '#1d4ed8', borderRadius: '999px' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{t.progress}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>{t.due}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => openDetail(t)}
                          style={{ padding: '5px 10px', background: '#eff6ff', color: '#1e40af', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Détail
                        </button>
                        {isChef && (
                          <button
                            onClick={() => handleDelete(t.id)}
                            style={{ padding: '5px 10px', background: '#fff1f2', color: '#be123c', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Supprimer
                          </button>
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

      {/* ── Modal Création ── */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowCreateModal(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Nouvelle tâche</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '10px', color: '#c53030', fontSize: '13px', marginBottom: '16px' }}>
                ⚠️ {formError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Titre <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" placeholder="Ex: Maquette page accueil" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Description</label>
                <textarea placeholder="Décrivez la tâche..." value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Projet <span style={{ color: '#ef4444' }}>*</span></label>
                <select value={form.projectId} onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">-- Sélectionner --</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Assigné à <span style={{ color: '#ef4444' }}>*</span></label>
                <select value={form.assignee} onChange={(e) => setForm((p) => ({ ...p, assignee: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">-- Sélectionner --</option>
                  {members.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Priorité</label>
                  <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="Haute">Haute</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Basse">Basse</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Statut</label>
                  <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="À faire">À faire</option>
                    <option value="En cours">En cours</option>
                    <option value="En révision">En révision</option>
                    <option value="Terminé">Terminé</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Date d'échéance <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="date" value={form.due} onChange={(e) => setForm((p) => ({ ...p, due: e.target.value }))} style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
              <button onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '11px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fff', color: '#475569', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleCreate} style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Créer la tâche</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Détail Tâche ── */}
      {showDetailModal && selectedTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowDetailModal(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '580px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>{selectedTask.title}</h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: priorityColor[selectedTask.priority].bg, color: priorityColor[selectedTask.priority].color }}>{selectedTask.priority}</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Assigné à : <strong>{selectedTask.assignee}</strong></span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Échéance : <strong>{selectedTask.due}</strong></span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>{selectedTask.description}</p>
              </div>
            )}

            {/* Statut */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Statut</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {['À faire', 'En cours', 'En révision', 'Terminé'].map((s) => {
                  const sc = statusColor[s];
                  const isActive = selectedTask.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selectedTask.id, s)}
                      style={{
                        padding: '8px 4px', borderRadius: '8px', border: `2px solid ${isActive ? sc.color : '#e2e8f0'}`,
                        background: isActive ? sc.bg : '#f8fafc', color: isActive ? sc.color : '#64748b',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Avancement */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Avancement : {selectedTask.progress}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={selectedTask.progress}
                onChange={(e) => handleProgressChange(selectedTask.id, Number(e.target.value))}
                style={{ width: '100%', accentColor: '#1d4ed8' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>0%</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>100%</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden', marginTop: '4px' }}>
                <div style={{ height: '100%', width: `${selectedTask.progress}%`, background: selectedTask.progress === 100 ? '#16a34a' : '#1d4ed8', borderRadius: '999px', transition: 'width 0.3s' }} />
              </div>
            </div>

            {/* Commentaires */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>
                Commentaires ({selectedTask.comments.length})
              </label>

              {selectedTask.comments.length === 0 && (
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 12px 0', textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '10px' }}>
                  Aucun commentaire pour l'instant
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                {selectedTask.comments.map((c) => (
                  <div key={c.id} style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 14px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>{c.author}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{c.date}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>{c.text}</p>
                  </div>
                ))}
              </div>

              {/* Ajouter commentaire */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(selectedTask.id); }}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                />
                <button
                  onClick={() => handleAddComment(selectedTask.id)}
                  style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                >
                  Envoyer
                </button>
              </div>
            </div>

            {/* Actions footer */}
            {isChef && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleDelete(selectedTask.id)}
                  style={{ padding: '8px 16px', background: '#fff1f2', color: '#be123c', border: '1.5px solid #fecdd3', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  🗑️ Supprimer la tâche
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}