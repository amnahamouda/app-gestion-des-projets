import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';

// ===================== INTERFACES =====================
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
}

interface Project {
  id: number;
  nom_projet: string;
}

interface User {
  id: number;
  nom_complet: string;
  email: string;
  role: string;
}

const API_URL = 'http://localhost:5000/api';

// Couleurs
const statusColor: Record<string, { bg: string; color: string }> = {
  'a_faire': { bg: '#f1f5f9', color: '#475569' },
  'en_cours': { bg: '#dbeafe', color: '#1e40af' },
  'termine': { bg: '#dcfce7', color: '#166534' },
};

const priorityColor: Record<string, { bg: string; color: string }> = {
  'haute': { bg: '#fee2e2', color: '#991b1b' },
  'moyenne': { bg: '#fef9c3', color: '#854d0e' },
  'faible': { bg: '#dcfce7', color: '#166534' },
};

// Traductions
const traduireStatut = (statut: string): string => {
  const map: Record<string, string> = {
    'a_faire': 'À faire',
    'en_cours': 'En cours',
    'termine': 'Terminé'
  };
  return map[statut] || statut;
};

const traduirePriorite = (priorite: string): string => {
  const map: Record<string, string> = {
    'haute': 'Haute',
    'moyenne': 'Moyenne',
    'faible': 'Basse'
  };
  return map[priorite] || priorite;
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #e2e8f0', borderRadius: '10px',
  fontSize: '14px', color: '#0f172a',
  background: '#f8fafc', outline: 'none', boxSizing: 'border-box',
};

const formatDateForBackend = (dateString: string): string | null => {
  if (!dateString) return null;
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString;
  return new Date(dateString).toISOString().split('T')[0];
};

