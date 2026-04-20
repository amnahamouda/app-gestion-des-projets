import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

interface Projet {
  id: number;
  nom_projet: string;
  statut: string;
  progression: number;
  date_fin_prevue: string;
  nb_taches: number;
  taches_terminees: number;
}

interface Tache {
  id: number;
  titre: string;
  assigne_nom: string;
  statut: string;
  progression: number;
  priorite: string;
  date_echeance: string;
  score_risque?: number;
  niveau_risque?: string;
}

interface ChargeEmploye {
  id: number;
  nom: string;
  role: string;
  charge: number;
  details: { taches_actives: number; taches_terminees: number; };
  statut: string;
}

interface StatsGlobales {
  total_projets: number;
  projets_en_cours: number;
  projets_termines: number;
  projets_en_retard: number;
  total_taches_equipe: number;
  taches_en_cours: number;
  taches_risquees: number;
  taux_completion: number;
  progression_moyenne: number;
}

// ── Design tokens — same palette as AdminDashboard, TeamPage, RiskAnalysis ──
const T = {
  navy950: '#0c1a3a',
  navy900: '#0f2057',
  navy800: '#1a2e6e',
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

const kpiDefs = [
  { label: 'Mes projets',        icon: '◈', accent: T.blue600,  accentLight: T.blue50,   accentMid: T.blue100  },
  { label: 'Taches equipe',      icon: '◉', accent: T.slate700, accentLight: T.slate100, accentMid: T.slate300 },
  { label: 'Taches risquees',    icon: '▲', accent: T.rose,     accentLight: T.rose50,   accentMid: T.roseMid  },
  { label: 'Taux completion',    icon: '◎', accent: T.green,    accentLight: T.green50,  accentMid: T.greenMid },
  { label: 'Progression moyenne',icon: '◐', accent: T.navy900,  accentLight: T.blue50,   accentMid: T.blue100  },
];

export default function ChefDashboard() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsGlobales>({
    total_projets: 0, projets_en_cours: 0, projets_termines: 0,
    projets_en_retard: 0, total_taches_equipe: 0, taches_en_cours: 0,
    taches_risquees: 0, taux_completion: 0, progression_moyenne: 0,
  });
  const [projets, setProjets] = useState<Projet[]>([]);
  const [tachesRisquees, setTachesRisquees] = useState<Tache[]>([]);
  const [chargeEquipe, setChargeEquipe] = useState<ChargeEmploye[]>([]);

  // ── Fetch ────────────────────────────────────────────────
  const fetchProjetsParStatut = async () => {
    try {
      const r = await fetch(`${API_URL}/dashboard/projets/statuts`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) {
        const p = d.projets || [];
        setProjets(p);
        setStats(prev => ({
          ...prev,
          total_projets: p.length,
          projets_en_cours:  p.filter((x: any) => x.statut === 'en_cours').length,
          projets_termines:  p.filter((x: any) => x.statut === 'termine').length,
          projets_en_retard: p.filter((x: any) => x.statut === 'en_retard').length,
        }));
      }
    } catch (e) { console.error(e); }
  };

  const fetchChargeEquipe = async () => {
    try {
      const r = await fetch(`${API_URL}/dashboard/charge-equipe`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) {
        setChargeEquipe(d.equipe || []);
        const total      = d.equipe?.reduce((a: number, e: any) => a + e.charge, 0) || 0;
        const encours    = d.equipe?.reduce((a: number, e: any) => a + (e.details?.taches_actives || 0), 0) || 0;
        const done       = d.equipe?.reduce((a: number, e: any) => a + (e.details?.taches_terminees || 0), 0) || 0;
        const progression= d.equipe?.reduce((a: number, e: any) => a + (e.charge > 0 ? ((e.details?.taches_terminees || 0) / e.charge) * 100 : 0), 0) || 0;
        const moyenne    = d.equipe?.length > 0 ? Math.round(progression / d.equipe.length) : 0;
        setStats(prev => ({ ...prev, total_taches_equipe: total, taches_en_cours: encours, taux_completion: total > 0 ? Math.round((done / total) * 100) : 0, progression_moyenne: moyenne }));
      }
    } catch (e) { console.error(e); }
  };

  const fetchTachesRisquees = async () => {
    try {
      const r = await fetch(`${API_URL}/dashboard/taches-risquees`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) {
        setTachesRisquees(d.taches_risquees || []);
        setStats(prev => ({ ...prev, taches_risquees: d.stats_risques?.total_risquees || 0 }));
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (token && user) {
      (async () => {
        setLoading(true);
        await Promise.all([fetchProjetsParStatut(), fetchChargeEquipe(), fetchTachesRisquees()]);
        setLoading(false);
      })();
    }
  }, [token, user]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ width: 44, height: 44, border: `3px solid ${T.blue100}`, borderTop: `3px solid ${T.blue600}`, borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <p style={{ color: T.slate500, fontWeight: 500, fontSize: 14 }}>Chargement...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── KPI values ───────────────────────────────────────────
  const kpiValues = [
    { value: stats.total_projets,        sub: `${stats.projets_en_cours} en cours · ${stats.projets_termines} termines`,                    tag: stats.projets_en_retard > 0 ? `${stats.projets_en_retard} en retard` : null, tagColor: T.rose,  tagBg: T.rose50  },
    { value: stats.total_taches_equipe,  sub: `${stats.taches_en_cours} actives · ${stats.total_taches_equipe - stats.taches_en_cours} terminees`, tag: null },
    { value: stats.taches_risquees,      sub: 'deadline proche ou depassee',                                                                tag: stats.taches_risquees > 0 ? 'Attention' : null, tagColor: T.rose, tagBg: T.rose50 },
    { value: `${stats.taux_completion}%`,sub: `${stats.total_taches_equipe - stats.taches_en_cours}/${stats.total_taches_equipe} terminees`, progress: stats.taux_completion, tag: null },
    { value: `${stats.progression_moyenne || 0}%`, sub: 'tous projets confondus', tag: null },
  ];

  const sMap: Record<string, { label: string; color: string; bg: string; bar: string }> = {
    en_cours:  { label: 'En cours',  color: T.blue600, bg: T.blue50,  bar: T.blue600 },
    termine:   { label: 'Termine',   color: T.green,   bg: T.green50, bar: T.green   },
    en_retard: { label: 'En retard', color: T.rose,    bg: T.rose50,  bar: T.rose    },
  };

  const rMap: Record<string, { color: string; bg: string; border: string; label: string }> = {
    critique: { color: T.rose,    bg: T.rose50,   border: T.rose,    label: 'Critique' },
    eleve:    { color: T.amber,   bg: T.amber50,  border: T.amber,   label: 'Eleve'    },
    moyen:    { color: T.amber,   bg: T.amber50,  border: T.amberMid,label: 'Moyen'    },
    faible:   { color: T.green,   bg: T.green50,  border: T.green,   label: 'Faible'   },
  };

  const pMap: Record<string, string> = { haute: T.rose, moyenne: T.amber, faible: T.green };
  const avatarPalette = [T.blue600, T.navy900, T.purple, '#db2777', '#ea580c', T.slate700];

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", display: 'flex', flexDirection: 'column', gap: 28 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .kcard{transition:box-shadow .2s,transform .2s}
        .kcard:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(30,64,175,.13)!important}
        .prow{transition:background .12s}
        .prow:hover{background:${T.blue50}!important}
        .tcard{transition:transform .18s,box-shadow .18s}
        .tcard:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(30,64,175,.1)!important}
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
          <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700, color: T.blue600, letterSpacing: 1.2, textTransform: 'uppercase' }}>Vue d'ensemble</p>
          <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: T.slate900, letterSpacing: '-0.5px' }}>
            Bonjour, <span style={{ color: T.blue600 }}>{(user as any)?.nom_complet?.split(' ')[0] || 'Chef'}</span> 👋
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.slate500, fontWeight: 500 }}>Tableau de bord Chef de projet</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.white, border: `1px solid ${T.slate100}`, borderRadius: 14, padding: '10px 16px', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
          <span className="dot-pulse" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: T.green }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: T.slate700 }}>Connecte</span>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(185px,1fr))', gap: 14 }}>
        {kpiDefs.map((def, i) => {
          const val = kpiValues[i];
          return (
            <div key={i} className="kcard fu" style={{ background: T.white, border: `1px solid ${T.slate100}`, borderRadius: 18, padding: '20px 20px 18px', boxShadow: '0 2px 12px rgba(0,0,0,.05)', animationDelay: `${i * 0.06}s`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: def.accent, borderRadius: '18px 18px 0 0' }} />
              <div style={{ width: 42, height: 42, background: def.accentLight, border: `1px solid ${def.accentMid}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: def.accent, fontWeight: 700, marginBottom: 14 }}>
                {def.icon}
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: T.slate500, textTransform: 'uppercase', letterSpacing: '.8px' }}>{def.label}</p>
              <p style={{ margin: '0 0 6px', fontSize: '1.95rem', fontWeight: 800, color: T.slate900, letterSpacing: '-1px', lineHeight: 1 }}>{val.value}</p>
              <p style={{ margin: 0, fontSize: 11, color: T.slate500, fontWeight: 500 }}>{val.sub}</p>
              {(val as any).progress !== undefined && (
                <div style={{ marginTop: 10, height: 4, background: def.accentLight, borderRadius: 99, overflow: 'hidden', border: `1px solid ${def.accentMid}` }}>
                  <div style={{ height: '100%', width: `${(val as any).progress}%`, background: def.accent, borderRadius: 99, transition: 'width 1s ease' }} />
                </div>
              )}
              {val.tag && (
                <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5, background: val.tagBg, border: `1px solid ${val.tagColor}22`, borderRadius: 20, padding: '3px 10px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: val.tagColor, display: 'inline-block' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: val.tagColor }}>{val.tag}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Projets + Risques ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Mes projets */}
        <div className="fu chart-card" style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.slate100}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)', animationDelay: '.28s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${T.slate100}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 3, height: 18, background: T.blue600, borderRadius: 99 }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: T.slate900 }}>Mes projets</span>
                <p style={{ margin: 0, fontSize: 11, color: T.slate500 }}>{stats.total_projets} projets au total</p>
              </div>
            </div>
            <Link to="/projects" style={{ fontSize: 12, fontWeight: 600, color: T.blue600, background: T.blue50, border: `1px solid ${T.blue100}`, borderRadius: 20, padding: '4px 12px', textDecoration: 'none' }}>
              Voir tout →
            </Link>
          </div>

          {projets.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: T.slate500 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
              <p style={{ margin: '0 0 8px', fontWeight: 500 }}>Aucun projet</p>
              <Link to="/projects" style={{ fontSize: 12, color: T.blue600, fontWeight: 600 }}>Creer votre premier projet</Link>
            </div>
          ) : projets.slice(0, 4).map(p => {
            const s = sMap[p.statut] || { label: p.statut, color: T.slate500, bg: T.slate100, bar: T.slate500 };
            return (
              <div key={p.id} className="prow" style={{ padding: '13px 20px', borderBottom: `1px solid ${T.slate50}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <Link to={`/projects/${p.id}`} style={{ fontWeight: 600, fontSize: 13, color: T.slate900, textDecoration: 'none' }}>{p.nom_projet}</Link>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.color}22` }}>{s.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <div style={{ flex: 1, height: 5, background: T.slate100, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${p.progression}%`, background: s.bar, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.slate700, minWidth: 30 }}>{p.progression}%</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: T.slate500, fontWeight: 500 }}>
                  {p.taches_terminees}/{p.nb_taches} taches · {new Date(p.date_fin_prevue).toLocaleDateString('fr-FR')}
                </p>
              </div>
            );
          })}
        </div>

        {/* Taches risquees */}
        <div className="fu chart-card" style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.slate100}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)', animationDelay: '.36s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${T.slate100}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 3, height: 18, background: T.rose, borderRadius: 99 }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: T.slate900 }}>Taches risquees</span>
                <p style={{ margin: 0, fontSize: 11, color: T.slate500 }}>{stats.taches_risquees} taches à risque</p>
              </div>
            </div>
            <Link to="/tasks" style={{ fontSize: 12, fontWeight: 600, color: T.rose, background: T.rose50, border: `1px solid ${T.roseMid}`, borderRadius: 20, padding: '4px 12px', textDecoration: 'none' }}>
              Voir tout →
            </Link>
          </div>

          {tachesRisquees.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: T.slate500 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
              <p style={{ margin: 0, fontWeight: 500 }}>Aucune tache risquee</p>
            </div>
          ) : tachesRisquees.slice(0, 5).map(t => {
            const rk = (t.niveau_risque || 'moyen').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const r  = rMap[rk] || rMap['moyen'];
            const pc = pMap[t.priorite] || T.slate500;
            return (
              <div key={t.id} className="prow" style={{ padding: '13px 20px', borderBottom: `1px solid ${T.slate50}`, borderLeft: `3px solid ${r.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: T.slate900, flex: 1, marginRight: 8 }}>{t.titre}</p>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: r.bg, color: r.color, border: `1px solid ${r.border}33`, whiteSpace: 'nowrap' }}>{r.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: pc, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: T.slate500, fontWeight: 500 }}>
                    {t.priorite === 'haute' ? 'Haute' : t.priorite === 'moyenne' ? 'Moyenne' : 'Basse'} · {t.assigne_nom} · {t.progression}%
                  </span>
                </div>
                <div style={{ height: 4, background: T.slate100, borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${t.progression}%`, background: r.color, borderRadius: 99 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Charge equipe ── */}
      <div className="fu chart-card" style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.slate100}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)', animationDelay: '.44s' }}>
        <div style={{ padding: '16px 22px', borderBottom: `1px solid ${T.slate100}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 18, background: T.purple, borderRadius: 99 }} />
          <div>
            <span style={{ fontWeight: 700, fontSize: 14, color: T.slate900 }}>Charge de travail equipe</span>
            <p style={{ margin: 0, fontSize: 11, color: T.slate500 }}>{chargeEquipe.length} membres</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, padding: 18 }}>
          {chargeEquipe.length === 0 ? (
            <div style={{ textAlign: 'center', color: T.slate500, padding: 32, gridColumn: '1/-1' }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>👥</div>
              <p style={{ margin: 0 }}>Aucun employe dans l'equipe</p>
            </div>
          ) : chargeEquipe.map(m => {
            const total      = m.charge;
            const done       = m.details?.taches_terminees || 0;
            const active     = m.details?.taches_actives || 0;
            const eff        = total > 0 ? Math.round((done / total) * 100) : 0;
            const overloaded = active > 3;
            const avColor    = avatarPalette[m.id % avatarPalette.length];
            return (
              <div key={m.id} className="tcard" style={{ background: overloaded ? T.rose50 : T.white, borderRadius: 16, padding: 16, border: `1px solid ${overloaded ? T.roseMid : T.slate100}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: overloaded ? T.rose : avColor, borderRadius: '16px 16px 0 0' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: 4 }}>
                  <div style={{ width: 38, height: 38, background: overloaded ? T.rose : avColor, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white, fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                    {m.nom?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: T.slate900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nom}</p>
                    <p style={{ margin: 0, fontSize: 11, color: T.slate500, fontWeight: 500 }}>{m.role === 'employe' ? 'Employe' : m.role}</p>
                  </div>
                  {overloaded && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.rose, background: T.roseMid, padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>Surcharge</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: T.slate500, fontWeight: 500 }}>{active} actives · {done} terminees</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: overloaded ? T.rose : T.blue600 }}>{eff}%</span>
                </div>
                <div style={{ height: 5, background: T.slate100, borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${eff}%`, background: overloaded ? T.rose : T.blue600, borderRadius: 99, transition: 'width .4s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Global banner ── */}
      <div className="fu" style={{ background: `linear-gradient(135deg, ${T.navy950} 0%, ${T.navy900} 55%, ${T.blue600} 100%)`, borderRadius: 20, padding: '24px 26px', animationDelay: '.52s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: 1 }}>Statistiques globales</p>
            <h2 style={{ margin: 0, fontWeight: 700, color: T.white, fontSize: 15 }}>Vue globale de mes projets</h2>
          </div>
          <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 12, padding: '6px 14px', border: '1px solid rgba(255,255,255,.2)' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', fontWeight: 600 }}>Chef de projet</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12 }}>
          {[
            { label: 'Projets en cours',  value: stats.projets_en_cours,   icon: '📁' },
            { label: 'Projets termines',  value: stats.projets_termines,    icon: '✅' },
            { label: 'Projets en retard', value: stats.projets_en_retard,   icon: '⚠️' },
            { label: 'Taches equipe',     value: stats.total_taches_equipe, icon: '📋' },
            { label: 'Taux completion',   value: `${stats.taux_completion}%`,icon: '🎯' },
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