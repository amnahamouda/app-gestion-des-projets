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

// ── Design tokens — same palette as AdminDashboard & TeamPage ──
const T = {
  navy950: '#0c1a3a',
  navy900: '#0f2057',
  blue700: '#1d4ed8',
  blue600: '#1e40af',
  blue400: '#60a5fa',
  blue100: '#dbeafe',
  blue50:  '#eff6ff',
  slate900: '#0f172a',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate100: '#f1f5f9',
  slate50:  '#f8fafc',
  white:    '#ffffff',
  rose:     '#e11d48',
  rose50:   '#fff1f2',
  roseMid:  '#fecdd3',
  amber:    '#b45309',
  amber50:  '#fffbeb',
  amberMid: '#fde68a',
  green:    '#15803d',
  green50:  '#f0fdf4',
  greenMid: '#bbf7d0',
  purple:   '#6d28d9',
  purple50: '#f5f3ff',
};

export default function RiskAnalysis() {
  const { token, user, isChef } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all');
  const [sortBy, setSortBy] = useState<'score' | 'deadline' | 'progress'>('score');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projects, setProjects] = useState<{ id: number; nom_projet: string }[]>([]);
  const [tasksWithRisk, setTasksWithRisk] = useState<Task[]>([]);
  const [projectRisks, setProjectRisks] = useState<ProjectRisk[]>([]);
  const [employeeWorkload, setEmployeeWorkload] = useState<EmployeeWorkload[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    total_taches: 0, critique: 0, eleve: 0, moyen: 0, faible: 0, normal: 0, termine: 0,
  });

  // ── Fetch ────────────────────────────────────────────────
  const fetchProjects = async () => {
    try {
      const r = await fetch(`${API_URL}/projets`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) {
        const chef = d.projets.filter((p: any) => Number(p.chef_projet_id) === Number(user?.id));
        setProjects(chef);
        if (chef.length > 0 && !selectedProjectId) setSelectedProjectId(chef[0].id);
      }
    } catch (e) { console.error(e); }
  };

  const fetchTachesRisquees = async (projetId: number) => {
    try {
      const r = await fetch(`${API_URL}/prediction/projet/${projetId}/taches-risquees`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) {
        setTasksWithRisk((d.taches_classees || []).map((t: any) => ({
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
          cause_risque: t.cause || "En cours d'analyse",
          jours_restants: t.jours_restants || 0,
        })));
        setGlobalStats(d.resume_risques || { total_taches: 0, critique: 0, eleve: 0, moyen: 0, faible: 0, normal: 0, termine: 0 });
      }
    } catch (e) { console.error(e); }
  };

  const fetchChargeTravail = async (projetId: number) => {
    try {
      const r = await fetch(`${API_URL}/prediction/projet/${projetId}/charge`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) setEmployeeWorkload(d.analyse_charge || []);
    } catch (e) { console.error(e); }
  };

  const fetchAnalyseGlobaleProjets = async () => {
    try {
      const risks: ProjectRisk[] = [];
      for (const project of projects) {
        const r = await fetch(`${API_URL}/prediction/projet/${project.id}/analyse-globale`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (d.success) {
          risks.push({
            id: project.id,
            nom_projet: d.projet || project.nom_projet,
            total_taches: 0, taches_terminees: 0,
            avancement: parseInt(d.resultats?.avancement) || 0,
            date_fin_prevue: '',
            jours_restants: d.resultats?.jours_restants || 0,
            score_risque_moyen: d.resultats?.score_risque || 0,
            niveau_risque: d.resultats?.niveau_risque || 'normal',
            taches_risquees: 0,
          });
        }
      }
      setProjectRisks(risks);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (token && user && isChef) {
      (async () => { setLoading(true); await fetchProjects(); setLoading(false); })();
    } else { setLoading(false); }
  }, [token, user, isChef]);

  useEffect(() => {
    if (selectedProjectId) {
      Promise.all([fetchTachesRisquees(selectedProjectId), fetchChargeTravail(selectedProjectId)]);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (projects.length > 0) fetchAnalyseGlobaleProjets();
  }, [projects]);

  // ── Risk helpers ─────────────────────────────────────────
  const getRiskLevel = (score: number, niveau?: string) => {
    if (niveau === 'critique' || score >= 70) return { label: 'Critique', color: T.rose,   bg: T.rose50,   bar: T.rose,   dot: T.rose   };
    if (niveau === 'élevé'   || score >= 50) return { label: 'Élevé',    color: T.amber,  bg: T.amber50,  bar: T.amber,  dot: T.amber  };
    if (niveau === 'moyen'   || score >= 30) return { label: 'Moyen',    color: T.blue600,bg: T.blue50,   bar: T.blue600,dot: T.blue600};
    if (niveau === 'faible'  || score >  0)  return { label: 'Faible',   color: T.green,  bg: T.green50,  bar: T.green,  dot: T.green  };
    return                                          { label: 'Normal',   color: T.slate500,bg: T.slate100,bar: T.slate400,dot: T.slate400};
  };

  const filteredTasks = tasksWithRisk.filter(t => {
    if (filterLevel === 'all')      return true;
    if (filterLevel === 'critique') return t.niveau_risque === 'critique';
    if (filterLevel === 'eleve')    return t.niveau_risque === 'élevé';
    if (filterLevel === 'moyen')    return t.niveau_risque === 'moyen';
    if (filterLevel === 'faible')   return t.niveau_risque === 'faible';
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'score')    return (b.score_risque || 0) - (a.score_risque || 0);
    if (sortBy === 'deadline') return (a.jours_restants || 0) - (b.jours_restants || 0);
    if (sortBy === 'progress') return a.progression - b.progression;
    return 0;
  });

  // ── Input style ──────────────────────────────────────────
  const selectSx: React.CSSProperties = {
    padding: '9px 14px',
    border: `1px solid ${T.slate300}`,
    borderRadius: '10px',
    fontSize: '13px',
    outline: 'none',
    background: T.white,
    color: T.slate900,
    cursor: 'pointer',
  };

  // ── Guards ───────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ width: 44, height: 44, border: `3px solid ${T.blue100}`, borderTop: `3px solid ${T.blue600}`, borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <p style={{ color: T.slate500, fontWeight: 500, fontSize: 14 }}>Chargement de l'analyse des risques...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!isChef) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <p style={{ color: T.slate500 }}>⛔ Accès réservé aux chefs de projet</p>
      <Link to="/dashboard" style={{ color: T.blue600 }}>Retour au dashboard</Link>
    </div>
  );

  // ── KPI cards config ─────────────────────────────────────
  const kpiCards = [
    { label: 'Risque critique',      value: globalStats.critique,                                         accent: T.rose,    accentLight: T.rose50,   icon: '▲' },
    { label: 'Risque élevé',         value: globalStats.eleve,                                            accent: T.amber,   accentLight: T.amber50,  icon: '◈' },
    { label: 'Risque moyen',         value: globalStats.moyen,                                            accent: T.blue600, accentLight: T.blue50,   icon: '◉' },
    { label: 'Risque faible',        value: globalStats.faible,                                           accent: T.green,   accentLight: T.green50,  icon: '◎' },
    { label: 'Employés surchargés',  value: employeeWorkload.filter(e => e.charge >= 5).length,           accent: T.purple,  accentLight: T.purple50, icon: '◐' },
    { label: 'Total tâches',         value: globalStats.total_taches,                                     accent: T.slate700,accentLight: T.slate100, icon: '◈' },
  ];

  return (
    <>
      <PageMeta title="Analyse des risques | Maison du Web" description="Module de prédiction de risque" />
      <PageBreadcrumb pageTitle="Analyse des risques" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .kcard{transition:box-shadow .2s,transform .2s}
        .kcard:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(30,64,175,.13)!important}
        .trow:hover td{background:${T.slate50}!important}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .35s ease both}
      `}</style>

      <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Header ── */}
        <div className="fu" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: T.blue600, letterSpacing: 1.2, textTransform: 'uppercase' }}>Prédiction</p>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: T.slate900, letterSpacing: '-0.5px' }}>
              Module d'analyse des risques
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: T.slate500, fontWeight: 500 }}>
              Score = ((100 − %avancement) × 100) / jours restants
            </p>
          </div>
        </div>

        {/* ── Project selector ── */}
        {projects.length > 0 ? (
          <div className="fu" style={{ background: T.white, borderRadius: 16, padding: '16px 20px', border: `1px solid ${T.slate100}`, boxShadow: '0 2px 8px rgba(0,0,0,.04)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.slate700 }}>Projet :</p>
            <select
              value={selectedProjectId || ''}
              onChange={e => setSelectedProjectId(Number(e.target.value))}
              style={{ ...selectSx, minWidth: 240 }}
            >
              {projects.map(p => <option key={p.id} value={p.id}>{p.nom_projet}</option>)}
            </select>
          </div>
        ) : (
          <div style={{ background: T.blue50, borderRadius: 14, padding: 20, textAlign: 'center', border: `1px solid ${T.blue100}` }}>
            <p style={{ color: T.blue600, fontWeight: 600, margin: 0 }}>⚠️ Aucun projet trouvé pour ce chef de projet</p>
            <p style={{ fontSize: 12, color: T.slate500, marginTop: 6 }}>Vérifiez que vous avez des projets avec chef_projet_id = {user?.id}</p>
          </div>
        )}

        {/* ── KPI Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14 }}>
          {kpiCards.map((s, i) => (
            <div key={s.label} className="kcard fu" style={{ background: T.white, border: `1px solid ${T.slate100}`, borderRadius: 18, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,.05)', position: 'relative', overflow: 'hidden', animationDelay: `${i * 0.05}s` }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent, borderRadius: '18px 18px 0 0' }} />
              <div style={{ width: 38, height: 38, background: s.accentLight, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: s.accent, fontWeight: 700, marginBottom: 12 }}>{s.icon}</div>
              <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 600, color: T.slate500, textTransform: 'uppercase', letterSpacing: '.7px' }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, color: T.slate900, letterSpacing: '-1.5px', lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Project risk table ── */}
        {projectRisks.length > 0 && (
          <div className="fu" style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.slate100}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.slate100}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 3, height: 18, background: T.blue600, borderRadius: 99 }} />
              <h2 style={{ margin: 0, fontWeight: 700, color: T.slate900, fontSize: 14 }}>Analyse du risque par projet</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.slate50, borderBottom: `1px solid ${T.slate100}` }}>
                    {['Projet', 'Avancement', 'Jours restants', 'Score risque', 'Niveau', 'Statut'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 700, color: T.slate500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.6px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projectRisks.map(p => {
                    const risk = getRiskLevel(p.score_risque_moyen, p.niveau_risque);
                    return (
                      <tr key={p.id} className="trow" style={{ borderBottom: `1px solid ${T.slate50}` }}>
                        <td style={{ padding: '13px 16px' }}>
                          <Link to={`/projects/${p.id}`} style={{ fontWeight: 700, color: T.slate900, textDecoration: 'none', fontSize: 13 }}>{p.nom_projet}</Link>
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 80, height: 5, background: T.slate100, borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${p.avancement}%`, background: T.blue600, borderRadius: 99 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.slate600 }}>{p.avancement}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ fontSize: 13, color: p.jours_restants <= 7 ? T.rose : T.slate500, fontWeight: p.jours_restants <= 7 ? 700 : 400 }}>
                            {p.jours_restants <= 0 ? '⚠️ Dépassé' : `${p.jours_restants}j`}
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 5, background: T.slate100, borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${p.score_risque_moyen}%`, background: risk.bar, borderRadius: 99 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: risk.color }}>{p.score_risque_moyen}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: risk.bg, color: risk.color, border: `1px solid ${risk.color}22` }}>
                            {risk.label}
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ fontSize: 12, color: risk.color, fontWeight: 600 }}>
                            {risk.label === 'Critique' ? '⚡ Action urgente' :
                             risk.label === 'Élevé'    ? '👁 À surveiller' :
                             risk.label === 'Moyen'    ? '📌 Surveillance' : '✓ Normal'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Workload ── */}
        <div className="fu" style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.slate100}`, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 3, height: 18, background: T.purple, borderRadius: 99 }} />
            <h2 style={{ margin: 0, fontWeight: 700, color: T.slate900, fontSize: 14 }}>Analyse de la charge de travail</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            {employeeWorkload.length === 0 ? (
              <p style={{ color: T.slate400, textAlign: 'center', padding: 24, gridColumn: '1/-1' }}>Aucun employé assigné à ce projet</p>
            ) : employeeWorkload.map(e => {
              const overloaded  = e.charge >= 5;
              const loadPercent = Math.min((e.charge / 7) * 100, 100);
              const barColor    = overloaded ? T.rose : T.blue600;
              const avColor     = overloaded ? T.rose50 : T.blue50;
              const borderColor = overloaded ? T.roseMid : T.blue100;
              return (
                <div key={e.id} style={{ padding: 16, borderRadius: 14, border: `1px solid ${borderColor}`, background: avColor }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <p style={{ fontWeight: 700, color: T.slate900, margin: 0, fontSize: 13 }}>{e.nom}</p>
                    {overloaded && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: T.rose50, color: T.rose, border: `1px solid ${T.roseMid}` }}>Surchargé</span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: T.slate500, margin: '0 0 8px' }}>
                    Charge : <strong style={{ color: barColor }}>{e.charge}</strong> tâches non terminées
                  </p>
                  <div style={{ height: 5, background: T.slate100, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${loadPercent}%`, background: barColor, borderRadius: 99, transition: 'width .4s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: T.slate400 }}>
                    <span>{e.taches_actives} actives</span>
                    <span>{e.taches_terminees} terminées</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Tasks classification ── */}
        <div className="fu" style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.slate100}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${T.slate100}`, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 3, height: 18, background: T.amber, borderRadius: 99 }} />
              <h2 style={{ margin: 0, fontWeight: 700, color: T.slate900, fontSize: 14 }}>Classification des tâches par niveau de risque</h2>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} style={selectSx}>
                <option value="all">Tous niveaux</option>
                <option value="critique">Critique</option>
                <option value="eleve">Élevé</option>
                <option value="moyen">Moyen</option>
                <option value="faible">Faible</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as 'score' | 'deadline' | 'progress')} style={selectSx}>
                <option value="score">Trier par score</option>
                <option value="deadline">Trier par deadline</option>
                <option value="progress">Trier par avancement</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.slate50, borderBottom: `1px solid ${T.slate100}` }}>
                  {['Tâche', 'Assigné à', 'Avancement', 'Jours restants', 'Score risque', 'Niveau', 'Cause'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 700, color: T.slate500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.6px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: T.slate400, fontSize: 14 }}>
                      ✅ Aucune tâche à risque dans ce projet
                    </td>
                  </tr>
                ) : sortedTasks.map(t => {
                  const risk = getRiskLevel(t.score_risque || 0, t.niveau_risque);
                  return (
                    <tr key={t.id} className="trow" style={{ borderBottom: `1px solid ${T.slate50}`, borderLeft: `3px solid ${risk.bar}` }}>
                      <td style={{ padding: '13px 16px' }}>
                        <p style={{ fontWeight: 700, color: T.slate900, margin: 0, fontSize: 13 }}>{t.titre}</p>
                        <p style={{ color: T.slate400, fontSize: 11, margin: '2px 0 0' }}>{t.projet_nom}</p>
                      </td>
                      <td style={{ padding: '13px 16px', color: T.slate600, fontSize: 13 }}>{t.assigne_nom || 'Non assigné'}</td>
                      <td style={{ padding: '13px 16px', minWidth: 110 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 60, height: 5, background: T.slate100, borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${t.progression}%`, background: T.blue600, borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 12, color: T.slate500 }}>{t.progression}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontSize: 13, color: (t.jours_restants || 0) <= 3 ? T.rose : (t.jours_restants || 0) <= 7 ? T.amber : T.slate500, fontWeight: (t.jours_restants || 0) <= 7 ? 700 : 400 }}>
                          {(t.jours_restants || 0) <= 0 ? '⚠️ En retard' : `${t.jours_restants}j`}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 50, height: 5, background: T.slate100, borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${t.score_risque || 0}%`, background: risk.bar, borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: risk.color }}>{t.score_risque || 0}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: risk.bg, color: risk.color, border: `1px solid ${risk.color}22` }}>
                          {risk.label}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', maxWidth: 200 }}>
                        <span style={{ fontSize: 11, color: T.slate500 }}>{t.cause_risque || "En cours d'analyse"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}