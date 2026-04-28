import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

const API_URL = 'http://localhost:5000/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, newPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/signin'), 3000);
      } else {
        setError(data.message || 'Erreur lors de la réinitialisation.');
      }
    } catch {
      setError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#e8edf5', fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '2.5rem',
        width: 380, boxShadow: '0 8px 40px rgba(10,40,110,0.18)'
      }}>
        <h2 style={{ color: '#0f1f4a', marginBottom: 6, fontSize: '1.2rem', fontWeight: 700 }}>
          🔐 Réinitialiser le mot de passe
        </h2>
        <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 24 }}>{email}</p>

        {success ? (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 8, padding: 16, textAlign: 'center'
          }}>
            <p style={{ color: '#15803d', fontWeight: 600, marginBottom: 4 }}>
              ✅ Mot de passe réinitialisé !
            </p>
            <span style={{ color: '#6b7280', fontSize: 12 }}>
              Redirection vers la connexion...
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#5a6a85', display: 'block', marginBottom: 4 }}>
                Nouveau mot de passe
              </label>
              <input
                type="password" value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••" required
                style={{
                  width: '100%', padding: '9px 12px',
                  background: '#f3f6fc', border: '1.5px solid #d6dff0',
                  borderRadius: 8, fontSize: 13, color: '#0f1f4a',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#5a6a85', display: 'block', marginBottom: 4 }}>
                Confirmer le mot de passe
              </label>
              <input
                type="password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••" required
                style={{
                  width: '100%', padding: '9px 12px',
                  background: '#f3f6fc', border: '1.5px solid #d6dff0',
                  borderRadius: 8, fontSize: 13, color: '#0f1f4a',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            {error && (
              <div style={{
                background: '#fff1f2', border: '1px solid #fecdd3',
                borderRadius: 7, padding: '7px 12px',
                color: '#be123c', fontSize: 12, marginBottom: 12
              }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '10.5px',
                background: loading ? '#93a3c8' : '#0f3494',
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Réinitialisation...' : 'Confirmer →'}
            </button>

            <button
              type="button" onClick={() => navigate('/signin')}
              style={{
                width: '100%', padding: '8.5px', marginTop: 8,
                background: 'transparent', border: '1px solid #d6dff0',
                borderRadius: 8, color: '#6b7280', fontSize: 12,
                cursor: 'pointer'
              }}
            >
              ← Retour à la connexion
            </button>
          </form>
        )}
      </div>
    </div>
  );
}