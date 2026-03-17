import { Link } from 'react-router';

const project = {
  id: 'PRJ-001',
  name: 'Refonte site e-commerce',
  description: 'Refonte complète du site e-commerce incluant nouveau design et nouvelles fonctionnalités.',
  chef: 'Amine Belhadj',
  status: 'En cours',
  priority: 'Haute',
  startDate: '10 Jan 2025',
  endDate: '30 Avr 2025',
  progress: 65,
  team: [
    { name: 'Sara Mansouri', role: 'Dev Front' },
    { name: 'Karim Ouali', role: 'Dev Back' },
    { name: 'Nadia Bouzid', role: 'UI/UX' },
    { name: 'Mehdi Rahali', role: 'QA' },
  ],
};

const kanbanColumns = [
  { id: 'todo', title: 'À faire', color: '#6b7280', tasks: [
    { id: 'T-005', title: 'Intégration Stripe', priority: 'Haute', assignee: 'Karim O.' },
    { id: 'T-006', title: 'Page confirmation', priority: 'Moyenne', assignee: 'Sara M.' },
  ]},
  { id: 'inprogress', title: 'En cours', color: '#3b82f6', tasks: [
    { id: 'T-001', title: 'Maquette accueil', priority: 'Haute', assignee: 'Nadia B.' },
    { id: 'T-002', title: 'API auth', priority: 'Haute', assignee: 'Karim O.' },
  ]},
  { id: 'review', title: 'En révision', color: '#f59e0b', tasks: [
    { id: 'T-003', title: 'Composant panier', priority: 'Haute', assignee: 'Sara M.' },
  ]},
  { id: 'done', title: 'Terminé', color: '#10b981', tasks: [
    { id: 'T-004', title: 'Setup Next.js', priority: 'Basse', assignee: 'Karim O.' },
    { id: 'T-009', title: 'Charte graphique', priority: 'Moyenne', assignee: 'Nadia B.' },
  ]},
];

const priorityColor: Record<string, string> = {
  'Haute': 'bg-red-100 text-red-700',
  'Moyenne': 'bg-yellow-100 text-yellow-700',
  'Basse': 'bg-green-100 text-green-700',
};

export default function ProjectDetail() {
  return (
    <div className="space-y-6">
      <Link to="/projects" className="text-sm text-blue-900 dark:text-blue-400 hover:underline">
        ← Retour aux projets
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{project.status}</span>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">{project.priority}</span>
            </div>
            <p className="text-gray-500 text-sm">{project.description}</p>
            <div className="flex gap-6 text-sm flex-wrap">
              <div><span className="text-gray-400">Chef : </span><span className="font-medium text-gray-700 dark:text-gray-300">{project.chef}</span></div>
              <div><span className="text-gray-400">Début : </span><span className="font-medium text-gray-700 dark:text-gray-300">{project.startDate}</span></div>
              <div><span className="text-gray-400">Fin : </span><span className="font-medium text-gray-700 dark:text-gray-300">{project.endDate}</span></div>
            </div>
          </div>
          <div className="w-48">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Avancement</span>
              <span className="font-bold text-gray-900 dark:text-white">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
              <div className="bg-blue-900 h-2.5 rounded-full" style={{ width: `${project.progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg">Tâches</h2>
          <button className="px-3 py-1.5 bg-blue-900 text-white rounded-lg text-sm hover:bg-blue-800">
            + Ajouter
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kanbanColumns.map((col) => (
            <div key={col.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b-2" style={{ borderColor: col.color }}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{col.title}</span>
                  <span className="text-xs text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: col.color }}>
                    {col.tasks.length}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {col.tasks.map((task) => (
                  <div key={task.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{task.title}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-400">{task.assignee}</span>
                    </div>
                  </div>
                ))}
                <button className="w-full text-left text-xs text-gray-400 hover:text-gray-600 py-1 px-2">
                  + Ajouter
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Équipe */}
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">Équipe</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {project.team.map((m) => (
            <div key={m.name} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
                {m.name[0]}
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</p>
              <p className="text-xs text-gray-400">{m.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}