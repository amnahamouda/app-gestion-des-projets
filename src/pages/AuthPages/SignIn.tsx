import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .si-root {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #f0f4ff;
    position: relative;
    overflow: hidden;
    padding: 1.5rem;
  }

  .si-root::before {
    content: '';
    position: fixed;
    top: -120px; left: -120px;
    width: 420px; height: 420px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%);
    pointer-events: none;
  }
  .si-root::after {
    content: '';
    position: fixed;
    bottom: -100px; right: -80px;
    width: 350px; height: 350px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(52,211,153,0.1), transparent 70%);
    pointer-events: none;
  }

  .si-card {
    width: 100%;
    max-width: 400px;
    background: #ffffff;
    border-radius: 20px;
    padding: 2.2rem 2rem;
    box-shadow: 0 2px 40px rgba(99,102,241,0.1), 0 0 0 1px rgba(99,102,241,0.07);
    position: relative;
    z-index: 1;
    animation: card-up 0.45s cubic-bezier(0.22,1,0.36,1) both;
  }

  @keyframes card-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .si-head {
    display: flex;
    align-items: center;
    gap: 11px;
    margin-bottom: 1.6rem;
  }

  .si-logo {
    width: 38px; height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 12px; color: #fff;
    letter-spacing: -0.3px;
    box-shadow: 0 4px 12px rgba(99,102,241,0.35);
    flex-shrink: 0;
  }

  .si-head-text h1 {
    font-size: 0.95rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 1px 0;
    letter-spacing: -0.3px;
  }

  .si-head-text p {
    font-size: 11.5px;
    color: #94a3b8;
    margin: 0;
    font-weight: 500;
  }

  .si-title {
    font-size: 1.35rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.6px;
    margin: 0 0 1.4rem 0;
  }

  .si-group { margin-bottom: 1rem; }

  .si-label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .si-label {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    letter-spacing: 0.2px;
  }

  .si-forgot {
    font-size: 12px;
    font-weight: 600;
    color: #6366f1;
    background: none; border: none;
    cursor: pointer; padding: 0;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: opacity 0.15s;
  }
  .si-forgot:hover { opacity: 0.7; }

  .si-input-wrap { position: relative; }

  .si-input {
    width: 100%;
    padding: 10.5px 14px;
    border: 1.5px solid #e8ecf4;
    border-radius: 10px;
    font-size: 13.5px;
    color: #0f172a;
    background: #f8faff;
    outline: none;
    box-sizing: border-box;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
  }

  .si-input:focus {
    border-color: #6366f1;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }

  .si-input:disabled {
    background: #f1f5f9;
    color: #94a3b8;
  }

  .si-input.padded { padding-right: 42px; }

  .si-eye {
    position: absolute;
    right: 12px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none;
    cursor: pointer; color: #94a3b8;
    font-size: 14px; padding: 0;
    display: flex; align-items: center;
    transition: color 0.15s;
  }
  .si-eye:hover { color: #64748b; }

  .si-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 13px;
    background: #fff5f5;
    border: 1.5px solid #fecaca;
    border-radius: 9px;
    color: #dc2626;
    font-size: 12.5px;
    font-weight: 500;
    margin-bottom: 1rem;
    animation: shake 0.28s ease;
  }

  @keyframes shake {
    0%,100% { transform: translateX(0); }
    30%      { transform: translateX(-5px); }
    70%      { transform: translateX(5px); }
  }

  .si-btn {
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    margin-top: 4px;
    box-shadow: 0 4px 16px rgba(99,102,241,0.3);
    transition: transform 0.15s, box-shadow 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 7px;
  }
  .si-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 7px 22px rgba(99,102,241,0.38);
  }
  .si-btn:active:not(:disabled) { transform: translateY(0); }
  .si-btn:disabled {
    background: #cbd5e1;
    box-shadow: none;
    cursor: not-allowed;
  }

  .si-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.55s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .si-back {
    width: 100%;
    padding: 11px;
    border: 1.5px solid #e8ecf4;
    border-radius: 10px;
    background: #fff;
    color: #64748b;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    margin-top: 10px;
    transition: border-color 0.18s, color 0.18s;
    display: flex; align-items: center; justify-content: center; gap: 5px;
  }
  .si-back:hover { border-color: #6366f1; color: #6366f1; }

  .si-success {
    text-align: center;
    padding: 18px;
    background: #f0fdf4;
    border: 1.5px solid #86efac;
    border-radius: 12px;
    animation: card-up 0.35s ease both;
  }
  .si-success-icon { font-size: 1.6rem; display: block; margin-bottom: 7px; }
  .si-success p { font-size: 13.5px; font-weight: 700; color: #166534; margin: 0 0 3px; }
  .si-success span { font-size: 12px; color: #4ade80; font-weight: 500; }

  .si-footer {
    text-align: center;
    margin-top: 1.4rem;
    font-size: 11px;
    color: #cbd5e1;
    font-weight: 500;
  }

  .si-forgot-head { margin-bottom: 1.4rem; }
  .si-forgot-head h2 {
    font-size: 1.2rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
    margin: 0 0 4px;
  }
  .si-forgot-head p {
    font-size: 12.5px;
    color: #94a3b8;
    margin: 0;
  }
`;

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
    try {
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
    } catch {
      setError('Erreur de connexion.');
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
    <>
      <style>{styles}</style>
      <div className="si-root">
        <div className="si-card">

          <div className="si-head">
            <div className="si-logo">MW</div>
            <div className="si-head-text">
              <h1>Maison du Web</h1>
              <p>Gestion de projets</p>
            </div>
          </div>

          {!showForgot ? (
            <>
              <p className="si-title">Bon retour 👋</p>
              <form onSubmit={handleSubmit}>
                <div className="si-group">
                  <div className="si-label-row">
                    <label className="si-label">Email</label>
                  </div>
                  <input
                    className="si-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@maisonweb.com"
                    required
                    disabled={blocked}
                  />
                </div>

                <div className="si-group">
                  <div className="si-label-row">
                    <label className="si-label">Mot de passe</label>
                    <button type="button" className="si-forgot" onClick={() => setShowForgot(true)}>
                      Oublié ?
                    </button>
                  </div>
                  <div className="si-input-wrap">
                    <input
                      className="si-input padded"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={blocked}
                    />
                    <button type="button" className="si-eye" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="si-error">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="si-btn" disabled={loading || blocked}>
                  {blocked
                    ? <><span>🔒</span> Bloqué temporairement</>
                    : loading
                    ? <><div className="si-spinner" /> Connexion…</>
                    : <>Se connecter →</>}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="si-forgot-head">
                <h2>Mot de passe oublié</h2>
                <p>On vous envoie un lien de réinitialisation.</p>
              </div>
              <form onSubmit={handleForgot}>
                {forgotSent ? (
                  <div className="si-success">
                    <span className="si-success-icon">📬</span>
                    <p>Email envoyé !</p>
                    <span>Vérifiez votre boîte de réception.</span>
                  </div>
                ) : (
                  <>
                    <div className="si-group">
                      <label className="si-label" style={{ display: 'block', marginBottom: '6px' }}>Email</label>
                      <input
                        className="si-input"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="vous@maisonweb.com"
                        required
                      />
                    </div>
                    <button type="submit" className="si-btn">Envoyer →</button>
                  </>
                )}
                <button
                  type="button"
                  className="si-back"
                  onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); }}
                >
                  ← Retour
                </button>
              </form>
            </>
          )}

          <div className="si-footer">© {new Date().getFullYear()} Maison du Web</div>
        </div>
      </div>
    </>
  );
}