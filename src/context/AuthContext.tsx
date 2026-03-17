import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'admin' | 'chef_projet' | 'employe';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => { success: boolean; role?: UserRole };
  logout: () => void;
  isAdmin: boolean;
  isChef: boolean;
  isEmploye: boolean;
}

const MOCK_USERS: AuthUser[] = [
  { id: 'U0', name: 'Admin MDW', email: 'admin@maisonweb.com', role: 'admin', department: 'Direction' },
  { id: 'U1', name: 'Amine Belhadj', email: 'chef@maisonweb.com', role: 'chef_projet', department: 'Développement' },
  { id: 'U2', name: 'Sara Mansouri', email: 'employe@maisonweb.com', role: 'employe', department: 'Développement' },
];

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('mdw-user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (email: string, password: string): { success: boolean; role?: UserRole } => {
    if (password !== 'password') return { success: false };
    const found = MOCK_USERS.find((u) => u.email === email);
    if (!found) return { success: false };
    setUser(found);
    localStorage.setItem('mdw-user', JSON.stringify(found));
    return { success: true, role: found.role };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mdw-user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAdmin: user?.role === 'admin',
      isChef: user?.role === 'chef_projet',
      isEmploye: user?.role === 'employe',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}