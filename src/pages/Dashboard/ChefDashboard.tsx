import { Link } from 'react-router';

const myProjects = [
  { id: 'PRJ-001', name: 'Refonte site e-commerce', progress: 65, tasks: 18, done: 10, status: 'En cours', deadline: '2025-04-30' },
  { id: 'PRJ-004', name: 'Portail client B2B', progress: 5, tasks: 9, done: 0, status: 'En attente', deadline: '2025-06-30' },
];

const teamTasks = [
  { id: 'T-001', title: 'Maquette page accueil', assignee: 'Nadia B.', status: 'En cours', progress: 60, due: '2025-03-20', priority: 'Haute' },
  { id: 'T-002', title: 'API authentification', assignee: 'Karim O.', status: 'En cours', progress: 40, due: '2025-03-25', priority: 'Haute' },
  { id: 'T-005', title: 'Intégration Stripe', assignee: 'Karim O.', status: 'À faire', progress: 0, due: '2025-04-10', priority: 'Haute' },
  { id: 'T-006', title: 'Charte graphique B2B', assignee: 'Nadia B.', status: 'À faire', progress: 0, due: '2025-04-05', priority: 'Moyenne' },
];

const team = [
  { name: 'Sara Mansouri', role: 'Dev Front', tasks: 2, done: 1 },
  { name: 'Karim Ouali', role: 'Dev Back', tasks: 3, done: 1 },
  { name: 'Nadia Bouzid', role: 'UI/UX', tasks: 2, done: 0 },
  { name: 'Mehdi Rahali', role: 'QA', tasks: 1, done: 0 },
];

// Tâches risquées — deadline proche et avancement faible
const riskyTasks = teamTasks.filter((t) => {
  const daysLeft = Math.ceil((new Date(t.due).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  return daysLeft <= 10 && t.progress < 50;
});

const statusColor: Record<string, { bg: string; color: string }> = {
  'En cours': { bg: '#dbeafe', color: '#1e40af' },
  'Terminé': { bg: '#dcfce7', color: '#166534' },
  'En attente': { bg: '#fef9c3', color: '#854d0e' },
  'À faire': { bg: '#f1f5f9', color: '#475569' },
};

const priorityColor: Record<string, { bg: string; color: string }> = {
  'Haute': { bg: '#fee2e2', color: '#991b1b' },
  'Moyenne': { bg: '#fef9c3', color: '#854d0e' },
  'Basse': { bg: '#dcfce7', color: '#166534' },
};

export default function ChefDashboard() {
  const totalTasks = teamTasks.length;
  const doneTasks = teamTasks.filter((t) => t.status === 'Terminé').length;
  const inProgressTasks = teamTasks.filter((t) => t.status === 'En cours').length;
  const completionRate = Math.round((doneTasks / totalTasks) * 100) || 0;

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>Tableau de bord — Chef de projet</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Suivi de vos projets et tâches</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Mes projets', value: myProjects.length, sub: `${myProjects.filter((p) => p.status === 'En cours').length} en cours`, icon: '📁', color: '#1e3a8a', light: '#eff6ff' },
          { label: 'Tâches équipe', value: totalTasks, sub: `${inProgressTasks} en cours`, icon: '✅', color: '#0369a1', light: '#f0f9ff' },
          { label: 'Tâches risquées', value: riskyTasks.length, sub: 'deadline proche', icon: '⚠️', color: '#991b1b', light: '#fff5f5' },
          { label: 'Taux complétion', value: `${completionRate}%`, sub: `${doneTasks}/${totalTasks} terminées`, icon: '📊', color: '#166534', light: '#f0fdf4' },
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

        {/* Mes projets */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '15px' }}>Mes projets</h2>
            <Link to="/projects" style={{ fontSize: '13px', color: '#1e40af', textDecoration: 'none', fontWeight: 500 }}>Voir tout →</Link>
          </div>
          <div>
            {myProjects.map((p) => {
              const sc = statusColor[p.status];
              return (
                <div key={p.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Link to={`/projects/${p.id}`} style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px', textDecoration: 'none' }}>{p.name}</Link>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: sc.bg, color: sc.color }}>{p.status}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p.progress}%`, background: '#1d4ed8', borderRadius: '999px' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{p.progress}%</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{p.done}/{p.tasks} tâches · Deadline : {p.deadline}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tâches risquées */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '15px' }}>⚠️ Tâches risquées</h2>
            <Link to="/tasks" style={{ fontSize: '13px', color: '#1e40af', textDecoration: 'none', fontWeight: 500 }}>Voir tout →</Link>
          </div>
          <div>
            {riskyTasks.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                ✅ Aucune tâche risquée
              </div>
            ) : riskyTasks.map((t) => {
              const daysLeft = Math.ceil((new Date(t.due).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const riskScore = Math.round(((100 - t.progress) * 100) / Math.max(daysLeft, 1));
              const pc = priorityColor[t.priority];
              return (
                <div key={t.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc', borderLeft: '4px solid #ef4444' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '13px' }}>{t.title}</p>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', background: '#fee2e2', color: '#991b1b' }}>
                      Risque: {Math.min(riskScore, 100)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 6px', borderRadius: '20px', background: pc.bg, color: pc.color }}>{t.priority}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{t.assignee} · {daysLeft}j restants · {t.progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charge équipe */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '15px' }}>Charge de travail équipe</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: '#f1f5f9' }}>
          {team.map((m) => {
            const efficiency = m.tasks > 0 ? Math.round((m.done / m.tasks) * 100) : 0;
            const overloaded = m.tasks - m.done > 2;
            return (
              <div key={m.name} style={{ background: '#fff', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                    {m.name[0]}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '13px' }}>{m.name}</p>
                    <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>{m.role}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                  <span>{m.tasks} tâches · {m.done} terminées</span>
                  {overloaded && <span style={{ color: '#ef4444', fontWeight: 600 }}>Surchargé</span>}
                </div>
                <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${efficiency}%`, background: overloaded ? '#ef4444' : '#1d4ed8', borderRadius: '999px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}