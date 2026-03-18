import { useState } from 'react';
import { Link } from 'react-router';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';

interface Task {
  id: string;
  title: string;
  project: string;
  projectId: string;
  assignee: string;
  progress: number;
  due: string;
  status: string;
  priority: string;
}

const tasks: Task[] = [
  { id: 'T-001', title: 'Maquette page accueil', project: 'Refonte e-commerce', projectId: 'PRJ-001', assignee: 'Nadia Bouzid', progress: 60, due: '2025-03-20', status: 'En cours', priority: 'Haute' },
  { id: 'T-002', title: 'API authentification', project: 'Refonte e-commerce', projectId: 'PRJ-001', assignee: 'Karim Ouali', progress: 40, due: '2025-03-25', status: 'En cours', priority: 'Haute' },
  { id: 'T-003', title: 'Tests module RH', project: 'App mobile RH', projectId: 'PRJ-002', assignee: 'Sara Mansouri', progress: 80, due: '2025-04-01', status: 'En révision', priority: 'Moyenne' },
  { id: 'T-004', title: 'Setup Next.js', project: 'Dashboard analytique', projectId: 'PRJ-003', assignee: 'Karim Ouali', progress: 100, due: '2025-01-15', status: 'Terminé', priority: 'Basse' },
  { id: 'T-005', title: 'Intégration Stripe', project: 'Refonte e-commerce', projectId: 'PRJ-001', assignee: 'Karim Ouali', progress: 0, due: '2025-04-10', status: 'À faire', priority: 'Haute' },
  { id: 'T-006', title: 'Charte graphique B2B', project: 'Portail B2B', projectId: 'PRJ-004', assignee: 'Nadia Bouzid', progress: 0, due: '2025-04-05', status: 'À faire', priority: 'Moyenne' },
  { id: 'T-007', title: 'Tests performance', project: 'Refonte e-commerce', projectId: 'PRJ-001', assignee: 'Mehdi Rahali', progress: 20, due: '2025-03-28', status: 'En cours', priority: 'Moyenne' },
  { id: 'T-008', title: 'Migration base de données', project: 'App mobile RH', projectId: 'PRJ-002', assignee: 'Karim Ouali', progress: 10, due: '2025-03-30', status: 'En cours', priority: 'Haute' },
];

const projects = [
  { id: 'PRJ-001', name: 'Refonte site e-commerce', totalTasks: 8, deadline: '2025-04-30' },
  { id: 'PRJ-002', name: 'Application mobile RH', totalTasks: 5, deadline: '2025-07-15' },
  { id: 'PRJ-003', name: 'Dashboard analytique', totalTasks: 6, deadline: '2025-01-31' },
  { id: 'PRJ-004', name: 'Portail client B2B', totalTasks: 4, deadline: '2025-06-30' },
];

const employeeWorkload = [
  { name: 'Karim Ouali', activeTasks: 4 },
  { name: 'Nadia Bouzid', activeTasks: 2 },
  { name: 'Sara Mansouri', activeTasks: 1 },
  { name: 'Mehdi Rahali', activeTasks: 1 },
  { name: 'Amine Belhadj', activeTasks: 0 },
];

const OVERLOAD_THRESHOLD = 3;

