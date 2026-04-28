import { Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';

const navItems = [
  { path: '/dashboard', label: 'Tableau de bord', icon: '📊', roles: ['admin', 'chef_projet', 'employe'] },
  { path: '/projects', label: 'Projets', icon: '📁', roles: ['chef_projet', 'employe'] },
  { path: '/tasks', label: 'Tâches', icon: '✅', roles: ['chef_projet', 'employe'] },
  { path: '/risk', label: 'Analyse des risques', icon: '🔍', roles: ['chef_projet'] },
  { path: '/team', label: "Gestion de l'équipe", icon: '👥', roles: ['chef_projet', 'admin'] },
  { path: '/calendar', label: 'Calendrier', icon: '📅', roles: ['chef_projet', 'employe'] },
  { path: '/users', label: 'Utilisateurs', icon: '🔧', roles: ['admin'] },
  { path: '/profile', label: 'Mon profil', icon: '👤', roles: ['admin', 'chef_projet', 'employe'] },
  { path: '/settings', label: 'Paramètres', icon: '⚙️', roles: ['admin', 'chef_projet', 'employe'] },
];

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();

  const filtered = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  const isActive = (path: string) => location.pathname === path;
  const isOpen = isExpanded || isMobileOpen || isHovered;

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-200 dark:border-gray-700">
        <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: '11px' }}>MW</span>
        </div>
        {isOpen && (
          <span className="font-bold text-gray-900 dark:text-white text-sm whitespace-nowrap">
            Maison du Web
          </span>
        )}
      </div>

      {/* User badge */}
      {isOpen && user && (
        <div className="mx-3 my-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
              {user.name?.[0]}
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-500">
                {user.role === 'admin' ? '🔴 Admin' : user.role === 'chef_projet' ? '🔵 Chef de projet' : '🟢 Employé'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="p-2 mt-2">
        {filtered.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
              isActive(item.path)
                ? 'bg-blue-900 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <span className="text-base flex-shrink-0">{item.icon}</span>
            {isOpen && (
              <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      {isOpen && (
        <div style={{ position: 'absolute', bottom: '16px', left: '12px', right: '12px' }}>
          <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, textAlign: 'center' }}>
              © {new Date().getFullYear()} Maison du Web
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}