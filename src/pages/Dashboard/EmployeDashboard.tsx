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
  chef_nom: string;
}

// ── Design tokens — same palette as all other pages ──────────
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

export default function EmployeDashboard() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    total_taches: 0,
    taches_terminees: 0,
    taches_en_cours: 0,
    progression_moyenne: 0,
    taches_urgentes: 0,
  });

  // ── Fetch ────────────────────────────────────────────────
  const fetchMesTaches = async () => {
    try {
      const r = await fetch(`${API_URL}/projets/taches/mes-taches`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) {
        const tasksData: Task[] = d.taches.map((t: any) => ({
          id: t.id,
          titre: t.titre,
          projet_nom: t.nom_projet || 'Sans projet',
          projet_id: t.projet_id,
          date_echeance: t.date_echeance,
          priorite: t.priorite,
          statut: t.statut,
          progression: t.progression || 0,
        }));
        setTasks(tasksData);
        const total      = tasksData.length;
        const terminees  = tasksData.filter(t => t.statut === 'termine').length;
        const enCours    = tasksData.filter(t => t.statut === 'en_cours').length;
        const progMoy    = total > 0 ? Math.round(tasksData.reduce((a, t) => a + t.progression, 0) / total) : 0;
        const urgentes   = tasksData.filter(t => {
          const j = Math.ceil((new Date(t.date_echeance).getTime() - Date.now()) / 86400000);
          return j <= 5 && j >= 0 && t.statut !== 'termine';
        }).length;
        setStats({ total_taches: total, taches_terminees: terminees, taches_en_cours: enCours, progression_moyenne: progMoy, taches_urgentes: urgentes });
      }
    } catch (e) { console.error(e); }
  };

  const fetchMesProjets = async () => {
    try {
      const r = await fetch(`${API_URL}/projets`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) {
        const filtered = d.projets.filter((p: any) => tasks.some(t => t.projet_id === p.id));
        setProjects(filtered.map((p: any) => ({ id: p.id, nom_projet: p.nom_projet, progression: p.progression || 0, chef_nom: p.chef_nom || 'Non assigné' })));
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (token && user) {
      (async () => { setLoading(true); await fetchMesTaches(); setLoading(false); })();
    }
  }, [token, user]);

  useEffect(() => { if (tasks.length > 0) fetchMesProjets(); }, [tasks]);

  // ── Helpers ──────────────────────────────────────────────
  const traduireStatut = (s: string) => ({ a_faire: 'À faire', en_cours: 'En cours', termine: 'Terminé' }[s] || s);
  const traduirePriorite = (p: string) => ({ haute: 'Haute', moyenne: 'Moyenne', faible: 'Basse' }[p] || p);

  const priorityStyle: Record<string, { bg: string; color: string; bar: string }> = {
    haute:   { bg: T.rose50,   color: T.rose,    bar: T.rose    },
    moyenne: { bg: T.amber50,  color: T.amber,   bar: T.amber   },
    faible:  { bg: T.green50,  color: T.green,   bar: T.green   },
  };

  const statusStyle: Record<string, { bg: string; color: string; bar: string }> = {
    a_faire:  { bg: T.slate100, color: T.slate600, bar: T.slate400 },
    en_cours: { bg: T.blue50,   color: T.blue600,  bar: T.blue600  },
    termine:  { bg: T.green50,  color: T.green,    bar: T.green    },
  };

  const daysLeft = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

  const completionRate = stats.total_taches > 0
    ? Math.round((stats.taches_terminees / stats.total_taches) * 100) : 0;

  // ── Loading ──────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ width: 44, height: 44, border: `3px solid ${T.blue100}`, borderTop: `3px solid ${T.blue600}`, borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <p style={{ color: T.slate500, fontWeight: 500, fontSize: 14 }}>Chargement...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── KPI cards ────────────────────────────────────────────
  const kpiCards = [
    { label: 'Mes tâches',       value: stats.total_taches,         sub: `${stats.taches_terminees} terminées`,  accent: T.blue600,  accentLight: T.blue50,  accentMid: T.blue100,  icon: '◈', progress: completionRate },
    { label: 'En cours',         value: stats.taches_en_cours,      sub: 'actuellement actives',                 accent: T.slate700, accentLight: T.slate100, accentMid: T.slate300, icon: '◉' },
    { label: 'Avancement moyen', value: `${stats.progression_moyenne}%`, sub: 'toutes tâches confondues',         accent: T.green,    accentLight: T.green50,  accentMid: T.greenMid, icon: '◎' },
    { label: 'Tâches urgentes',  value: stats.taches_urgentes,      sub: 'deadline < 5 jours',                   accent: T.rose,     accentLight: T.rose50,   accentMid: T.roseMid,  icon: '▲',
      tag: stats.taches_urgentes > 0 ? 'Attention' : null, tagColor: T.rose, tagBg: T.rose50 },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", display: 'flex', flexDirection: 'column', gap: 28 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
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
          <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700, color: T.blue600, letterSpacing: 1.2, textTransform: 'uppercase' }}>Mon espace</p>
          <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: T.slate900, letterSpacing: '-0.5px' }}>
            Bonjour, <span style={{ color: T.blue600 }}>{(user as any)?.nom_complet?.split(' ')[0] || 'Employé'}</span> 👋
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.slate500, fontWeight: 500 }}>Tableau de bord Employé</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.white, border: `1px solid ${T.slate100}`, borderRadius: 14, padding: '10px 16px', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
          <span className="dot-pulse" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: T.green }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: T.slate700 }}>Connecté</span>
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
            <p style={{ margin: '0 0 6px', fontSize: '1.95rem', fontWeight: 800, color: T.slate900, letterSpacing: '-1px', lineHeight: 1 }}>{card.value}</p>
            <p style={{ margin: 0, fontSize: 11, color: T.slate500, fontWeight: 500 }}>{card.sub}</p>
            {card.progress !== undefined && (
              <div style={{ marginTop: 10, height: 4, background: card.accentLight, borderRadius: 99, overflow: 'hidden', border: `1px solid ${card.accentMid}` }}>
                <div style={{ height: '100%', width: `${card.progress}%`, background: card.accent, borderRadius: 99, transition: 'width 1s ease' }} />
              </div>
            )}
            {(card as any).tag && (
              <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5, background: (card as any).tagBg, border: `1px solid ${(card as any).tagColor}22`, borderRadius: 20, padding: '3px 10px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: (card as any).tagColor, display: 'inline-block' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: (card as any).tagColor }}>{(card as any).tag}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Taches + Projets ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Mes tâches */}
        <div className="fu chart-card" style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.slate100}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)', animationDelay: '.24s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${T.slate100}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 3, height: 18, background: T.blue600, borderRadius: 99 }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: T.slate900 }}>Mes tâches</span>
                <p style={{ margin: 0, fontSize: 11, color: T.slate500 }}>{stats.total_taches} tâches au total</p>
              </div>
            </div>
            <Link to="/tasks" style={{ fontSize: 12, fontWeight: 600, color: T.blue600, background: T.blue50, border: `1px solid ${T.blue100}`, borderRadius: 20, padding: '4px 12px', textDecoration: 'none' }}>
              Voir tout →
            </Link>
          </div>

          {tasks.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: T.slate500 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              <p style={{ margin: 0, fontWeight: 500 }}>Aucune tâche assignée</p>
            </div>
          ) : tasks.slice(0, 5).map(t => {
            const pc  = priorityStyle[t.priorite] || { bg: T.slate100, color: T.slate500, bar: T.slate400 };
            const sc  = statusStyle[t.statut]    || { bg: T.slate100, color: T.slate500, bar: T.slate400 };
            const jl  = daysLeft(t.date_echeance);
            const urgent = jl <= 3 && t.statut !== 'termine';
            return (
              <div key={t.id} className="prow" style={{ padding: '13px 20px', borderBottom: `1px solid ${T.slate50}`, borderLeft: `3px solid ${pc.bar}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: T.slate900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titre}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: T.slate400 }}>{t.projet_nom}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: pc.bg, color: pc.color }}>{traduirePriorite(t.priorite)}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color }}>{traduireStatut(t.statut)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <div style={{ flex: 1, height: 4, background: T.slate100, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${t.progression}%`, background: sc.bar, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.slate600, minWidth: 28 }}>{t.progression}%</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: urgent ? T.rose : T.slate400, fontWeight: urgent ? 700 : 400 }}>
                  {jl < 0 ? '⚠️ En retard' : jl === 0 ? '⚠️ Aujourd\'hui' : `${jl}j restants`}
                </p>
              </div>
            );
          })}
        </div>

        {/* Mes projets */}
        <div className="fu chart-card" style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.slate100}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)', animationDelay: '.32s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${T.slate100}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 3, height: 18, background: T.green, borderRadius: 99 }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: T.slate900 }}>Mes projets</span>
                <p style={{ margin: 0, fontSize: 11, color: T.slate500 }}>{projects.length} projets actifs</p>
              </div>
            </div>
            <Link to="/projects" style={{ fontSize: 12, fontWeight: 600, color: T.green, background: T.green50, border: `1px solid ${T.greenMid}`, borderRadius: 20, padding: '4px 12px', textDecoration: 'none' }}>
              Voir tout →
            </Link>
          </div>

          {projects.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: T.slate500 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
              <p style={{ margin: 0, fontWeight: 500 }}>Aucun projet trouvé</p>
            </div>
          ) : projects.slice(0, 5).map(p => (
            <div key={p.id} className="prow" style={{ padding: '13px 20px', borderBottom: `1px solid ${T.slate50}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <Link to={`/projects/${p.id}`} style={{ fontWeight: 700, fontSize: 13, color: T.slate900, textDecoration: 'none' }}>{p.nom_projet}</Link>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.blue600 }}>{p.progression}%</span>
              </div>
              <div style={{ height: 5, background: T.slate100, borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${p.progression}%`, background: T.blue600, borderRadius: 99 }} />
              </div>
              <p style={{ margin: 0, fontSize: 11, color: T.slate400, fontWeight: 500 }}>
                Chef : {p.chef_nom}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Global banner ── */}
      <div className="fu" style={{ background: `linear-gradient(135deg, ${T.navy950} 0%, ${T.navy900} 55%, ${T.blue600} 100%)`, borderRadius: 20, padding: '24px 26px', animationDelay: '.44s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: 1 }}>Mon activité</p>
            <h2 style={{ margin: 0, fontWeight: 700, color: T.white, fontSize: 15 }}>Résumé de mon travail</h2>
          </div>
          <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 12, padding: '6px 14px', border: '1px solid rgba(255,255,255,.2)' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', fontWeight: 600 }}>Employé</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12 }}>
          {[
            { label: 'Total tâches',      value: stats.total_taches,         icon: '📋' },
            { label: 'Terminées',         value: stats.taches_terminees,     icon: '✅' },
            { label: 'En cours',          value: stats.taches_en_cours,      icon: '⚡' },
            { label: 'Urgentes',          value: stats.taches_urgentes,      icon: '⚠️' },
            { label: 'Avancement moyen',  value: `${stats.progression_moyenne}%`, icon: '📊' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,.1)', borderRadius: 14, padding: '16px 14px', border: '0.5px solid rgba(255,255,255,.15)', textAlign: 'center', transition: 'background .2s', cursor: 'default' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.18)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.1)')}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <p style={{ margin: '0 0 4px', fontSize: '1.55rem', fontWeight: 800, color: T.white, lineHeight: 1, letterSpacing: '-0.5px' }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,.6)', lineHeight: 1.4, fontWeight: 500 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}