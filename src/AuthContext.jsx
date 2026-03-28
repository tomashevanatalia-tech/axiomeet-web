import { createContext, useContext, useState, useEffect } from 'react';
import { api, getToken, setToken, clearToken, getUser, setUser } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      // Always verify token validity on app start
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
    // Backend returns { user: {...}, tokens: {...} }
    const token = data.tokens?.access_token || data.access_token;
    if (!token) throw new Error('No access token in response');
    setToken(token);
    const userData = {
      id: data.user?.id || data.user_id,
      email: data.user?.email || data.email || email,
      name: data.user?.display_name || data.name || email.split('@')[0],
      organization_id: data.user?.organization_id || data.organization_id,
      role: data.user?.role || data.role,
    };
    setUser(userData);
    setUserState(userData);
    return data;
  };

  const register = async (formData) => {
    const data = await api.register(formData);
    // Backend returns { user: {...}, organization: {...}, tokens: {...} }
    const token = data.tokens?.access_token || data.access_token;
    if (!token) throw new Error('No access token in response');
    setToken(token);
    const userData = {
      id: data.user?.id || data.user_id,
      email: data.user?.email || formData.email,
      name: data.user?.display_name || data.user?.name || formData.display_name || formData.name || formData.email.split('@')[0],
      organization_id: data.user?.organization_id || data.organization?.id || data.organization_id,
      role: data.user?.role || 'admin',
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
