import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from './context/AuthContext';

import AppLayout from './layout/AppLayout';
import SignIn from './pages/AuthPages/SignIn';
import SignUp from './pages/AuthPages/SignUp';
import NotFound from './pages/OtherPage/NotFound';

import AdminDashboard from './pages/Dashboard/AdminDashboard';
import ChefDashboard from './pages/Dashboard/ChefDashboard';
import EmployeDashboard from './pages/Dashboard/EmployeDashboard';

import ProjectsList from './pages/Projects/ProjectsList';
import ProjectDetail from './pages/Projects/ProjectDetail';
import FormElements from './pages/Forms/FormElements';

import TasksList from './pages/Tasks/TasksList';
import UsersList from './pages/Users/UsersList';
import Calendar from './pages/Calendar';
import UserProfiles from './pages/UserProfiles';
import RiskAnalysis from './pages/Risk/RiskDashboard';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/signin" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/signin" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function ChefAdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/signin" replace />;
  if (user.role !== 'admin' && user.role !== 'chef_projet') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function DashboardHome() {
  const { isAdmin, isChef } = useAuth();
  if (isAdmin) return <AdminDashboard />;
  if (isChef) return <ChefDashboard />;
  return <EmployeDashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardHome />} />

        <Route path="/projects" element={<ProjectsList />} />
        <Route path="/projects/new" element={<ChefAdminRoute><FormElements /></ChefAdminRoute>} />
        <Route path="/projects/:id" element={<ProjectDetail />} />

        <Route path="/tasks" element={<TasksList />} />

        <Route path="/risk" element={<ChefAdminRoute><RiskAnalysis /></ChefAdminRoute>} />

        <Route path="/calendar" element={<Calendar />} />

        <Route path="/users" element={<AdminRoute><UsersList /></AdminRoute>} />

        <Route path="/profile" element={<UserProfiles />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}