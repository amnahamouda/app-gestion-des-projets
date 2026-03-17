import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import PageMeta from '../components/common/PageMeta';

export default function UserProfiles() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    department: user?.department ?? '',
    phone: '',
    bio: '',
  });
  const [success, setSuccess] = useState(false);

  const roleLabel: Record<string, string> = {
    admin: 'Admin',
    chef_projet: 'Chef de projet',
    employe: 'Employé',
  };

  const roleColor: Record<string, { bg: string; color: string }> = {
    admin: { bg: '#f3e8ff', color: '#6b21a8' },
    chef_projet: { bg: '#dbeafe', color: '#1e40af' },
    employe: { bg: '#dcfce7', color: '#166534' },
  };

  const rc = user?.role ? roleColor[user.role] : { bg: '#f1f5f9', color: '#475569' };

  const handleSave = () => {
    setIsEditing(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#0f172a',
    background: '#f8fafc',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <>
      <PageMeta
        title={`Profil | Maison du Web`}
        description="Mon profil"
      />
      <PageBreadcrumb pageTitle="Mon profil" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Outfit', sans-serif" }}>

        {/* Success */}
        {success && (
          <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '10px', color: '#166534', fontSize: '14px', fontWeight: 500 }}>
            ✅ Profil mis à jour avec succès !
          </div>
        )}

        {/* Card profil */}
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

          {/* Banner */}
          <div style={{ height: '120px', background: 'linear-gradient(135deg, #0f172a, #1e3a8a, #1d4ed8)', position: 'relative' }} />

          {/* Avatar + Info */}
          <div style={{ padding: '0 24px 24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
                {/* Avatar */}
                <div style={{
                  width: '80px', height: '80px',
                  background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '2rem',
                  border: '4px solid #fff',
                  marginTop: '-40px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  flexShrink: 0,
                }}>
                  {user?.name?.[0] ?? 'U'}
                </div>
                <div style={{ paddingBottom: '4px' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                    {user?.name}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px', background: rc.bg, color: rc.color }}>
                      {user?.role ? roleLabel[user.role] : ''}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>{user?.department}</span>
                  </div>
                </div>
              </div>

              {/* Boutons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    ✏️ Modifier
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      style={{ padding: '8px 18px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Enregistrer
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Informations */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* Infos personnelles */}
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 20px 0' }}>
              Informations personnelles
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Nom complet', key: 'name', type: 'text' },
                { label: 'Adresse email', key: 'email', type: 'email' },
                { label: 'Département', key: 'department', type: 'text' },
                { label: 'Téléphone', key: 'phone', type: 'tel' },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {f.label}
                  </label>
                  {isEditing ? (
                    <input
                      type={f.type}
                      value={form[f.key as keyof typeof form]}
                      onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      style={inputStyle}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                    />
                  ) : (
                    <p style={{ fontSize: '14px', color: '#0f172a', margin: 0, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                      {form[f.key as keyof typeof form] || <span style={{ color: '#94a3b8' }}>Non renseigné</span>}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bio + Sécurité */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Bio */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>Bio</h3>
              {isEditing ? (
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  placeholder="Décrivez-vous en quelques mots..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              ) : (
                <p style={{ fontSize: '14px', color: form.bio ? '#0f172a' : '#94a3b8', margin: 0, lineHeight: 1.6 }}>
                  {form.bio || 'Aucune bio renseignée.'}
                </p>
              )}
            </div>

            {/* Déconnexion */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>Session</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
                Connecté en tant que <strong>{user?.name}</strong>
              </p>
              <button
                onClick={logout}
                style={{ width: '100%', padding: '11px', background: '#fff1f2', color: '#be123c', border: '1.5px solid #fecdd3', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                🚪 Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}