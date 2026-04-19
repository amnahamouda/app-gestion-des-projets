import { useState, useEffect } from 'react';
import { ChartOptions } from 'chart.js';
import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

const API_URL = 'http://localhost:5000/api';

interface StatistiquesGlobales {
  utilisateurs: { total: number; admins: number; chefs_projet: number; employes: number; actifs: number; };
  projets: { total: number; en_cours: number; termines: number; en_retard: number; };
  taches: { total: number; terminees: number; en_retard: number; progression_moyenne: string; };
}

interface ActiviteRecente { date: string; connexions: number; }
interface Projet { id: number; nom_projet: string; statut: string; progression: number; chef_nom: string; }
interface User { id: number; nom_complet: string; email: string; role: string; department: string; }

// ── Design tokens ──────────────────────────────────────────
const T = {
  // Navy / Blue scale (chart primaries)
  navy950: '#0c1a3a',
  navy900: '#0f2057',
  navy800: '#1a2e6e',
  blue700: '#1d4ed8',
  blue600: '#1e40af',   // primary accent
  blue400: '#60a5fa',
  blue100: '#dbeafe',
  blue50:  '#eff6ff',

  // Slate scale
  slate900: '#0f172a',
  slate700: '#334155',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate100: '#f1f5f9',
  slate50:  '#f8fafc',
  white:    '#ffffff',

  // Status colors
  rose:     '#e11d48',
  rose50:   '#fff1f2',
  roseMid:  '#fecdd3',
  amber:    '#b45309',
  amber50:  '#fffbeb',
  green:    '#15803d',
  green50:  '#f0fdf4',
  greenMid: '#bbf7d0',
  purple:   '#6d28d9',
  purple50: '#f5f3ff',
};

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatistiquesGlobales | null>(null);
  const [activite, setActivite] = useState<ActiviteRecente[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);

  const fetchVueGlobale = async () => {
    try {
      const r = await fetch(`${API_URL}/dashboard/admin/global`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) { setStats(d.statistiques); setActivite(d.activite_recente || []); }
    } catch (e) { console.error(e); }
  };

  const fetchProjetsRecents = async () => {
    try {
      const r = await fetch(`${API_URL}/projets?limit=5`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) setProjets(d.projets || []);
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
    if (token) {
      (async () => {
        setLoading(true);
        await Promise.all([fetchVueGlobale(), fetchProjetsRecents(), fetchUsers()]);
        setLoading(false);
      })();
    }
  }, [token]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ width: 44, height: 44, border: `3px solid ${T.blue100}`, borderTop: `3px solid ${T.blue600}`, borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <p style={{ color: T.slate500, fontWeight: 500, fontSize: 14 }}>Chargement...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const totalProjets = stats?.projets.total || 0;
  const enCours = stats?.projets.en_cours || 0;
  const termines = stats?.projets.termines || 0;
  const enRetard = stats?.projets.en_retard || 0;
  const totalTaches = stats?.taches.total || 0;
  const tachesTerminees = stats?.taches.terminees || 0;
  const completionRate = totalTaches > 0 ? Math.round((tachesTerminees / totalTaches) * 100) : 0;
  const tauxActivite = (stats?.utilisateurs?.total || 0) > 0
    ? Math.round((Number(stats!.utilisateurs.actifs) / Number(stats!.utilisateurs.total)) * 100) : 0;

  // ── Chart configs ──
  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, title: { display: false } },
  };

  // ── Chart data (corporate blue/slate/navy palette) ──
  const projetsChartData = {
    labels: ['En cours', 'Termines', 'En retard'],
    datasets: [{
      label: 'Projets',
      data: [enCours, termines, enRetard],
      backgroundColor: [T.blue600, T.slate700, T.slate400],
      borderRadius: 10,
      borderSkipped: false,
    }],
  };

  const usersChartData = {
    labels: ['Admins', 'Chefs de projet', 'Employes'],
    datasets: [{
      data: [
        stats?.utilisateurs.admins || 0,
        stats?.utilisateurs.chefs_projet || 0,
        stats?.utilisateurs.employes || 0,
      ],
      backgroundColor: [T.navy900, T.blue600, T.slate400],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const tachesChartData = {
    labels: ['Terminees', 'En retard', 'En cours'],
    datasets: [{
      label: 'Taches',
      data: [
        tachesTerminees,
        stats?.taches.en_retard || 0,
        totalTaches - tachesTerminees - (stats?.taches.en_retard || 0),
      ],
      backgroundColor: [T.blue600, T.slate500, T.slate300],
      borderRadius: 10,
      borderSkipped: false,
    }],
  };

  const activiteChartData = {
    labels: activite.slice(0, 7).map(a => new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })),
    datasets: [{
      label: 'Connexions',
      data: activite.slice(0, 7).map(a => a.connexions),
      borderColor: T.blue600,
      backgroundColor: `${T.blue600}18`,
      fill: true,
      tension: 0.45,
      pointBackgroundColor: T.blue600,
      pointBorderColor: T.white,
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
    }],
  };

  const barOpts: ChartOptions<'bar'> = {
    ...chartDefaults,
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 12, family: 'DM Sans' }, color: T.slate500 } },
      y: { grid: { color: T.slate100 }, ticks: { font: { size: 11, family: 'DM Sans' }, color: T.slate500 }, beginAtZero: true },
    },
  };

  const lineOpts: ChartOptions<'line'> = {
    ...chartDefaults,
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11, family: 'DM Sans' }, color: T.slate500 } },
      y: { grid: { color: T.slate100 }, ticks: { font: { size: 11, family: 'DM Sans' }, color: T.slate500 }, beginAtZero: true },
    },
  };

  const doughnutOpts: ChartOptions<'doughnut'> = {
    ...chartDefaults,
    cutout: '68%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { font: { size: 12, family: 'DM Sans' }, color: T.slate700, padding: 16, usePointStyle: true, pointStyleWidth: 8 },
      },
      title: { display: false },
    },
  };

  const kpiCards = [
    { label: 'Total projets',     value: totalProjets,                    sub: `${enCours} en cours`,                  tag: `${termines} termines`,      tagColor: T.green,    tagBg: T.green50, accent: T.blue600,  accentLight: T.blue50,   accentMid: T.blue100,  icon: '◈' },
    { label: 'Projets en retard', value: enRetard,                        sub: 'necessitent attention',                tag: enRetard > 0 ? 'Attention' : null, tagColor: T.rose, tagBg: T.rose50,  accent: T.rose,    accentLight: T.rose50,   accentMid: T.roseMid,  icon: '▲' },
    { label: 'Utilisateurs',      value: stats?.utilisateurs.total || 0,  sub: `${stats?.utilisateurs.actifs || 0} actifs`, tag: `${tauxActivite}% actifs`, tagColor: T.blue600, tagBg: T.blue50, accent: T.slate700, accentLight: T.slate100, accentMid: T.slate300, icon: '◉' },
    { label: 'Taches creees',     value: totalTaches,                     sub: `${tachesTerminees} terminees`,         tag: `${completionRate}% complete`, tagColor: T.green,  tagBg: T.green50, accent: T.blue700,  accentLight: T.blue50,   accentMid: T.blue100,  icon: '◎', progress: completionRate },
  ];

  const avatarPalette = [T.blue600, T.navy900, T.purple, '#db2777', '#ea580c', T.slate700];

  const roleStyle: Record<string, { bg: string; color: string; label: string }> = {
    admin:       { bg: T.slate100, color: T.slate900, label: 'Admin' },
    chef_projet: { bg: T.blue50,   color: T.blue600,  label: 'Chef projet' },
    employe:     { bg: T.green50,  color: T.green,    label: 'Employe' },
  };

  const sMap: Record<string, { label: string; color: string; bg: string; bar: string }> = {
    en_cours:  { label: 'En cours',  color: T.blue600,  bg: T.blue50,  bar: T.blue600 },
    termine:   { label: 'Termine',   color: T.green,    bg: T.green50, bar: T.green },
    en_retard: { label: 'En retard', color: T.rose,     bg: T.rose50,  bar: T.rose },
  };

  const globalStats = [
    { label: 'Utilisateurs actifs', value: stats?.utilisateurs.actifs || 0,       icon: '👤', color: T.blue600 },
    { label: 'Projets crees',       value: totalProjets,                           icon: '📁', color: T.navy900 },
    { label: 'Taches crees',        value: totalTaches,                            icon: '✅', color: T.green },
    { label: 'Chefs de projet',     value: stats?.utilisateurs.chefs_projet || 0,  icon: '🎯', color: T.purple },
    { label: 'Employes',            value: stats?.utilisateurs.employes || 0,      icon: '💼', color: T.amber },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", display: 'flex', flexDirection: 'column', gap: 28 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .kcard{transition:box-shadow .2s,transform .2s}
        .kcard:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(30,64,175,.13)!important}
        .prow{transition:background .12s}
        .prow:hover{background:${T.blue50}!important}
        .chart-card{transition:box-shadow .2s}
        .chart-card:hover{box-shadow:0 8px 28px rgba(30,64,175,.1)!important}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .38s ease both}
        .dot-pulse{animation:dotPulse 2s ease-in-out infinite}
        @keyframes dotPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
      `}</style>

      {/* ── Header ── */}
      <div className="fu" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 600, color: T.blue600, letterSpacing: 1.2, textTransform: 'uppercase' }}>Vue d'ensemble</p>
          <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 700, color: T.slate900, letterSpacing: '-0.4px' }}>
            Bonjour, <span style={{ color: T.blue600 }}>{(user as any)?.nom_complet?.split(' ')[0] || 'Admin'}</span> 👋
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.slate500, fontWeight: 500 }}>Tableau de bord Administrateur</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.white, border: `1px solid ${T.slate100}`, borderRadius: 14, padding: '10px 16px', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
          <span className="dot-pulse" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: T.green }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: T.slate700 }}>Connecte</span>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
        {kpiCards.map((card, i) => (
          <div key={i} className="kcard fu" style={{ background: T.white, border: `1px solid ${T.slate100}`, borderRadius: 18, padding: '20px 20px 18px', boxShadow: '0 2px 12px rgba(0,0,0,.05)', animationDelay: `${i * 0.06}s`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: card.accent, borderRadius: '18px 18px 0 0' }} />
            <div style={{ width: 42, height: 42, background: card.accentLight, border: `1px solid ${card.accentMid}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: card.accent, fontWeight: 700, marginBottom: 14 }}>
              {card.icon}
            </div>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: T.slate500, textTransform: 'uppercase', letterSpacing: '.8px' }}>{card.label}</p>
            <p style={{ margin: '0 0 6px', fontSize: '1.95rem', fontWeight: 700, color: T.slate900, letterSpacing: '-1px', lineHeight: 1 }}>{card.value}</p>
            <p style={{ margin: 0, fontSize: 11, color: T.slate500, fontWeight: 500 }}>{card.sub}</p>
            {card.progress !== undefined && (
              <div style={{ marginTop: 10, height: 4, background: card.accentLight, borderRadius: 99, overflow: 'hidden', border: `1px solid ${card.accentMid}` }}>
                <div style={{ height: '100%', width: `${card.progress}%`, background: card.accent, borderRadius: 99 }} />
              </div>
            )}
            {card.tag && (
              <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5, background: card.tagBg, border: `1px solid ${card.tagColor}22`, borderRadius: 20, padding: '3px 10px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: card.tagColor, display: 'inline-block' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: card.tagColor }}>{card.tag}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Charts Row 1 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div className="chart-card fu" style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.slate100}`, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,.05)', animationDelay: '.24s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 3, height: 18, background: T.blue600, borderRadius: 99 }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: T.slate900 }}>Repartition des projets</span>
          </div>
          <div style={{ height: 260 }}>
            <Bar data={projetsChartData} options={barOpts} />
          </div>
        </div>

        <div className="chart-card fu" style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.slate100}`, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,.05)', animationDelay: '.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 3, height: 18, background: T.navy900, borderRadius: 99 }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: T.slate900 }}>Repartition des utilisateurs</span>
          </div>
          <div style={{ height: 260 }}>
            <Doughnut data={usersChartData} options={doughnutOpts} />
          </div>
        </div>
      </div>

      {/* ── Charts Row 2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div className="chart-card fu" style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.slate100}`, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,.05)', animationDelay: '.36s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 3, height: 18, background: T.slate700, borderRadius: 99 }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: T.slate900 }}>Etat des taches</span>
          </div>
          <div style={{ height: 260 }}>
            <Bar data={tachesChartData} options={barOpts} />
          </div>
        </div>

        <div className="chart-card fu" style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.slate100}`, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,.05)', animationDelay: '.42s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 3, height: 18, background: T.blue400, borderRadius: 99 }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: T.slate900 }}>Activite recente</span>
          </div>
          <div style={{ height: 260 }}>
            {activite.length > 0 ? (
              <Line data={activiteChartData} options={lineOpts} />
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: T.slate500, gap: 8 }}>
                <span style={{ fontSize: 32 }}>📈</span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>Aucune activite recente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Projets + Equipe ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Projets recents */}
        <div className="fu" style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.slate100}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)', animationDelay: '.48s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${T.slate100}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 3, height: 18, background: T.blue600, borderRadius: 99 }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: T.slate900 }}>Projets recents</span>
                <p style={{ margin: 0, fontSize: 11, color: T.slate500 }}>{totalProjets} projets au total</p>
              </div>
            </div>
            <Link to="/projects" style={{ fontSize: 12, fontWeight: 600, color: T.blue600, background: T.blue50, border: `1px solid ${T.blue100}`, borderRadius: 20, padding: '4px 12px', textDecoration: 'none' }}>Voir tout →</Link>
          </div>
          <div>
            {projets.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: T.slate500 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                <p style={{ margin: 0, fontWeight: 500 }}>Aucun projet</p>
              </div>
            ) : projets.slice(0, 5).map((p) => {
              const s = sMap[p.statut] || { label: p.statut, color: T.slate500, bg: T.slate100, bar: T.slate500 };
              return (
                <div key={p.id} className="prow" style={{ padding: '13px 20px', borderBottom: `1px solid ${T.slate50}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <Link to={`/projects/${p.id}`} style={{ fontWeight: 600, fontSize: 13, color: T.slate900, textDecoration: 'none' }}>{p.nom_projet}</Link>
                      <p style={{ margin: 0, fontSize: 11, color: T.slate500, fontWeight: 500 }}>Chef : {p.chef_nom || 'Non assigne'}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 5, background: T.slate100, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p.progression}%`, background: s.bar, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.slate700, minWidth: 30 }}>{p.progression}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Equipe */}
        <div className="fu" style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.slate100}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)', animationDelay: '.54s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${T.slate100}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 3, height: 18, background: T.purple, borderRadius: 99 }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: T.slate900 }}>Equipe</span>
                <p style={{ margin: 0, fontSize: 11, color: T.slate500 }}>{stats?.utilisateurs.total || 0} membres</p>
              </div>
            </div>
            <Link to="/users" style={{ fontSize: 12, fontWeight: 600, color: T.purple, background: T.purple50, border: `1px solid ${T.purple}22`, borderRadius: 20, padding: '4px 12px', textDecoration: 'none' }}>Gerer →</Link>
          </div>
          <div>
            {usersList.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: T.slate500 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
                <p style={{ margin: 0, fontWeight: 500 }}>Aucun utilisateur</p>
              </div>
            ) : usersList.slice(0, 5).map((u) => {
              const rs = roleStyle[u.role] || { bg: T.slate100, color: T.slate500, label: u.role };
              const avColor = avatarPalette[u.id % avatarPalette.length];
              return (
                <div key={u.id} className="prow" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: `1px solid ${T.slate50}` }}>
                  <div style={{ width: 36, height: 36, background: avColor, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {u.nom_complet?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: T.slate900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nom_complet}</p>
                    <p style={{ margin: 0, fontSize: 11, color: T.slate500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: rs.bg, color: rs.color, border: `1px solid ${rs.color}22`, flexShrink: 0 }}>{rs.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Stats supplementaires ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
        {[
          { label: 'Progression moyenne', value: stats?.taches.progression_moyenne || '0%', sub: 'des taches completees', accent: T.blue600,  accentLight: T.blue50,   accentMid: T.blue100,           icon: '◐' },
          { label: "Taux d'activite",     value: `${tauxActivite}%`,                        sub: 'utilisateurs actifs',  accent: T.slate700, accentLight: T.slate100, accentMid: T.slate300,          icon: '◉' },
          { label: 'Efficacite projets',  value: `${totalProjets > 0 ? Math.round((termines / totalProjets) * 100) : 0}%`, sub: 'projets termines', accent: T.green, accentLight: T.green50, accentMid: T.greenMid, icon: '◎' },
          { label: 'Charge moyenne',      value: (stats?.utilisateurs.employes || 0) > 0 ? Math.round(totalTaches / stats!.utilisateurs.employes) : 0, sub: 'taches par employe', accent: T.purple, accentLight: T.purple50, accentMid: `${T.purple}33`, icon: '◈' },
        ].map((s, i) => (
          <div key={i} className="kcard fu" style={{ background: T.white, border: `1px solid ${T.slate100}`, borderRadius: 18, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,.05)', position: 'relative', overflow: 'hidden', animationDelay: `${.6 + i * .06}s` }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent, borderRadius: '18px 18px 0 0' }} />
            <div style={{ width: 40, height: 40, background: s.accentLight, border: `1px solid ${s.accentMid}`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: s.accent, fontWeight: 700, marginBottom: 12 }}>{s.icon}</div>
            <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 600, color: T.slate500, textTransform: 'uppercase', letterSpacing: '.7px' }}>{s.label}</p>
            <p style={{ margin: '0 0 4px', fontSize: '1.8rem', fontWeight: 700, color: T.slate900, letterSpacing: '-1px', lineHeight: 1 }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 11, color: T.slate500, fontWeight: 500 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Vue globale systeme ── */}
      <div className="fu" style={{ background: `linear-gradient(135deg, ${T.navy950} 0%, ${T.navy900} 55%, ${T.blue600} 100%)`, borderRadius: 20, padding: '24px 26px', animationDelay: '.78s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: 1 }}>Statistiques globales</p>
            <h2 style={{ margin: 0, fontWeight: 700, color: T.white, fontSize: 15 }}>Vue globale du systeme</h2>
          </div>
          <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 12, padding: '6px 14px', border: '1px solid rgba(255,255,255,.2)' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', fontWeight: 600 }}>Plateforme</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12 }}>
          {globalStats.map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,.1)', borderRadius: 14, padding: '18px 14px', border: '1px solid rgba(255,255,255,.15)', textAlign: 'center', transition: 'background .2s', cursor: 'default' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.18)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.1)')}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <p style={{ margin: '0 0 4px', fontSize: '1.7rem', fontWeight: 700, color: T.white, lineHeight: 1, letterSpacing: '-0.5px' }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,.65)', lineHeight: 1.4, fontWeight: 500 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}