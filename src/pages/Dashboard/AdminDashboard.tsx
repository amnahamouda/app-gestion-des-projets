import { Link } from 'react-router';

const stats = [
  { label: 'Total projets', value: '12', sub: '3 en retard', color: 'bg-blue-900' },
  { label: 'Tâches actives', value: '48', sub: '22 en cours', color: 'bg-orange-500' },
  { label: 'Projets terminés', value: '4', sub: 'ce trimestre', color: 'bg-green-600' },
  { label: 'Membres équipe', value: '9', sub: 'actifs', color: 'bg-purple-600' },
];

const recentProjects = [
  { id: 'PRJ-001', name: 'Refonte site e-commerce', progress: 65, status: 'En cours', chef: 'Amine B.' },
  { id: 'PRJ-002', name: 'Application mobile RH', progress: 20, status: 'En cours', chef: 'Sara M.' },
  { id: 'PRJ-003', name: 'Dashboard analytique', progress: 100, status: 'Terminé', chef: 'Karim O.' },
  { id: 'PRJ-004', name: 'Portail client B2B', progress: 5, status: 'En attente', chef: 'Amine B.' },
];

const statusColor: Record<string, string> = {
  'En cours': 'bg-blue-100 text-blue-800',
  'Terminé': 'bg-green-100 text-green-800',
  'En attente': 'bg-yellow-100 text-yellow-800',
};

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord — Admin</h1>
        <p className="text-gray-500 text-sm mt-1">Vue globale de Maison du Web</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className={`w-10 h-10 ${s.color} rounded-lg mb-3`} />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.label}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Projets récents */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Projets récents</h2>
          <Link to="/projects" className="text-sm text-blue-900 dark:text-blue-400 hover:underline">
            Voir tout
          </Link>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {recentProjects.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <Link to={`/projects/${p.id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-900 truncate block">
                  {p.name}
                </Link>
                <p className="text-xs text-gray-400">Chef : {p.chef}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[p.status]}`}>
                {p.status}
              </span>
              <div className="w-24">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-400">{p.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-900 h-1.5 rounded-full"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}