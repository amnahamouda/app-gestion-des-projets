import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';

const API_URL = 'http://localhost:5000/api';

interface Member {
  id: number;
  nom_complet: string;
  email: string;
  role: string;
  departement: string;
  telephone?: string;
  poste?: string;
  status: number;
  charge_actuelle?: number;
  taches_terminees?: number;
  taches_actives?: number;
  total_taches?: number;
  taches_en_retard?: number;
  disponibilite?: string;
}

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
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate100: '#f1f5f9',
  slate50:  '#f8fafc',
  white:    '#ffffff',
  rose:     '#e11d48',
  rose50:   '#fff1f2',
  roseMid:  '#fecdd3',
  green:    '#15803d',
  green50:  '#f0fdf4',
  greenMid: '#bbf7d0',
  amber:    '#b45309',
  amber50:  '#fffbeb',
  purple:   '#6d28d9',
  purple50: '#f5f3ff',
};

export default function TeamPage() {
  const { token, user, isAdmin, isChef } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState<Partial<Member>>({});
  const [form, setForm] = useState({
    nom_complet: '', email: '', password: '', role: 'employe',
    departement: '', telephone: '', poste: ''
  });
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [performanceData, setPerformanceData] = useState<any>(null);

  const fetchMembres = async () => {
    try {
      const r = await fetch(`${API_URL}/equipe/membres`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) setMembers(d.membres || []);
    } catch (e) { console.error(e); }
  };

  const fetchDisponibilite = async () => {
    try {
      const r = await fetch(`${API_URL}/equipe/disponibilite`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) {
        setMembers(d.employes.map((e: any) => ({
          id: e.id, nom_complet: e.nom, email: e.email, role: 'employe',
          departement: e.poste || 'Non défini', charge_actuelle: e.taches_actives,
          taches_terminees: e.taches_terminees, total_taches: e.total_taches,
          taches_en_retard: e.taches_en_retard, disponibilite: e.disponibilite,
        })));
      }
    } catch (e) { console.error(e); }
  };

  const fetchPerformance = async () => {
    try {
      const r = await fetch(`${API_URL}/equipe/performance`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) setPerformanceData(d);
    } catch (e) { console.error(e); }
  };

  const fetchChargeAuto = async () => {
    try {
      const r = await fetch(`${API_URL}/equipe/charge-auto`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) {
        setMembers(prev => prev.map(m => {
          const cd = d.analyse_charge?.find((c: any) => c.employe.id === m.id);
          if (cd) {
            const aFaire = cd.details?.a_faire || 0;
            const enCours = cd.details?.en_cours || 0;
            const termines = cd.details?.terminees || 0;
            return { ...m, charge_actuelle: Number(cd.charge), taches_actives: aFaire + enCours, taches_terminees: termines, total_taches: aFaire + enCours + termines };
          }
          return m;
        }));
      }
    } catch (e) { console.error(e); }
  };

  const handleCreateMember = async () => {
    if (!form.nom_complet || !form.email || !form.password || !form.departement) {
      setFormError('Tous les champs sont obligatoires.'); return;
    }
    try {
      const r = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (r.ok && d.success) {
        setShowModal(false);
        setForm({ nom_complet: '', email: '', password: '', role: 'employe', departement: '', telephone: '', poste: '' });
        setFormError('');
        setSuccessMsg(`✓ "${form.nom_complet}" ajouté avec succès`);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchMembres();
      } else { setFormError(d.message || 'Erreur lors de la création'); }
    } catch (e) { console.error(e); setFormError('Erreur de connexion'); }
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;
    try {
      const r = await fetch(`${API_URL}/equipe/membres/${selectedMember.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const d = await r.json();
      if (r.ok && d.success) {
        setSuccessMsg('✓ Membre modifié avec succès');
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchMembres(); setSelectedMember(null); setEditForm({});
      } else { setFormError(d.message || 'Erreur lors de la modification'); }
    } catch (e) { console.error(e); setFormError('Erreur de connexion'); }
  };

  const handleDesactiver = async (id: number, nom: string) => {
    if (!window.confirm(`Désactiver ${nom} ?`)) return;
    try {
      const r = await fetch(`${API_URL}/equipe/membres/${id}/desactiver`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (r.ok && d.success) {
        setSuccessMsg(`✓ ${nom} désactivé`);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchMembres();
      } else { alert(d.message || 'Erreur lors de la désactivation'); }
    } catch (e) { console.error(e); alert('Erreur de connexion'); }
  };

  const getStatus = (charge?: number): { label: string; color: string; bg: string; bar: string } => {
    const n = Number(charge) || 0;
    if (n <= 3) return { label: 'Disponible', color: T.green,  bg: T.green50, bar: T.green  };
    if (n === 4) return { label: 'Occupé',    color: T.amber,  bg: T.amber50, bar: T.amber  };
    return              { label: 'Surchargé', color: T.rose,   bg: T.rose50,  bar: T.rose   };
  };

  const getPerformance = (m: Member) => {
    const total = m.total_taches || 0;
    const done  = m.taches_terminees || 0;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  useEffect(() => {
    if (token) {
      (async () => {
        setLoading(true);
        if (isAdmin) { await fetchMembres(); await fetchChargeAuto(); }
        else if (isChef) { await fetchDisponibilite(); await fetchPerformance(); }
        setLoading(false);
      })();
    }
  }, [token, isAdmin, isChef]);

  const filtered = members.filter(m => {
    const matchSearch = m.nom_complet?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || getStatus(m.charge_actuelle).label === filterStatus;
    return matchSearch && matchStatus;
  });

  const statsCards = [
    { label: 'Total membres', value: members.length, accent: T.blue600, accentLight: T.blue50, icon: '◉' },
    { label: 'Disponibles',   value: members.filter(m => getStatus(m.charge_actuelle).label === 'Disponible').length, accent: T.green,  accentLight: T.green50, icon: '◎' },
    { label: 'Occupés',       value: members.filter(m => getStatus(m.charge_actuelle).label === 'Occupé').length,    accent: T.amber,  accentLight: T.amber50, icon: '◈' },
    { label: 'Surchargés',    value: members.filter(m => getStatus(m.charge_actuelle).label === 'Surchargé').length, accent: T.rose,   accentLight: T.rose50,  icon: '▲' },
  ];

  const roleLabels: Record<string, string> = { admin: 'Admin', chef_projet: 'Chef de projet', employe: 'Employé' };
  const roleColors: Record<string, { bg: string; color: string }> = {
    admin:       { bg: T.purple50, color: T.purple  },
    chef_projet: { bg: T.blue50,   color: T.blue600 },
    employe:     { bg: T.green50,  color: T.green   },
  };
  const avatarPalette = [T.blue600, T.navy900, T.purple, '#db2777', '#ea580c', T.slate700];

  const inputSx: React.CSSProperties = {
    padding: '11px 14px', border: `1px solid ${T.slate300}`, borderRadius: '10px',
    background: T.white, color: T.slate900, fontSize: '14px', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  };

  if (!isAdmin && !isChef) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <p style={{ color: T.slate500 }}>⛔ Accès réservé aux administrateurs et chefs de projet</p>
      <Link to="/dashboard" style={{ color: T.blue600 }}>Retour au dashboard</Link>
    </div>
  );

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ width: 44, height: 44, border: `3px solid ${T.blue100}`, borderTop: `3px solid ${T.blue600}`, borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <p style={{ color: T.slate500, fontWeight: 500, fontSize: 14 }}>Chargement...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <PageMeta title="Gestion de l'équipe" />
      <PageBreadcrumb pageTitle="Gestion de l'équipe" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .kcard{transition:box-shadow .2s,transform .2s}
        .kcard:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(30,64,175,.13)!important}
        .mcard{transition:box-shadow .2s,transform .2s}
        .mcard:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(30,64,175,.1)!important}
        .prow-btn{transition:background .15s,border-color .15s}
        .prow-btn:hover{background:${T.blue50}!important}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .35s ease both}
      `}</style>

      <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Header ── */}
        <div className="fu" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: T.blue600, letterSpacing: 1.2, textTransform: 'uppercase' }}>Équipe</p>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: T.slate900, letterSpacing: '-0.5px' }}>
              {isAdmin ? "Gestion de l'équipe" : "Disponibilité de l'équipe"}
            </h1>
            <p style={{ margin: '4px 0 12px', fontSize: 13, color: T.slate500, fontWeight: 500 }}>
              {isAdmin ? 'Ajout, modification et désactivation des membres' : 'Disponibilité et performance des employés'}
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {[
                { dot: T.green, text: '0-3 tâches : Disponible' },
                { dot: T.amber, text: '4 tâches : Occupé' },
                { dot: T.rose,  text: '5+ tâches : Surchargé' },
              ].map(s => (
                <span key={s.text} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, color: T.slate500, fontWeight: 500 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />{s.text}
                </span>
              ))}
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setShowModal(true); setFormError(''); }}
              style={{ padding: '10px 20px', background: `linear-gradient(135deg, ${T.navy950}, ${T.blue600})`, color: T.white, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 14px ${T.blue600}44` }}
            >
              + Ajouter un membre
            </button>
          )}
        </div>

        {/* ── Success banner ── */}
        {successMsg && (
          <div className="fu" style={{ padding: '12px 16px', background: T.green50, border: `1px solid ${T.greenMid}`, borderRadius: 12, color: T.green, fontWeight: 600, fontSize: 13 }}>
            {successMsg}
          </div>
        )}

        {/* ── Chef: performance globale — LIGHT VERSION ── */}
        {isChef && performanceData && (
          <div className="fu" style={{ background: T.white, borderRadius: 18, border: `1px solid ${T.blue100}`, padding: '20px 24px', boxShadow: '0 2px 12px rgba(30,64,175,.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 3, height: 18, background: T.blue600, borderRadius: 99 }} />
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.blue600, textTransform: 'uppercase', letterSpacing: 1 }}>Statistiques globales</p>
                <h2 style={{ margin: 0, fontWeight: 800, color: T.slate900, fontSize: 14 }}>Performance globale de l'équipe</h2>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
              {[
                { label: 'Tâches totales',   value: performanceData.performance_globale?.total_taches    || 0,     accent: T.blue600,  bg: T.blue50   },
                { label: 'Tâches terminées', value: performanceData.performance_globale?.taches_terminees || 0,     accent: T.green,    bg: T.green50  },
                { label: 'Taux de réussite', value: performanceData.performance_globale?.taux_reussite    || '0%',  accent: T.navy900,  bg: T.blue50   },
                { label: 'Durée moyenne',    value: performanceData.performance_globale?.duree_moyenne    || 'N/A', accent: T.slate700, bg: T.slate100 },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '16px 14px', border: `1px solid ${s.accent}18`, textAlign: 'center', transition: 'transform .15s, box-shadow .15s', cursor: 'default' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 18px ${s.accent}22`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <p style={{ margin: '0 0 6px', fontSize: 11, color: T.slate500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.6px' }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: '1.7rem', fontWeight: 800, color: s.accent, letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── KPI cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
          {statsCards.map((s, i) => (
            <div key={s.label} className="kcard fu" style={{ background: T.white, border: `1px solid ${T.slate100}`, borderRadius: 18, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,.05)', position: 'relative', overflow: 'hidden', animationDelay: `${i * 0.06}s` }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent, borderRadius: '18px 18px 0 0' }} />
              <div style={{ width: 38, height: 38, background: s.accentLight, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: s.accent, fontWeight: 700, marginBottom: 12 }}>{s.icon}</div>
              <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 600, color: T.slate500, textTransform: 'uppercase', letterSpacing: '.7px' }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, color: T.slate900, letterSpacing: '-1.5px', lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Search + filter ── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input type="text" placeholder="Rechercher un membre..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputSx, flex: 1, maxWidth: 320 }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ ...inputSx, width: 'auto', cursor: 'pointer' }}>
            <option value="all">Tous les statuts</option>
            <option value="Disponible">Disponible</option>
            <option value="Occupé">Occupé</option>
            <option value="Surchargé">Surchargé</option>
          </select>
        </div>

        {/* ── Members grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 18 }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: T.slate500 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>Aucun membre trouvé</p>
            </div>
          ) : filtered.map((m, i) => {
            const status  = getStatus(m.charge_actuelle);
            const rc      = roleColors[m.role] || { bg: T.slate100, color: T.slate500 };
            const perf    = getPerformance(m);
            const loadPct = Math.min(((m.charge_actuelle || 0) / 5) * 100, 100);
            const avColor = avatarPalette[m.id % avatarPalette.length];
            return (
              <div key={m.id} className="mcard fu" style={{ background: T.white, borderRadius: 20, border: `1px solid ${T.slate100}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)', animationDelay: `${i * 0.04}s` }}>
                <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.slate100}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 46, height: 46, background: avColor, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white, fontWeight: 700, fontSize: 17, flexShrink: 0 }}>
                    {m.nom_complet?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: T.slate900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nom_complet}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: T.slate500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</p>
                  </div>
                  <div style={{ padding: '3px 10px', borderRadius: 20, background: status.bg, border: `1px solid ${status.color}22`, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: status.color }}>{status.label}</span>
                  </div>
                </div>

                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: rc.bg, color: rc.color }}>
                      {roleLabels[m.role] || m.role}
                    </span>
                    {m.departement && (
                      <span style={{ fontSize: 11, color: T.slate500, display: 'flex', alignItems: 'center', gap: 4 }}>📂 {m.departement}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: T.slate500, fontWeight: 500 }}>Charge de travail</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: status.color }}>{m.charge_actuelle || 0} tâche(s)</span>
                    </div>
                    <div style={{ height: 5, background: T.slate100, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${loadPct}%`, background: status.bar, borderRadius: 99, transition: 'width .4s' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: T.slate500, fontWeight: 500 }}>Performance</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.blue600 }}>{perf}%</span>
                    </div>
                    <div style={{ height: 5, background: T.slate100, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${perf}%`, background: T.blue600, borderRadius: 99, transition: 'width .4s' }} />
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: T.slate400 }}>
                      {m.taches_terminees || 0} terminées · {m.total_taches || 0} au total
                    </p>
                  </div>
                </div>

                <div style={{ padding: '12px 20px', borderTop: `1px solid ${T.slate100}`, display: 'flex', gap: 10 }}>
                  <button className="prow-btn" onClick={() => setSelectedMember(m)}
                    style={{ flex: 1, padding: '8px', background: T.blue50, color: T.blue600, border: `1px solid ${T.blue100}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Voir détail
                  </button>
                  {isAdmin && (
                    <button onClick={() => handleDesactiver(m.id, m.nom_complet)}
                      style={{ padding: '8px 14px', background: T.rose50, color: T.rose, border: `1px solid ${T.roseMid}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Désactiver
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Detail modal ── */}
        {selectedMember && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
            onClick={() => setSelectedMember(null)}>
            <div style={{ background: T.white, borderRadius: 24, maxWidth: 500, width: '100%', padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,.15)' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 52, height: 52, background: `linear-gradient(135deg, ${T.navy950}, ${T.blue600})`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white, fontWeight: 700, fontSize: 20 }}>
                    {selectedMember.nom_complet?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.slate900 }}>{selectedMember.nom_complet}</h2>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: T.slate500 }}>{selectedMember.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedMember(null)} style={{ background: T.slate100, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: T.slate500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Rôle',            value: roleLabels[selectedMember.role] || selectedMember.role },
                  { label: 'Département',      value: selectedMember.departement || 'Non défini' },
                  { label: 'Statut',           value: getStatus(selectedMember.charge_actuelle).label },
                  { label: 'Tâches actives',   value: selectedMember.charge_actuelle || 0 },
                  { label: 'Tâches terminées', value: selectedMember.taches_terminees || 0 },
                  { label: 'Total tâches',     value: selectedMember.total_taches || 0 },
                ].map(info => (
                  <div key={info.label} style={{ background: T.slate50, borderRadius: 12, padding: 14, border: `1px solid ${T.slate100}` }}>
                    <p style={{ margin: '0 0 4px', fontSize: 11, color: T.slate400, fontWeight: 500 }}>{info.label}</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.slate900 }}>{info.value}</p>
                  </div>
                ))}
              </div>

              {isAdmin && (
                <div style={{ paddingTop: 20, borderTop: `1px solid ${T.slate100}` }}>
                  <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: T.slate700 }}>Modifier les informations</p>
                  {formError && (
                    <div style={{ padding: '10px 14px', background: T.rose50, border: `1px solid ${T.roseMid}`, borderRadius: 8, color: T.rose, fontSize: 13, marginBottom: 12 }}>⚠️ {formError}</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input type="text"  placeholder="Nom complet"  defaultValue={selectedMember.nom_complet}  onChange={e => setEditForm({ ...editForm, nom_complet: e.target.value })}  style={inputSx} />
                    <input type="email" placeholder="Email"         defaultValue={selectedMember.email}         onChange={e => setEditForm({ ...editForm, email: e.target.value })}        style={inputSx} />
                    <input type="text"  placeholder="Département"   defaultValue={selectedMember.departement}   onChange={e => setEditForm({ ...editForm, departement: e.target.value })}  style={inputSx} />
                    <select defaultValue={selectedMember.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} style={inputSx}>
                      <option value="employe">Employé</option>
                      <option value="chef_projet">Chef de projet</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button onClick={handleUpdateMember}
                      style={{ padding: '11px', background: `linear-gradient(135deg, ${T.navy950}, ${T.blue600})`, color: T.white, border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                      Enregistrer les modifications
                    </button>
                  </div>
                </div>
              )}

              <button onClick={() => setSelectedMember(null)}
                style={{ width: '100%', marginTop: 16, padding: '11px', background: T.slate100, border: `1px solid ${T.slate300}`, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: T.slate700 }}>
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* ── Add member modal ── */}
        {showModal && isAdmin && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
            onClick={() => setShowModal(false)}>
            <div style={{ background: T.white, borderRadius: 24, maxWidth: 480, width: '100%', padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,.15)' }}
              onClick={e => e.stopPropagation()}>
              <h2 style={{ margin: '0 0 20px', fontSize: 19, fontWeight: 800, color: T.slate900 }}>Ajouter un membre</h2>
              {formError && (
                <div style={{ padding: '10px 14px', background: T.rose50, border: `1px solid ${T.roseMid}`, borderRadius: 8, color: T.rose, fontSize: 13, marginBottom: 16 }}>⚠️ {formError}</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input type="text"     placeholder="Nom complet"  value={form.nom_complet}  onChange={e => setForm({ ...form, nom_complet: e.target.value })}  style={inputSx} />
                <input type="email"    placeholder="Email"         value={form.email}        onChange={e => setForm({ ...form, email: e.target.value })}        style={inputSx} />
                <input type="password" placeholder="Mot de passe"  value={form.password}     onChange={e => setForm({ ...form, password: e.target.value })}     style={inputSx} />
                <input type="text"     placeholder="Département"   value={form.departement}  onChange={e => setForm({ ...form, departement: e.target.value })}  style={inputSx} />
                <input type="text"     placeholder="Téléphone"     value={form.telephone}    onChange={e => setForm({ ...form, telephone: e.target.value })}    style={inputSx} />
                <input type="text"     placeholder="Poste"         value={form.poste}        onChange={e => setForm({ ...form, poste: e.target.value })}        style={inputSx} />
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: T.slate500, textTransform: 'uppercase', letterSpacing: '.7px' }}>Rôle</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {(['employe', 'chef_projet'] as const).map(r => (
                      <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                        style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${form.role === r ? T.blue600 : T.slate300}`, background: form.role === r ? T.blue50 : T.white, color: form.role === r ? T.blue600 : T.slate700, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all .15s' }}>
                        {r === 'employe' ? 'Employé' : 'Chef de projet'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
                <button onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '12px', background: T.slate100, border: `1px solid ${T.slate300}`, borderRadius: 10, cursor: 'pointer', color: T.slate700, fontWeight: 600, fontSize: 14 }}>
                  Annuler
                </button>
                <button onClick={handleCreateMember}
                  style={{ flex: 1, padding: '12px', background: `linear-gradient(135deg, ${T.navy950}, ${T.blue600})`, color: T.white, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: `0 4px 14px ${T.blue600}44` }}>
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}