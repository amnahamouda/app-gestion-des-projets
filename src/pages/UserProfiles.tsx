import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import PageMeta from '../components/common/PageMeta';

/* ─── styles ─── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .pp { display:flex; flex-direction:column; gap:18px; font-family:'Plus Jakarta Sans',sans-serif; }

  .pp-toast {
    display:flex; align-items:center; gap:10px;
    padding:12px 18px;
    background:var(--color-success-50,rgba(16,185,129,.08));
    border:1px solid var(--color-success-200,rgba(16,185,129,.2));
    border-radius:12px; color:var(--color-success-700,#047857);
    font-size:13px; font-weight:700; animation:ppIn .3s ease;
  }
  @keyframes ppIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }

  /* ── Hero ── */
  .pp-hero {
    border-radius:18px; overflow:hidden;
    border:1px solid #0C447C;
    background:#042C53;
  }
  .pp-stripe { height:5px; background:#185FA5; }
  .pp-hbody { padding:26px 26px 0; }
  .pp-htop { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:14px; }
  .pp-avwrap { display:flex; align-items:center; gap:16px; }

  .pp-av {
    width:66px; height:66px; border-radius:14px;
    background:#0C447C; border:2px solid #185FA5;
    display:flex; align-items:center; justify-content:center;
    font-size:1.5rem; font-weight:800; color:#B5D4F4;
    flex-shrink:0; cursor:pointer; position:relative; overflow:hidden;
  }
  .pp-av-overlay {
    position:absolute; inset:0; background:rgba(4,44,83,.75);
    display:flex; align-items:center; justify-content:center;
    opacity:0; transition:opacity .2s;
  }
  .pp-av:hover .pp-av-overlay { opacity:1; }

  .pp-uname { font-size:1.2rem; font-weight:800; color:#E6F1FB; margin:0 0 5px 0; }
  .pp-umeta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .pp-rbadge {
    font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em;
    padding:3px 10px; border-radius:6px; background:#185FA5; color:#B5D4F4;
  }
  .pp-udept { font-size:13px; font-weight:600; color:#378ADD; }

  /* stats */
  .pp-stats { display:flex; border-top:1px solid #0C447C; margin-top:22px; }
  .pp-stat { flex:1; padding:16px 18px; position:relative; }
  .pp-stat+.pp-stat::before { content:''; position:absolute; left:0; top:16px; bottom:16px; width:1px; background:#0C447C; }
  .pp-snum { font-size:1.2rem; font-weight:800; color:#B5D4F4; margin-bottom:2px; }
  .pp-slbl { font-size:11px; font-weight:600; color:#378ADD; text-transform:uppercase; letter-spacing:.04em; }

  /* buttons */
  .pp-acts { display:flex; gap:8px; align-items:center; }
  .pp-btn {
    display:inline-flex; align-items:center; gap:6px;
    padding:8px 16px; border-radius:9px;
    font-size:13px; font-weight:700; cursor:pointer;
    font-family:'Plus Jakarta Sans',sans-serif;
    transition:all .15s; border:none;
  }
  .pp-solid { background:#185FA5; color:#E6F1FB; }
  .pp-solid:hover { background:#0C447C; }
  .pp-ghost { background:transparent; color:#85B7EB; border:1.5px solid #378ADD; }
  .pp-ghost:hover { background:rgba(55,138,221,.15); }

  /* grid */
  .pp-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  @media(max-width:640px) { .pp-grid { grid-template-columns:1fr; } }
  .pp-rcol { display:flex; flex-direction:column; gap:16px; }

  /* card */
  .pp-card {
    background:var(--color-white,#fff);
    border:1px solid var(--color-gray-200,#e5e7eb);
    border-radius:14px; padding:20px;
  }
  .dark .pp-card { background:var(--color-gray-900,#111827); border-color:rgba(255,255,255,.08); }
  .pp-card-ttl {
    font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em;
    color:var(--color-gray-400,#9ca3af); margin:0 0 16px 0;
    display:flex; align-items:center; gap:8px;
  }
  .pp-card-ttl::before { content:''; display:block; width:3px; height:13px; background:#185FA5; border-radius:2px; }

  /* fields */
  .pp-frow { padding:9px 0; border-bottom:1px solid var(--color-gray-100,#f3f4f6); }
  .dark .pp-frow { border-color:rgba(255,255,255,.06); }
  .pp-frow:last-child { border-bottom:none; padding-bottom:0; }
  .pp-fkey { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:var(--color-gray-400,#9ca3af); margin-bottom:3px; }
  .pp-fval { font-size:14px; font-weight:500; color:var(--color-gray-800,#1f2937); }
  .dark .pp-fval { color:#e5e7eb; }
  .pp-fempty { color:var(--color-gray-300,#d1d5db); font-weight:400; }

  .pp-inp {
    width:100%; padding:8px 11px;
    background:var(--color-gray-50,#f9fafb);
    border:1px solid var(--color-gray-200,#e5e7eb);
    border-radius:8px; font-size:14px; font-weight:500;
    color:var(--color-gray-800,#1f2937);
    font-family:'Plus Jakarta Sans',sans-serif;
    outline:none; box-sizing:border-box; transition:all .15s;
  }
  .dark .pp-inp { background:rgba(255,255,255,.05); border-color:rgba(255,255,255,.1); color:#e5e7eb; }
  .pp-inp::placeholder { color:var(--color-gray-300,#d1d5db); font-weight:400; }
  .pp-inp:focus { border-color:#185FA5; box-shadow:0 0 0 3px rgba(24,95,165,.12); }

  /* password */
  .pp-pw-row { display:flex; align-items:center; gap:8px; margin-top:4px; }
  .pp-pw-row .pp-inp { flex:1; }
  .pp-eye { background:none; border:none; cursor:pointer; color:var(--color-gray-400,#9ca3af); padding:0; display:flex; }
  .pp-strength { height:4px; border-radius:2px; margin-top:6px; transition:all .3s; }

  /* notifications */
  .pp-notif { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--color-gray-100,#f3f4f6); }
  .dark .pp-notif { border-color:rgba(255,255,255,.06); }
  .pp-notif:last-child { border-bottom:none; padding-bottom:0; }
  .pp-nlbl { font-size:13px; font-weight:600; color:var(--color-gray-800,#1f2937); margin-bottom:2px; }
  .dark .pp-nlbl { color:#e5e7eb; }
  .pp-nsub { font-size:12px; color:var(--color-gray-400,#9ca3af); }

  /* activity */
  .pp-act { display:flex; align-items:flex-start; gap:12px; padding:10px 0; border-bottom:1px solid var(--color-gray-100,#f3f4f6); }
  .dark .pp-act { border-color:rgba(255,255,255,.06); }
  .pp-act:last-child { border-bottom:none; padding-bottom:0; }
  .pp-act-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .pp-act-lbl { font-size:13px; font-weight:600; color:var(--color-gray-800,#1f2937); margin-bottom:2px; }
  .dark .pp-act-lbl { color:#e5e7eb; }
  .pp-act-time { font-size:11px; color:var(--color-gray-400,#9ca3af); }
  .pp-act-badge { font-size:11px; font-weight:700; padding:2px 8px; border-radius:5px; margin-top:2px; align-self:flex-start; }

  /* upload zone */
  .pp-upload {
    border:1.5px dashed #378ADD; border-radius:10px;
    padding:18px; text-align:center; cursor:pointer;
    transition:background .15s;
    display:flex; flex-direction:column; align-items:center; gap:8px;
  }
  .pp-upload:hover { background:rgba(24,95,165,.06); }

  /* session bar */
  .pp-session {
    background:var(--color-white,#fff);
    border:1px solid var(--color-gray-200,#e5e7eb);
    border-radius:14px; padding:18px 20px;
    display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;
  }
  .dark .pp-session { background:var(--color-gray-900,#111827); border-color:rgba(255,255,255,.08); }
  .pp-odot { width:8px; height:8px; border-radius:50%; background:#10b981; border:1.5px solid rgba(16,185,129,.3); }
  .pp-olbl { font-size:13px; color:var(--color-gray-500,#6b7280); }
  .pp-olbl strong { color:var(--color-gray-800,#1f2937); font-weight:700; }
  .dark .pp-olbl strong { color:#e5e7eb; }
  .pp-btn-danger {
    padding:9px 20px;
    background:rgba(239,68,68,.07); color:#dc2626;
    border:1px solid rgba(239,68,68,.2);
    border-radius:8px; font-size:13px; font-weight:700;
    cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:opacity .15s;
  }
  .pp-btn-danger:hover { opacity:.8; }
`;

/* ─── types ─── */
const roleLabel: Record<string, string> = {
  admin: 'Admin',
  chef_projet: 'Chef de projet',
  employe: 'Employé',
};

const infoFields = [
  { label: 'Nom complet',   key: 'name'       as const, type: 'text'  },
  { label: 'Email',         key: 'email'      as const, type: 'email' },
  { label: 'Département',   key: 'department' as const, type: 'text'  },
  { label: 'Téléphone',     key: 'phone'      as const, type: 'tel'   },
];

const activityItems = [
  { label: 'Projet "Refonte Site" créé', time: "Aujourd'hui, 09:14", badge: 'Projet', bg: '#E6F1FB', color: '#0C447C' },
  { label: 'Tâche validée par le chef',  time: 'Hier, 16:42',        badge: 'Tâche',  bg: '#EAF3DE', color: '#27500A' },
  { label: 'Deadline dans 2 jours',      time: 'Avant-hier',         badge: 'Rappel', bg: '#FAEEDA', color: '#633806' },
  { label: 'Profil complété à 80%',      time: 'Il y a 3 jours',     badge: 'Profil', bg: '#E6F1FB', color: '#0C447C' },
];

const defaultNotifs = [
  { label: 'Email — Nouveaux projets', sub: 'Recevoir un email à chaque assignation', on: true  },
  { label: 'Email — Rapports hebdo',   sub: 'Résumé chaque lundi matin',             on: true  },
  { label: 'Notifications push',       sub: 'Alertes en temps réel',                 on: false },
  { label: 'Mentions équipe',          sub: 'Quand quelqu\'un vous mentionne',        on: true  },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 38, height: 22, borderRadius: 11,
        background: on ? '#185FA5' : 'var(--color-gray-200,#e5e7eb)',
        border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
        transition: 'background .2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, width: 16, height: 16,
        borderRadius: '50%', background: '#fff',
        left: on ? 19 : 3, transition: 'left .2s',
      }} />
    </button>
  );
}

function StrengthBar({ password }: { password: string }) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const cfg = [
    { w: '0%',   color: 'transparent', label: '' },
    { w: '25%',  color: '#E24B4A',     label: 'Faible'     },
    { w: '50%',  color: '#EF9F27',     label: 'Moyen'      },
    { w: '75%',  color: '#639922',     label: 'Fort'       },
    { w: '100%', color: '#1D9E75',     label: 'Très fort'  },
  ];
  const s = cfg[score] ?? cfg[0];
  return password ? (
    <>
      <div style={{ height: 4, borderRadius: 2, background: s.color, width: s.w, marginTop: 6, transition: 'all .3s' }} />
      <div style={{ fontSize: 11, color: s.color, marginTop: 3 }}>{s.label}</div>
    </>
  ) : null;
}

export default function UserProfiles() {
  const { user, logout } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing]   = useState(false);
  const [toast, setToast]       = useState('');
  const [avatarSrc, setAvatar]  = useState('');
  const [notifs, setNotifs]     = useState(defaultNotifs);
  const [showPwCur, setShowPwCur] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);

  const [form, setForm] = useState({
    name:       user?.name       ?? '',
    email:      user?.email      ?? '',
    department: user?.department ?? '',
    phone:      '',
    bio:        '',
  });
  const [pw, setPw] = useState({ cur: '', nw: '', conf: '' });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const saveInfo = () => { setEditing(false); showToast('Profil mis à jour avec succès'); };

  const savePw = () => {
    if (!pw.cur || !pw.nw || !pw.conf) return showToast('Remplissez tous les champs');
    if (pw.nw !== pw.conf)              return showToast('Les mots de passe ne correspondent pas');
    if (pw.nw.length < 8)              return showToast('Minimum 8 caractères requis');
    setPw({ cur: '', nw: '', conf: '' });
    showToast('Mot de passe mis à jour');
  };

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target?.result as string);
      showToast('Photo de profil mise à jour');
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <style>{styles}</style>
      <PageMeta title="Profil | Maison du Web" description="Mon profil" />
      <PageBreadcrumb pageTitle="Mon profil" />

      <div className="pp">

        {toast && (
          <div className="pp-toast">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="8" fill="rgba(16,185,129,.15)" />
              <path d="M5 8.5l2 2 4-4" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
            {toast}
          </div>
        )}

        {/* ── Hero ── */}
        <div className="pp-hero">
          <div className="pp-stripe" />
          <div className="pp-hbody">
            <div className="pp-htop">
              <div className="pp-avwrap">
                <div className="pp-av" onClick={() => fileRef.current?.click()}>
                  {avatarSrc
                    ? <img src={avatarSrc} alt="avatar" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span>{form.name?.[0]?.toUpperCase() ?? 'U'}</span>
                  }
                  <div className="pp-av-overlay">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3 13.5V15h1.5l8.75-8.75-1.5-1.5L3 13.5z" fill="#B5D4F4" />
                      <path d="M14.85 4.15a1 1 0 000-1.41l-1.09-1.09a1 1 0 00-1.41 0l-1.06 1.06 2.5 2.5 1.06-1.06z" fill="#B5D4F4" />
                    </svg>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImg} />
                <div>
                  <div className="pp-uname">{form.name || user?.name}</div>
                  <div className="pp-umeta">
                    <span className="pp-rbadge">{user?.role ? roleLabel[user.role] : 'Utilisateur'}</span>
                    <span className="pp-udept">{form.department || user?.department}</span>
                  </div>
                </div>
              </div>

              <div className="pp-acts">
                {!editing ? (
                  <button className="pp-btn pp-solid" onClick={() => setEditing(true)}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M8.5 1.5l3 3-7 7H1.5v-3l7-7z" stroke="#B5D4F4" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
                    </svg>
                    Modifier
                  </button>
                ) : (
                  <>
                    <button className="pp-btn pp-ghost" onClick={() => setEditing(false)}>Annuler</button>
                    <button className="pp-btn pp-solid" onClick={saveInfo}>Enregistrer</button>
                  </>
                )}
              </div>
            </div>

            <div className="pp-stats">
              {[['14','Projets'],['3','Équipes'],['98%','Complétion'],['2 ans','Ancienneté']].map(([n,l]) => (
                <div className="pp-stat" key={l}>
                  <div className="pp-snum">{n}</div>
                  <div className="pp-slbl">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 1 ── */}
        <div className="pp-grid">
          {/* Info perso */}
          <div className="pp-card">
            <h3 className="pp-card-ttl">Informations personnelles</h3>
            {infoFields.map(f => (
              <div className="pp-frow" key={f.key}>
                <div className="pp-fkey">{f.label}</div>
                {editing
                  ? <input className="pp-inp" type={f.type} value={form[f.key]} onChange={set(f.key)} />
                  : <div className="pp-fval">{form[f.key] || <span className="pp-fempty">Non renseigné</span>}</div>
                }
              </div>
            ))}
            <div className="pp-frow">
              <div className="pp-fkey">Bio</div>
              {editing
                ? <textarea className="pp-inp" value={form.bio} onChange={set('bio')} rows={2} placeholder="Quelques mots..." style={{ resize: 'none' }} />
                : <div className="pp-fval">{form.bio || <span className="pp-fempty">Non renseignée</span>}</div>
              }
            </div>
          </div>

          <div className="pp-rcol">
            {/* Mot de passe */}
            <div className="pp-card">
              <h3 className="pp-card-ttl">Mot de passe</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Mot de passe actuel', key: 'cur' as const, show: showPwCur, toggle: () => setShowPwCur(p => !p), placeholder: '••••••••' },
                  { label: 'Nouveau',             key: 'nw'  as const, show: showPwNew, toggle: () => setShowPwNew(p => !p), placeholder: 'Min. 8 caractères' },
                  { label: 'Confirmer',           key: 'conf'as const, show: false,     toggle: () => {},                    placeholder: '••••••••' },
                ].map(f => (
                  <div key={f.key}>
                    <div className="pp-fkey" style={{ marginBottom: 4 }}>{f.label}</div>
                    <div className={f.key !== 'conf' ? 'pp-pw-row' : ''}>
                      <input
                        className="pp-inp"
                        type={f.show ? 'text' : 'password'}
                        value={pw[f.key]}
                        onChange={e => setPw(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        style={f.key === 'conf' ? { width: '100%' } : {}}
                      />
                      {f.key !== 'conf' && (
                        <button className="pp-eye" onClick={f.toggle}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2" />
                            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {f.key === 'nw' && <StrengthBar password={pw.nw} />}
                  </div>
                ))}
                <button className="pp-btn pp-solid" style={{ width: '100%', justifyContent: 'center' }} onClick={savePw}>
                  Mettre à jour
                </button>
              </div>
            </div>

            {/* Photo upload */}
            <div className="pp-card">
              <h3 className="pp-card-ttl">Photo de profil</h3>
              <div className="pp-upload" onClick={() => fileRef.current?.click()}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="#378ADD" strokeWidth="1.4" />
                  <circle cx="8.5" cy="10.5" r="2" stroke="#378ADD" strokeWidth="1.2" />
                  <path d="M3 17l5-4 3 3 3-2.5 7 5" stroke="#378ADD" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#378ADD' }}>Cliquer pour uploader</div>
                <div style={{ fontSize: 12, color: 'var(--color-gray-400,#9ca3af)' }}>PNG, JPG — max 2 MB</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2 ── */}
        <div className="pp-grid">
          {/* Notifications */}
          <div className="pp-card">
            <h3 className="pp-card-ttl">Notifications</h3>
            {notifs.map((n, i) => (
              <div className="pp-notif" key={n.label}>
                <div>
                  <div className="pp-nlbl">{n.label}</div>
                  <div className="pp-nsub">{n.sub}</div>
                </div>
                <Toggle on={n.on} onToggle={() => setNotifs(p => p.map((x, j) => j === i ? { ...x, on: !x.on } : x))} />
              </div>
            ))}
          </div>

          {/* Activité */}
          <div className="pp-card">
            <h3 className="pp-card-ttl">Activité récente</h3>
            {activityItems.map(a => (
              <div className="pp-act" key={a.label}>
                <div className="pp-act-icon" style={{ background: a.bg }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke={a.color} strokeWidth="1.2" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="pp-act-lbl">{a.label}</div>
                  <div className="pp-act-time">{a.time}</div>
                </div>
                <span className="pp-act-badge" style={{ background: a.bg, color: a.color }}>{a.badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Session bar ── */}
        <div className="pp-session">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="pp-odot" />
            <div className="pp-olbl">
              Connecté en tant que <strong>{form.name || user?.name}</strong> — Tunis, TN
            </div>
          </div>
          <button className="pp-btn-danger" onClick={logout}>Se déconnecter</button>
        </div>

      </div>
    </>
  );
}