export default function TasksList() {
  const { isChef, token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Récupérer l'ID de la tâche à mettre en évidence depuis l'URL
  const searchParams = new URLSearchParams(location.search);
  const highlightTaskId = searchParams.get('highlight');
  
  // ===================== ÉTATS PRINCIPAUX =====================
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // États pour la mise en évidence
  const [highlightedTask, setHighlightedTask] = useState<number | null>(null);
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);
  
  // ===================== ÉTATS MODAL CRÉATION =====================
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    titre: '',
    description: '',
    projet_id: '',
    assigne_a: '',
    priorite: 'moyenne',
    date_debut: '',
    date_echeance: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  
  // ===================== ÉTATS MODAL DÉTAIL =====================
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');
  
  // ===================== ÉTATS POUR LA MODIFICATION TEMPORAIRE =====================
  const [tempStatut, setTempStatut] = useState<string>('');
  const [tempProgression, setTempProgression] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  
  // ===================== ÉTATS MODAL MODIFICATION TÂCHE =====================
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Task | null>(null);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  
  // ===================== ÉTATS MODAL MODIFICATION COMMENTAIRE =====================
  const [showEditCommentModal, setShowEditCommentModal] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  useEffect(() => {
    if (highlightTaskId && tasks.length > 0) {
      const taskId = Number(highlightTaskId);
      setHighlightedTask(taskId);
      
      // Faire défiler jusqu'à la tâche après un petit délai
      setTimeout(() => {
        if (highlightedRowRef.current) {
          highlightedRowRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
      
      // Enlever le paramètre de l'URL après 5 secondes
      setTimeout(() => {
        setHighlightedTask(null);
        window.history.replaceState({}, '', '/tasks');
      }, 5000);
    }
  }, [highlightTaskId, tasks]);
  
  // ===================== CHARGER LES TÂCHES =====================
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/projets/taches/mes-taches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.taches);
      }
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===================== CHARGER LES PROJETS =====================
  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/projets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProjects(data.projets);
      }
    } catch (error) {
      console.error('Erreur chargement projets:', error);
    }
  };

  // ===================== CHARGER LES UTILISATEURS =====================
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.users) {
        setUsersList(data.users);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTasks();
      fetchProjects();
      fetchUsers();
    }
  }, [token]);

  // ===================== CRÉER UNE TÂCHE =====================
  const handleCreateTask = async () => {
    if (!form.titre || !form.projet_id || !form.assigne_a || !form.date_echeance) {
      setFormError('Titre, projet, assigné et date d\'échéance sont obligatoires.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const response = await fetch(`${API_URL}/projets/${form.projet_id}/taches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projet_id: parseInt(form.projet_id),
          titre: form.titre,
          description: form.description,
          assigne_a: parseInt(form.assigne_a),
          priorite: form.priorite,
          date_debut: formatDateForBackend(form.date_debut),
          date_echeance: formatDateForBackend(form.date_echeance)
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowCreateModal(false);
        setForm({
          titre: '',
          description: '',
          projet_id: '',
          assigne_a: '',
          priorite: 'moyenne',
          date_debut: '',
          date_echeance: ''
        });
        fetchTasks();
      } else {
        setFormError(data.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création:', error);
      setFormError('Erreur de connexion');
    } finally {
      setFormLoading(false);
    }
  };

  // ===================== SUPPRIMER UNE TÂCHE =====================
  const handleDelete = async (id: number) => {
    if (!window.confirm('Confirmer la suppression de cette tâche ?')) return;
    
    try {
      const response = await fetch(`${API_URL}/projets/taches/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        fetchTasks();
        if (selectedTask?.id === id) setShowDetailModal(false);
      } else {
        alert(data.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur de connexion');
    }
  };

  // ===================== METTRE À JOUR LE STATUT =====================
  const handleStatusChange = async (taskId: number, newStatut: string) => {
    console.log("🔄 Tentative de changement statut - Tâche:", taskId, "Nouveau statut:", newStatut);
    
    // ✅ Déterminer la progression automatique selon le statut
    let newProgression = 0;
    if (newStatut === 'termine') {
      newProgression = 100;
    } else if (newStatut === 'en_cours') {
      newProgression = 25;
    } else if (newStatut === 'a_faire') {
      newProgression = 0;
    }
    
    try {
      // Mettre à jour le statut
      const response = await fetch(`${API_URL}/projets/taches/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statut: newStatut, progression: newProgression })
      });

      const data = await response.json();
      console.log("📡 Réponse backend:", data);
      
      if (response.ok && data.success) {
        console.log("✅ Statut modifié avec succès");
        fetchTasks(); // Recharger la liste
        if (selectedTask?.id === taskId) {
          setSelectedTask(prev => prev ? { ...prev, statut: newStatut, progression: newProgression } : prev);
          setTempStatut(newStatut);
          setTempProgression(newProgression);
        }
      } else {
        console.log("❌ Erreur:", data.message);
        alert(data.message || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      alert('Erreur de connexion');
    }
  };

  // ===================== SAUVEGARDER L'AVANCEMENT (CALCUL AUTOMATIQUE) =====================
  const handleSaveChanges = async () => {
    if (!selectedTask) return;
    
    setSaving(true);
    
    try {
      // ✅ Calculer le nouveau statut basé sur la progression
      let newStatut = selectedTask.statut;
      let message = "";
      
      if (tempProgression === 100) {
        newStatut = 'termine';
        message = "🎉 Tâche terminée !";
      } else if (tempProgression > 0 && tempProgression < 100) {
        newStatut = 'en_cours';
        message = `📝 En cours (${tempProgression}%)`;
      } else if (tempProgression === 0) {
        newStatut = 'a_faire';
        message = "📋 À faire";
      }
      
      // Envoyer la mise à jour de progression
      const response = await fetch(`${API_URL}/projets/taches/${selectedTask.id}/progression`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progression: tempProgression })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }
      
      const data = await response.json();
      console.log("📡 Réponse backend:", data);
      
      // Recharger les données
      await fetchTasks();
      
      // Recharger les détails de la tâche
      const detailResponse = await fetch(`${API_URL}/projets/taches/${selectedTask.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const detailData = await detailResponse.json();
      if (detailData.success) {
        const tache = detailData.tache;
        if (tache.date_debut) {
          tache.date_debut = new Date(tache.date_debut).toISOString().split('T')[0];
        }
        if (tache.date_echeance) {
          tache.date_echeance = new Date(tache.date_echeance).toISOString().split('T')[0];
        }
        setSelectedTask(tache);
        setTempStatut(tache.statut);
        setTempProgression(tache.progression);
      }
      
      // Afficher un message de succès
      alert(`✅ Avancement mis à jour : ${tempProgression}%\n${message}`);
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ===================== AJOUTER UN COMMENTAIRE =====================
  const handleAddComment = async (taskId: number) => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`${API_URL}/projets/taches/${taskId}/commentaires`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tache_id: taskId,
          commentaire: newComment.trim()
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const detailResponse = await fetch(`${API_URL}/projets/taches/${taskId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const detailData = await detailResponse.json();
        if (detailData.success) {
          setSelectedTask(detailData.tache);
          setTempStatut(detailData.tache.statut);
          setTempProgression(detailData.tache.progression);
        }
        setNewComment('');
      } else {
        alert(data.message || 'Erreur lors de l\'ajout du commentaire');
      }
    } catch (error) {
      console.error('Erreur ajout commentaire:', error);
      alert('Erreur de connexion');
    }
  };

  // ===================== MODIFIER UN COMMENTAIRE =====================
  const openEditComment = (comment: Comment) => {
    setEditingComment(comment);
    setEditCommentText(comment.texte);
    setShowEditCommentModal(true);
  };

  const handleEditComment = async () => {
    if (!editingComment) return;
    if (!editCommentText.trim()) return;

    try {
      const response = await fetch(`${API_URL}/projets/commentaires/${editingComment.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ texte: editCommentText.trim() })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const detailResponse = await fetch(`${API_URL}/projets/taches/${selectedTask?.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const detailData = await detailResponse.json();
        if (detailData.success) {
          setSelectedTask(detailData.tache);
          setTempStatut(detailData.tache.statut);
          setTempProgression(detailData.tache.progression);
        }
        setShowEditCommentModal(false);
        setEditingComment(null);
        setEditCommentText('');
      } else {
        alert(data.message || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur modification commentaire:', error);
      alert('Erreur de connexion');
    }
  };

  // ===================== SUPPRIMER UN COMMENTAIRE =====================
  const handleDeleteComment = async (commentId: number, taskId: number) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return;
    
    try {
      const response = await fetch(`${API_URL}/projets/commentaires/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        const detailResponse = await fetch(`${API_URL}/projets/taches/${taskId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const detailData = await detailResponse.json();
        if (detailData.success) {
          setSelectedTask(detailData.tache);
          setTempStatut(detailData.tache.statut);
          setTempProgression(detailData.tache.progression);
        }
      }
    } catch (error) {
      console.error('Erreur suppression commentaire:', error);
      alert('Erreur de connexion');
    }
  };

  // ===================== OUVRIRE LES DÉTAILS =====================
  const openDetail = async (taskId: number) => {
    try {
      const response = await fetch(`${API_URL}/projets/taches/${taskId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const tache = data.tache;
        if (tache.date_debut) {
          tache.date_debut = new Date(tache.date_debut).toISOString().split('T')[0];
        }
        if (tache.date_echeance) {
          tache.date_echeance = new Date(tache.date_echeance).toISOString().split('T')[0];
        }
        setSelectedTask(tache);
        setTempStatut(tache.statut);
        setTempProgression(tache.progression);
        setShowDetailModal(true);
        setNewComment('');
      }
    } catch (error) {
      console.error('Erreur chargement détails:', error);
    }
  };

  // ===================== MODIFIER UNE TÂCHE =====================
  const openEditTask = (task: Task) => {
    setEditForm({ ...task });
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditTask = async () => {
    if (!editForm) return;
    if (!editForm.titre.trim()) {
      setEditError('Le titre est obligatoire');
      return;
    }
    if (!editForm.date_echeance) {
      setEditError('La date d\'échéance est obligatoire');
      return;
    }

    setEditLoading(true);
    setEditError('');

    try {
      const response = await fetch(`${API_URL}/projets/taches/${editForm.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titre: editForm.titre,
          description: editForm.description,
          assigne_a: editForm.assigne_a,
          priorite: editForm.priorite,
          date_debut: formatDateForBackend(editForm.date_debut || ''),
          date_echeance: formatDateForBackend(editForm.date_echeance)
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowEditModal(false);
        fetchTasks();
      } else {
        setEditError(data.message || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur modification:', error);
      setEditError('Erreur de connexion');
    } finally {
      setEditLoading(false);
    }
  };

  // Filtrage
  const filtered = tasks.filter((t) => {
    const matchSearch = t.titre.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.statut === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Chargement des tâches...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ===================== HEADER ===================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>📋 Tâches</h1>
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

      {/* ===================== FILTRES ===================== */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Rechercher une tâche..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, maxWidth: '280px' }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fff', cursor: 'pointer' }}
        >
          <option value="all">Tous les statuts</option>
          <option value="a_faire">À faire</option>
          <option value="en_cours">En cours</option>
          <option value="termine">Terminé</option>
        </select>
      </div>

      {/* ===================== TABLEAU DES TÂCHES ===================== */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '13px' }}>Tâche</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '13px' }}>Projet</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '13px' }}>
                  {isChef ? 'Assigné à' : 'Chef de projet'}
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '13px' }}>Priorité</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '13px' }}>Statut</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '13px' }}>Avancement</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '13px' }}>Échéance</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '13px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const sc = statusColor[t.statut] || { bg: '#f1f5f9', color: '#475569' };
                const pc = priorityColor[t.priorite] || { bg: '#f1f5f9', color: '#475569' };
                const isHighlighted = highlightedTask === t.id;
                return (
                  <tr 
                    key={t.id} 
                    ref={isHighlighted ? highlightedRowRef : null}
                    style={{ 
                      borderBottom: '1px solid #f1f5f9',
                      background: isHighlighted ? '#fef9c3' : 'transparent',
                      animation: isHighlighted ? 'highlightPulse 1s ease-in-out 3' : 'none',
                      transition: 'all 0.3s ease',
                      transform: isHighlighted ? 'scale(1.01)' : 'scale(1)',
                      boxShadow: isHighlighted ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, cursor: 'pointer' }} onClick={() => openDetail(t.id)}>{t.titre}</p>
                      <p style={{ color: '#94a3b8', fontSize: '11px', margin: '2px 0 0 0' }}>T-{t.id} · {t.commentaires?.length || 0} commentaire(s)</p>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <Link to={`/projects/${t.projet_id}`} style={{ color: '#1e40af', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>
                        {t.nom_projet || 'Chargement...'}
                      </Link>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>
                      {isChef ? (
                        t.assigne_nom || 'Non assigné'
                      ) : (
                        t.chef_nom || 'Chef non trouvé'
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: pc.bg, color: pc.color }}>
                        {traduirePriorite(t.priorite)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={t.statut}
                        onChange={(e) => {
                          const newStatut = e.target.value;
                          if (selectedTask?.id === t.id) {
                            setTempStatut(newStatut);
                          }
                          handleStatusChange(t.id, newStatut);
                        }}
                        style={{ fontSize: '12px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', background: sc.bg, color: sc.color, border: 'none', cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="a_faire">À faire</option>
                        <option value="en_cours">En cours</option>
                        <option value="termine">Terminé</option>
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px', minWidth: '120px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${t.progression}%`, background: t.progression === 100 ? '#16a34a' : '#1d4ed8', borderRadius: '999px' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{t.progression}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>
                      {t.date_echeance ? new Date(t.date_echeance).toLocaleDateString() : '—'}
                      {t.alerte === 'en_retard' && <span style={{ color: '#ef4444', marginLeft: '4px' }}>⚠️</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => openDetail(t.id)}
                          style={{ padding: '5px 10px', background: '#eff6ff', color: '#1e40af', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          📋 Détail
                        </button>
                        {isChef && (
                          <>
                            <button
                              onClick={() => openEditTask(t)}
                              style={{ padding: '5px 10px', background: '#f0fdf4', color: '#166534', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              ✏️ Modifier
                            </button>
                            <button
                              onClick={() => handleDelete(t.id)}
                              style={{ padding: '5px 10px', background: '#fff1f2', color: '#be123c', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            >
                              🗑️ Supprimer
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

      <style>{`
        @keyframes highlightPulse {
          0% {
            background-color: #fef9c3;
            transform: scale(1);
          }
          50% {
            background-color: #fde047;
            transform: scale(1.02);
          }
          100% {
            background-color: #fef9c3;
            transform: scale(1);
          }
        }
      `}</style>

      {/* ===================== MODAL DE CRÉATION ===================== */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowCreateModal(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '520px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>➕ Nouvelle tâche</h2>
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
                <input type="text" placeholder="Ex: Maquette page accueil" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Description</label>
                <textarea placeholder="Décrivez la tâche..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Projet <span style={{ color: '#ef4444' }}>*</span></label>
                <select value={form.projet_id} onChange={(e) => setForm({ ...form, projet_id: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">-- Sélectionner --</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.nom_projet}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Assigné à <span style={{ color: '#ef4444' }}>*</span></label>
                <select value={form.assigne_a} onChange={(e) => setForm({ ...form, assigne_a: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">-- Sélectionner --</option>
                  {usersList.map((u) => <option key={u.id} value={u.id}>{u.nom_complet} {u.role === 'chef_projet' ? '(Chef)' : ''}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Priorité</label>
                  <select value={form.priorite} onChange={(e) => setForm({ ...form, priorite: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="haute">Haute</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="faible">Basse</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Date de début</label>
                  <input type="date" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Date d'échéance <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="date" value={form.date_echeance} onChange={(e) => setForm({ ...form, date_echeance: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
              <button onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '11px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fff', color: '#475569', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleCreateTask} disabled={formLoading} style={{ flex: 1, padding: '11px', background: formLoading ? '#94a3b8' : 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: formLoading ? 'not-allowed' : 'pointer' }}>
                {formLoading ? 'Création...' : '✅ Créer la tâche'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL DÉTAIL TÂCHE ===================== */}
      {showDetailModal && selectedTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowDetailModal(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '580px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>

            {/* En-tête */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>{selectedTask.titre}</h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: priorityColor[selectedTask.priorite]?.bg || '#f1f5f9', color: priorityColor[selectedTask.priorite]?.color || '#475569' }}>
                    {traduirePriorite(selectedTask.priorite)}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Assigné à : <strong>{selectedTask.assigne_nom}</strong></span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Échéance : <strong>{new Date(selectedTask.date_echeance).toLocaleDateString()}</strong></span>
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
            
            {/* Analyse avancement */}
            {selectedTask.analyse_avancement && (
              <div style={{ 
                background: selectedTask.analyse_avancement.statut_risque === 'en_retard' ? '#fee2e2' : 
                           selectedTask.analyse_avancement.statut_risque === 'deadline_proche' ? '#fef9c3' : '#f0fdf4', 
                borderRadius: '10px', 
                padding: '10px 14px', 
                marginBottom: '16px' 
              }}>
                <p style={{ fontSize: '12px', margin: 0, color: '#374151' }}>
                  📊 {selectedTask.analyse_avancement.conseil}
                </p>
                <p style={{ fontSize: '11px', margin: '4px 0 0 0', color: '#15803d' }}>
                  Avancement recommandé : {selectedTask.analyse_avancement.avancement_recommande}
                </p>
              </div>
            )}

            {/* ===================== SECTION STATUT & AVANCEMENT ===================== */}
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: '0 0 12px 0' }}>📊 Avancement de la tâche</h3>
              
              {/* Statut - Boutons */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Statut</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { value: 'a_faire', label: 'À faire' },
                    { value: 'en_cours', label: 'En cours' },
                    { value: 'termine', label: 'Terminé' }
                  ].map((s) => {
                    const sc = statusColor[s.value];
                    const isActive = tempStatut === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => {
                          setTempStatut(s.value);
                          // Mettre à jour la progression selon le statut
                          let newProgression = tempProgression;
                          if (s.value === 'termine') newProgression = 100;
                          else if (s.value === 'en_cours' && tempProgression === 0) newProgression = 25;
                          else if (s.value === 'a_faire') newProgression = 0;
                          setTempProgression(newProgression);
                        }}
                        style={{
                          padding: '8px 4px', borderRadius: '8px', border: `2px solid ${isActive ? sc.color : '#e2e8f0'}`,
                          background: isActive ? sc.bg : '#fff',
                          color: isActive ? sc.color : '#64748b',
                          fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Avancement - Slider */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  Avancement : {tempProgression}%
                </label>
                
                {/* Barre de recommandation */}
                {selectedTask.analyse_avancement && (
                  <div style={{ marginBottom: '4px' }}>
                    <div style={{ 
                      height: '4px', 
                      background: '#e2e8f0', 
                      borderRadius: '999px',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: `${parseInt(selectedTask.analyse_avancement.avancement_recommande)}%`,
                        width: '2px',
                        height: '12px',
                        background: '#f59e0b',
                        borderRadius: '999px',
                        top: '-4px',
                        transform: 'translateX(-50%)'
                      }} />
                    </div>
                    <p style={{ fontSize: '10px', color: '#f59e0b', margin: '2px 0 0 0' }}>
                      📍 Recommandé: {selectedTask.analyse_avancement.avancement_recommande}
                    </p>
                  </div>
                )}
                
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={tempProgression}
                  onChange={(e) => {
                    const newProgress = Number(e.target.value);
                    setTempProgression(newProgress);
                    // Mettre à jour le statut automatiquement selon la progression
                    if (newProgress === 100) {
                      setTempStatut('termine');
                    } else if (newProgress > 0 && newProgress < 100) {
                      setTempStatut('en_cours');
                    } else if (newProgress === 0) {
                      setTempStatut('a_faire');
                    }
                  }}
                  style={{ width: '100%', accentColor: '#1d4ed8' }}
                />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>0%</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>50%</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>100%</span>
                </div>
                
                {/* Barre de progression visuelle */}
                <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginTop: '12px' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${tempProgression}%`, 
                    background: tempProgression === 100 ? '#16a34a' : '#1d4ed8', 
                    borderRadius: '999px',
                    transition: 'width 0.3s'
                  }} />
                </div>
                
                {/* Input numérique */}
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Ou saisir :</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={tempProgression}
                    onChange={(e) => {
                      const newProgress = Number(e.target.value);
                      setTempProgression(newProgress);
                      if (newProgress === 100) {
                        setTempStatut('termine');
                      } else if (newProgress > 0 && newProgress < 100) {
                        setTempStatut('en_cours');
                      } else if (newProgress === 0) {
                        setTempStatut('a_faire');
                      }
                    }}
                    style={{ width: '80px', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <span style={{ fontSize: '12px', color: '#64748b' }}>%</span>
                </div>
              </div>

              {/* Bouton Enregistrer */}
              <div style={{ marginTop: '16px' }}>
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: saving ? '#94a3b8' : 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {saving ? '⏳ Enregistrement...' : '💾 Enregistrer les modifications'}
                </button>
              </div>
            </div>
            
            {/* ===================== SECTION COMMENTAIRES ===================== */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  💬 Commentaires ({selectedTask.commentaires?.length || 0})
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                {selectedTask.commentaires && selectedTask.commentaires.length > 0 ? (
                  selectedTask.commentaires.map((c) => {
                    return (
                      <div key={c.id} style={{ 
                        background: '#f8fafc', 
                        borderRadius: '12px', 
                        padding: '12px 14px', 
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              background: '#1e3a8a',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontWeight: 'bold',
                              fontSize: '12px'
                            }}>
                              {c.auteur_nom?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>{c.auteur_nom}</span>
                              <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '8px' }}>
                                {new Date(c.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => openEditComment(c)}
                              style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontSize: '12px', padding: '2px 4px' }}
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteComment(c.id, selectedTask.id)}
                              style={{ background: 'none', border: 'none', color: '#be123c', cursor: 'pointer', fontSize: '12px', padding: '2px 4px' }}
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <p style={{ fontSize: '13px', color: '#1e293b', margin: '6px 0 0 0', lineHeight: '1.4', wordBreak: 'break-word' }}>
                          {c.texte}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '10px' }}>
                    <span style={{ fontSize: '28px' }}>💬</span>
                    <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '8px' }}>Aucun commentaire</p>
                    <p style={{ color: '#cbd5e1', fontSize: '11px' }}>Soyez le premier à commenter !</p>
                  </div>
                )}
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
                />
                <button 
                  onClick={() => handleAddComment(selectedTask.id)} 
                  disabled={!newComment.trim()}
                  style={{ 
                    padding: '10px 16px', 
                    background: newComment.trim() ? 'linear-gradient(135deg, #1e3a8a, #1d4ed8)' : '#94a3b8',
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '10px', 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                    flexShrink: 0 
                  }}
                >
                  Envoyer 📨
                </button>
              </div>
              <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>
                ⚡ Appuyez sur Entrée pour envoyer
              </p>
            </div>

            {/* Bouton Supprimer (chef uniquement) */}
            {isChef && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => handleDelete(selectedTask.id)} style={{ padding: '8px 16px', background: '#fff1f2', color: '#be123c', border: '1.5px solid #fecdd3', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  🗑️ Supprimer la tâche
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== MODAL MODIFICATION TÂCHE ===================== */}
      {showEditModal && editForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowEditModal(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '520px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>✏️ Modifier la tâche</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            {editError && (
              <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '10px', color: '#c53030', fontSize: '13px', marginBottom: '16px' }}>
                ⚠️ {editError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Titre <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" value={editForm.titre} onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Description</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Assigné à</label>
                <select value={editForm.assigne_a} onChange={(e) => setEditForm({ ...editForm, assigne_a: parseInt(e.target.value) })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>{u.nom_complet} {u.role === 'chef_projet' ? '(Chef)' : ''}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Priorité</label>
                  <select value={editForm.priorite} onChange={(e) => setEditForm({ ...editForm, priorite: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="haute">Haute</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="faible">Basse</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Date de début</label>
                  <input type="date" value={editForm.date_debut || ''} onChange={(e) => setEditForm({ ...editForm, date_debut: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Date d'échéance <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="date" value={editForm.date_echeance} onChange={(e) => setEditForm({ ...editForm, date_echeance: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
              <button onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '11px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fff', color: '#475569', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleEditTask} disabled={editLoading} style={{ flex: 1, padding: '11px', background: editLoading ? '#94a3b8' : 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: editLoading ? 'not-allowed' : 'pointer' }}>
                {editLoading ? 'Modification...' : '💾 Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL MODIFICATION COMMENTAIRE ===================== */}
      {showEditCommentModal && editingComment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowEditCommentModal(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>✏️ Modifier le commentaire</h2>
              <button onClick={() => setShowEditCommentModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Commentaire</label>
              <textarea
                value={editCommentText}
                onChange={(e) => setEditCommentText(e.target.value)}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowEditCommentModal(false)} style={{ flex: 1, padding: '11px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fff', color: '#475569', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleEditComment} style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                💾 Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}