import { createContext, useContext, useState, useEffect } from 'react';
import { api, getToken, setToken, clearToken, getUser, setUser } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token && !user) {
      // Try to restore session
      api.getDashboard()
        .then(() => {
          setUserState(getUser());
        })
        .catch(() => {
          clearToken();
          setUserState(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setToken(data.access_token);
    const userData = {
      id: data.user_id,
      email: data.email,
      name: data.name || email.split('@')[0],
      organization_id: data.organization_id,
      role: data.role,
    };
    setUser(userData);
    setUserState(userData);
    return data;
  };

  const register = async (formData) => {
    const data = await api.register(formData);
    setToken(data.access_token);
    const userData = {
      id: data.user_id,
      email: formData.email,
      name: formData.name || formData.email.split('@')[0],
      organization_id: data.organization_id,
      role: 'admin',
    };
    setUser(userData);
    setUserState(userData);
    return data;
  };

  const logout = () => {
    clearToken();
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
