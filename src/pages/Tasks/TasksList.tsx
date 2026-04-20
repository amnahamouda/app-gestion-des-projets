import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';

// ===================== INTERFACES =====================
interface SubTask {
  id: number;
  titre: string;
  termine: boolean;
}

interface Comment {
  id: number;
  user_id: number;
  auteur_nom: string;
  texte: string;
  created_at: string;
}

interface AnalyseAvancement {
  progression_actuelle: string;
  avancement_recommande: string;
  ecart: string;
  statut_risque: string;
  conseil: string;
}

interface Task {
  id: number;
  titre: string;
  description: string;
  projet_id: number;
  nom_projet: string;
  chef_nom?: string;
  assigne_a: number;
  assigne_nom: string;
  priorite: string;
  statut: string;
  date_debut?: string;
  date_echeance: string;
  progression: number;
  jours_restants?: number;
  alerte?: string;
  commentaires?: Comment[];
  analyse_avancement?: AnalyseAvancement;
  subtasks?: SubTask[];
}

interface Project { id: number; nom_projet: string; }
interface User { id: number; nom_complet: string; email: string; role: string; }

const API_URL = 'http://localhost:5000/api';

// ── Design tokens ────────────────────────────────────────
const T = {
  navy950: '#0c1a3a', navy900: '#0f2057',
  blue600: '#1e40af', blue400: '#60a5fa', blue100: '#dbeafe', blue50: '#eff6ff',
  slate900: '#0f172a', slate700: '#334155', slate600: '#475569',
  slate500: '#64748b', slate400: '#94a3b8', slate300: '#cbd5e1',
  slate100: '#f1f5f9', slate50: '#f8fafc', white: '#ffffff',
  rose: '#e11d48', rose50: '#fff1f2', roseMid: '#fecdd3',
  amber: '#b45309', amber50: '#fffbeb', amberMid: '#fde68a',
  green: '#15803d', green50: '#f0fdf4', greenMid: '#bbf7d0',
};

const statusStyle: Record<string, { bg: string; color: string }> = {
  a_faire:  { bg: T.slate100, color: T.slate600 },
  en_cours: { bg: T.blue50,   color: T.blue600  },
  termine:  { bg: T.green50,  color: T.green    },
};

const priorityStyle: Record<string, { bg: string; color: string }> = {
  haute:   { bg: T.rose50,  color: T.rose  },
  moyenne: { bg: T.amber50, color: T.amber },
  faible:  { bg: T.green50, color: T.green },
};

const traduireStatut   = (s: string) => ({ a_faire: 'À faire', en_cours: 'En cours', termine: 'Terminé' }[s] || s);
const traduirePriorite = (p: string) => ({ haute: 'Haute', moyenne: 'Moyenne', faible: 'Basse' }[p] || p);

const formatDateForBackend = (d: string): string | null => {
  if (!d) return null;
  if (d.match(/^\d{4}-\d{2}-\d{2}$/)) return d;
  return new Date(d).toISOString().split('T')[0];
};

const inputSx: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: `1px solid ${T.slate300}`, borderRadius: '10px',
  fontSize: '14px', color: T.slate900,
  background: T.white, outline: 'none', boxSizing: 'border-box',
};

// ── Subtask storage (localStorage per task) ──────────────
const STORAGE_KEY = (taskId: number) => `subtasks_task_${taskId}`;
const loadSubtasks = (taskId: number): SubTask[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY(taskId)) || '[]'); }
  catch { return []; }
};
const saveSubtasks = (taskId: number, subtasks: SubTask[]) => {
  localStorage.setItem(STORAGE_KEY(taskId), JSON.stringify(subtasks));
};
const calcProgression = (subtasks: SubTask[]): number => {
  if (subtasks.length === 0) return 0;
  return Math.round((subtasks.filter(s => s.termine).length / subtasks.length) * 100);
};

