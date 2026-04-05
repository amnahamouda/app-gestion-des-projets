import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

interface Task {
  id: number;
  titre: string;
  description: string;
  assigne_nom: string;
  assigne_id?: number;
  statut: string;
  priorite: string;
  progression: number;
  date_echeance: string;
  date_debut?: string;
  commentaires?: any[];
}

interface TeamMember {
  id: number;
  nom_complet: string;
  email: string;
  role: string;
  taches_count?: number;
}

interface Project {
  id: number;
  nom_projet: string;
  description: string;
  chef_nom: string;
  chef_projet_id: number;
  statut: string;
  priorite: string;
  date_debut: string;
  date_fin_prevue: string;
  progression: number;
  total_taches: number;
  taches_terminees: number;
  taches_retard?: number;
}

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

// Fonctions de traduction
const traduireStatut = (statut: string): string => {
  const map: Record<string, string> = {
    'en_cours': 'en_cours',
    'termine': 'termine',
    'a_faire': 'a_faire',
    'en_attente': 'en_attente'
  };
  return map[statut] || statut;
};

const traduirePriorite = (priorite: string): string => {
  const map: Record<string, string> = {
    'haute': 'haute',
    'moyenne': 'moyenne',
    'faible': 'faible'
  };
  return map[priorite] || priorite;
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { token, user, isChef, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    titre: '',
    description: '',
    assigne_a: '',
    priorite: 'moyenne',
    date_debut: '',
    date_echeance: ''
  });
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState('');

  // Charger les détails du projet
  const fetchProjectDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/projets/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 Détails projet:', data);
      
      if (data.success) {
        setProject({
          id: data.projet.id,
          nom_projet: data.projet.nom_projet,
          description: data.projet.description || '',
          chef_nom: data.projet.chef_nom || 'Non assigné',
          chef_projet_id: data.projet.chef_projet_id,
          statut: traduireStatut(data.projet.statut),
          priorite: traduirePriorite(data.projet.priorite),
          date_debut: data.projet.date_debut ? new Date(data.projet.date_debut).toISOString().split('T')[0] : '',
          date_fin_prevue: data.projet.date_fin_prevue ? new Date(data.projet.date_fin_prevue).toISOString().split('T')[0] : '',
          progression: data.projet.progression || 0,
           total_taches: data.projet.total_taches || 0,
    taches_terminees: data.projet.taches_terminees || 0
        });
      }
    } catch (error) {
      console.error('Erreur chargement projet:', error);
    }
  };

  // Charger les tâches du projet (via la route correcte)
  const fetchTasks = async () => {
    try {
      // ✅ Utiliser la route: /projets/:projetId/taches
      const response = await fetch(`${API_URL}/projets/${id}/taches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 Tâches du projet:', data);
      
      if (data.success) {
        setTasks(data.taches.map((t: any) => ({
          id: t.id,
          titre: t.titre,
          description: t.description || '',
          assigne_nom: t.assigne_nom || 'Non assigné',
          assigne_id: t.assigne_a,
          statut: t.statut,
          priorite: t.priorite,
          progression: t.progression,
          date_echeance: t.date_echeance ? new Date(t.date_echeance).toISOString().split('T')[0] : '',
          date_debut: t.date_debut ? new Date(t.date_debut).toISOString().split('T')[0] : ''
        })));
        
        // Extraire l'équipe unique des tâches
        const uniqueTeam = new Map();
        data.taches.forEach((t: any) => {
          if (t.assigne_a && t.assigne_nom && !uniqueTeam.has(t.assigne_a)) {
            uniqueTeam.set(t.assigne_a, {
              id: t.assigne_a,
              nom_complet: t.assigne_nom,
              email: '',
              role: 'employe'
            });
          }
        });
        setTeam(Array.from(uniqueTeam.values()));
      }
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
    }
  };

  // Créer une tâche
  const handleCreateTask = async () => {
    if (!taskForm.titre.trim()) {
      setTaskError('Le titre est obligatoire');
      return;
    }
    if (!taskForm.assigne_a) {
      setTaskError('Veuillez assigner la tâche');
      return;
    }
    if (!taskForm.date_echeance) {
      setTaskError('La date d\'échéance est obligatoire');
      return;
    }

    setTaskLoading(true);
    setTaskError('');

    try {
      // ✅ Utiliser la route: /projets/:projetId/taches
      const response = await fetch(`${API_URL}/projets/${id}/taches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titre: taskForm.titre,
          description: taskForm.description,
          assigne_a: parseInt(taskForm.assigne_a),
          priorite: taskForm.priorite,
          date_debut: taskForm.date_debut || null,
          date_echeance: taskForm.date_echeance
        }),
      });

      const data = await response.json();
      console.log('📊 Création tâche:', data);

      if (response.ok && data.success) {
        setShowTaskModal(false);
        setTaskForm({
          titre: '',
          description: '',
          assigne_a: '',
          priorite: 'moyenne',
          date_debut: '',
          date_echeance: ''
        });
        fetchTasks();
        fetchProjectDetails();
      } else {
        setTaskError(data.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création tâche:', error);
      setTaskError('Erreur de connexion');
    } finally {
      setTaskLoading(false);
    }
  };

  // Supprimer une tâche
  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Confirmer la suppression de cette tâche ?')) return;
    
    try {
      // ✅ Utiliser la route: /projets/taches/:id
      const response = await fetch(`${API_URL}/projets/taches/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        fetchTasks();
        fetchProjectDetails();
      } else {
        alert(data.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur de connexion');
    }
  };

  // Mettre à jour le statut d'une tâche
  const updateTaskStatus = async (taskId: number, newStatut: string) => {
    try {
      // ✅ Utiliser la route: /projets/taches/:id/status
      const response = await fetch(`${API_URL}/projets/taches/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statut: newStatut })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        fetchTasks();
        fetchProjectDetails();
      }
    } catch (error) {
      console.error('Erreur mise à jour:', error);
    }
  };

  // Mettre à jour la progression d'une tâche
  const updateTaskProgress = async (taskId: number, progression: number) => {
    try {
      // ✅ Utiliser la route: /projets/taches/:id/progression
      const response = await fetch(`${API_URL}/projets/taches/${taskId}/progression`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progression })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        fetchTasks();
        fetchProjectDetails();
      }
    } catch (error) {
      console.error('Erreur mise à jour progression:', error);
    }
  };

  useEffect(() => {
    if (token && id) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([
          fetchProjectDetails(),
          fetchTasks()
        ]);
        setLoading(false);
      };
      loadData();
    }
  }, [token, id]);

  // Organiser les tâches par colonne Kanban
  const kanbanColumns: KanbanColumn[] = [
    { id: 'a_faire', title: 'À faire', color: '#6b7280', tasks: tasks.filter(t => t.statut === 'a_faire') },
    { id: 'en_cours', title: 'En cours', color: '#3b82f6', tasks: tasks.filter(t => t.statut === 'en_cours') },
    { id: 'termine', title: 'Terminé', color: '#10b981', tasks: tasks.filter(t => t.statut === 'termine') },
  ];

  const priorityColor: Record<string, string> = {
    'haute': 'bg-red-100 text-red-700',
    'moyenne': 'bg-yellow-100 text-yellow-700',
    'faible': 'bg-green-100 text-green-700',
  };

  const statusLabel: Record<string, string> = {
    'a_faire': 'À faire',
    'en_cours': 'En cours',
    'termine': 'Terminé',
    'en_attente': 'En attente'
  };

  const statusColor: Record<string, string> = {
    'en_cours': 'bg-blue-100 text-blue-700',
    'termine': 'bg-green-100 text-green-700',
    'a_faire': 'bg-gray-100 text-gray-700',
    'en_attente': 'bg-yellow-100 text-yellow-700',
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <p>Chargement du projet...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Projet non trouvé</p>
        <Link to="/projects" style={{ color: '#1e40af', textDecoration: 'none' }}>Retour aux projets</Link>
      </div>
    );
  }
