import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (blocked) return;
    setLoading(true);
    setError('');
    const result = login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setBlocked(true);
        setError('Compte bloqué temporairement après 3 tentatives incorrectes.');
        setTimeout(() => { setBlocked(false); setAttempts(0); }, 30000);
      } else {
        setError(`Email ou mot de passe incorrect. (${newAttempts}/3 tentatives)`);
      }
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Outfit', sans-serif" }}>

      {/* Panneau gauche */}
      <div style={{ width: '45%', background: '#0f172a', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '3rem', position: 'relative', overflow: 'hidden' }}
        className="hidden lg:flex"
      >
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(59,130,246,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(59,130,246,0.06)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '46px', height: '46px', background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(249,115,22,0.3)' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: '15px' }}>MW</span>
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '17px', margin: 0 }}>Maison du Web</p>
            <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Gestion de projets</p>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: '#fff', fontSize: '2.3rem', fontWeight: 700, lineHeight: 1.2, margin: '0 0 16px 0' }}>
            Gérez vos projets<br />
            <span style={{ color: '#fb923c' }}>avec efficacité</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.7, margin: '0 0 2.5rem 0' }}>
            Suivez vos tâches, coordonnez votre équipe et livrez dans les délais.
          </p>
          <div style={{ display: 'flex', gap: '0', marginBottom: '2rem' }}>
            {[
              { value: '12+', label: 'Projets actifs' },
              { value: '9', label: 'Membres' },
              { value: '98%', label: 'Livraison' },
            ].map((s, i) => (
              <div key={s.label} style={{ flex: 1, padding: '16px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: i === 0 ? '12px 0 0 12px' : i === 2 ? '0 12px 12px 0' : '0' }}>
                <p style={{ color: '#fb923c', fontWeight: 700, fontSize: '1.5rem', margin: 0 }}>{s.value}</p>
                <p style={{ color: '#64748b', fontSize: '0.7rem', margin: '2px 0 0 0', textTransform: 'uppercase' }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { icon: '📁', text: 'Gestion des projets et tâches' },
              { icon: '🗂️', text: 'Tableau Kanban interactif' },
              { icon: '👥', text: '3 rôles : Admin, Chef, Employé' },
            ].map((f) => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                  {f.icon}
                </div>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: '#334155', fontSize: '0.75rem', position: 'relative', zIndex: 1 }}>
          © {new Date().getFullYear()} Maison du Web · Tous droits réservés
        </p>
      </div>

      {/* Panneau droit */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#f8fafc' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 4px 30px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>

            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 20px rgba(30,58,138,0.25)' }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: '16px' }}>MW</span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>Bon retour 👋</h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Connectez-vous à votre espace</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '7px' }}>Adresse email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@maisonweb.com"
                  required
                  disabled={blocked}
                  style={{ width: '100%', padding: '11px 15px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#0f172a', background: blocked ? '#f1f5f9' : '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => { if (!blocked) { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,58,138,0.08)'; }}}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Mot de passe</label>
                  <Link to="/auth/reset-password" style={{ fontSize: '12px', color: '#1e3a8a', textDecoration: 'none', fontWeight: 500 }}>
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={blocked}
                    style={{ width: '100%', padding: '11px 46px 11px 15px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#0f172a', background: blocked ? '#f1f5f9' : '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={(e) => { if (!blocked) { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,58,138,0.08)'; }}}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '15px', padding: 0 }}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1.5px solid #fed7d7', borderRadius: '10px', color: '#c53030', fontSize: '13px' }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || blocked}
                style={{ width: '100%', padding: '13px', background: blocked ? '#94a3b8' : 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: blocked ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(30,58,138,0.3)' }}
              >
                {blocked ? '🔒 Bloqué temporairement' : loading ? 'Connexion...' : 'Se connecter →'}
              </button>

              <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', margin: 0 }}>
                Pas encore de compte ?{' '}
                <Link to="/signup" style={{ color: '#1e3a8a', fontWeight: 600, textDecoration: 'none' }}>
                  Créer un compte
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}