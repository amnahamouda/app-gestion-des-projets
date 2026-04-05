import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';




// ===================== INTERFACES =====================
interface Project {
  id: string;
  name: string;
  description: string;
  chef: string;
  chef_id?: number;
  status: string;
  priority: string;
  progress: number;
  startDate: string;
  endDate: string;
  tasks: number;
}

interface User {
  id: number;
  nom_complet: string;
  email: string;
  role: string;
}

const API_URL = 'http://localhost:5000/api';
const members = [
  { id: 'U1', name: 'Amine Belhadj' },
  { id: 'U2', name: 'Sara Mansouri' },
  { id: 'U3', name: 'Karim Ouali' },
  { id: 'U4', name: 'Nadia Bouzid' },
];

// Couleurs
const statusColor: Record<string, { bg: string; color: string }> = {
  'En cours': { bg: '#dbeafe', color: '#1e40af' },
  'Terminé': { bg: '#dcfce7', color: '#166534' },
  'En attente': { bg: '#fef9c3', color: '#854d0e' },
  'Annulé': { bg: '#fee2e2', color: '#991b1b' },
  'en_cours': { bg: '#dbeafe', color: '#1e40af' },
  'termine': { bg: '#dcfce7', color: '#166534' },
  'en_attente': { bg: '#fef9c3', color: '#854d0e' },
};

const priorityColor: Record<string, { bg: string; color: string }> = {
  'Haute': { bg: '#fee2e2', color: '#991b1b' },
  'Moyenne': { bg: '#fef9c3', color: '#854d0e' },
  'Basse': { bg: '#dcfce7', color: '#166534' },
  'haute': { bg: '#fee2e2', color: '#991b1b' },
  'moyenne': { bg: '#fef9c3', color: '#854d0e' },
  'faible': { bg: '#dcfce7', color: '#166534' },
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #e2e8f0', borderRadius: '10px',
  fontSize: '14px', color: '#0f172a',
  background: '#f8fafc', outline: 'none', boxSizing: 'border-box',
};

// Traduction
const traduireStatut = (statut: string): string => {
  const map: Record<string, string> = {
    'en_cours': 'En cours',
    'termine': 'Terminé',
    'en_attente': 'En attente',
    'a_faire': 'À faire',
    'en_retard': 'En retard'
  };
  return map[statut] || statut;
};

const traduirePriorite = (priorite: string): string => {
  const map: Record<string, string> = {
    'critique': 'Critique',
    'haute': 'Haute',
    'moyenne': 'Moyenne',
    'faible': 'Basse'
  };
  return map[priorite] || priorite;
};

