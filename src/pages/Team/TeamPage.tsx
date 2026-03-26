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
  // Données de charge et performance
  charge_actuelle?: number;
  taches_terminees?: number;
  taches_actives?: number;
  total_taches?: number;
  taches_en_retard?: number;
  disponibilite?: string;
}

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
    nom_complet: '',
    email: '',
    password: '',
    role: 'employe',
    departement: '',
    telephone: '',
    poste: ''
  });
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>(null);

  // ==================== US1: ADMIN - LISTER LES MEMBRES ====================
  const fetchMembres = async () => {
    try {
      const response = await fetch(`${API_URL}/equipe/membres`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 Membres reçus:', data);
      
      if (data.success) {
        setMembers(data.membres || []);
      }
    } catch (error) {
      console.error('Erreur chargement membres:', error);
    }
  };

  // ==================== US2: CHEF - DISPONIBILITÉ DES EMPLOYÉS ====================
  const fetchDisponibilite = async () => {
    try {
      const response = await fetch(`${API_URL}/equipe/disponibilite`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 Disponibilité:', data);
      
      if (data.success) {
        // Transformer les données de disponibilité en format membre
        const membresFormatted = data.employes.map((e: any) => ({
          id: e.id,
          nom_complet: e.nom,
          email: e.email,
          role: 'employe',
          departement: e.poste || 'Non défini',
          charge_actuelle: e.taches_actives,
          taches_terminees: e.taches_terminees,
          total_taches: e.total_taches,
          taches_en_retard: e.taches_en_retard,
          disponibilite: e.disponibilite
        }));
        setMembers(membresFormatted);
        setStatsData(data);
      }
    } catch (error) {
      console.error('Erreur chargement disponibilité:', error);
    }
  };

  // ==================== US3: CHEF - PERFORMANCE DE L'ÉQUIPE ====================
  const fetchPerformance = async () => {
    try {
      const response = await fetch(`${API_URL}/equipe/performance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 Performance:', data);
      
      if (data.success) {
        setPerformanceData(data);
      }
    } catch (error) {
      console.error('Erreur chargement performance:', error);
    }
  };

  // ==================== US4: CHEF - CALCUL CHARGE AUTOMATIQUE ====================
 // ==================== US4: CHEF - CALCUL CHARGE AUTOMATIQUE ====================
const fetchChargeAuto = async () => {
  try {
    const response = await fetch(`${API_URL}/equipe/charge-auto`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    console.log('📊 Charge auto:', data);
    
    if (data.success) {
      setMembers(prev => prev.map(m => {
        const chargeData = data.analyse_charge?.find((c: any) => c.employe.id === m.id);
        if (chargeData) {
          const aFaire = chargeData.details?.a_faire || 0;      // ✅ ajouté
          const enCours = chargeData.details?.en_cours || 0;
          const terminees = chargeData.details?.terminees || 0;
          
          return {
            ...m,
            charge_actuelle: Number(chargeData.charge),          // ✅ forcer number
            taches_actives: aFaire + enCours,                   // ✅ corrigé
            taches_terminees: terminees,
            total_taches: aFaire + enCours + terminees          // ✅ corrigé
          };
        }
        return m;
      }));
    }
  } catch (error) {
    console.error('Erreur chargement charge auto:', error);
  }
};
  // ==================== ADMIN - AJOUTER UN MEMBRE ====================
  const handleCreateMember = async () => {
    if (!form.nom_complet || !form.email || !form.password || !form.departement) {
      setFormError('Tous les champs sont obligatoires.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setShowModal(false);
        setForm({ nom_complet: '', email: '', password: '', role: 'employe', departement: '', telephone: '', poste: '' });
        setFormError('');
        setSuccessMsg(`✅ "${form.nom_complet}" ajouté avec succès`);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchMembres();
      } else {
        setFormError(data.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création:', error);
      setFormError('Erreur de connexion');
    }
  };

  // ==================== ADMIN - MODIFIER UN MEMBRE ====================
  const handleUpdateMember = async () => {
    if (!selectedMember) return;
    
    try {
      const response = await fetch(`${API_URL}/equipe/membres/${selectedMember.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg(`✅ Membre modifié avec succès`);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchMembres();
        setSelectedMember(null);
        setEditForm({});
      } else {
        setFormError(data.message || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Erreur modification:', error);
      setFormError('Erreur de connexion');
    }
  };

  // ==================== ADMIN - DÉSACTIVER UN MEMBRE ====================
  const handleDesactiver = async (id: number, nom: string) => {
    if (!window.confirm(`Désactiver ${nom} ?`)) return;
    
    try {
      const response = await fetch(`${API_URL}/equipe/membres/${id}/desactiver`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg(`✅ ${nom} désactivé`);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchMembres();
      } else {
        alert(data.message || 'Erreur lors de la désactivation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    }
  };

  // ==================== FONCTION getStatus CORRIGÉE ====================
const getStatus = (charge?: number): { label: string; color: string; bg: string; dot: string; icon: string } => {
  const n = Number(charge) || 0;   // ✅ convertir string → number (MySQL يرجع string أحياناً)
  
  if (n <= 3) {
    return { label: 'Disponible', color: '#16a34a', bg: '#dcfce7', dot: '#22c55e', icon: '🟢' };
  }
  if (n === 4) {
    return { label: 'Occupé', color: '#f59e0b', bg: '#fef9c3', dot: '#eab308', icon: '🟡' };
  }
  return { label: 'Surchargé', color: '#dc2626', bg: '#fee2e2', dot: '#ef4444', icon: '🔴' };
};

  // Calculer la performance individuelle
  const getPerformance = (member: Member): number => {
    const total = member.total_taches || 0;
    const terminees = member.taches_terminees || 0;
    return total > 0 ? Math.round((terminees / total) * 100) : 0;
  };

  // Charger les données selon le rôle
 // ==================== useEffect CORRIGÉ ====================
useEffect(() => {
  if (token) {
    const loadData = async () => {
      setLoading(true);
      
      if (isAdmin) {
        await fetchMembres();
        await fetchChargeAuto();   // ✅ تعبي charge_actuelle بعد fetchMembres
      } 
      else if (isChef) {
        await fetchDisponibilite(); // ✅ هي وحدها كافية، charge_actuelle موجودة
        await fetchPerformance();
        // ❌ fetchChargeAuto() محذوفة للشاف — كانت تكتب فوق القيم
      }
      
      setLoading(false);
    };
    loadData();
  }
}, [token, isAdmin, isChef]);

  // Filtrer les membres
  const filtered = members.filter((m) => {
    const matchSearch = m.nom_complet?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase());
    const status = getStatus(m.charge_actuelle).label;
    const matchStatus = filterStatus === 'all' || status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Stats globales
  const statsCards = [
    { 
      label: 'Total membres', 
      value: members.length, 
      icon: '👥', 
      color: '#0f172a', 
      bg: '#f8fafc' 
    },
    { 
      label: 'Disponibles', 
      value: members.filter(m => getStatus(m.charge_actuelle).label === 'Disponible').length, 
      icon: '🟢', 
      color: '#16a34a', 
      bg: '#dcfce7' 
    },
    { 
      label: 'Occupés', 
      value: members.filter(m => getStatus(m.charge_actuelle).label === 'Occupé').length, 
      icon: '🟡', 
      color: '#f59e0b', 
      bg: '#fef9c3' 
    },
    { 
      label: 'Surchargés', 
      value: members.filter(m => getStatus(m.charge_actuelle).label === 'Surchargé').length, 
      icon: '🔴', 
      color: '#dc2626', 
      bg: '#fee2e2' 
    },
  ];

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    chef_projet: 'Chef de projet',
    employe: 'Employé',
  };

  const roleColors: Record<string, { bg: string; color: string }> = {
    admin: { bg: '#f3e8ff', color: '#6b21a8' },
    chef_projet: { bg: '#dbeafe', color: '#1e40af' },
    employe: { bg: '#dcfce7', color: '#166534' },
  };

  if (!isAdmin && !isChef) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>⛔ Accès réservé aux administrateurs et chefs de projet</p>
        <Link to="/dashboard" style={{ color: '#1e40af' }}>Retour au dashboard</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <>
      
      <PageBreadcrumb pageTitle="Gestion de l'équipe" />

      <div style={{ fontFamily: "'Outfit', sans-serif", maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {isAdmin ? 'Gestion de l\'équipe' : 'Disponibilité de l\'équipe'}
            </h1>
            <p style={{ color: '#64748b', marginTop: '4px' }}>
              {isAdmin 
                ? 'Gérer les membres de l\'équipe (ajout, modification, désactivation)'
                : 'Consulter la disponibilité et performance des employés'}
            </p>
            {/* Légende des statuts */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
              <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></span>
                0-1 tâche: Disponible
              </span>
              <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308' }}></span>
                2 tâches: Occupé
              </span>
              <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
                3+ tâches: Surchargé
              </span>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setShowModal(true); setFormError(''); }}
              style={{ padding: '10px 20px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              + Ajouter un membre
            </button>
          )}
        </div>

        {/* Message succès */}
        {successMsg && (
          <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', color: '#166534', marginBottom: '20px' }}>
            ✓ {successMsg}
          </div>
        )}

        {/* US3: Performance globale (visible uniquement pour chef) */}
        {isChef && performanceData && (
          <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', borderRadius: '16px', padding: '20px', marginBottom: '24px', color: '#fff' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>📊 Performance globale de l'équipe</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>Tâches totales</p>
                <p style={{ fontSize: '28px', fontWeight: 700, margin: '4px 0 0 0' }}>{performanceData.performance_globale?.total_taches || 0}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>Tâches terminées</p>
                <p style={{ fontSize: '28px', fontWeight: 700, margin: '4px 0 0 0' }}>{performanceData.performance_globale?.taches_terminees || 0}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>Taux de réussite</p>
                <p style={{ fontSize: '28px', fontWeight: 700, margin: '4px 0 0 0' }}>{performanceData.performance_globale?.taux_reussite || '0%'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', opacity: 0.8, margin: 0 }}>Durée moyenne</p>
                <p style={{ fontSize: '16px', fontWeight: 600, margin: '4px 0 0 0' }}>{performanceData.performance_globale?.duree_moyenne || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {statsCards.map((s) => (
            <div key={s.label} style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>{s.icon}</span>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{s.label}</p>
              </div>
              <p style={{ fontSize: '28px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, maxWidth: '300px', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', background: '#fff' }}
          >
            <option value="all">Tous les statuts</option>
            <option value="Disponible">🟢 Disponible (0-1 tâche)</option>
            <option value="Occupé">🟡 Occupé (2 tâches)</option>
            <option value="Surchargé">🔴 Surchargé (3+ tâches)</option>
          </select>
        </div>

        {/* Grille membres */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filtered.map((m) => {
            const status = getStatus(m.charge_actuelle);
            const roleColorData = roleColors[m.role] || { bg: '#f1f5f9', color: '#475569' };
            const performance = getPerformance(m);
            const loadPercent = Math.min(((m.charge_actuelle || 0) / 5) * 100, 100);
            const total = m.total_taches || 0;
            const terminees = m.taches_terminees || 0;

            return (
              <div key={m.id} style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', transition: 'all 0.2s' }}>
                {/* En-tête */}
                <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '18px' }}>
                    {m.nom_complet?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '16px' }}>{m.nom_complet}</p>
                    <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0 0' }}>{m.email}</p>
                  </div>
                  <div style={{ padding: '4px 12px', borderRadius: '20px', background: status.bg }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: status.color }}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                </div>

                {/* Corps */}
                <div style={{ padding: '16px 20px' }}>
                  {/* Rôle */}
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: roleColorData.bg, color: roleColorData.color }}>
                      {roleLabels[m.role] || m.role}
                    </span>
                    {m.departement && (
                      <span style={{ fontSize: '11px', marginLeft: '8px', color: '#94a3b8' }}>
                        📂 {m.departement}
                      </span>
                    )}
                  </div>

                  {/* Charge de travail (US4) */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Charge de travail</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: status.color }}>
                        {m.charge_actuelle || 0} tâche(s) active(s)
                      </span>
                    </div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${loadPercent}%`, background: status.color, borderRadius: '10px' }} />
                    </div>
                    {m.charge_actuelle && m.charge_actuelle >= 3 && (
                      <div style={{ marginTop: '8px', padding: '4px 8px', background: '#fee2e2', borderRadius: '8px' }}>
                        <span style={{ fontSize: '10px', color: '#dc2626' }}>⚠️ Surcharge - Réaffecter des tâches</span>
                      </div>
                    )}
                  </div>

                  {/* Performance (US3) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Performance</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>{performance}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${performance}%`, background: '#16a34a', borderRadius: '10px' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '8px 0 0 0' }}>
                      {terminees} terminées · {total} au total
                    </p>
                  </div>
                </div>

                {/* Boutons */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setSelectedMember(m)}
                    style={{ flex: 1, padding: '8px', background: '#eff6ff', color: '#1e40af', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                  >
                    Voir détail
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDesactiver(m.id, m.nom_complet)}
                      style={{ padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                    >
                      Désactiver
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Détail Membre (comme avant) */}
        {selectedMember && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setSelectedMember(null)}>
            <div style={{ background: '#fff', borderRadius: '24px', maxWidth: '500px', width: '100%', padding: '28px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '20px' }}>
                    {selectedMember.nom_complet?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{selectedMember.nom_complet}</h2>
                    <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>{selectedMember.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedMember(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Rôle', value: roleLabels[selectedMember.role] || selectedMember.role },
                  { label: 'Département', value: selectedMember.departement || 'Non défini' },
                  { label: 'Statut', value: getStatus(selectedMember.charge_actuelle).label },
                  { label: 'Tâches actives', value: selectedMember.charge_actuelle || 0 },
                  { label: 'Tâches terminées', value: selectedMember.taches_terminees || 0 },
                  { label: 'Total tâches', value: selectedMember.total_taches || 0 },
                ].map((info) => (
                  <div key={info.label} style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px' }}>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 4px 0' }}>{info.label}</p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{info.value}</p>
                  </div>
                ))}
              </div>

              {isAdmin && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Modifier les informations</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="text" placeholder="Nom complet" defaultValue={selectedMember.nom_complet} onChange={(e) => setEditForm({ ...editForm, nom_complet: e.target.value })} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                    <input type="email" placeholder="Email" defaultValue={selectedMember.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                    <input type="text" placeholder="Département" defaultValue={selectedMember.departement} onChange={(e) => setEditForm({ ...editForm, departement: e.target.value })} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                    <select defaultValue={selectedMember.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <option value="employe">Employé</option>
                      <option value="chef_projet">Chef de projet</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button onClick={handleUpdateMember} style={{ padding: '10px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Enregistrer</button>
                  </div>
                </div>
              )}

              <button onClick={() => setSelectedMember(null)} style={{ width: '100%', marginTop: '20px', padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Modal Ajout Membre (Admin seulement) */}
        {showModal && isAdmin && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowModal(false)}>
            <div style={{ background: '#fff', borderRadius: '24px', maxWidth: '480px', width: '100%', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>Ajouter un membre</h2>
              {formError && <div style={{ padding: '10px', background: '#fee2e2', borderRadius: '8px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>⚠️ {formError}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input type="text" placeholder="Nom complet" value={form.nom_complet} onChange={(e) => setForm({ ...form, nom_complet: e.target.value })} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                <input type="password" placeholder="Mot de passe" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                <input type="text" placeholder="Département" value={form.departement} onChange={(e) => setForm({ ...form, departement: e.target.value })} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                <input type="text" placeholder="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                <input type="text" placeholder="Poste" value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Rôle</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {[
                      { value: 'employe', label: 'Employé' },
                      { value: 'chef_projet', label: 'Chef de projet' },
                    ].map((r) => (
                      <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `2px solid ${form.role === r.value ? '#1e3a8a' : '#e2e8f0'}`, background: form.role === r.value ? '#eff6ff' : '#fff', cursor: 'pointer' }}>{r.label}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleCreateMember} style={{ flex: 1, padding: '12px', background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Ajouter</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}