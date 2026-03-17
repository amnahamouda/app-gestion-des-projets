import { useState } from 'react';
import { useNavigate, Link } from 'react-router';

export default function SignUp() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employe',
    department: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Le nom est obligatoire';
    if (!form.email.trim()) newErrors.email = "L'email est obligatoire";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email invalide';
    if (!form.password) newErrors.password = 'Le mot de passe est obligatoire';
    else if (form.password.length < 6) newErrors.password = 'Minimum 6 caractères';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    if (!form.department.trim()) newErrors.department = 'Le département est obligatoire';
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    setErrors({});
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => navigate('/signin'), 2000);
    }, 1000);
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '11px 15px',
    border: `1.5px solid ${hasError ? '#ef4444' : '#e2e8f0'}`,
    borderRadius: '10px',
    fontSize: '14px',
    color: '#0f172a',
    background: '#f8fafc',
    outline: 'none',
    boxSizing: 'border-box',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: "'Outfit', sans-serif", padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '480px', background: '#fff', borderRadius: '20px', padding: '2.5rem', boxShadow: '0 4px 40px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 8px 20px rgba(30,58,138,0.25)' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: '16px' }}>MW</span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>Créer un compte</h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Rejoignez la plateforme Maison du Web</p>
        </div>

        {/* Success */}
        {success && (
          <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '10px', color: '#166534', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
            ✅ Compte créé avec succès ! Redirection...
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Nom */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Nom complet <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Amine Belhadj"
              style={inputStyle(!!errors.name)}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,58,138,0.08)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.name ? '#ef4444' : '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {errors.name && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>⚠ {errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Adresse email <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="email@maisonweb.com"
              style={inputStyle(!!errors.email)}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,58,138,0.08)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.email ? '#ef4444' : '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {errors.email && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>⚠ {errors.email}</p>}
          </div>

          {/* Département + Rôle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Département <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                placeholder="Ex: Développement"
                style={inputStyle(!!errors.department)}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = errors.department ? '#ef4444' : '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
              />
              {errors.department && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>⚠ {errors.department}</p>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Rôle</label>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                style={{ ...inputStyle(false), cursor: 'pointer' }}
              >
                <option value="employe">Employé</option>
                <option value="chef_projet">Chef de projet</option>
              </select>
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Mot de passe <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Minimum 6 caractères"
              style={inputStyle(!!errors.password)}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,58,138,0.08)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.password ? '#ef4444' : '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {errors.password && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>⚠ {errors.password}</p>}
            {form.password && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{
                    flex: 1, height: '4px', borderRadius: '999px',
                    background: form.password.length >= i * 3
                      ? i === 1 ? '#ef4444' : i === 2 ? '#f59e0b' : '#16a34a'
                      : '#e2e8f0',
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* Confirmer */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Confirmer le mot de passe <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Répétez le mot de passe"
              style={inputStyle(!!errors.confirmPassword)}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,58,138,0.08)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.confirmPassword ? '#ef4444' : '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            {errors.confirmPassword && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>⚠ {errors.confirmPassword}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || success}
            style={{
              width: '100%', padding: '13px',
              background: loading || success ? '#94a3b8' : 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontSize: '15px', fontWeight: 600,
              cursor: loading || success ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(30,58,138,0.3)',
              marginTop: '4px',
            }}
          >
            {loading ? 'Création en cours...' : success ? 'Compte créé ✅' : 'Créer mon compte →'}
          </button>

          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', margin: 0 }}>
            Déjà un compte ?{' '}
            <Link to="/signin" style={{ color: '#1e3a8a', fontWeight: 600, textDecoration: 'none' }}>
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}