// ===================== COMPONENT =====================
export default function TasksList() {
  const { isChef, token, user } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const highlightTaskId = searchParams.get('highlight');

  const [tasks, setTasks]         = useState<Task[]>([]);
  const [projects, setProjects]   = useState<Project[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [highlightedTask, setHighlightedTask] = useState<number | null>(null);
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);

  // Modal états
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showEditCommentModal, setShowEditCommentModal] = useState(false);
  const [selectedTask, setSelectedTask]       = useState<Task | null>(null);
  const [formError, setFormError]             = useState('');
  const [formLoading, setFormLoading]         = useState(false);
  const [editError, setEditError]             = useState('');
  const [editLoading, setEditLoading]         = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [newComment, setNewComment]           = useState('');
  const [editingComment, setEditingComment]   = useState<Comment | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [tempStatut, setTempStatut]           = useState('');
  const [tempProgression, setTempProgression] = useState(0);
  const [editForm, setEditForm]               = useState<Task | null>(null);
  const [form, setForm] = useState({
    titre: '', description: '', projet_id: '', assigne_a: '',
    priorite: 'moyenne', date_debut: '', date_echeance: '',
  });

  // ── Subtasks state ────────────────────────────────────
  const [subtasks, setSubtasks]         = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // ── Fetch ─────────────────────────────────────────────
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API_URL}/projets/taches/mes-taches`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) setTasks(d.taches);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchProjects = async () => {
    try {
      const r = await fetch(`${API_URL}/projets`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) setProjects(d.projets);
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const r = await fetch(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.users) setUsersList(d.users);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (token) { fetchTasks(); fetchProjects(); fetchUsers(); }
  }, [token]);

  useEffect(() => {
    if (highlightTaskId && tasks.length > 0) {
      const id = Number(highlightTaskId);
      setHighlightedTask(id);
      setTimeout(() => { highlightedRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
      setTimeout(() => { setHighlightedTask(null); window.history.replaceState({}, '', '/tasks'); }, 5000);
    }
  }, [highlightTaskId, tasks]);

  // ── Subtask helpers ───────────────────────────────────
  const loadTaskSubtasks = (taskId: number) => {
    const loaded = loadSubtasks(taskId);
    setSubtasks(loaded);
    // Sync avancement avec subtasks si subtasks existent
    if (loaded.length > 0) {
      const prog = calcProgression(loaded);
      setTempProgression(prog);
      setTempStatut(prog === 100 ? 'termine' : prog > 0 ? 'en_cours' : 'a_faire');
    }
  };

  const addSubtask = () => {
    if (!newSubtaskTitle.trim() || !selectedTask) return;
    const newSt: SubTask = { id: Date.now(), titre: newSubtaskTitle.trim(), termine: false };
    const updated = [...subtasks, newSt];
    setSubtasks(updated);
    saveSubtasks(selectedTask.id, updated);
    setNewSubtaskTitle('');
    syncProgressionFromSubtasks(updated);
  };

  const toggleSubtask = (id: number) => {
    if (!selectedTask) return;
    const updated = subtasks.map(s => s.id === id ? { ...s, termine: !s.termine } : s);
    setSubtasks(updated);
    saveSubtasks(selectedTask.id, updated);
    syncProgressionFromSubtasks(updated);
  };

  const deleteSubtask = (id: number) => {
    if (!selectedTask) return;
    const updated = subtasks.filter(s => s.id !== id);
    setSubtasks(updated);
    saveSubtasks(selectedTask.id, updated);
    syncProgressionFromSubtasks(updated);
  };

  const syncProgressionFromSubtasks = (subs: SubTask[]) => {
    if (subs.length === 0) return;
    const prog = calcProgression(subs);
    setTempProgression(prog);
    setTempStatut(prog === 100 ? 'termine' : prog > 0 ? 'en_cours' : 'a_faire');
  };

  // ── CRUD tasks ────────────────────────────────────────
  const handleCreateTask = async () => {
    if (!form.titre || !form.projet_id || !form.assigne_a || !form.date_echeance) {
      setFormError("Titre, projet, assigné et date d'échéance sont obligatoires."); return;
    }
    setFormLoading(true); setFormError('');
    try {
      const r = await fetch(`${API_URL}/projets/${form.projet_id}/taches`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projet_id: parseInt(form.projet_id), titre: form.titre, description: form.description,
          assigne_a: parseInt(form.assigne_a), priorite: form.priorite,
          date_debut: formatDateForBackend(form.date_debut), date_echeance: formatDateForBackend(form.date_echeance),
        }),
      });
      const d = await r.json();
      if (r.ok && d.success) {
        setShowCreateModal(false);
        setForm({ titre: '', description: '', projet_id: '', assigne_a: '', priorite: 'moyenne', date_debut: '', date_echeance: '' });
        fetchTasks();
      } else { setFormError(d.message || 'Erreur lors de la création'); }
    } catch (e) { setFormError('Erreur de connexion'); } finally { setFormLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      const r = await fetch(`${API_URL}/projets/taches/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok && d.success) { fetchTasks(); if (selectedTask?.id === id) setShowDetailModal(false); }
      else { alert(d.message || 'Erreur suppression'); }
    } catch (e) { alert('Erreur de connexion'); }
  };

  const handleStatusChange = async (taskId: number, newStatut: string) => {
    const prog = newStatut === 'termine' ? 100 : newStatut === 'en_cours' ? 25 : 0;
    try {
      const r = await fetch(`${API_URL}/projets/taches/${taskId}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut, progression: prog }),
      });
      const d = await r.json();
      if (r.ok && d.success) {
        fetchTasks();
        if (selectedTask?.id === taskId) { setTempStatut(newStatut); setTempProgression(prog); }
      } else { alert(d.message || 'Erreur'); }
    } catch (e) { alert('Erreur de connexion'); }
  };

  const handleSaveChanges = async () => {
    if (!selectedTask) return;
    setSaving(true);
    try {
      const r = await fetch(`${API_URL}/projets/taches/${selectedTask.id}/progression`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ progression: tempProgression }),
      });
      if (!r.ok) throw new Error('Erreur sauvegarde');
      // Sync statut aussi
      await fetch(`${API_URL}/projets/taches/${selectedTask.id}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: tempStatut, progression: tempProgression }),
      });
      await fetchTasks();
      const dr = await fetch(`${API_URL}/projets/taches/${selectedTask.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const dd = await dr.json();
      if (dd.success) {
        const t = dd.tache;
        if (t.date_debut) t.date_debut = new Date(t.date_debut).toISOString().split('T')[0];
        if (t.date_echeance) t.date_echeance = new Date(t.date_echeance).toISOString().split('T')[0];
        setSelectedTask(t); setTempStatut(t.statut); setTempProgression(t.progression);
      }
      alert(`✅ Avancement mis à jour : ${tempProgression}%`);
    } catch (e) { alert('❌ Erreur lors de la sauvegarde'); } finally { setSaving(false); }
  };

  const handleAddComment = async (taskId: number) => {
    if (!newComment.trim()) return;
    try {
      const r = await fetch(`${API_URL}/projets/taches/${taskId}/commentaires`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tache_id: taskId, commentaire: newComment.trim() }),
      });
      const d = await r.json();
      if (r.ok && d.success) {
        const dr = await fetch(`${API_URL}/projets/taches/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
        const dd = await dr.json();
        if (dd.success) { setSelectedTask(dd.tache); setTempStatut(dd.tache.statut); setTempProgression(dd.tache.progression); }
        setNewComment('');
      } else { alert(d.message || 'Erreur commentaire'); }
    } catch (e) { alert('Erreur de connexion'); }
  };

  const openEditComment = (c: Comment) => { setEditingComment(c); setEditCommentText(c.texte); setShowEditCommentModal(true); };

  const handleEditComment = async () => {
    if (!editingComment || !editCommentText.trim()) return;
    try {
      const r = await fetch(`${API_URL}/projets/commentaires/${editingComment.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ texte: editCommentText.trim() }),
      });
      const d = await r.json();
      if (r.ok && d.success) {
        const dr = await fetch(`${API_URL}/projets/taches/${selectedTask?.id}`, { headers: { Authorization: `Bearer ${token}` } });
        const dd = await dr.json();
        if (dd.success) { setSelectedTask(dd.tache); }
        setShowEditCommentModal(false); setEditingComment(null); setEditCommentText('');
      }
    } catch (e) { alert('Erreur'); }
  };

  const handleDeleteComment = async (commentId: number, taskId: number) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return;
    try {
      const r = await fetch(`${API_URL}/projets/commentaires/${commentId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok && d.success) {
        const dr = await fetch(`${API_URL}/projets/taches/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
        const dd = await dr.json();
        if (dd.success) { setSelectedTask(dd.tache); }
      }
    } catch (e) { alert('Erreur'); }
  };

  const openDetail = async (taskId: number) => {
    try {
      const r = await fetch(`${API_URL}/projets/taches/${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) {
        const t = d.tache;
        if (t.date_debut) t.date_debut = new Date(t.date_debut).toISOString().split('T')[0];
        if (t.date_echeance) t.date_echeance = new Date(t.date_echeance).toISOString().split('T')[0];
        setSelectedTask(t); setTempStatut(t.statut); setTempProgression(t.progression);
        loadTaskSubtasks(taskId);
        setShowDetailModal(true); setNewComment('');
      }
    } catch (e) { console.error(e); }
  };

  const openEditTask = (task: Task) => { setEditForm({ ...task }); setEditError(''); setShowEditModal(true); };

  const handleEditTask = async () => {
    if (!editForm) return;
    if (!editForm.titre.trim()) { setEditError('Le titre est obligatoire'); return; }
    if (!editForm.date_echeance) { setEditError("La date d'échéance est obligatoire"); return; }
    setEditLoading(true); setEditError('');
    try {
      const r = await fetch(`${API_URL}/projets/taches/${editForm.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: editForm.titre, description: editForm.description, assigne_a: editForm.assigne_a,
          priorite: editForm.priorite, date_debut: formatDateForBackend(editForm.date_debut || ''),
          date_echeance: formatDateForBackend(editForm.date_echeance),
        }),
      });
      const d = await r.json();
      if (r.ok && d.success) { setShowEditModal(false); fetchTasks(); }
      else { setEditError(d.message || 'Erreur modification'); }
    } catch (e) { setEditError('Erreur de connexion'); } finally { setEditLoading(false); }
  };

  const filtered = tasks.filter(t => {
    const matchSearch = t.titre.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.statut === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Subtask progress ring ─────────────────────────────
  const SubtaskRing = ({ done, total }: { done: number; total: number }) => {
    if (total === 0) return null;
    const pct = Math.round((done / total) * 100);
    const r = 14; const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
      <svg width="36" height="36" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="18" cy="18" r={r} fill="none" stroke={T.slate100} strokeWidth="3" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={pct === 100 ? T.green : T.blue600} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray .4s' }} />
        <text x="18" y="18" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="700"
          fill={pct === 100 ? T.green : T.blue600} style={{ transform: 'rotate(90deg)', transformOrigin: '18px 18px' }}>
          {pct}%
        </text>
      </svg>
    );
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ width: 44, height: 44, border: `3px solid ${T.blue100}`, borderTop: `3px solid ${T.blue600}`, borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <p style={{ color: T.slate500, fontWeight: 500, fontSize: 14 }}>Chargement des tâches...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Modal overlay style ───────────────────────────────
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
  };
  const modalStyle: React.CSSProperties = {
    background: T.white, borderRadius: 20, width: '100%',
    boxShadow: '0 24px 64px rgba(0,0,0,.18)', maxHeight: '90vh', overflowY: 'auto',
  };

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .trow:hover td{background:${T.blue50}!important}
        .subtask-row:hover{background:${T.slate50}!important}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes highlightPulse{0%,100%{background:${T.amber50}}50%{background:${T.amberMid}}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .3s ease both}
        input[type=range]{accent-color:${T.blue600};cursor:pointer}
        .subtask-check{transition:all .15s}
        .subtask-check:hover{transform:scale(1.1)}
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: T.blue600, letterSpacing: 1.2, textTransform: 'uppercase' }}>Gestion</p>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: T.slate900, letterSpacing: '-0.5px' }}>Mes tâches</h1>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: T.slate500 }}>{tasks.length} tâches au total</p>
        </div>
        {isChef && (
          <button onClick={() => { setShowCreateModal(true); setFormError(''); }}
            style={{ padding: '10px 20px', background: `linear-gradient(135deg, ${T.navy950}, ${T.blue600})`, color: T.white, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 14px ${T.blue600}44` }}>
            + Nouvelle tâche
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input type="text" placeholder="Rechercher une tâche..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputSx, maxWidth: 280 }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ ...inputSx, width: 'auto', cursor: 'pointer' }}>
          <option value="all">Tous les statuts</option>
          <option value="a_faire">À faire</option>
          <option value="en_cours">En cours</option>
          <option value="termine">Terminé</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.slate100}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.slate50, borderBottom: `1px solid ${T.slate100}` }}>
                {['Tâche', 'Projet', isChef ? 'Assigné à' : 'Chef', 'Priorité', 'Statut', 'Avancement', 'Échéance', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 700, color: T.slate500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.6px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const sc = statusStyle[t.statut] || { bg: T.slate100, color: T.slate500 };
                const pc = priorityStyle[t.priorite] || { bg: T.slate100, color: T.slate500 };
                const isHighlighted = highlightedTask === t.id;
                const taskSubtasks = loadSubtasks(t.id);
                const hasSubs = taskSubtasks.length > 0;
                const subsDone = taskSubtasks.filter(s => s.termine).length;
                return (
                  <tr key={t.id} ref={isHighlighted ? highlightedRowRef : null} className="trow"
                    style={{ borderBottom: `1px solid ${T.slate50}`, animation: isHighlighted ? 'highlightPulse 1s ease 3' : 'none' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <p style={{ fontWeight: 700, color: T.slate900, margin: 0, cursor: 'pointer' }} onClick={() => openDetail(t.id)}>{t.titre}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 10, color: T.slate400 }}>T-{t.id}</span>
                        {hasSubs && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: T.blue600, background: T.blue50, padding: '1px 6px', borderRadius: 20 }}>
                            {subsDone}/{taskSubtasks.length} sous-tâches
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <Link to={`/projects/${t.projet_id}`} style={{ color: T.blue600, fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
                        {t.nom_projet || '—'}
                      </Link>
                    </td>
                    <td style={{ padding: '13px 16px', color: T.slate600, fontSize: 13 }}>
                      {isChef ? (t.assigne_nom || 'Non assigné') : (t.chef_nom || '—')}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: pc.bg, color: pc.color }}>
                        {traduirePriorite(t.priorite)}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <select value={t.statut} onChange={e => handleStatusChange(t.id, e.target.value)}
                        style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: sc.bg, color: sc.color, border: 'none', cursor: 'pointer', outline: 'none' }}>
                        <option value="a_faire">À faire</option>
                        <option value="en_cours">En cours</option>
                        <option value="termine">Terminé</option>
                      </select>
                    </td>
                    <td style={{ padding: '13px 16px', minWidth: 130 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {hasSubs
                          ? <SubtaskRing done={subsDone} total={taskSubtasks.length} />
                          : (
                            <>
                              <div style={{ flex: 1, height: 5, background: T.slate100, borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${t.progression}%`, background: t.progression === 100 ? T.green : T.blue600, borderRadius: 99 }} />
                              </div>
                              <span style={{ fontSize: 11, color: T.slate400, minWidth: 28 }}>{t.progression}%</span>
                            </>
                          )
                        }
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', color: T.slate400, fontSize: 12 }}>
                      {t.date_echeance ? new Date(t.date_echeance).toLocaleDateString('fr-FR') : '—'}
                      {t.alerte === 'en_retard' && <span style={{ color: T.rose, marginLeft: 4 }}>⚠️</span>}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => openDetail(t.id)}
                          style={{ padding: '5px 10px', background: T.blue50, color: T.blue600, border: `1px solid ${T.blue100}`, borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          Détail
                        </button>
                        {isChef && (
                          <>
                            <button onClick={() => openEditTask(t)}
                              style={{ padding: '5px 10px', background: T.green50, color: T.green, border: `1px solid ${T.greenMid}`, borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                              Modifier
                            </button>
                            <button onClick={() => handleDelete(t.id)}
                              style={{ padding: '5px 10px', background: T.rose50, color: T.rose, border: `1px solid ${T.roseMid}`, borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                              Supprimer
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: T.slate400 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                  <p style={{ fontWeight: 600, margin: 0 }}>Aucune tâche trouvée</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== MODAL DÉTAIL ===================== */}
      {showDetailModal && selectedTask && (
        <div style={overlayStyle} onClick={() => setShowDetailModal(false)}>
          <div style={{ ...modalStyle, maxWidth: 640, padding: 28 }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ flex: 1, marginRight: 12 }}>
                <h2 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: T.slate900 }}>{selectedTask.titre}</h2>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: priorityStyle[selectedTask.priorite]?.bg, color: priorityStyle[selectedTask.priorite]?.color }}>
                    {traduirePriorite(selectedTask.priorite)}
                  </span>
                  <span style={{ fontSize: 12, color: T.slate500 }}>Assigné à : <strong style={{ color: T.slate700 }}>{selectedTask.assigne_nom}</strong></span>
                  <span style={{ fontSize: 12, color: T.slate500 }}>Échéance : <strong style={{ color: T.slate700 }}>{new Date(selectedTask.date_echeance).toLocaleDateString('fr-FR')}</strong></span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)}
                style={{ background: T.slate100, border: 'none', borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: 'pointer', color: T.slate500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div style={{ background: T.slate50, borderRadius: 12, padding: '12px 14px', marginBottom: 16, border: `1px solid ${T.slate100}` }}>
                <p style={{ fontSize: 13, color: T.slate600, margin: 0 }}>{selectedTask.description}</p>
              </div>
            )}

            {/* Analyse avancement */}
            {selectedTask.analyse_avancement && (
              <div style={{ background: selectedTask.analyse_avancement.statut_risque === 'en_retard' ? T.rose50 : selectedTask.analyse_avancement.statut_risque === 'deadline_proche' ? T.amber50 : T.green50, borderRadius: 12, padding: '10px 14px', marginBottom: 16, border: `1px solid ${selectedTask.analyse_avancement.statut_risque === 'en_retard' ? T.roseMid : T.amberMid}` }}>
                <p style={{ fontSize: 12, margin: 0, color: T.slate700 }}>📊 {selectedTask.analyse_avancement.conseil}</p>
                <p style={{ fontSize: 11, margin: '4px 0 0', color: T.green }}>Recommandé : {selectedTask.analyse_avancement.avancement_recommande}</p>
              </div>
            )}

            {/* ── SUBTASKS ── */}
            <div style={{ background: T.slate50, borderRadius: 14, padding: 18, marginBottom: 18, border: `1px solid ${T.slate100}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 3, height: 16, background: T.blue600, borderRadius: 99 }} />
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.slate900 }}>
                    Sous-tâches
                  </h3>
                  <span style={{ fontSize: 11, fontWeight: 700, background: T.blue50, color: T.blue600, padding: '2px 8px', borderRadius: 20 }}>
                    {subtasks.filter(s => s.termine).length}/{subtasks.length}
                  </span>
                </div>
                {subtasks.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ height: 6, width: 100, background: T.slate200, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${calcProgression(subtasks)}%`, background: calcProgression(subtasks) === 100 ? T.green : T.blue600, borderRadius: 99, transition: 'width .4s' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: calcProgression(subtasks) === 100 ? T.green : T.blue600 }}>{calcProgression(subtasks)}%</span>
                  </div>
                )}
              </div>

              {/* List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, maxHeight: 200, overflowY: 'auto' }}>
                {subtasks.length === 0 ? (
                  <p style={{ textAlign: 'center', color: T.slate400, fontSize: 12, padding: '12px 0', margin: 0 }}>
                    Aucune sous-tâche — ajoutez-en ci-dessous
                  </p>
                ) : subtasks.map(s => (
                  <div key={s.id} className="subtask-row fu" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: T.white, borderRadius: 10, border: `1px solid ${s.termine ? T.greenMid : T.slate200}`, transition: 'all .15s' }}>
                    <button className="subtask-check" onClick={() => toggleSubtask(s.id)}
                      style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${s.termine ? T.green : T.slate300}`, background: s.termine ? T.green : T.white, color: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: 12, fontWeight: 700 }}>
                      {s.termine ? '✓' : ''}
                    </button>
                    <span style={{ flex: 1, fontSize: 13, color: s.termine ? T.slate400 : T.slate900, fontWeight: s.termine ? 400 : 500, textDecoration: s.termine ? 'line-through' : 'none' }}>
                      {s.titre}
                    </span>
                    <button onClick={() => deleteSubtask(s.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.slate400, fontSize: 14, padding: '2px 4px', borderRadius: 4 }}>✕</button>
                  </div>
                ))}
              </div>

              {/* Add subtask */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={newSubtaskTitle} onChange={e => setNewSubtaskTitle(e.target.value)}
                  placeholder="Nouvelle sous-tâche..."
                  onKeyDown={e => { if (e.key === 'Enter') addSubtask(); }}
                  style={{ ...inputSx, flex: 1, fontSize: 13, padding: '8px 12px' }} />
                <button onClick={addSubtask} disabled={!newSubtaskTitle.trim()}
                  style={{ padding: '8px 16px', background: newSubtaskTitle.trim() ? `linear-gradient(135deg, ${T.navy950}, ${T.blue600})` : T.slate300, color: T.white, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: newSubtaskTitle.trim() ? 'pointer' : 'not-allowed' }}>
                  + Ajouter
                </button>
              </div>

              {subtasks.length > 0 && (
                <p style={{ margin: '8px 0 0', fontSize: 11, color: T.blue600, fontWeight: 600 }}>
                  💡 L'avancement se calcule automatiquement selon vos sous-tâches
                </p>
              )}
            </div>

            {/* ── AVANCEMENT ── */}
            <div style={{ background: T.white, borderRadius: 14, padding: 18, marginBottom: 18, border: `1px solid ${T.slate100}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 3, height: 16, background: T.green, borderRadius: 99 }} />
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.slate900 }}>Avancement de la tâche</h3>
              </div>

              {/* Statut buttons */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.slate500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.6px' }}>Statut</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {[{ value: 'a_faire', label: 'À faire' }, { value: 'en_cours', label: 'En cours' }, { value: 'termine', label: 'Terminé' }].map(s => {
                    const sc = statusStyle[s.value];
                    const active = tempStatut === s.value;
                    return (
                      <button key={s.value} type="button"
                        onClick={() => {
                          if (subtasks.length > 0) return; // subtasks control avancement
                          setTempStatut(s.value);
                          if (s.value === 'termine') setTempProgression(100);
                          else if (s.value === 'en_cours' && tempProgression === 0) setTempProgression(25);
                          else if (s.value === 'a_faire') setTempProgression(0);
                        }}
                        style={{ padding: '8px 4px', borderRadius: 10, border: `2px solid ${active ? sc.color : T.slate200}`, background: active ? sc.bg : T.white, color: active ? sc.color : T.slate500, fontSize: 12, fontWeight: 700, cursor: subtasks.length > 0 ? 'default' : 'pointer', transition: 'all .15s', opacity: subtasks.length > 0 ? .6 : 1 }}>
                        {s.label}
                      </button>
                    );
                  })}
                </div>
                {subtasks.length > 0 && (
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: T.amber, fontWeight: 600 }}>
                    ⚡ Statut géré automatiquement par les sous-tâches
                  </p>
                )}
              </div>

              {/* Progression display */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.slate500, textTransform: 'uppercase', letterSpacing: '.6px' }}>Avancement</label>
                  <span style={{ fontSize: 20, fontWeight: 800, color: tempProgression === 100 ? T.green : T.blue600, letterSpacing: '-1px' }}>{tempProgression}%</span>
                </div>

                {subtasks.length > 0 ? (
                  // Subtask-driven progress bar (not interactive)
                  <div>
                    <div style={{ height: 10, background: T.slate100, borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ height: '100%', width: `${tempProgression}%`, background: tempProgression === 100 ? T.green : T.blue600, borderRadius: 99, transition: 'width .5s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      {subtasks.map(s => (
                        <div key={s.id} style={{ flex: 1, height: 4, background: s.termine ? T.green : T.slate200, borderRadius: 99, margin: '0 1px', transition: 'background .3s' }} title={s.titre} />
                      ))}
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: T.slate500 }}>
                      {subtasks.filter(s => s.termine).length} / {subtasks.length} sous-tâches terminées
                    </p>
                  </div>
                ) : (
                  // Manual slider
                  <div>
                    <input type="range" min={0} max={100} step={1} value={tempProgression}
                      onChange={e => {
                        const v = Number(e.target.value);
                        setTempProgression(v);
                        setTempStatut(v === 100 ? 'termine' : v > 0 ? 'en_cours' : 'a_faire');
                      }}
                      style={{ width: '100%' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.slate400, marginTop: 2 }}>
                      <span>0%</span><span>50%</span><span>100%</span>
                    </div>
                    <div style={{ height: 6, background: T.slate100, borderRadius: 99, overflow: 'hidden', marginTop: 10 }}>
                      <div style={{ height: '100%', width: `${tempProgression}%`, background: tempProgression === 100 ? T.green : T.blue600, borderRadius: 99, transition: 'width .3s' }} />
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: T.slate500 }}>Saisie manuelle :</span>
                      <input type="number" min={0} max={100} value={tempProgression}
                        onChange={e => { const v = Number(e.target.value); setTempProgression(v); setTempStatut(v === 100 ? 'termine' : v > 0 ? 'en_cours' : 'a_faire'); }}
                        style={{ width: 70, padding: '5px 8px', border: `1px solid ${T.slate200}`, borderRadius: 8, fontSize: 12 }} />
                      <span style={{ fontSize: 12, color: T.slate500 }}>%</span>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={handleSaveChanges} disabled={saving}
                style={{ width: '100%', marginTop: 16, padding: '11px', background: saving ? T.slate300 : `linear-gradient(135deg, ${T.navy950}, ${T.blue600})`, color: T.white, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {saving ? '⏳ Enregistrement...' : '💾 Enregistrer les modifications'}
              </button>
            </div>

            {/* ── COMMENTAIRES ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 3, height: 16, background: T.purple ?? T.slate700, borderRadius: 99 }} />
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.slate900 }}>
                  Commentaires ({selectedTask.commentaires?.length || 0})
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14, maxHeight: 240, overflowY: 'auto' }}>
                {selectedTask.commentaires && selectedTask.commentaires.length > 0 ? (
                  selectedTask.commentaires.map(c => (
                    <div key={c.id} style={{ background: T.slate50, borderRadius: 12, padding: '11px 14px', border: `1px solid ${T.slate100}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, background: T.blue600, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white, fontWeight: 700, fontSize: 12 }}>
                            {c.auteur_nom?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: T.blue600 }}>{c.auteur_nom}</span>
                            <span style={{ fontSize: 10, color: T.slate400, marginLeft: 8 }}>
                              {new Date(c.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => openEditComment(c)}
                            style={{ background: T.blue50, border: 'none', color: T.blue600, cursor: 'pointer', fontSize: 11, padding: '3px 7px', borderRadius: 6, fontWeight: 600 }}>Modifier</button>
                          <button onClick={() => handleDeleteComment(c.id, selectedTask.id)}
                            style={{ background: T.rose50, border: 'none', color: T.rose, cursor: 'pointer', fontSize: 11, padding: '3px 7px', borderRadius: 6, fontWeight: 600 }}>Supprimer</button>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: T.slate700, margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>{c.texte}</p>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: 24, background: T.slate50, borderRadius: 12 }}>
                    <span style={{ fontSize: 28 }}>💬</span>
                    <p style={{ color: T.slate400, fontSize: 13, margin: '8px 0 0' }}>Aucun commentaire</p>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                  placeholder="Ajouter un commentaire..." onKeyDown={e => { if (e.key === 'Enter') handleAddComment(selectedTask.id); }}
                  style={{ ...inputSx, flex: 1, fontSize: 13, padding: '9px 12px' }} />
                <button onClick={() => handleAddComment(selectedTask.id)} disabled={!newComment.trim()}
                  style={{ padding: '9px 16px', background: newComment.trim() ? `linear-gradient(135deg, ${T.navy950}, ${T.blue600})` : T.slate300, color: T.white, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: newComment.trim() ? 'pointer' : 'not-allowed' }}>
                  Envoyer
                </button>
              </div>
            </div>

            {isChef && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.slate100}`, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => handleDelete(selectedTask.id)}
                  style={{ padding: '8px 16px', background: T.rose50, color: T.rose, border: `1px solid ${T.roseMid}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  🗑️ Supprimer la tâche
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== MODAL CRÉATION ===================== */}
      {showCreateModal && (
        <div style={overlayStyle} onClick={() => setShowCreateModal(false)}>
          <div style={{ ...modalStyle, maxWidth: 520, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.slate900 }}>Nouvelle tâche</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: T.slate100, border: 'none', borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: 'pointer', color: T.slate500 }}>×</button>
            </div>
            {formError && <div style={{ padding: '10px 14px', background: T.rose50, border: `1px solid ${T.roseMid}`, borderRadius: 8, color: T.rose, fontSize: 13, marginBottom: 16 }}>⚠️ {formError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Titre *', type: 'text', placeholder: 'Ex: Maquette page accueil', key: 'titre' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.slate600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={inputSx} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.slate600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Description</label>
                <textarea placeholder="Décrivez la tâche..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputSx, resize: 'none' }} />
              </div>
              {[
                { label: 'Projet *', key: 'projet_id', options: projects.map(p => ({ value: p.id, label: p.nom_projet })) },
                { label: 'Assigné à *', key: 'assigne_a', options: usersList.map(u => ({ value: u.id, label: `${u.nom_complet}${u.role === 'chef_projet' ? ' (Chef)' : ''}` })) },
                { label: 'Priorité', key: 'priorite', options: [{ value: 'haute', label: 'Haute' }, { value: 'moyenne', label: 'Moyenne' }, { value: 'faible', label: 'Basse' }] },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.slate600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>{f.label}</label>
                  <select value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={{ ...inputSx, cursor: 'pointer' }}>
                    {f.key !== 'priorite' && <option value="">-- Sélectionner --</option>}
                    {f.options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.slate600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Date début</label>
                  <input type="date" value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} style={inputSx} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.slate600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Date échéance *</label>
                  <input type="date" value={form.date_echeance} onChange={e => setForm({ ...form, date_echeance: e.target.value })} style={inputSx} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowCreateModal(false)}
                style={{ flex: 1, padding: '11px', border: `1px solid ${T.slate300}`, borderRadius: 10, background: T.white, color: T.slate600, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleCreateTask} disabled={formLoading}
                style={{ flex: 1, padding: '11px', background: formLoading ? T.slate300 : `linear-gradient(135deg, ${T.navy950}, ${T.blue600})`, color: T.white, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: formLoading ? 'not-allowed' : 'pointer' }}>
                {formLoading ? 'Création...' : 'Créer la tâche'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL MODIFICATION TÂCHE ===================== */}
      {showEditModal && editForm && (
        <div style={overlayStyle} onClick={() => setShowEditModal(false)}>
          <div style={{ ...modalStyle, maxWidth: 520, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.slate900 }}>Modifier la tâche</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: T.slate100, border: 'none', borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: 'pointer', color: T.slate500 }}>×</button>
            </div>
            {editError && <div style={{ padding: '10px 14px', background: T.rose50, border: `1px solid ${T.roseMid}`, borderRadius: 8, color: T.rose, fontSize: 13, marginBottom: 16 }}>⚠️ {editError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.slate600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Titre *</label>
                <input type="text" value={editForm.titre} onChange={e => setEditForm({ ...editForm, titre: e.target.value })} style={inputSx} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.slate600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} style={{ ...inputSx, resize: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.slate600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Assigné à</label>
                <select value={editForm.assigne_a} onChange={e => setEditForm({ ...editForm, assigne_a: parseInt(e.target.value) })} style={{ ...inputSx, cursor: 'pointer' }}>
                  {usersList.map(u => <option key={u.id} value={u.id}>{u.nom_complet}{u.role === 'chef_projet' ? ' (Chef)' : ''}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.slate600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Priorité</label>
                  <select value={editForm.priorite} onChange={e => setEditForm({ ...editForm, priorite: e.target.value })} style={{ ...inputSx, cursor: 'pointer' }}>
                    <option value="haute">Haute</option><option value="moyenne">Moyenne</option><option value="faible">Basse</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.slate600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Date début</label>
                  <input type="date" value={editForm.date_debut || ''} onChange={e => setEditForm({ ...editForm, date_debut: e.target.value })} style={inputSx} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.slate600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Date échéance *</label>
                <input type="date" value={editForm.date_echeance} onChange={e => setEditForm({ ...editForm, date_echeance: e.target.value })} style={inputSx} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowEditModal(false)}
                style={{ flex: 1, padding: '11px', border: `1px solid ${T.slate300}`, borderRadius: 10, background: T.white, color: T.slate600, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleEditTask} disabled={editLoading}
                style={{ flex: 1, padding: '11px', background: editLoading ? T.slate300 : `linear-gradient(135deg, ${T.navy950}, ${T.blue600})`, color: T.white, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: editLoading ? 'not-allowed' : 'pointer' }}>
                {editLoading ? 'Modification...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL MODIFICATION COMMENTAIRE ===================== */}
      {showEditCommentModal && editingComment && (
        <div style={overlayStyle} onClick={() => setShowEditCommentModal(false)}>
          <div style={{ ...modalStyle, maxWidth: 460, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.slate900 }}>Modifier le commentaire</h2>
              <button onClick={() => setShowEditCommentModal(false)} style={{ background: T.slate100, border: 'none', borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: 'pointer', color: T.slate500 }}>×</button>
            </div>
            <textarea value={editCommentText} onChange={e => setEditCommentText(e.target.value)} rows={4} style={{ ...inputSx, resize: 'vertical' }} autoFocus />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setShowEditCommentModal(false)}
                style={{ flex: 1, padding: '11px', border: `1px solid ${T.slate300}`, borderRadius: 10, background: T.white, color: T.slate600, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleEditComment}
                style={{ flex: 1, padding: '11px', background: `linear-gradient(135deg, ${T.navy950}, ${T.blue600})`, color: T.white, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}