import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

interface Projet {
  id: number;
  nom_projet: string;
  statut: string;
  progression: number;
  date_fin_prevue: string;
  nb_taches: number;
  taches_terminees: number;
}

interface Tache {
  id: number;
  titre: string;
  assigne_nom: string;
  statut: string;
  progression: number;
  priorite: string;
  date_echeance: string;
  score_risque?: number;
  niveau_risque?: string;
}

interface ChargeEmploye {
  id: number;
  nom: string;
  role: string;
  charge: number;
  details: {
    taches_actives: number;
    taches_terminees: number;
  };
  statut: string;
}

interface StatsGlobales {
  total_projets: number;
  projets_en_cours: number;
  projets_termines: number;
  projets_en_retard: number;
  total_taches_equipe: number;
  taches_en_cours: number;
  taches_risquees: number;
  taux_completion: number;
  progression_moyenne: number;
}

interface RepartitionProjet {
  statut: string;
  nombre: number;
  pourcentage: number;
}

export default function ChefDashboard() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsGlobales>({
    total_projets: 0,
    projets_en_cours: 0,
    projets_termines: 0,
    projets_en_retard: 0,
    total_taches_equipe: 0,
    taches_en_cours: 0,
    taches_risquees: 0,
    taux_completion: 0,
    progression_moyenne: 0
  });
  const [projets, setProjets] = useState<Projet[]>([]);
  const [tachesRisquees, setTachesRisquees] = useState<Tache[]>([]);
  const [chargeEquipe, setChargeEquipe] = useState<ChargeEmploye[]>([]);
  const [repartitionProjets, setRepartitionProjets] = useState<RepartitionProjet[]>([]);

    const fetchProjetsParStatut = async () => {
    try {
      console.log('🔍 Récupération des projets pour chef ID:', user?.id);
      const response = await fetch(`${API_URL}/dashboard/projets/statuts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 Réponse projets:', data);
      
      if (data.success) {
        // ✅ Maintenant data.projets contient la liste des projets
        const projetsData = data.projets || [];
        console.log(`✅ ${projetsData.length} projets trouvés`);
        
        setProjets(projetsData);
        
        // Calculer les stats à partir des projets
        const enCours = projetsData.filter((p: any) => p.statut === 'en_cours').length;
        const termines = projetsData.filter((p: any) => p.statut === 'termine').length;
        const enRetard = projetsData.filter((p: any) => p.statut === 'en_retard').length;
        
        setStats(prev => ({
          ...prev,
          total_projets: projetsData.length,
          projets_en_cours: enCours,
          projets_termines: termines,
          projets_en_retard: enRetard
        }));
      }
    } catch (error) {
      console.error('Erreur chargement projets:', error);
    }
  };

  // US3: Récupérer la charge de l'équipe
  const fetchChargeEquipe = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/charge-equipe`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 Charge équipe:', data);
      
      if (data.success) {
        setChargeEquipe(data.equipe || []);
        
        const totalTaches = data.equipe?.reduce((acc: number, e: any) => acc + e.charge, 0) || 0;
        const tachesEnCours = data.equipe?.reduce((acc: number, e: any) => acc + (e.details?.taches_actives || 0), 0) || 0;
        const tachesTerminees = data.equipe?.reduce((acc: number, e: any) => acc + (e.details?.taches_terminees || 0), 0) || 0;
        
        setStats(prev => ({
          ...prev,
          total_taches_equipe: totalTaches,
          taches_en_cours: tachesEnCours,
          taux_completion: totalTaches > 0 ? Math.round((tachesTerminees / totalTaches) * 100) : 0
        }));
      }
    } catch (error) {
      console.error('Erreur chargement charge équipe:', error);
    }
  };

  // US4: Récupérer les tâches risquées
  const fetchTachesRisquees = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/taches-risquees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 Tâches risquées:', data);
      
      if (data.success) {
        setTachesRisquees(data.taches_risquees || []);
        setStats(prev => ({
          ...prev,
          taches_risquees: data.stats_risques?.total_risquees || 0
        }));
      }
    } catch (error) {
      console.error('Erreur chargement tâches risquées:', error);
    }
  };

  useEffect(() => {
    if (token && user) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([
          fetchProjetsParStatut(),
          fetchChargeEquipe(),
          fetchTachesRisquees(),
          
        ]);
        setLoading(false);
      };
      loadData();
    }
  }, [token, user]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
          Tableau de bord — Chef de projet
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
          Bienvenue 
        </p>
      </div>

      {/* KPI Cards - 6 cartes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {/* Carte 1: Projets */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 8px 0', fontWeight: 500 }}>📁 Mes projets</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0', lineHeight: 1 }}>{stats.total_projets}</p>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                {stats.projets_en_cours} en cours · {stats.projets_termines} terminés
              </p>
            </div>
            <div style={{ width: '44px', height: '44px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              📁
            </div>
          </div>
          {stats.projets_en_retard > 0 && (
            <div style={{ marginTop: '12px', padding: '6px 10px', background: '#fee2e2', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: '#991b1b', fontWeight: 600 }}>⚠️ {stats.projets_en_retard} projet(s) en retard</span>
            </div>
          )}
        </div>

        {/* Carte 2: Tâches équipe */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 8px 0', fontWeight: 500 }}>✅ Tâches équipe</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0', lineHeight: 1 }}>{stats.total_taches_equipe}</p>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                {stats.taches_en_cours} en cours · {stats.total_taches_equipe - stats.taches_en_cours} terminées
              </p>
            </div>
            <div style={{ width: '44px', height: '44px', background: '#f0f9ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              ✅
            </div>
          </div>
        </div>

        {/* Carte 3: Tâches risquées */}
        <div style={{ background: stats.taches_risquees > 0 ? '#fff5f5' : '#fff', borderRadius: '16px', padding: '20px', border: `1px solid ${stats.taches_risquees > 0 ? '#fee2e2' : '#e2e8f0'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: stats.taches_risquees > 0 ? '#991b1b' : '#64748b', fontSize: '13px', margin: '0 0 8px 0', fontWeight: 500 }}>⚠️ Tâches risquées</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: stats.taches_risquees > 0 ? '#991b1b' : '#0f172a', margin: '0 0 4px 0', lineHeight: 1 }}>{stats.taches_risquees}</p>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>deadline proche ou dépassée</p>
            </div>
            <div style={{ width: '44px', height: '44px', background: stats.taches_risquees > 0 ? '#fee2e2' : '#fff5f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              ⚠️
            </div>
          </div>
        </div>

        {/* Carte 4: Taux complétion */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 8px 0', fontWeight: 500 }}>📊 Taux complétion</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: '#166534', margin: '0 0 4px 0', lineHeight: 1 }}>{stats.taux_completion}%</p>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                {stats.total_taches_equipe - stats.taches_en_cours}/{stats.total_taches_equipe} terminées
              </p>
            </div>
            <div style={{ width: '44px', height: '44px', background: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              📊
            </div>
          </div>
          <div style={{ marginTop: '12px', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${stats.taux_completion}%`, background: '#16a34a', borderRadius: '999px' }} />
          </div>
        </div>

        {/* Carte 5: Progression moyenne */}
        <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', borderRadius: '16px', padding: '20px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '12px', opacity: 0.8, margin: '0 0 8px 0' }}>📈 Progression moyenne</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 4px 0', lineHeight: 1 }}>{stats.progression_moyenne || 0}%</p>
              <p style={{ fontSize: '11px', opacity: 0.8, margin: 0 }}>tous projets confondus</p>
            </div>
            <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              📈
            </div>
          </div>
        </div>

       
        
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Mes projets */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '15px' }}>Mes projets</h2>
            <Link to="/projects" style={{ fontSize: '13px', color: '#1e40af', textDecoration: 'none', fontWeight: 500 }}>Voir tout →</Link>
          </div>
          <div>
            {projets.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <p>📭 Aucun projet</p>
                <Link to="/projects" style={{ fontSize: '12px', color: '#1e40af', marginTop: '8px', display: 'inline-block' }}>
                  Créer votre premier projet
                </Link>
              </div>
            ) : (
              projets.slice(0, 3).map((p) => {
                const statusMap: Record<string, { bg: string; color: string; label: string }> = {
                  'en_cours': { bg: '#dbeafe', color: '#1e40af', label: 'En cours' },
                  'termine': { bg: '#dcfce7', color: '#166534', label: 'Terminé' },
                  'en_retard': { bg: '#fee2e2', color: '#991b1b', label: 'En retard' },
                };
                const status = statusMap[p.statut] || { bg: '#f1f5f9', color: '#475569', label: p.statut };
                
                return (
                  <div key={p.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <Link to={`/projects/${p.id}`} style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px', textDecoration: 'none' }}>
                        {p.nom_projet}
                      </Link>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${p.progression}%`, background: '#1d4ed8', borderRadius: '999px' }} />
                      </div>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{p.progression}%</span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                      {p.taches_terminees}/{p.nb_taches} tâches · Deadline : {new Date(p.date_fin_prevue).toLocaleDateString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tâches risquées */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '15px' }}>⚠️ Tâches risquées</h2>
            <Link to="/tasks" style={{ fontSize: '13px', color: '#1e40af', textDecoration: 'none', fontWeight: 500 }}>Voir tout →</Link>
          </div>
          <div>
            {tachesRisquees.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <p>✅ Aucune tâche risquée</p>
              </div>
            ) : (
              tachesRisquees.slice(0, 5).map((t) => {
                const priorityMap: Record<string, { bg: string; color: string }> = {
                  'haute': { bg: '#fee2e2', color: '#991b1b' },
                  'moyenne': { bg: '#fef9c3', color: '#854d0e' },
                  'faible': { bg: '#dcfce7', color: '#166534' },
                };
                const priority = priorityMap[t.priorite] || { bg: '#f1f5f9', color: '#475569' };
                const niveauRisque = t.niveau_risque === 'critique' ? '🔴 Critique' : 
                                     t.niveau_risque === 'élevé' ? '🟠 Élevé' :
                                     t.niveau_risque === 'moyen' ? '🟡 Moyen' : '🟢 Faible';
                
                return (
                  <div key={t.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc', borderLeft: `4px solid ${t.niveau_risque === 'critique' ? '#ef4444' : t.niveau_risque === 'élevé' ? '#f97316' : '#eab308'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '13px' }}>{t.titre}</p>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', background: '#fee2e2', color: '#991b1b' }}>
                        {niveauRisque}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 6px', borderRadius: '20px', background: priority.bg, color: priority.color }}>
                        {t.priorite === 'haute' ? 'Haute' : t.priorite === 'moyenne' ? 'Moyenne' : 'Basse'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {t.assigne_nom} · {t.progression}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Charge équipe */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '15px' }}>Charge de travail équipe</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: '#f1f5f9' }}>
          {chargeEquipe.length === 0 ? (
            <div style={{ background: '#fff', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              <p>👥 Aucun employé dans l'équipe</p>
            </div>
          ) : (
            chargeEquipe.map((m) => {
              const totalTaches = m.charge;
              const doneTaches = m.details?.taches_terminees || 0;
              const efficiency = totalTaches > 0 ? Math.round((doneTaches / totalTaches) * 100) : 0;
              const overloaded = totalTaches - doneTaches > 2;
              
              return (
                <div key={m.id} style={{ background: '#fff', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '36px', height: '36px', background: overloaded ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                      {m.nom?.[0] || 'U'}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '13px' }}>{m.nom}</p>
                      <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>{m.role === 'employe' ? 'Employé' : m.role}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                    <span>{totalTaches} tâches · {doneTaches} terminées</span>
                    {overloaded && <span style={{ color: '#ef4444', fontWeight: 600 }}>Surchargé</span>}
                  </div>
                  <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${efficiency}%`, background: overloaded ? '#ef4444' : '#1d4ed8', borderRadius: '999px' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}