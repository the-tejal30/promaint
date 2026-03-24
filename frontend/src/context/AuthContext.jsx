import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import client from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('promaint_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (username, password) => {
    const res = await client.post('/auth/login', { username, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('promaint_token', token);
    localStorage.setItem('promaint_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('promaint_token');
    localStorage.removeItem('promaint_user');
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';

  const value = useMemo(
    () => ({ user, login, logout, isAdmin }),
    [user, login, logout, isAdmin]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