// ── Calcul du score de risque ─────────────────────────────────────────────────
function calculateRiskScore(task: Task): number {
  if (task.status === 'Terminé') return 0;
  const daysLeft = Math.ceil((new Date(task.due).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return 100;
  const score = Math.round(((100 - task.progress) * 100) / Math.max(daysLeft, 1));
  return Math.min(score, 100);
}

function getRiskLevel(score: number): { label: string; color: string; bg: string; icon: string } {
  if (score >= 70) return { label: 'Élevé', color: '#991b1b', bg: '#fee2e2', icon: '🔴' };
  if (score >= 40) return { label: 'Moyen', color: '#854d0e', bg: '#fef9c3', icon: '🟡' };
  return { label: 'Faible', color: '#166534', bg: '#dcfce7', icon: '🟢' };
}

function getRiskCause(task: Task): string[] {
  const causes: string[] = [];
  const daysLeft = Math.ceil((new Date(task.due).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) causes.push('Deadline dépassée');
  else if (daysLeft <= 5) causes.push(`Deadline très proche (${daysLeft}j)`);
  if (task.progress < 30 && task.status !== 'À faire') causes.push('Progression très faible');
  if (task.status === 'À faire' && daysLeft <= 10) causes.push('Tâche non démarrée');
  const emp = employeeWorkload.find((e) => e.name === task.assignee);
  if (emp && emp.activeTasks >= OVERLOAD_THRESHOLD) causes.push(`${task.assignee} surchargé (${emp.activeTasks} tâches actives)`);
  if (task.priority === 'Haute' && task.progress < 50) causes.push('Priorité haute avec avancement insuffisant');
  return causes.length > 0 ? causes : ['Surveillance normale'];
}

export default function RiskAnalysis() {
  const [filterLevel, setFilterLevel] = useState('all');
  const [sortBy, setSortBy] = useState<'score' | 'deadline' | 'progress'>('score');

  // Calcul des scores
  const tasksWithRisk = tasks
    .filter((t) => t.status !== 'Terminé')
    .map((t) => ({
      ...t,
      score: calculateRiskScore(t),
      daysLeft: Math.ceil((new Date(t.due).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      causes: getRiskCause(t),
    }));

  // Filtrage
  const filtered = tasksWithRisk.filter((t) => {
    const level = getRiskLevel(t.score).label;
    if (filterLevel === 'all') return true;
    if (filterLevel === 'eleve') return level === 'Élevé';
    if (filterLevel === 'moyen') return level === 'Moyen';
    if (filterLevel === 'faible') return level === 'Faible';
    return true;
  });

  // Tri
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score;
    if (sortBy === 'deadline') return a.daysLeft - b.daysLeft;
    if (sortBy === 'progress') return a.progress - b.progress;
    return 0;
  });

  // Stats globales
  const highRisk = tasksWithRisk.filter((t) => t.score >= 70).length;
  const mediumRisk = tasksWithRisk.filter((t) => t.score >= 40 && t.score < 70).length;
  const lowRisk = tasksWithRisk.filter((t) => t.score < 40).length;

  // Analyse par projet
  const projectRisk = projects.map((p) => {
    const pTasks = tasksWithRisk.filter((t) => t.projectId === p.id);
    const avgScore = pTasks.length > 0 ? Math.round(pTasks.reduce((acc, t) => acc + t.score, 0) / pTasks.length) : 0;
    const daysToDeadline = Math.ceil((new Date(p.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const doneTasks = tasks.filter((t) => t.projectId === p.id && t.status === 'Terminé').length;
    const advancement = Math.round((doneTasks / p.totalTasks) * 100);
    return { ...p, avgScore, daysToDeadline, advancement, taskCount: pTasks.length };
  });

  // Analyse charge employés
  const overloadedEmployees = employeeWorkload.filter((e) => e.activeTasks >= OVERLOAD_THRESHOLD);

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

        {/* KPIs risque */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Risque élevé', value: highRisk, icon: '🔴', bg: '#fff5f5', color: '#991b1b', border: '#fecaca' },
            { label: 'Risque moyen', value: mediumRisk, icon: '🟡', bg: '#fffbeb', color: '#854d0e', border: '#fde68a' },
            { label: 'Risque faible', value: lowRisk, icon: '🟢', bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
            { label: 'Employés surchargés', value: overloadedEmployees.length, icon: '⚠️', bg: '#fff7ed', color: '#9a3412', border: '#fed7aa' },
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
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '15px' }}>📁 Analyse du risque par projet</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Projet', 'Avancement', 'Jours restants', 'Score risque moyen', 'Niveau', 'Tâches à risque'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '13px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projectRisk.map((p) => {
                  const risk = getRiskLevel(p.avgScore);
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <Link to={`/projects/${p.id}`} style={{ fontWeight: 600, color: '#0f172a', textDecoration: 'none' }}>{p.name}</Link>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '80px', height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${p.advancement}%`, background: p.advancement === 100 ? '#16a34a' : '#1d4ed8', borderRadius: '999px' }} />
                          </div>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{p.advancement}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '13px', color: p.daysToDeadline <= 10 ? '#ef4444' : '#475569', fontWeight: p.daysToDeadline <= 10 ? 700 : 400 }}>
                          {p.daysToDeadline <= 0 ? '⚠ Dépassé' : `${p.daysToDeadline}j`}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${p.avgScore}%`, background: p.avgScore >= 70 ? '#ef4444' : p.avgScore >= 40 ? '#f59e0b' : '#16a34a', borderRadius: '999px' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: risk.color }}>{p.avgScore}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: risk.bg, color: risk.color }}>
                          {risk.icon} {risk.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '13px', color: '#475569' }}>{p.taskCount} tâches analysées</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charge de travail */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontWeight: 600, color: '#0f172a', margin: '0 0 16px 0', fontSize: '15px' }}>👥 Analyse de la charge de travail</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {employeeWorkload.map((e) => {
              const overloaded = e.activeTasks >= OVERLOAD_THRESHOLD;
              const loadPercent = Math.min((e.activeTasks / OVERLOAD_THRESHOLD) * 100, 100);
              return (
                <div key={e.name} style={{ padding: '14px', borderRadius: '12px', border: `1.5px solid ${overloaded ? '#fecaca' : '#e2e8f0'}`, background: overloaded ? '#fff5f5' : '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '13px' }}>{e.name}</p>
                    {overloaded && <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 6px', borderRadius: '20px', background: '#fee2e2', color: '#991b1b' }}>Surchargé</span>}
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 6px 0' }}>
                    Charge : <strong style={{ color: overloaded ? '#ef4444' : '#0f172a' }}>{e.activeTasks}</strong> / {OVERLOAD_THRESHOLD} tâches actives
                  </p>
                  <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${loadPercent}%`, background: overloaded ? '#ef4444' : '#1d4ed8', borderRadius: '999px', transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })}
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
                <option value="eleve">🔴 Élevé</option>
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
                  {['Tâche', 'Assigné à', 'Avancement', 'Jours restants', 'Score risque', 'Niveau', 'Causes'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '13px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((t) => {
                  const risk = getRiskLevel(t.score);
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', borderLeft: `4px solid ${risk.color}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ fontWeight: 600, color: '#0f172a', margin: 0 }}>{t.title}</p>
                        <p style={{ color: '#94a3b8', fontSize: '11px', margin: '2px 0 0 0' }}>{t.project}</p>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#475569' }}>{t.assignee}</td>
                      <td style={{ padding: '14px 16px', minWidth: '120px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '60px', height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${t.progress}%`, background: t.progress === 100 ? '#16a34a' : '#1d4ed8', borderRadius: '999px' }} />
                          </div>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{t.progress}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '13px', color: t.daysLeft <= 3 ? '#ef4444' : t.daysLeft <= 7 ? '#f59e0b' : '#475569', fontWeight: t.daysLeft <= 7 ? 700 : 400 }}>
                          {t.daysLeft <= 0 ? '⚠ En retard' : `${t.daysLeft}j`}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '50px', height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${t.score}%`, background: risk.color, borderRadius: '999px' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: risk.color }}>{t.score}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: risk.bg, color: risk.color }}>
                          {risk.icon} {risk.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', maxWidth: '220px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {t.causes.map((cause, i) => (
                            <span key={i} style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ color: risk.color }}>•</span> {cause}
                            </span>
                          ))}
                        </div>
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