const canEdit = isChef || isAdmin || user?.id === project.chef_projet_id;

  return (
    <div className="space-y-6">
      <Link to="/projects" className="text-sm text-blue-900 hover:underline inline-flex items-center gap-1">
        ← Retour aux projets
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{project.nom_projet}</h1>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColor[project.statut] || 'bg-gray-100 text-gray-700'}`}>
                {statusLabel[project.statut] || project.statut}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${priorityColor[project.priorite] || 'bg-gray-100'}`}>
                {project.priorite === 'haute' ? 'Haute' : project.priorite === 'moyenne' ? 'Moyenne' : 'Basse'}
              </span>
            </div>
            <p className="text-gray-500 text-sm">{project.description || 'Aucune description'}</p>
            <div className="flex gap-6 text-sm flex-wrap">
              <div><span className="text-gray-400">Chef : </span><span className="font-medium text-gray-700">{project.chef_nom}</span></div>
              <div><span className="text-gray-400">Début : </span><span className="font-medium text-gray-700">{project.date_debut || 'Non définie'}</span></div>
              <div><span className="text-gray-400">Fin : </span><span className="font-medium text-gray-700">{project.date_fin_prevue}</span></div>
              <div><span className="text-gray-400">Tâches : </span><span className="font-medium text-gray-700">{project.taches_terminees}/{project.total_taches} terminées</span></div>
            </div>
          </div>
          <div className="w-48">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Avancement</span>
              <span className="font-bold text-gray-900">{project.progression}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-900 h-2.5 rounded-full transition-all duration-300" style={{ width: `${project.progression}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 text-lg">Tâches ({tasks.length})</h2>
          {canEdit && (
            <button 
              onClick={() => setShowTaskModal(true)}
              className="px-3 py-1.5 bg-blue-900 text-white rounded-lg text-sm hover:bg-blue-800 transition-colors"
            >
              + Ajouter une tâche
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kanbanColumns.map((col) => (
            <div key={col.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b-2" style={{ borderColor: col.color }}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900">{col.title}</span>
                  <span className="text-xs text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: col.color }}>
                    {col.tasks.length}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
                {col.tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Aucune tâche
                  </div>
                ) : (
                  col.tasks.map((task) => (
                    <div key={task.id} className="bg-gray-50 rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-900 mb-1 flex-1">{task.titre}</p>
                        {canEdit && col.id !== 'termine' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, col.id === 'a_faire' ? 'en_cours' : 'termine')}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            {col.id === 'a_faire' ? 'Démarrer →' : 'Terminer →'}
                          </button>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor[task.priorite] || 'bg-gray-100'}`}>
                          {task.priorite === 'haute' ? 'Haute' : task.priorite === 'moyenne' ? 'Moyenne' : 'Basse'}
                        </span>
                        <span className="text-xs text-gray-400">{task.assigne_nom}</span>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 rounded-full transition-all" 
                              style={{ width: `${task.progression}%` }} 
                            />
                          </div>
                          <span className="text-xs text-gray-400">{task.progression}%</span>
                        </div>
                        {canEdit && (
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={task.progression}
                            onChange={(e) => updateTaskProgress(task.id, parseInt(e.target.value))}
                            className="w-full mt-1 accent-blue-600"
                          />
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">Échéance: {task.date_echeance || 'Non définie'}</span>
                        {canEdit && (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {canEdit && (
                  <button 
                    onClick={() => setShowTaskModal(true)}
                    className="w-full text-left text-xs text-gray-400 hover:text-gray-600 py-2 px-2 transition-colors"
                  >
                    + Ajouter une tâche
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Équipe */}
      {team.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 text-lg mb-4">Équipe ({team.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {team.map((m) => (
              <div key={m.id} className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-800 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
                  {m.nom_complet?.[0]?.toUpperCase() || 'U'}
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{m.nom_complet}</p>
                <p className="text-xs text-gray-400">{m.role === 'employe' ? 'Employé' : m.role}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Création Tâche */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4" onClick={() => setShowTaskModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">➕ Nouvelle tâche</h2>
              <button onClick={() => setShowTaskModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>

            {taskError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
                ⚠️ {taskError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={taskForm.titre}
                  onChange={(e) => setTaskForm({ ...taskForm, titre: e.target.value })}
                  placeholder="Ex: Maquette page accueil"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={3}
                  placeholder="Décrivez la tâche..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Assigné à <span className="text-red-500">*</span>
                </label>
                <select
                  value={taskForm.assigne_a}
                  onChange={(e) => setTaskForm({ ...taskForm, assigne_a: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Sélectionner --</option>
                  {team.map((m) => (
                    <option key={m.id} value={m.id}>{m.nom_complet}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Priorité</label>
                  <select
                    value={taskForm.priorite}
                    onChange={(e) => setTaskForm({ ...taskForm, priorite: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="faible">Basse</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="haute">Haute</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={taskForm.date_debut}
                    onChange={(e) => setTaskForm({ ...taskForm, date_debut: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Date échéance <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={taskForm.date_echeance}
                  onChange={(e) => setTaskForm({ ...taskForm, date_echeance: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTaskModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateTask}
                disabled={taskLoading}
                className="flex-1 py-2 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 disabled:bg-gray-400 transition-colors"
              >
                {taskLoading ? 'Création...' : '✅ Créer la tâche'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}