import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getMe } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [hospitalId, setHospitalId] = useState(() => localStorage.getItem('hospitalId'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      getMe().then(setUser).catch(() => setUser(null));
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    if (hospitalId) {
      localStorage.setItem('hospitalId', hospitalId);
    } else {
      localStorage.removeItem('hospitalId');
    }
  }, [hospitalId]);

  const login = async (HospitalID, password) => {
    const data = await apiLogin(HospitalID, password);
    setToken(data.token);
    setHospitalId(data.HospitalID);
    const me = await getMe();
    setUser(me);
    return data;
  };

  const logout = () => {
    setToken(null);
    setHospitalId(null);
    setUser(null);
  };

  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'admin';
  const isDoctor = user?.role === 'doctor';
  const canViewAiSummary = isAdmin || isDoctor;

  return (
    <AuthContext.Provider value={{ token, hospitalId, user, login, logout, isAuthenticated, isAdmin, isDoctor, canViewAiSummary }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