export default function ProjectsList() {
  const { isChef, isAdmin, token, user } = useAuth();
  const navigate = useNavigate();
  
  // États
  const [projectsBackend, setProjectsBackend] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Project | null>(null);
  const [editError, setEditError] = useState('');
  
  // États pour le modal de création
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    nom_projet: '',
    description: '',
    chef_projet_id: '',
    date_debut: '',
    date_fin_prevue: '',
    statut: 'en_attente',
    priorite: 'moyenne'
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  // Fusion des projets
  const allProjects: Project[] = [

    ...projectsBackend
  ];

  // ===================== CHARGER LES PROJETS =====================
const fetchProjects = async () => {
  try {
    setLoading(true);
    const response = await fetch(`${API_URL}/projets`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) throw new Error('Erreur chargement');
    
    const data = await response.json();
    console.log('📊 Données reçues:', data); // ✅ LOG
    
    if (data.success) {
      const formattedProjects = data.projets.map((p: any) => {
        // ✅ Prendre la progression directement du backend SANS modification
        let progress = p.progression || 0;
        
        // ✅ Ajouter un log pour voir la valeur
        console.log(`📊 Projet ${p.nom_projet} (ID:${p.id}): progression brute = ${p.progression}, progress final = ${progress}`);
        
        return {
          id: String(p.id),
          name: p.nom_projet,
          description: p.description || '',
          chef: p.chef_nom || 'Non assigné',
          chef_id: p.chef_projet_id,
          status: traduireStatut(p.statut),
          priority: traduirePriorite(p.priorite),
          progress: progress,  // ✅ Utiliser directement la valeur
          startDate: p.date_debut ? new Date(p.date_debut).toISOString().split('T')[0] : '',
          endDate: p.date_fin_prevue ? new Date(p.date_fin_prevue).toISOString().split('T')[0] : '',
          tasks: p.nb_taches || 0
        };
      });
      setProjectsBackend(formattedProjects);
    }
  } catch (error) {
    console.error('Erreur chargement projets:', error);
  } finally {
    setLoading(false);
  }
};
  // ===================== CHARGER LES CHEFS =====================
  const fetchChefs = async () => {
    try {
      const response = await fetch(`${API_URL}/users?role=chef_projet`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Erreur chargement chefs:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
      fetchChefs();
    } else {
      setLoading(false);
    }
  }, [token]);

  // ===================== AUTOMATISATION DE L'AVANCEMENT (CORRIGÉ) =====================
  useEffect(() => {
  if (!editForm) return;
  
  let newProgress = editForm.progress;
  let changed = false;
  
  if (editForm.status === 'Terminé' && editForm.progress !== 100) {
    newProgress = 100;
    changed = true;
  } else if (editForm.status === 'En attente' && editForm.progress > 5) {
    newProgress = 0;
    changed = true;
  } else if (editForm.status === 'Annulé' && editForm.progress !== 0) {
    newProgress = 0;
    changed = true;
  } else if (editForm.status === 'En cours' && editForm.progress === 0) {
    // Si le projet est en cours et avancement = 0, mettre 10%
    newProgress = 10;
    changed = true;
    console.log('📈 Projet en cours, avancement mis à 10%');
  }
  
  if (changed) {
    setEditForm({ ...editForm, progress: newProgress });
  }
}, [editForm?.status]);
  // ===================== CRÉER UN PROJET =====================
  const handleCreateProject = async () => {
    if (!createForm.nom_projet.trim()) {
      setCreateError('Le nom du projet est obligatoire');
      return;
    }
    if (!createForm.date_fin_prevue) {
      setCreateError('La date de fin prévue est obligatoire');
      return;
    }
    if (createForm.date_debut && createForm.date_fin_prevue && 
        new Date(createForm.date_fin_prevue) <= new Date(createForm.date_debut)) {
      setCreateError('La date de fin doit être postérieure à la date de début');
      return;
    }

    setCreateLoading(true);
    setCreateError('');

    try {
      const response = await fetch(`${API_URL}/projets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom_projet: createForm.nom_projet,
          description: createForm.description || null,
          chef_projet_id: createForm.chef_projet_id ? parseInt(createForm.chef_projet_id) : null,
          date_debut: createForm.date_debut || null,
          date_fin_prevue: createForm.date_fin_prevue,
          statut: createForm.statut,
          priorite: createForm.priorite
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowCreateModal(false);
        setCreateForm({
          nom_projet: '',
          description: '',
          chef_projet_id: '',
          date_debut: '',
          date_fin_prevue: '',
          statut: 'en_attente',
          priorite: 'moyenne'
        });
        fetchProjects();
      } else {
        setCreateError(data.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création:', error);
      setCreateError('Erreur de connexion au serveur');
    } finally {
      setCreateLoading(false);
    }
  };

  // ===================== SUPPRIMER UN PROJET =====================
  const handleDelete = async (id: string) => {
    if (!window.confirm('Confirmer la suppression de ce projet ?')) return;
    
    try {
      const response = await fetch(`${API_URL}/projets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        fetchProjects();
      } else {
        alert(data.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur de connexion');
    }
  };

  // ===================== MODIFIER UN PROJET =====================
  const openEdit = (project: Project) => {
    setEditForm({ ...project });
    setEditError('');
    setShowEditModal(true);
  };

 const handleEditSave = async () => {
  if (!editForm) return;
  if (!editForm.name.trim()) { setEditError('Le nom est obligatoire.'); return; }
  if (!editForm.endDate) { setEditError('La date de fin est obligatoire.'); return; }
  if (new Date(editForm.endDate) <= new Date(editForm.startDate)) {
    setEditError('La date de fin doit être après la date de début.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/projets/${editForm.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nom_projet: editForm.name,
        description: editForm.description,
        chef_projet_id: editForm.chef_id || null,
        date_debut: editForm.startDate || null,
        date_fin_prevue: editForm.endDate,
        statut: editForm.status === 'En cours' ? 'en_cours' : 
                editForm.status === 'Terminé' ? 'termine' :
                editForm.status === 'En attente' ? 'en_attente' : 'en_attente',
        priorite: editForm.priority === 'Haute' ? 'haute' :
                  editForm.priority === 'Moyenne' ? 'moyenne' : 'faible',
        progression: editForm.progress  // ← AJOUTER CETTE LIGNE (important!)
      }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      setShowEditModal(false);
      fetchProjects(); // Recharger la liste
    } else {
      setEditError(data.message || 'Erreur lors de la modification');
    }
  } catch (error) {
    console.error('Erreur modification:', error);
    setEditError('Erreur de connexion');
  }
};
  // Filtrage
  const filtered = allProjects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading && token) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Chargement des projets...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>Projets</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>{allProjects.length} projets au total</p>
        </div>
        {(isChef || isAdmin) && (
          <button
            onClick={() => setShowCreateModal(true)}
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
                console.log(`Affichage projet ${p.name}: progress = ${p.progress}`);
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
                          <div style={{ height: '100%', width: `${p.progress}%`,background: p.progress === 100 ? '#16a34a' : '#1d4ed8', borderRadius: '999px' }} />
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

      {/* ===================== MODAL DE CRÉATION ===================== */}
      {showCreateModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '550px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>➕ Nouveau projet</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            {createError && (
              <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '10px', color: '#c53030', fontSize: '13px', marginBottom: '16px' }}>
                ⚠️ {createError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Nom du projet <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={createForm.nom_projet}
                  onChange={(e) => setCreateForm({ ...createForm, nom_projet: e.target.value })}
                  placeholder="Ex: Application Mobile"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  placeholder="Décrivez les objectifs du projet..."
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Chef de projet</label>
                <select
                  value={createForm.chef_projet_id}
                  onChange={(e) => setCreateForm({ ...createForm, chef_projet_id: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Sélectionner un chef de projet</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.nom_complet}</option>
                  ))}
                  {user?.role === 'chef_projet' && (
                    <option value={user.id}>Moi-même ({user.name})</option>
                  )}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Date de début</label>
                  <input
                    type="date"
                    value={createForm.date_debut}
                    onChange={(e) => setCreateForm({ ...createForm, date_debut: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    Date de fin <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={createForm.date_fin_prevue}
                    onChange={(e) => setCreateForm({ ...createForm, date_fin_prevue: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Statut</label>
                  <select
                    value={createForm.statut}
                    onChange={(e) => setCreateForm({ ...createForm, statut: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="en_attente">En attente</option>
                    <option value="en_cours">En cours</option>
                    <option value="termine">Terminé</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Priorité</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {[
                      { value: 'faible', label: 'Basse', color: '#16a34a', bg: '#dcfce7' },
                      { value: 'moyenne', label: 'Moyenne', color: '#f59e0b', bg: '#fef9c3' },
                      { value: 'haute', label: 'Haute', color: '#ef4444', bg: '#fee2e2' },
                    ].map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setCreateForm({ ...createForm, priorite: p.value })}
                        style={{
                          padding: '8px', borderRadius: '8px', border: `2px solid ${createForm.priorite === p.value ? p.color : '#e2e8f0'}`,
                          background: createForm.priorite === p.value ? p.bg : '#f8fafc',
                          color: createForm.priorite === p.value ? p.color : '#64748b',
                          fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '8px 0 0 0' }}>
                * Champs obligatoires
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ flex: 1, padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fff', color: '#475569', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={handleCreateProject}
                disabled={createLoading}
                style={{ flex: 1, padding: '12px', background: createLoading ? '#94a3b8' : 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: createLoading ? 'not-allowed' : 'pointer' }}
              >
                {createLoading ? 'Création...' : '✅ Créer le projet'}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Nom du projet <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => p ? { ...p, name: e.target.value } : p)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => p ? { ...p, description: e.target.value } : p)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>

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
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      console.log('🔄 Changement de statut vers:', newStatus);
                      setEditForm((p) => p ? { ...p, status: newStatus } : p);
                    }}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="En attente">En attente</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                    <option value="Annulé">Annulé</option>
                  </select>
                </div>
              </div>

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
                  />
                </div>
              </div>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
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