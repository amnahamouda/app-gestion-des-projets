import { useState } from 'react';
import { useNavigate } from 'react-router';
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
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blocked) return;
    setLoading(true);
    setError('');
    const result = await login(email, password);
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

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
    setTimeout(() => {
      setShowForgot(false);
      setForgotSent(false);
      setForgotEmail('');
    }, 3000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: "'Outfit', sans-serif", padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 4px 40px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 8px 20px rgba(30,58,138,0.25)' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: '16px' }}>MW</span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>Maison du Web</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Connectez-vous à votre espace</p>
        </div>

        {/* Login Form */}
        {!showForgot ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Adresse email</label>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Mot de passe</label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  style={{ fontSize: '12px', color: '#1e3a8a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}
                >
                  Mot de passe oublié ?
                </button>
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
              style={{ width: '100%', padding: '13px', background: blocked ? '#94a3b8' : 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: blocked ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(30,58,138,0.3)', marginTop: '4px' }}
            >
              {blocked ? '🔒 Bloqué temporairement' : loading ? 'Connexion...' : 'Se connecter →'}
            </button>
          </form>

        ) : (
          <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔑</div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>Mot de passe oublié</h2>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Entrez votre email pour recevoir un lien de réinitialisation</p>
            </div>

            {forgotSent ? (
              <div style={{ padding: '16px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '10px', textAlign: 'center' }}>
                <p style={{ color: '#166534', fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0' }}>✅ Email envoyé !</p>
                <p style={{ color: '#166534', fontSize: '13px', margin: 0 }}>Vérifiez votre boîte mail.</p>
              </div>
            ) : (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Adresse email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="email@maisonweb.com"
                    required
                    style={{ width: '100%', padding: '11px 15px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#0f172a', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,58,138,0.08)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <button type="submit" style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(30,58,138,0.3)' }}>
                  Envoyer le lien →
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); }}
              style={{ width: '100%', padding: '11px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fff', color: '#475569', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              ← Retour à la connexion
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', margin: '1.5rem 0 0 0' }}>
          © {new Date().getFullYear()} Maison du Web · Tous droits réservés
        </p>
      </div>
    </div>
  );
}