import { Link } from 'react-router';

const myTasks = [
  { id: 'T-001', title: 'Maquette page accueil', project: 'Refonte e-commerce', projectId: 'PRJ-001', due: '2025-03-20', priority: 'Haute', status: 'En cours', progress: 60 },
  { id: 'T-003', title: 'Tests module RH', project: 'App mobile RH', projectId: 'PRJ-002', due: '2025-04-01', priority: 'Moyenne', status: 'En révision', progress: 80 },
  { id: 'T-006', title: 'Charte graphique B2B', project: 'Portail B2B', projectId: 'PRJ-004', due: '2025-04-05', priority: 'Moyenne', status: 'À faire', progress: 0 },
];

const myProjects = [
  { id: 'PRJ-001', name: 'Refonte site e-commerce', progress: 65, role: 'Développeuse Front', status: 'En cours' },
  { id: 'PRJ-002', name: 'Application mobile RH', progress: 20, role: 'QA', status: 'En cours' },
];

const priorityColor: Record<string, { bg: string; color: string }> = {
  'Haute': { bg: '#fee2e2', color: '#991b1b' },
  'Moyenne': { bg: '#fef9c3', color: '#854d0e' },
  'Basse': { bg: '#dcfce7', color: '#166634' },
};

const statusColor: Record<string, { bg: string; color: string }> = {
  'En cours': { bg: '#dbeafe', color: '#1e40af' },
  'En révision': { bg: '#fef9c3', color: '#854d0e' },
  'À faire': { bg: '#f1f5f9', color: '#475569' },
  'Terminé': { bg: '#dcfce7', color: '#166534' },
};

export default function EmployeDashboard() {
  const doneTasks = myTasks.filter((t) => t.status === 'Terminé').length;
  const inProgress = myTasks.filter((t) => t.status === 'En cours').length;
  const avgProgress = Math.round(myTasks.reduce((acc, t) => acc + t.progress, 0) / myTasks.length);

  // Tâches urgentes — deadline dans moins de 5 jours
  const urgentTasks = myTasks.filter((t) => {
    const daysLeft = Math.ceil((new Date(t.due).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 5 && t.status !== 'Terminé';
  });

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>Mon tableau de bord</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Vos tâches et projets assignés</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Mes tâches', value: myTasks.length, sub: `${doneTasks} terminées`, icon: '✅', color: '#1e3a8a', light: '#eff6ff' },
          { label: 'En cours', value: inProgress, sub: 'actuellement', icon: '⚡', color: '#0369a1', light: '#f0f9ff' },
          { label: 'Avancement moyen', value: `${avgProgress}%`, sub: 'toutes tâches', icon: '📊', color: '#166534', light: '#f0fdf4' },
          { label: 'Tâches urgentes', value: urgentTasks.length, sub: 'deadline < 5j', icon: '🔴', color: '#991b1b', light: '#fff5f5' },
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
            {myTasks.map((t) => {
              const pc = priorityColor[t.priority];
              const sc = statusColor[t.status];
              const daysLeft = Math.ceil((new Date(t.due).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={t.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '13px' }}>{t.title}</p>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: pc.bg, color: pc.color, flexShrink: 0, marginLeft: '8px' }}>{t.priority}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 6px', borderRadius: '20px', background: sc.bg, color: sc.color }}>{t.status}</span>
                    <span style={{ fontSize: '11px', color: daysLeft <= 3 ? '#ef4444' : '#94a3b8', fontWeight: daysLeft <= 3 ? 700 : 400 }}>
                      {daysLeft <= 0 ? '⚠ En retard' : `${daysLeft}j restants`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ flex: 1, height: '4px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${t.progress}%`, background: t.progress === 100 ? '#16a34a' : '#1d4ed8', borderRadius: '999px' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{t.progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Projets assignés */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '15px' }}>Projets assignés</h2>
            <Link to="/projects" style={{ fontSize: '13px', color: '#1e40af', textDecoration: 'none', fontWeight: 500 }}>Voir tout →</Link>
          </div>
          <div>
            {myProjects.map((p) => (
              <div key={p.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Link to={`/projects/${p.id}`} style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px', textDecoration: 'none' }}>{p.name}</Link>
                  <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '20px' }}>{p.role}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${p.progress}%`, background: '#1d4ed8', borderRadius: '999px' }} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{p.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}