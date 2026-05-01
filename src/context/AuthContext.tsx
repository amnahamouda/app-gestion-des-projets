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
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole }>;
  logout: () => void;
  isAdmin: boolean;
  isChef: boolean;
  isEmploye: boolean;
}

const API_URL = 'http://localhost:5000/api';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('mdw-user');
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('mdw-token');
  });

  const login = async (email: string, password: string): Promise<{ success: boolean; role?: UserRole }> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) return { success: false };

      const loggedUser: AuthUser = {
        id: String(data.user.id),
        name: data.user.nom_complet,
        email: data.user.email,
        role: data.user.role as UserRole,
        department: data.user.departement ?? '',
      };

      // ✅ حفظ التوكن أولاً قبل setUser
      localStorage.setItem('mdw-token', data.token);
      localStorage.setItem('mdw-user', JSON.stringify(loggedUser));
      setToken(data.token);
      setUser(loggedUser);

      return { success: true, role: loggedUser.role };

    } catch {
      // Fallback mock si backend indisponible
      const MOCK_USERS: AuthUser[] = [
        { id: 'U0', name: 'Admin MDW',      email: 'admin@maisonweb.com',  role: 'admin',       department: 'Direction' },
        { id: 'U1', name: 'Amine Belhadj',  email: 'chef@maisonweb.com',   role: 'chef_projet', department: 'Développement' },
        { id: 'U2', name: 'Sara Mansouri',  email: 'employe@maisonweb.com', role: 'employe',    department: 'Développement' },
      ];

      if (password !== 'password') return { success: false };
      const found = MOCK_USERS.find((u) => u.email === email);
      if (!found) return { success: false };

      // ✅ توكن وهمي في mock mode
      const mockToken = 'mock-token-' + found.role;
      localStorage.setItem('mdw-token', mockToken);
      localStorage.setItem('mdw-user', JSON.stringify(found));
      setToken(mockToken);
      setUser(found);

      return { success: true, role: found.role };
    }
  };

  const logout = async () => {
    try {
      const currentToken = localStorage.getItem('mdw-token');
      if (currentToken) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
        });
      }
    } catch {
      // ignore
    }

    setUser(null);
    setToken(null);
    localStorage.removeItem('mdw-token');
    localStorage.removeItem('mdw-user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAdmin:   user?.role === 'admin',
      isChef:    user?.role === 'chef_projet',
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