import { useState, useEffect } from 'react';
import { ChartOptions } from 'chart.js';
import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const API_URL = 'http://localhost:5000/api';

interface StatistiquesGlobales {
  utilisateurs: {
    total: number;
    admins: number;
    chefs_projet: number;
    employes: number;
    actifs: number;
  };
  projets: {
    total: number;
    en_cours: number;
    termines: number;
    en_retard: number;
  };
  taches: {
    total: number;
    terminees: number;
    en_retard: number;
    progression_moyenne: string;
  };
}

interface ActiviteRecente {
  date: string;
  connexions: number;
}

interface Projet {
  id: number;
  nom_projet: string;
  statut: string;
  progression: number;
  chef_nom: string;
}

interface User {
  id: number;
  nom_complet: string;
  email: string;
  role: string;
  department: string;
}

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatistiquesGlobales | null>(null);
    console.log("STATS:", stats);
  console.log("UTILISATEURS:", stats?.utilisateurs);
  const [activite, setActivite] = useState<ActiviteRecente[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);

  // US5: Vue globale admin
  const fetchVueGlobale = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/admin/global`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.statistiques);
        setActivite(data.activite_recente || []);
      }
    } catch (error) {
      console.error('Erreur chargement vue globale:', error);
    }
  };
const activiteChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Activité des utilisateurs',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};
const tachesChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'État des tâches',
    },
  },
}; 
const usersChartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
    },
    title: {
      display: true,
      text: 'Répartition des utilisateurs',
    },
  },
}; 
const projetsChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Répartition des projets par statut',
    },
  },
}; 
  // Récupérer les projets récents
  const fetchProjetsRecents = async () => {
    try {
      const response = await fetch(`${API_URL}/projets?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProjets(data.projets || []);
      }
    } catch (error) {
      console.error('Erreur chargement projets:', error);
    }
  };

  // Récupérer les utilisateurs
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.users) {
        setUsersList(data.users);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  useEffect(() => {
    if (token) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([
          fetchVueGlobale(),
          fetchProjetsRecents(),
          fetchUsers()
        ]);
        setLoading(false);
      };
      loadData();
    }
  }, [token]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

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

  const statusColors: Record<string, { bg: string; color: string; dot: string }> = {
    'en_cours': { bg: '#eff6ff', color: '#1e40af', dot: '#3b82f6' },
    'termine': { bg: '#f0fdf4', color: '#166534', dot: '#22c55e' },
    'en_retard': { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444' },
  };

  const totalProjets = stats?.projets.total || 0;
  const enCours = stats?.projets.en_cours || 0;
  const termines = stats?.projets.termines || 0;
  const enRetard = stats?.projets.en_retard || 0;
  const totalTaches = stats?.taches.total || 0;
  const tachesTerminees = stats?.taches.terminees || 0;
  const completionRate = totalTaches > 0 ? Math.round((tachesTerminees / totalTaches) * 100) : 0;

  // Configuration du graphique en barres (Projets par statut)
  const projetsChartData = {
    labels: ['En cours', 'Terminés', 'En retard'],
    datasets: [
      {
        label: 'Nombre de projets',
        data: [enCours, termines, enRetard],
        backgroundColor: ['#3b82f6', '#22c55e', '#ef4444'],
        borderRadius: 8,
      },
    ],
  };

 
  // Configuration du graphique en camembert (Répartition des utilisateurs)
  const usersChartData = {
    labels: ['Admins', 'Chefs de projet', 'Employés'],
    datasets: [
      {
        data: [
          stats?.utilisateurs.admins || 0,
          stats?.utilisateurs.chefs_projet || 0,
          stats?.utilisateurs.employes || 0,
        ],
        backgroundColor: ['#8b5cf6', '#3b82f6', '#10b981'],
        borderWidth: 0,
      },
    ],
  };

 

  // Configuration du graphique linéaire (Activité récente)
  const activiteChartData = {
    labels: activite.slice(0, 7).map(a => new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })),
    datasets: [
      {
        label: 'Connexions',
        data: activite.slice(0, 7).map(a => a.connexions),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  
  // Configuration du graphique en barres (Tâches)
  const tachesChartData = {
    labels: ['Terminées', 'En retard', 'En cours'],
    datasets: [
      {
        label: 'Nombre de tâches',
        data: [
          tachesTerminees,
          stats?.taches.en_retard || 0,
          totalTaches - tachesTerminees - (stats?.taches.en_retard || 0),
        ],
        backgroundColor: ['#22c55e', '#ef4444', '#f59e0b'],
        borderRadius: 8,
      },
    ],
  };

  
  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '40px' }}>

      {/* Header */}
      <div>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px 0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Vue d'ensemble
        </p>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>
          Tableau de bord Administrateur
        </h1>
        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
          Bienvenue 
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total projets', value: totalProjets, sub: `${enCours} en cours`, icon: '📁', trend: `${termines} terminés`, trendUp: true },
          { label: 'Projets en retard', value: enRetard, sub: `nécessitent attention`, icon: '⚠️', trend: 'à surveiller', trendUp: false },
          { label: 'Utilisateurs', value: stats?.utilisateurs.total || 0, sub: `${stats?.utilisateurs.actifs || 0} actifs`, icon: '👥', trend: `${stats?.utilisateurs.employes || 0} employés`, trendUp: true },
          { label: 'Tâches créées', value: totalTaches, sub: `${tachesTerminees} terminées`, icon: '✅', trend: `${completionRate}% complété`, trendUp: true },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '14px', padding: '20px 24px', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(30,58,138,0.10)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: 0, fontWeight: 500 }}>{s.label}</p>
              <div style={{ width: '36px', height: '36px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', border: '1px solid #dbeafe' }}>
                {s.icon}
              </div>
            </div>
            <p style={{ fontSize: '2.2rem', fontWeight: 700, color: '#111827', margin: '0 0 4px 0', lineHeight: 1 }}>{s.value}</p>
            <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 8px 0' }}>{s.sub}</p>
            <span style={{ fontSize: '11px', color: s.trendUp ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
              {s.trendUp ? '↑' : '↓'} {s.trend}
            </span>
          </div>
        ))}
      </div>

      {/* Graphiques - Ligne 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Graphique Projets */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ height: '300px' }}>
            <Bar data={projetsChartData} options={projetsChartOptions} />
          </div>
        </div>

        {/* Graphique Utilisateurs */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ height: '300px' }}>
            <Doughnut data={usersChartData} options={usersChartOptions} />
          </div>
        </div>
      </div>

      {/* Graphiques - Ligne 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Graphique Tâches */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ height: '300px' }}>
            <Bar data={tachesChartData} options={tachesChartOptions} />
          </div>
        </div>

        {/* Graphique Activité */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ height: '300px' }}>
            {activite.length > 0 ? (
              <Line data={activiteChartData} options={activiteChartOptions} />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                <p>Aucune activité récente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Projets + Équipe */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Projets récents */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f9fafb' }}>
            <div>
              <h2 style={{ fontWeight: 700, color: '#111827', margin: 0, fontSize: '15px' }}>Projets récents</h2>
              <p style={{ color: '#9ca3af', fontSize: '12px', margin: '2px 0 0 0' }}>{totalProjets} projets au total</p>
            </div>
            <Link to="/projects" style={{ fontSize: '13px', color: '#1d4ed8', textDecoration: 'none', fontWeight: 600 }}>Voir tout →</Link>
          </div>
          <div>
            {projets.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                <p>📭 Aucun projet</p>
              </div>
            ) : (
              projets.slice(0, 5).map((p, idx) => {
                const sc = statusColors[p.statut] || { bg: '#f9fafb', color: '#374151', dot: '#9ca3af' };
                const statusLabel = p.statut === 'en_cours' ? 'En cours' : p.statut === 'termine' ? 'Terminé' : p.statut === 'en_retard' ? 'En retard' : p.statut;
                return (
                  <div key={p.id} style={{ padding: '14px 24px', borderBottom: idx < projets.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <Link to={`/projects/${p.id}`} style={{ fontWeight: 600, color: '#111827', fontSize: '13px', textDecoration: 'none' }}>{p.nom_projet}</Link>
                        <p style={{ color: '#9ca3af', fontSize: '11px', margin: '2px 0 0 0' }}>Chef : {p.chef_nom || 'Non assigné'}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', background: sc.bg }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot }} />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: sc.color }}>{statusLabel}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '5px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${p.progression}%`, background: p.progression === 100 ? '#059669' : '#1d4ed8', borderRadius: '999px' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{p.progression}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Équipe */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f9fafb' }}>
            <div>
              <h2 style={{ fontWeight: 700, color: '#111827', margin: 0, fontSize: '15px' }}>Équipe</h2>
              <p style={{ color: '#9ca3af', fontSize: '12px', margin: '2px 0 0 0' }}>{stats?.utilisateurs.total || 0} membres au total</p>
            </div>
            <Link to="/users" style={{ fontSize: '13px', color: '#1d4ed8', textDecoration: 'none', fontWeight: 600 }}>Gérer →</Link>
          </div>
          <div>
            {usersList.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                <p>👥 Aucun utilisateur</p>
              </div>
            ) : (
              usersList.slice(0, 5).map((u, idx) => {
                const rc = roleColor[u.role];
                return (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', borderBottom: idx < 4 ? '1px solid #f9fafb' : 'none' }}>
                    <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                      {u.nom_complet?.[0] || 'U'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: '#111827', margin: 0, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nom_complet}</p>
                      <p style={{ color: '#9ca3af', fontSize: '11px', margin: 0 }}>{u.email}</p>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: rc.bg, color: rc.color, flexShrink: 0 }}>
                      {roleLabel[u.role]}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Statistiques supplémentaires */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '14px', padding: '20px', color: '#fff' }}>
          <p style={{ fontSize: '12px', opacity: 0.8, margin: '0 0 8px 0' }}>Progression moyenne</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats?.taches.progression_moyenne || '0%'}</p>
          <p style={{ fontSize: '11px', opacity: 0.8, marginTop: '8px' }}>des tâches complétées</p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', borderRadius: '14px', padding: '20px', color: '#fff' }}>
          <p style={{ fontSize: '12px', opacity: 0.8, margin: '0 0 8px 0' }}>Taux d'activité</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
            {stats?.utilisateurs?.total > 0
  ? Math.round(
      (Number(stats.utilisateurs.actifs) / Number(stats.utilisateurs.total)) * 100
    )
  : 0}%
          </p>
          <p style={{ fontSize: '11px', opacity: 0.8, marginTop: '8px' }}>utilisateurs actifs</p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '14px', padding: '20px', color: '#fff' }}>
          <p style={{ fontSize: '12px', opacity: 0.8, margin: '0 0 8px 0' }}>Efficacité projets</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
            {totalProjets > 0 ? Math.round((termines / totalProjets) * 100) : 0}%
          </p>
          <p style={{ fontSize: '11px', opacity: 0.8, marginTop: '8px' }}>projets terminés</p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)', borderRadius: '14px', padding: '20px', color: '#fff' }}>
          <p style={{ fontSize: '12px', opacity: 0.8, margin: '0 0 8px 0' }}>Charge moyenne</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
            {stats?.utilisateurs.employes > 0 
              ? Math.round(totalTaches / stats?.utilisateurs.employes) 
              : 0}
          </p>
          <p style={{ fontSize: '11px', opacity: 0.8, marginTop: '8px' }}>tâches par employé</p>
        </div>
      </div>

      {/* Vue globale système */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', borderRadius: '14px', padding: '24px', color: '#fff' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontWeight: 700, color: '#fff', margin: '0 0 4px 0', fontSize: '15px' }}>Vue globale du système</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>Statistiques générales de la plateforme</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Utilisateurs actifs', value: stats?.utilisateurs.actifs || 0, icon: '👤' },
            { label: 'Projets créés', value: totalProjets, icon: '📁' },
            { label: 'Tâches créées', value: totalTaches, icon: '✅' },
            { label: 'Chefs de projet', value: stats?.utilisateurs.chefs_projet || 0, icon: '🎯' },
            { label: 'Employés', value: stats?.utilisateurs.employes || 0, icon: '💼' },
          ].map((s) => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '16px', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{s.icon}</div>
              <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.4 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}