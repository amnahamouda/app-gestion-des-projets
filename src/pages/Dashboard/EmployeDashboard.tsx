import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

interface Task {
  id: number;
  titre: string;
  projet_nom: string;
  projet_id: number;
  date_echeance: string;
  priorite: string;
  statut: string;
  progression: number;
}

interface Project {
  id: number;
  nom_projet: string;
  progression: number;
  role?: string;
  chef_nom: string;
}

export default function EmployeDashboard() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    total_taches: 0,
    taches_terminees: 0,
    taches_en_cours: 0,
    progression_moyenne: 0,
    taches_urgentes: 0
  });

  // Charger les tâches de l'employé connecté
  const fetchMesTaches = async () => {
    try {
      console.log('🔍 Chargement des tâches pour employé ID:', user?.id);
      const response = await fetch(`${API_URL}/projets/taches/mes-taches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 Tâches reçues:', data);
      
      if (data.success) {
        const tasksData = data.taches.map((t: any) => ({
          id: t.id,
          titre: t.titre,
          projet_nom: t.nom_projet || 'Sans projet',
          projet_id: t.projet_id,
          date_echeance: t.date_echeance,
          priorite: t.priorite,
          statut: t.statut,
          progression: t.progression || 0
        }));
        
        setTasks(tasksData);
        
        // Calculer les stats
        const total = tasksData.length;
        const terminees = tasksData.filter((t: Task) => t.statut === 'termine').length;
        const enCours = tasksData.filter((t: Task) => t.statut === 'en_cours').length;
        const progressionMoyenne = total > 0 
          ? Math.round(tasksData.reduce((acc: number, t: Task) => acc + t.progression, 0) / total) 
          : 0;
        
        // Tâches urgentes (deadline dans moins de 5 jours)
        const urgentes = tasksData.filter((t: Task) => {
          const daysLeft = Math.ceil((new Date(t.date_echeance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return daysLeft <= 5 && daysLeft >= 0 && t.statut !== 'termine';
        }).length;
        
        setStats({
          total_taches: total,
          taches_terminees: terminees,
          taches_en_cours: enCours,
          progression_moyenne: progressionMoyenne,
          taches_urgentes: urgentes
        });
      }
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
    }
  };

  // Charger les projets où l'employé a des tâches
  const fetchMesProjets = async () => {
    try {
      console.log('🔍 Chargement des projets pour employé ID:', user?.id);
      const response = await fetch(`${API_URL}/projets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 Projets reçus:', data);
      
      if (data.success) {
        // Filtrer les projets où l'employé a des tâches
        const projetsAvecTaches = data.projets.filter((p: any) => {
          // Vérifier si l'employé a des tâches dans ce projet
          return tasks.some(t => t.projet_id === p.id);
        });
        
        setProjects(projetsAvecTaches.map((p: any) => ({
          id: p.id,
          nom_projet: p.nom_projet,
          progression: p.progression || 0,
          chef_nom: p.chef_nom || 'Non assigné'
        })));
      }
    } catch (error) {
      console.error('Erreur chargement projets:', error);
    }
  };

  useEffect(() => {
    if (token && user) {
      const loadData = async () => {
        setLoading(true);
        await fetchMesTaches();
        setLoading(false);
      };
      loadData();
    }
  }, [token, user]);

  // Recharger les projets après avoir les tâches
  useEffect(() => {
    if (tasks.length > 0) {
      fetchMesProjets();
    }
  }, [tasks]);

  // Fonction pour traduire le statut
  const traduireStatut = (statut: string): string => {
    const map: Record<string, string> = {
      'a_faire': 'À faire',
      'en_cours': 'En cours',
      'termine': 'Terminé'
    };
    return map[statut] || statut;
  };

  // Fonction pour traduire la priorité
  const traduirePriorite = (priorite: string): string => {
    const map: Record<string, string> = {
      'haute': 'Haute',
      'moyenne': 'Moyenne',
      'faible': 'Basse'
    };
    return map[priorite] || priorite;
  };

  // Couleurs
  const priorityColor: Record<string, { bg: string; color: string }> = {
    'haute': { bg: '#fee2e2', color: '#991b1b' },
    'moyenne': { bg: '#fef9c3', color: '#854d0e' },
    'faible': { bg: '#dcfce7', color: '#166534' },
  };

  const statusColor: Record<string, { bg: string; color: string }> = {
    'a_faire': { bg: '#f1f5f9', color: '#475569' },
    'en_cours': { bg: '#dbeafe', color: '#1e40af' },
    'termine': { bg: '#dcfce7', color: '#166534' },
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <p>Chargement de votre tableau de bord...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
          Mon tableau de bord
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
          Bienvenue 
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Mes tâches', value: stats.total_taches, sub: `${stats.taches_terminees} terminées`, icon: '✅', light: '#eff6ff' },
          { label: 'En cours', value: stats.taches_en_cours, sub: 'actuellement', icon: '⚡', light: '#f0f9ff' },
          { label: 'Avancement moyen', value: `${stats.progression_moyenne}%`, sub: 'toutes tâches', icon: '📊', light: '#f0fdf4' },
          { label: 'Tâches urgentes', value: stats.taches_urgentes, sub: 'deadline < 5j', icon: '🔴', light: '#fff5f5' },
        ].map((s) => (
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Mes tâches */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '15px' }}>Mes tâches</h2>
            <Link to="/tasks" style={{ fontSize: '13px', color: '#1e40af', textDecoration: 'none', fontWeight: 500 }}>Voir tout →</Link>
          </div>
          <div>
            {tasks.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <p>📭 Aucune tâche assignée</p>
              </div>
            ) : (
              tasks.slice(0, 5).map((t) => {
                const pc = priorityColor[t.priorite] || { bg: '#f1f5f9', color: '#475569' };
                const sc = statusColor[t.statut] || { bg: '#f1f5f9', color: '#475569' };
                const daysLeft = Math.ceil((new Date(t.date_echeance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const statusLabel = traduireStatut(t.statut);
                const priorityLabel = traduirePriorite(t.priorite);
                
                return (
                  <div key={t.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div>
                        <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '13px' }}>{t.titre}</p>
                        <p style={{ color: '#94a3b8', fontSize: '11px', margin: '2px 0 0 0' }}>{t.projet_nom}</p>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: pc.bg, color: pc.color, flexShrink: 0, marginLeft: '8px' }}>
                        {priorityLabel}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 6px', borderRadius: '20px', background: sc.bg, color: sc.color }}>
                        {statusLabel}
                      </span>
                      <span style={{ fontSize: '11px', color: daysLeft <= 3 ? '#ef4444' : '#94a3b8', fontWeight: daysLeft <= 3 ? 700 : 400 }}>
                        {daysLeft <= 0 ? '⚠️ En retard' : `${daysLeft}j restants`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ flex: 1, height: '4px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${t.progression}%`, background: t.progression === 100 ? '#16a34a' : '#1d4ed8', borderRadius: '999px' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{t.progression}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Projets assignés */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '15px' }}>Projets assignés</h2>
            <Link to="/projects" style={{ fontSize: '13px', color: '#1e40af', textDecoration: 'none', fontWeight: 500 }}>Voir tout →</Link>
          </div>
          <div>
            {projects.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <p>📭 Aucun projet assigné</p>
              </div>
            ) : (
              projects.map((p) => (
                <div key={p.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Link to={`/projects/${p.id}`} style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px', textDecoration: 'none' }}>
                      {p.nom_projet}
                    </Link>
                    <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '20px' }}>
                      Chef: {p.chef_nom}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p.progression}%`, background: '#1d4ed8', borderRadius: '999px' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{p.progression}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tâches urgentes - section supplémentaire */}
      {stats.taches_urgentes > 0 && (
        <div style={{ background: '#fff5f5', borderRadius: '16px', border: '1px solid #fecaca', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <h2 style={{ fontWeight: 600, color: '#991b1b', margin: 0, fontSize: '15px' }}>Attention: Tâches urgentes</h2>
          </div>
          <p style={{ color: '#991b1b', fontSize: '13px', margin: 0 }}>
            Vous avez {stats.taches_urgentes} tâche(s) avec une deadline dans moins de 5 jours. 
            <Link to="/tasks" style={{ color: '#991b1b', marginLeft: '8px', fontWeight: 600 }}>Voir les tâches →</Link>
          </p>
        </div>
      )}
    </div>
  );
}