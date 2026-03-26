import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';

const API_URL = 'http://localhost:5000/api';

interface Task {
  id: number;
  titre: string;
  projet_id: number;
  projet_nom: string;
  assigne_nom: string;
  progression: number;
  date_echeance: string;
  statut: string;
  priorite: string;
  score_risque?: number;
  niveau_risque?: string;
  cause_risque?: string;
  jours_restants?: number;
}

interface ProjectRisk {
  id: number;
  nom_projet: string;
  total_taches: number;
  taches_terminees: number;
  avancement: number;
  date_fin_prevue: string;
  jours_restants: number;
  score_risque_moyen: number;
  niveau_risque: string;
  taches_risquees: number;
}

interface EmployeeWorkload {
  id: number;
  nom: string;
  charge: number;
  taches_actives: number;
  taches_terminees: number;
  statut: string;
}

interface GlobalStats {
  total_taches: number;
  critique: number;
  eleve: number;
  moyen: number;
  faible: number;
  normal: number;
  termine: number;
}

export default function RiskAnalysis() {
  const { token, user, isChef } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all');
  const [sortBy, setSortBy] = useState<'score' | 'deadline' | 'progress'>('score');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projects, setProjects] = useState<{ id: number; nom_projet: string }[]>([]);
  
  // États pour les données
  const [tasksWithRisk, setTasksWithRisk] = useState<Task[]>([]);
  const [projectRisks, setProjectRisks] = useState<ProjectRisk[]>([]);
  const [employeeWorkload, setEmployeeWorkload] = useState<EmployeeWorkload[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    total_taches: 0,
    critique: 0,
    eleve: 0,
    moyen: 0,
    faible: 0,
    normal: 0,
    termine: 0
  });

  // Charger les projets du chef
  const fetchProjects = async () => {
    try {
      console.log('🔍 Chargement des projets...');
      const response = await fetch(`${API_URL}/projets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 Projets reçus:', data);
      
      if (data.success) {
        // Filtrer les projets du chef connecté
        const projetsChef = data.projets.filter(
  (p: any) => Number(p.chef_projet_id) === Number(user?.id)
);
        console.log(`✅ ${projetsChef.length} projets trouvés pour chef ID: ${user?.id}`);
        setProjects(projetsChef);
        if (projetsChef.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projetsChef[0].id);
        }
      }
    } catch (error) {
      console.error('Erreur chargement projets:', error);
    }
  };

  // Charger la classification des tâches par risque pour un projet
  const fetchTachesRisquees = async (projetId: number) => {
    try {
      console.log(`🔍 Chargement tâches risquées pour projet ${projetId}...`);
      const response = await fetch(`${API_URL}/prediction/projet/${projetId}/taches-risquees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 Réponse tâches risquées:', data);
      
      if (data.success) {
        // Transformer les données pour correspondre à l'interface
        const formattedTasks = (data.taches_classees || []).map((t: any) => ({
          id: t.id,
          titre: t.titre,
          projet_id: projetId,
          projet_nom: t.projet || projects.find(p => p.id === projetId)?.nom_projet || '',
          assigne_nom: t.assigne || 'Non assigné',
          progression: parseInt(t.progression) || 0,
          date_echeance: t.date_echeance || '',
          statut: t.statut || 'en_cours',
          priorite: t.priorite || 'moyenne',
          score_risque: t.score_risque || 0,
          niveau_risque: t.niveau_risque || 'normal',
          cause_risque: t.cause || 'En cours d\'analyse',
          jours_restants: t.jours_restants || 0
        }));
        
        setTasksWithRisk(formattedTasks);
        setGlobalStats(data.resume_risques || {
          total_taches: 0,
          critique: 0,
          eleve: 0,
          moyen: 0,
          faible: 0,
          normal: 0,
          termine: 0
        });
      } else {
        console.error('Erreur API:', data.message);
      }
    } catch (error) {
      console.error('Erreur chargement tâches risquées:', error);
    }
  };

  // Charger l'analyse de charge pour un projet
  const fetchChargeTravail = async (projetId: number) => {
    try {
      console.log(`🔍 Chargement charge travail pour projet ${projetId}...`);
      const response = await fetch(`${API_URL}/prediction/projet/${projetId}/charge`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 Réponse charge travail:', data);
      
      if (data.success) {
        setEmployeeWorkload(data.analyse_charge || []);
      }
    } catch (error) {
      console.error('Erreur chargement charge travail:', error);
    }
  };

  // Charger l'analyse globale des risques pour tous les projets du chef
  const fetchAnalyseGlobaleProjets = async () => {
    try {
      const projetsRisques: ProjectRisk[] = [];
      
      for (const project of projects) {
        console.log(`🔍 Analyse globale pour projet ${project.id}...`);
        const response = await fetch(`${API_URL}/prediction/projet/${project.id}/analyse-globale`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        console.log(`📊 Analyse projet ${project.id}:`, data);
        
        if (data.success) {
          projetsRisques.push({
            id: project.id,
            nom_projet: data.projet || project.nom_projet,
            total_taches: 0,
            taches_terminees: 0,
            avancement: parseInt(data.resultats?.avancement) || 0,
            date_fin_prevue: '',
            jours_restants: data.resultats?.jours_restants || 0,
            score_risque_moyen: data.resultats?.score_risque || 0,
            niveau_risque: data.resultats?.niveau_risque || 'normal',
            taches_risquees: 0
          });
        }
      }
      
      setProjectRisks(projetsRisques);
    } catch (error) {
      console.error('Erreur chargement analyse globale:', error);
    }
  };

  // Charger toutes les données
  useEffect(() => {
    if (token && user && isChef) {
      const loadData = async () => {
        setLoading(true);
        await fetchProjects();
        setLoading(false);
      };
      loadData();
    } else {
      setLoading(false);
    }
  }, [token, user, isChef]);

  // Charger les données spécifiques au projet sélectionné
  useEffect(() => {
    if (selectedProjectId) {
      const loadProjectData = async () => {
        await Promise.all([
          fetchTachesRisquees(selectedProjectId),
          fetchChargeTravail(selectedProjectId)
        ]);
      };
      loadProjectData();
    }
  }, [selectedProjectId]);

  // Charger l'analyse globale après avoir les projets
  useEffect(() => {
    if (projects.length > 0) {
      fetchAnalyseGlobaleProjets();
    }
  }, [projects]);

  // Fonction pour obtenir le niveau de risque
  const getRiskLevel = (score: number, niveau?: string) => {
    if (niveau === 'critique' || score >= 70) {
      return { label: 'Critique', color: '#991b1b', bg: '#fee2e2', icon: '🔴' };
    }
    if (niveau === 'élevé' || score >= 50) {
      return { label: 'Élevé', color: '#dc2626', bg: '#fee2e2', icon: '🟠' };
    }
    if (niveau === 'moyen' || score >= 30) {
      return { label: 'Moyen', color: '#f59e0b', bg: '#fef9c3', icon: '🟡' };
    }
    if (niveau === 'faible' || score > 0) {
      return { label: 'Faible', color: '#16a34a', bg: '#dcfce7', icon: '🟢' };
    }
    return { label: 'Normal', color: '#475569', bg: '#f1f5f9', icon: '⚪' };
  };

  // Filtrage des tâches
  const filteredTasks = tasksWithRisk.filter((t) => {
    if (filterLevel === 'all') return true;
    if (filterLevel === 'critique') return t.niveau_risque === 'critique';
    if (filterLevel === 'eleve') return t.niveau_risque === 'élevé';
    if (filterLevel === 'moyen') return t.niveau_risque === 'moyen';
    if (filterLevel === 'faible') return t.niveau_risque === 'faible';
    return true;
  });

  // Tri des tâches
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'score') return (b.score_risque || 0) - (a.score_risque || 0);
    if (sortBy === 'deadline') return (a.jours_restants || 0) - (b.jours_restants || 0);
    if (sortBy === 'progress') return a.progression - b.progression;
    return 0;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <p>Chargement de l'analyse des risques...</p>
      </div>
    );
  }

  if (!isChef) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>⛔ Accès réservé aux chefs de projet</p>
        <Link to="/dashboard" style={{ color: '#1e40af' }}>Retour au dashboard</Link>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Analyse des risques | Maison du Web" description="Module de prédiction de risque" />
      <PageBreadcrumb pageTitle="Analyse des risques" />

      <div style={{ fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            🔍 Module de prédiction de risque
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            Analyse automatique des risques de retard — Score = ((100 - %avancement) × 100) / jours restants
          </p>
        </div>

        {/* Sélecteur de projet */}
        {projects.length > 0 ? (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px 20px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginRight: '12px' }}>Projet :</label>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
              style={{ padding: '8px 16px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fff', cursor: 'pointer', minWidth: '200px' }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.nom_projet}</option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ background: '#fee2e2', borderRadius: '16px', padding: '20px', textAlign: 'center', color: '#991b1b' }}>
            <p>⚠️ Aucun projet trouvé pour ce chef de projet</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              Vérifiez que vous avez des projets avec chef_projet_id = {user?.id}
            </p>
          </div>
        )}

        {/* KPIs risque */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Risque critique', value: globalStats.critique, icon: '🔴', bg: '#fff5f5', color: '#991b1b', border: '#fecaca' },
            { label: 'Risque élevé', value: globalStats.eleve, icon: '🟠', bg: '#fff5f5', color: '#dc2626', border: '#fecaca' },
            { label: 'Risque moyen', value: globalStats.moyen, icon: '🟡', bg: '#fffbeb', color: '#f59e0b', border: '#fde68a' },
            { label: 'Risque faible', value: globalStats.faible, icon: '🟢', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
            { label: 'Employés surchargés', value: employeeWorkload.filter(e => e.charge >= 5).length, icon: '⚠️', bg: '#fff7ed', color: '#9a3412', border: '#fed7aa' },
            { label: 'Total tâches', value: globalStats.total_taches, icon: '📋', bg: '#eff6ff', color: '#1e40af', border: '#dbeafe' },
          ].map((s) => (
            <div key={s.label} style={{ background: s.bg, borderRadius: '16px', padding: '16px', border: `1.5px solid ${s.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>{s.icon}</span>
                <p style={{ color: s.color, fontSize: '13px', margin: 0, fontWeight: 500 }}>{s.label}</p>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Analyse par projet */}
        {projectRisks.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '15px' }}>📁 Analyse du risque par projet</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['Projet', 'Avancement', 'Jours restants', 'Score risque', 'Niveau', 'Statut'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '13px' }}>{h}</th>
                    ))}
                   </tr>
                </thead>
                <tbody>
                  {projectRisks.map((p) => {
                    const risk = getRiskLevel(p.score_risque_moyen, p.niveau_risque);
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <Link to={`/projects/${p.id}`} style={{ fontWeight: 600, color: '#0f172a', textDecoration: 'none' }}>{p.nom_projet}</Link>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '80px', height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${p.avancement}%`, background: p.avancement === 100 ? '#16a34a' : '#1d4ed8', borderRadius: '999px' }} />
                            </div>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>{p.avancement}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '13px', color: p.jours_restants <= 7 ? '#ef4444' : '#475569', fontWeight: p.jours_restants <= 7 ? 700 : 400 }}>
                            {p.jours_restants <= 0 ? '⚠️ Dépassé' : `${p.jours_restants}j`}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '60px', height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${p.score_risque_moyen}%`, background: risk.color, borderRadius: '999px' }} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: risk.color }}>{p.score_risque_moyen}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: risk.bg, color: risk.color }}>
                            {risk.icon} {risk.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {p.niveau_risque === 'critique' && <span style={{ color: '#ef4444' }}>🔴 Action urgente</span>}
                          {p.niveau_risque === 'élevé' && <span style={{ color: '#f97316' }}>🟠 À surveiller</span>}
                          {p.niveau_risque === 'moyen' && <span style={{ color: '#f59e0b' }}>🟡 Surveillance</span>}
                          {p.niveau_risque === 'faible' && <span style={{ color: '#16a34a' }}>🟢 Normal</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Charge de travail */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontWeight: 600, color: '#0f172a', margin: '0 0 16px 0', fontSize: '15px' }}>👥 Analyse de la charge de travail</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {employeeWorkload.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Aucun employé assigné à ce projet</p>
            ) : (
              employeeWorkload.map((e) => {
                const overloaded = e.charge >= 5;
                const loadPercent = Math.min((e.charge / 7) * 100, 100);
                return (
                  <div key={e.id} style={{ padding: '14px', borderRadius: '12px', border: `1.5px solid ${overloaded ? '#fecaca' : '#e2e8f0'}`, background: overloaded ? '#fff5f5' : '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '13px' }}>{e.nom}</p>
                      {overloaded && <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 6px', borderRadius: '20px', background: '#fee2e2', color: '#991b1b' }}>Surchargé</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 6px 0' }}>
                      Charge : <strong style={{ color: overloaded ? '#ef4444' : '#0f172a' }}>{e.charge}</strong> tâches non terminées
                    </p>
                    <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${loadPercent}%`, background: overloaded ? '#ef4444' : '#1d4ed8', borderRadius: '999px', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: '#94a3b8' }}>
                      <span>{e.taches_actives} actives</span>
                      <span>{e.taches_terminees} terminées</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Classification des tâches par risque */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '15px' }}>📋 Classification des tâches par niveau de risque</h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                style={{ padding: '6px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff', cursor: 'pointer' }}
              >
                <option value="all">Tous niveaux</option>
                <option value="critique">🔴 Critique</option>
                <option value="eleve">🟠 Élevé</option>
                <option value="moyen">🟡 Moyen</option>
                <option value="faible">🟢 Faible</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'deadline' | 'progress')}
                style={{ padding: '6px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff', cursor: 'pointer' }}
              >
                <option value="score">Trier par score</option>
                <option value="deadline">Trier par deadline</option>
                <option value="progress">Trier par avancement</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Tâche', 'Assigné à', 'Avancement', 'Jours restants', 'Score risque', 'Niveau', 'Cause'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '13px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                      ✅ Aucune tâche à risque dans ce projet
                    </td>
                  </tr>
                ) : (
                  sortedTasks.map((t) => {
                    const risk = getRiskLevel(t.score_risque || 0, t.niveau_risque);
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', borderLeft: `4px solid ${risk.color}` }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ fontWeight: 600, color: '#0f172a', margin: 0 }}>{t.titre}</p>
                          <p style={{ color: '#94a3b8', fontSize: '11px', margin: '2px 0 0 0' }}>{t.projet_nom}</p>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>{t.assigne_nom || 'Non assigné'}</td>
                        <td style={{ padding: '14px 16px', minWidth: '100px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '60px', height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${t.progression}%`, background: t.progression === 100 ? '#16a34a' : '#1d4ed8', borderRadius: '999px' }} />
                            </div>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{t.progression}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '13px', color: (t.jours_restants || 0) <= 3 ? '#ef4444' : (t.jours_restants || 0) <= 7 ? '#f59e0b' : '#475569', fontWeight: (t.jours_restants || 0) <= 7 ? 700 : 400 }}>
                            {(t.jours_restants || 0) <= 0 ? '⚠️ En retard' : `${t.jours_restants}j`}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '50px', height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${t.score_risque || 0}%`, background: risk.color, borderRadius: '999px' }} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: risk.color }}>{t.score_risque || 0}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: risk.bg, color: risk.color }}>
                            {risk.icon} {risk.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', maxWidth: '200px' }}>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {t.cause_risque || 'En cours d\'analyse'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}