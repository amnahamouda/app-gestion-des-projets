import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .signin-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100vh;
    background: #e8edf5;
    font-family: 'Inter', sans-serif;
  }

  .signin-card {
    display: flex;
    border-radius: 16px;
    overflow: hidden;
    width: 720px;
    height: 420px;
    box-shadow: 0 8px 40px rgba(10, 40, 110, 0.18);
  }

  /* LEFT */
  .s-left {
    flex: 1;
    background: #0f3494;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 1.6rem 1.4rem;
    position: relative;
    overflow: hidden;
  }
  .s-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
  .s-left-inner {
    position: relative; z-index: 2;
    display: flex; flex-direction: column;
    justify-content: space-between; height: 100%;
  }
  .s-brand { display: flex; align-items: center; gap: 7px; }
  .s-brand-logo {
    width: 26px; height: 26px; border-radius: 6px;
    background: rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 8px; color: #fff;
  }
  .s-brand-name { font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,0.88); }
  .s-copy h2 { font-size: .95rem; font-weight: 700; color: #fff; line-height: 1.35; margin-bottom: .4rem; }
  .s-copy p { font-size: 10px; color: rgba(255,255,255,0.48); line-height: 1.65; }
  .s-stats { display: flex; gap: 5px; }
  .s-stat {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.13);
    border-radius: 7px; padding: 6px 8px; flex: 1;
  }
  .s-stat-n { font-size: .82rem; font-weight: 700; color: #fff; }
  .s-stat-l { font-size: 8.5px; color: rgba(255,255,255,0.38); margin-top: 1px; }

  /* RIGHT */
  .s-right {
    flex: 1; background: #fff;
    display: flex; flex-direction: column;
    justify-content: center; padding: 2rem 2.2rem;
  }
  .s-pill {
    display: inline-flex; align-items: center; gap: 4px;
    background: #dbeafe; border-radius: 20px;
    padding: 2px 9px; font-size: 9.5px; color: #0f3494;
    font-weight: 600; margin-bottom: .9rem; width: fit-content;
  }
  .s-dot {
    width: 4px; height: 4px; border-radius: 50%; background: #0f3494;
    animation: s-pulse 2s ease-in-out infinite;
  }
  @keyframes s-pulse { 0%,100%{opacity:1;} 50%{opacity:0.25;} }
  .s-form-title { font-size: 1.15rem; font-weight: 700; color: #0f1f4a; margin-bottom: 1.1rem; }
  .s-field { margin-bottom: .7rem; }
  .s-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .s-lbl { font-size: 10.5px; font-weight: 600; color: #5a6a85; }
  .s-forgot {
    font-size: 10.5px; font-weight: 600; color: #0f3494;
    background: none; border: none; cursor: pointer;
    font-family: 'Inter', sans-serif; padding: 0;
  }
  .s-ibox { position: relative; }
  .s-inp {
    width: 100%; padding: 9px 12px;
    background: #f3f6fc; border: 1.5px solid #d6dff0;
    border-radius: 8px; font-size: 12.5px; color: #0f1f4a;
    font-family: 'Inter', sans-serif; outline: none;
    transition: border-color .2s, box-shadow .2s, background .2s;
  }
  .s-inp::placeholder { color: #aab4c8; }
  .s-inp:focus { border-color: #0f3494; background: #eaf0fd; box-shadow: 0 0 0 3px rgba(15,52,148,0.08); }
  .s-inp.pr { padding-right: 34px; }
  .s-eye {
    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: #9ca3af; font-size: 12px; padding: 0; line-height: 1;
  }
  .s-err {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 10px; background: #fff1f2;
    border: 1px solid #fecdd3; border-radius: 7px;
    color: #be123c; font-size: 11px; font-weight: 500;
    margin-bottom: .7rem; animation: s-shake .3s ease;
  }
  @keyframes s-shake {
    0%,100%{transform:translateX(0);}
    30%{transform:translateX(-3px);}
    70%{transform:translateX(3px);}
  }
  .s-btn {
    width: 100%; padding: 10.5px;
    background: #0f3494; color: #fff;
    border: none; border-radius: 8px;
    font-size: 12.5px; font-weight: 600; cursor: pointer;
    font-family: 'Inter', sans-serif; margin-top: 4px;
    display: flex; align-items: center; justify-content: center; gap: 5px;
    transition: background .15s, transform .1s;
  }
  .s-btn:hover:not(:disabled) { background: #0a2470; transform: translateY(-1px); }
  .s-btn:active:not(:disabled) { transform: scale(0.99); }
  .s-btn:disabled { opacity: .45; cursor: not-allowed; }
  .s-spin {
    width: 11px; height: 11px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff; border-radius: 50%;
    animation: s-sp .5s linear infinite;
  }
  @keyframes s-sp { to { transform: rotate(360deg); } }
  .s-footer { text-align: center; margin-top: 1rem; font-size: 10px; color: #c8d4e8; }
  .s-forgot-head { margin-bottom: 1.1rem; }
  .s-forgot-head h2 { font-size: 1.15rem; font-weight: 700; color: #0f1f4a; margin-bottom: 3px; }
  .s-forgot-head p { font-size: 11px; color: #6b7280; }
  .s-success {
    text-align: center; padding: 1.1rem;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    border-radius: 8px; margin-bottom: .7rem;
  }
  .s-success p { font-size: 12.5px; font-weight: 600; color: #15803d; margin-bottom: 6px; }
  .s-success a { font-size: 11px; color: #0f3494; font-weight: 600; word-break: break-all; }
  .s-back {
    width: 100%; padding: 8.5px;
    background: transparent; border: 1px solid #d6dff0;
    border-radius: 8px; color: #6b7280;
    font-size: 11.5px; font-weight: 500; cursor: pointer;
    font-family: 'Inter', sans-serif; margin-top: 8px;
    display: flex; align-items: center; justify-content: center; gap: 4px;
    transition: border-color .18s, color .18s;
  }
  .s-back:hover { border-color: #0f3494; color: #0f3494; }
`;

const API_URL = 'http://localhost:5000/api';

export default function SignIn() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [showPassword,    setShowPassword]    = useState(false);
  const [attempts,        setAttempts]        = useState(0);
  const [blocked,         setBlocked]         = useState(false);
  const [showForgot,      setShowForgot]      = useState(false);
  const [forgotEmail,     setForgotEmail]     = useState('');
  const [forgotSent,      setForgotSent]      = useState(false);
  const [forgotLoading,   setForgotLoading]   = useState(false);
  const [forgotError,     setForgotError]     = useState('');
  const [forgotResetLink, setForgotResetLink] = useState(''); // ✅ جديد

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;
    let W = 0, H = 0;

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      r: number; alpha: number;
      pulse: number; pulseSpeed: number;
    };
    const PARTICLE_COUNT = 28;
    const particles: Particle[] = [];

    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 2.5 + 1,
          alpha: Math.random() * 0.35 + 0.08,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.025 + 0.01,
        });
      }
    };

    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            const a = (1 - dist / 80) * 0.18;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(130,170,255,${a})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const updateParticles = () => {
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        p.pulse += p.pulseSpeed;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      }
    };

    const drawParticles = () => {
      for (const p of particles) {
        const a = p.alpha + Math.sin(p.pulse) * 0.12;
        const r = p.r + Math.sin(p.pulse * 0.8) * 0.5;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
        g.addColorStop(0,   `rgba(160,195,255,${a})`);
        g.addColorStop(0.5, `rgba(100,150,255,${a * 0.4})`);
        g.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,220,255,${a + 0.15})`; ctx.fill();
      }
    };

    const drawWaves = () => {
      const waves = [
        { amp: 18, freq: 0.018, spd: 0.4,  yBase: 0.72, alpha: 0.12, color: [40, 100, 220] },
        { amp: 14, freq: 0.022, spd: 0.55, yBase: 0.80, alpha: 0.09, color: [20,  70, 190] },
        { amp: 10, freq: 0.030, spd: 0.70, yBase: 0.88, alpha: 0.07, color: [60, 120, 240] },
      ];
      for (const w of waves) {
        ctx.beginPath(); ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 2) {
          const y = H * w.yBase
            + Math.sin(x * w.freq + t * w.spd) * w.amp
            + Math.sin(x * w.freq * 1.8 + t * w.spd * 1.4) * w.amp * 0.4;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H); ctx.closePath();
        const [r, g, b] = w.color;
        const grad = ctx.createLinearGradient(0, H * w.yBase, 0, H);
        grad.addColorStop(0, `rgba(${r},${g},${b},${w.alpha})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},${w.alpha * 0.3})`);
        ctx.fillStyle = grad; ctx.fill();
      }
    };

    const drawOrbs = () => {
      const orbs = [
        { x: 0.15, y: 0.18, r: 80, col: [50,  100, 220] as [number,number,number], a: 0.18, idx: 0   },
        { x: 0.78, y: 0.30, r: 65, col: [30,   70, 180] as [number,number,number], a: 0.15, idx: 1.6 },
        { x: 0.45, y: 0.65, r: 55, col: [70,  130, 250] as [number,number,number], a: 0.13, idx: 3.1 },
        { x: 0.88, y: 0.75, r: 45, col: [20,   50, 160] as [number,number,number], a: 0.12, idx: 2.0 },
      ];
      for (const o of orbs) {
        const ox = W * o.x + Math.sin(t * 0.3 + o.idx) * 16;
        const oy = H * o.y + Math.cos(t * 0.25 + o.idx) * 12;
        const gr = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r);
        gr.addColorStop(0,   `rgba(${o.col[0]},${o.col[1]},${o.col[2]},${o.a})`);
        gr.addColorStop(0.5, `rgba(${o.col[0]},${o.col[1]},${o.col[2]},${o.a * 0.3})`);
        gr.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(ox, oy, o.r, 0, Math.PI * 2);
        ctx.fillStyle = gr; ctx.fill();
      }
    };

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      W = canvas.width  = rect.width  || 360;
      H = canvas.height = rect.height || 420;
      initParticles();
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.006;
      drawOrbs(); drawWaves(); drawConnections();
      updateParticles(); drawParticles();
      animId = requestAnimationFrame(draw);
    };

    resize(); draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blocked) return;
    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return; }
    setLoading(true); setError('');
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        const n = attempts + 1;
        setAttempts(n);
        if (n >= 3) {
          setBlocked(true);
          setError('Compte bloqué après 3 tentatives. Réessayez dans 30s.');
          setTimeout(() => { setBlocked(false); setAttempts(0); }, 30000);
        } else {
          setError(`Email ou mot de passe incorrect. (${n}/3 tentatives)`);
        }
        setLoading(false);
      }
    } catch {
      setError('Erreur de connexion.');
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotLoading(true);
    setForgotError('');

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setForgotSent(true);
        setForgotResetLink(data.resetLink); // ✅ نحفظو الرابط
      } else {
        setForgotError(data.message || 'Email introuvable ou erreur serveur.');
      }
    } catch {
      setForgotError('Erreur de connexion au serveur.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="signin-wrap">
        <div className="signin-card">

          {/* LEFT */}
          <div className="s-left">
            <canvas ref={canvasRef} className="s-canvas" />
            <div className="s-left-inner">
              <div className="s-brand">
                <div className="s-brand-logo">MW</div>
                <span className="s-brand-name">Maison du Web</span>
              </div>
              <div className="s-copy">
                <h2>Gérez vos projets avec clarté.</h2>
                <p>Plateforme centralisée pour vos équipes et livrables.</p>
              </div>
              <div className="s-stats">
                <div className="s-stat"><div className="s-stat-n">24</div><div className="s-stat-l">Projets</div></div>
                <div className="s-stat"><div className="s-stat-n">8</div><div className="s-stat-l">Membres</div></div>
                <div className="s-stat"><div className="s-stat-n">97%</div><div className="s-stat-l">Temps</div></div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          {!showForgot ? (
            <div className="s-right">
              <div className="s-pill"><div className="s-dot" /> Espace sécurisé</div>
              <div className="s-form-title">Connexion</div>

              <form onSubmit={handleSubmit}>
                <div className="s-field">
                  <div className="s-label-row"><span className="s-lbl">Email</span></div>
                  <input
                    className="s-inp" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vous@maisonweb.com" required disabled={blocked}
                  />
                </div>

                <div className="s-field">
                  <div className="s-label-row">
                    <span className="s-lbl">Mot de passe</span>
                    <button
                      type="button" className="s-forgot"
                      onClick={() => { setShowForgot(true); setForgotError(''); setForgotEmail(''); setForgotResetLink(''); setForgotSent(false); }}
                    >
                      Oublié ?
                    </button>
                  </div>
                  <div className="s-ibox">
                    <input
                      className="s-inp pr"
                      type={showPassword ? 'text' : 'password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" required disabled={blocked}
                    />
                    <button type="button" className="s-eye" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                {error && <div className="s-err"><span>⚠</span><span>{error}</span></div>}

                <button type="submit" className="s-btn" disabled={loading || blocked}>
                  {blocked
                    ? <><span>🔒</span> Bloqué temporairement</>
                    : loading
                    ? <><div className="s-spin" /> Connexion…</>
                    : <>Se connecter →</>}
                </button>
              </form>

              <div className="s-footer">© {new Date().getFullYear()} Maison du Web</div>
            </div>

          ) : (
            <div className="s-right">
              <div className="s-forgot-head">
                <h2>Mot de passe oublié</h2>
                <p>Entrez votre email pour recevoir un lien de réinitialisation.</p>
              </div>
              <form onSubmit={handleForgot}>
                {forgotSent ? (
                  <div className="s-success">
                    <p>✅ Lien généré avec succès !</p>
                    <a href={forgotResetLink} target="_blank" rel="noreferrer">
                      Cliquez ici pour réinitialiser votre mot de passe
                    </a>
                  </div>
                ) : (
                  <>
                    <div className="s-field">
                      <div className="s-label-row"><span className="s-lbl">Email</span></div>
                      <input
                        className="s-inp" type="email" value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder="vous@maisonweb.com" required
                      />
                    </div>

                    {forgotError && (
                      <div className="s-err"><span>⚠</span><span>{forgotError}</span></div>
                    )}

                    <button type="submit" className="s-btn" disabled={forgotLoading}>
                      {forgotLoading
                        ? <><div className="s-spin" /> Génération en cours…</>
                        : <>Générer le lien →</>}
                    </button>
                  </>
                )}
                <button
                  type="button" className="s-back"
                  onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); setForgotError(''); setForgotResetLink(''); }}
                >
                  ← Retour à la connexion
                </button>
              </form>
              <div className="s-footer">© {new Date().getFullYear()} Maison du Web</div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}