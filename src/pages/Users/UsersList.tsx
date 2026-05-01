import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

type UserRole = 'chef_projet' | 'employe' | 'admin';

interface User {
  id: string;
  nom_complet: string;
  prenom?: string;
  email: string;
  role: UserRole;
  matricule?: string;
  telephone?: string;
  departement?: string;
  poste?: string;
  ville?: string;
  wilaya?: string;
  adresse?: string;
  code_postal?: string;
  date_embauche?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  genre?: 'Homme' | 'Femme' | 'Autre';
  situation_familiale?: 'Célibataire' | 'Marié(e)' | 'Divorcé(e)' | 'Veuf/Veuve';
  nombre_enfants?: number;
  status: 'Actif' | 'Inactif';
}

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
  transition: 'all 0.2s ease',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '6px',
};

const roleColor: Record<string, { bg: string; color: string }> = {
  admin: { bg: '#f3e8ff', color: '#6b21a8' },
  chef_projet: { bg: '#dbeafe', color: '#1e40af' },
  employe: { bg: '#dcfce7', color: '#166534' },
};

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  chef_projet: 'Chef de projet',
  employe: 'Employé',
};

const API_URL = 'http://localhost:5000/api';

export default function UsersList() {
  const { isAdmin, user: currentUser, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const emptyForm = {
    nom_complet: '',
    prenom: '',
    email: '',
    password: '',
    role: 'employe' as UserRole,
    matricule: '',
    telephone: '',
    departement: '',
    poste: '',
    ville: '',
    wilaya: '',
    adresse: '',
    code_postal: '',
    date_embauche: '',
    date_naissance: '',
    lieu_naissance: '',
    genre: '',
    situation_familiale: '',
    nombre_enfants: 0,
  };

  const [form, setForm] = useState(emptyForm);

  // ===================== FETCH USERS =====================
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Erreur lors du chargement');

      const data = await response.json();
      if (data.success) {
        const formattedUsers = data.users.map((u: any) => ({
          id: u.id,
          nom_complet: u.nom_complet,
          prenom: u.prenom,
          email: u.email,
          role: u.role,
          matricule: u.matricule,
          telephone: u.telephone,
          departement: u.departement,
          poste: u.poste,
          ville: u.ville,
          wilaya: u.wilaya,
          adresse: u.adresse,
          code_postal: u.code_postal,
          date_embauche: u.date_embauche,
          date_naissance: u.date_naissance,
          lieu_naissance: u.lieu_naissance,
          genre: u.genre,
          situation_familiale: u.situation_familiale,
          nombre_enfants: u.nombre_enfants,
          status: u.status === 1 ? 'Actif' : 'Inactif',
        }));
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Erreur chargement users:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===================== CRÉER UTILISATEUR =====================
  const handleCreateUser = async () => {
    if (!form.nom_complet || !form.email || !form.password || !form.departement) {
      setFormError('Nom complet, email, mot de passe et département sont obligatoires.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      // ✅ FIX: /auth/users au lieu de /auth/signUp
      const response = await fetch(`${API_URL}/auth/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom_complet: form.nom_complet,
          prenom: form.prenom || null,
          email: form.email,
          password: form.password,
          role: form.role,
          matricule: form.matricule || null,
          telephone: form.telephone || null,
          departement: form.departement,
          poste: form.poste || null,
          ville: form.ville || null,
          wilaya: form.wilaya || null,
          adresse: form.adresse || null,
          code_postal: form.code_postal || null,
          date_embauche: form.date_embauche || null,
          date_naissance: form.date_naissance || null,
          lieu_naissance: form.lieu_naissance || null,
          genre: form.genre || null,
          situation_familiale: form.situation_familiale || null,
          nombre_enfants: form.nombre_enfants || 0,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg(`✅ Utilisateur "${form.nom_complet}" créé avec succès ! Un email lui a été envoyé.`);
        setShowModal(false);
        setForm(emptyForm);
        fetchUsers();
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setFormError(data.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création:', error);
      setFormError('Erreur de connexion au serveur');
    } finally {
      setFormLoading(false);
    }
  };

  // ===================== SUPPRIMER UTILISATEUR =====================
  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Confirmer la suppression de "${name}" ?`)) return;

    try {
      const response = await fetch(`${API_URL}/auth/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg(`✅ Utilisateur "${name}" supprimé avec succès`);
        fetchUsers();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setFormError(data.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      setFormError('Erreur de connexion');
    }
  };

  // ===================== TOGGLE STATUT =====================
  const handleToggleStatus = async (id: string, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const response = await fetch(`${API_URL}/auth/users/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchUsers();
        setSuccessMsg('✅ Statut mis à jour');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
    }
  };

  // ===================== ÉTAT MODIFICATION =====================
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editLoading, setEditLoading] = useState(false);

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      nom_complet: user.nom_complet || '',
      prenom: user.prenom || '',
      email: user.email || '',
      password: '',
      role: user.role,
      matricule: user.matricule || '',
      telephone: user.telephone || '',
      departement: user.departement || '',
      poste: user.poste || '',
      ville: user.ville || '',
      wilaya: user.wilaya || '',
      adresse: user.adresse || '',
      code_postal: user.code_postal || '',
      date_embauche: user.date_embauche || '',
      date_naissance: user.date_naissance || '',
      lieu_naissance: user.lieu_naissance || '',
      genre: user.genre || '',
      situation_familiale: user.situation_familiale || '',
      nombre_enfants: user.nombre_enfants || 0,
    });
    setShowEditModal(true);
    setFormError('');
  };

  // ===================== METTRE À JOUR UTILISATEUR =====================
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (!editForm.nom_complet || !editForm.email || !editForm.departement) {
      setFormError('Nom complet, email et département sont obligatoires.');
      return;
    }

    setEditLoading(true);
    setFormError('');

    try {
      // ✅ FIX: password n'est pas inclus par défaut
      const updateData: any = {
        nom_complet: editForm.nom_complet,
        prenom: editForm.prenom || null,
        email: editForm.email,
        role: editForm.role,
        matricule: editForm.matricule || null,
        telephone: editForm.telephone || null,
        departement: editForm.departement,
        poste: editForm.poste || null,
        ville: editForm.ville || null,
        wilaya: editForm.wilaya || null,
        adresse: editForm.adresse || null,
        code_postal: editForm.code_postal || null,
        date_embauche: editForm.date_embauche || null,
        date_naissance: editForm.date_naissance || null,
        lieu_naissance: editForm.lieu_naissance || null,
        genre: editForm.genre || null,
        situation_familiale: editForm.situation_familiale || null,
        nombre_enfants: editForm.nombre_enfants || 0,
      };

      // ✅ FIX: يبعث password فقط إذا كان مكتوب
      if (editForm.password && editForm.password.trim() !== '') {
        updateData.password = editForm.password;
      }

      const response = await fetch(`${API_URL}/auth/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg(`✅ Utilisateur "${editForm.nom_complet}" modifié avec succès !`);
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers();
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setFormError(data.message || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur modification:', error);
      setFormError('Erreur de connexion au serveur');
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && token) {
      fetchUsers();
    }
  }, [isAdmin, token]);

  const filteredUsers = users.filter((u) => {
  const matchSearch =
    u.nom_complet?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.matricule?.toLowerCase().includes(search.toLowerCase());

  const matchRole = roleFilter === 'all' || u.role === roleFilter;

  return matchSearch && matchRole;
});

  if (!isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⛔</div>
        <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Accès refusé</p>
        <p>Vous n'avez pas les droits administrateur</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Chargement des utilisateurs...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            👥 Utilisateurs
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            {users.length} utilisateur(s) au total
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(''); setForm(emptyForm); }}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(30,58,138,0.25)',
          }}
        >
          + Nouvel utilisateur
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', color: '#166534', fontSize: '14px' }}>
          {successMsg}
        </div>
      )}

      {formError && (
        <div style={{ padding: '12px 16px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '10px', color: '#c53030', fontSize: '14px' }}>
          ⚠️ {formError}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Rechercher par nom, email ou matricule..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...inputStyle, maxWidth: '320px' }}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.background = '#fff'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
      />
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
  {[
    { value: 'all',        label: '👥 Tous',          bg: '#f1f5f9', color: '#475569' },
    { value: 'employe',    label: '💼 Employés',       bg: '#dcfce7', color: '#166534' },
    { value: 'chef_projet',label: '🎯 Chefs de projet',bg: '#dbeafe', color: '#1e40af' },
  ].map((f) => (
    <button
      key={f.value}
      onClick={() => setRoleFilter(f.value)}
      style={{
        padding: '7px 14px',
        borderRadius: '20px',
        border: `2px solid ${roleFilter === f.value ? f.color : '#e2e8f0'}`,
        background: roleFilter === f.value ? f.bg : '#fff',
        color: roleFilter === f.value ? f.color : '#94a3b8',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {f.label}
      <span style={{
        marginLeft: '6px',
        background: roleFilter === f.value ? f.color : '#e2e8f0',
        color: roleFilter === f.value ? '#fff' : '#64748b',
        borderRadius: '10px',
        padding: '1px 7px',
        fontSize: '11px',
      }}>
        {f.value === 'all' ? users.length : users.filter(u => u.role === f.value).length}
      </span>
    </button>
  ))}
</div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Utilisateur', 'Matricule', 'Email', 'Rôle', 'Département', 'Poste', 'Statut', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '13px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const rc = roleColor[u.role] || roleColor.employe;
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px',
                          background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
                          borderRadius: '10px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0,
                        }}>
                          {u.nom_complet?.[0] || 'U'}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: '#0f172a', margin: 0 }}>{u.nom_complet}</p>
                          {u.prenom && <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>{u.prenom}</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>
                      {u.matricule || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontSize: '13px' }}>{u.email}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: '12px', fontWeight: 600,
                        padding: '3px 10px', borderRadius: '20px',
                        background: rc.bg, color: rc.color,
                      }}>
                        {roleLabel[u.role] || u.role}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontSize: '13px' }}>{u.departement || '—'}</td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontSize: '13px' }}>{u.poste || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: '12px', fontWeight: 600,
                        padding: '3px 10px', borderRadius: '20px',
                        background: u.status === 'Actif' ? '#dcfce7' : '#f1f5f9',
                        color: u.status === 'Actif' ? '#166534' : '#475569',
                      }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => openEditModal(u)}
                          style={{
                            padding: '5px 10px',
                            background: '#eff6ff', color: '#1e40af',
                            border: 'none', borderRadius: '8px',
                            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.nom_complet)}
                          style={{
                            padding: '5px 10px',
                            background: '#fff1f2', color: '#be123c',
                            border: 'none', borderRadius: '8px',
                            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== MODAL CRÉATION ===================== */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', overflowY: 'auto' }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '700px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>➕ Créer un utilisateur</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateUser(); }}>
              {/* Obligatoires */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>📋 Informations obligatoires</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Nom complet *</label>
                    <input type="text" value={form.nom_complet} onChange={(e) => setForm({ ...form, nom_complet: e.target.value })} placeholder="Ex: Jean Dupont" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Prénom</label>
                    <input type="text" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} placeholder="Ex: Jean" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@maisonweb.com" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Mot de passe *</label>
                    <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Professionnelles */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>💼 Informations professionnelles</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Matricule</label>
                    <input type="text" value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} placeholder="Ex: MW-2024-001" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Téléphone</label>
                    <input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="+213 5XX XX XX XX" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Rôle *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      {[
                        { value: 'employe', label: 'Employé', icon: '💼' },
                        { value: 'chef_projet', label: 'Chef Projet', icon: '🎯' },
                        { value: 'admin', label: 'Administrateur', icon: '⚙️' },
                      ].map((r) => (
                        <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value as UserRole })}
                          style={{ padding: '10px 8px', borderRadius: '8px', border: `2px solid ${form.role === r.value ? '#1e3a8a' : '#e2e8f0'}`, background: form.role === r.value ? '#eff6ff' : '#f8fafc', color: form.role === r.value ? '#1e3a8a' : '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          <div style={{ fontSize: '16px', marginBottom: '4px' }}>{r.icon}</div>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Département *</label>
                    <input type="text" value={form.departement} onChange={(e) => setForm({ ...form, departement: e.target.value })} placeholder="Ex: Développement, Design..." style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Poste</label>
                    <input type="text" value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} placeholder="Ex: Développeur Full Stack" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Date d'embauche</label>
                    <input type="date" value={form.date_embauche} onChange={(e) => setForm({ ...form, date_embauche: e.target.value })} style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>📍 Adresse</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Adresse</label>
                    <input type="text" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Rue, numéro, résidence..." style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Ville</label>
                    <input type="text" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} placeholder="Ex: Alger" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Wilaya</label>
                    <input type="text" value={form.wilaya} onChange={(e) => setForm({ ...form, wilaya: e.target.value })} placeholder="Ex: Alger" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Code postal</label>
                    <input type="text" value={form.code_postal} onChange={(e) => setForm({ ...form, code_postal: e.target.value })} placeholder="Ex: 16000" style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Personnelles */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>👤 Informations personnelles</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Date de naissance</label>
                    <input type="date" value={form.date_naissance} onChange={(e) => setForm({ ...form, date_naissance: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Lieu de naissance</label>
                    <input type="text" value={form.lieu_naissance} onChange={(e) => setForm({ ...form, lieu_naissance: e.target.value })} placeholder="Ex: Alger" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Genre</label>
                    <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} style={inputStyle}>
                      <option value="">Sélectionner</option>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Situation familiale</label>
                    <select value={form.situation_familiale} onChange={(e) => setForm({ ...form, situation_familiale: e.target.value })} style={inputStyle}>
                      <option value="">Sélectionner</option>
                      <option value="Célibataire">Célibataire</option>
                      <option value="Marié(e)">Marié(e)</option>
                      <option value="Divorcé(e)">Divorcé(e)</option>
                      <option value="Veuf/Veuve">Veuf/Veuve</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Nombre d'enfants</label>
                    <input type="number" value={form.nombre_enfants} onChange={(e) => setForm({ ...form, nombre_enfants: parseInt(e.target.value) || 0 })} min="0" style={inputStyle} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fff', color: '#475569', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" disabled={formLoading}
                  style={{ flex: 1, padding: '12px', background: formLoading ? '#94a3b8' : 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: formLoading ? 'not-allowed' : 'pointer' }}>
                  {formLoading ? 'Création en cours...' : "✅ Créer l'utilisateur"}
                </button>
              </div>

              <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '16px' }}>
                📧 Un email de bienvenue sera automatiquement envoyé à l'utilisateur avec ses identifiants.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL MODIFICATION ===================== */}
      {showEditModal && editingUser && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', overflowY: 'auto' }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '700px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>✏️ Modifier l'utilisateur</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }}>
              {/* Obligatoires */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>📋 Informations obligatoires</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Nom complet *</label>
                    <input type="text" value={editForm.nom_complet} onChange={(e) => setEditForm({ ...editForm, nom_complet: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Prénom</label>
                    <input type="text" value={editForm.prenom} onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Mot de passe</label>
                    <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Laisser vide pour ne pas modifier" style={inputStyle} />
                    <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>🔒 Laissez vide pour conserver le mot de passe actuel</p>
                  </div>
                </div>
              </div>

              {/* Professionnelles */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>💼 Informations professionnelles</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Matricule</label>
                    <input type="text" value={editForm.matricule} onChange={(e) => setEditForm({ ...editForm, matricule: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Téléphone</label>
                    <input type="tel" value={editForm.telephone} onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Rôle *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      {[
                        { value: 'employe', label: 'Employé', icon: '💼' },
                        { value: 'chef_projet', label: 'Chef Projet', icon: '🎯' },
                        { value: 'admin', label: 'Administrateur', icon: '⚙️' },
                      ].map((r) => (
                        <button key={r.value} type="button" onClick={() => setEditForm({ ...editForm, role: r.value as UserRole })}
                          style={{ padding: '10px 8px', borderRadius: '8px', border: `2px solid ${editForm.role === r.value ? '#1e3a8a' : '#e2e8f0'}`, background: editForm.role === r.value ? '#eff6ff' : '#f8fafc', color: editForm.role === r.value ? '#1e3a8a' : '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          <div style={{ fontSize: '16px', marginBottom: '4px' }}>{r.icon}</div>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Département *</label>
                    <input type="text" value={editForm.departement} onChange={(e) => setEditForm({ ...editForm, departement: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Poste</label>
                    <input type="text" value={editForm.poste} onChange={(e) => setEditForm({ ...editForm, poste: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Date d'embauche</label>
                    <input type="date" value={editForm.date_embauche} onChange={(e) => setEditForm({ ...editForm, date_embauche: e.target.value })} style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>📍 Adresse</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Adresse</label>
                    <input type="text" value={editForm.adresse} onChange={(e) => setEditForm({ ...editForm, adresse: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Ville</label>
                    <input type="text" value={editForm.ville} onChange={(e) => setEditForm({ ...editForm, ville: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Wilaya</label>
                    <input type="text" value={editForm.wilaya} onChange={(e) => setEditForm({ ...editForm, wilaya: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Code postal</label>
                    <input type="text" value={editForm.code_postal} onChange={(e) => setEditForm({ ...editForm, code_postal: e.target.value })} style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Personnelles */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px' }}>👤 Informations personnelles</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Date de naissance</label>
                    <input type="date" value={editForm.date_naissance} onChange={(e) => setEditForm({ ...editForm, date_naissance: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Lieu de naissance</label>
                    <input type="text" value={editForm.lieu_naissance} onChange={(e) => setEditForm({ ...editForm, lieu_naissance: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Genre</label>
                    <select value={editForm.genre} onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })} style={inputStyle}>
                      <option value="">Sélectionner</option>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Situation familiale</label>
                    <select value={editForm.situation_familiale} onChange={(e) => setEditForm({ ...editForm, situation_familiale: e.target.value })} style={inputStyle}>
                      <option value="">Sélectionner</option>
                      <option value="Célibataire">Célibataire</option>
                      <option value="Marié(e)">Marié(e)</option>
                      <option value="Divorcé(e)">Divorcé(e)</option>
                      <option value="Veuf/Veuve">Veuf/Veuve</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Nombre d'enfants</label>
                    <input type="number" value={editForm.nombre_enfants} onChange={(e) => setEditForm({ ...editForm, nombre_enfants: parseInt(e.target.value) || 0 })} min="0" style={inputStyle} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowEditModal(false)}
                  style={{ flex: 1, padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fff', color: '#475569', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" disabled={editLoading}
                  style={{ flex: 1, padding: '12px', background: editLoading ? '#94a3b8' : 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: editLoading ? 'not-allowed' : 'pointer' }}>
                  {editLoading ? 'Modification...' : '💾 Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}