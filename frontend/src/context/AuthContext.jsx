import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';


const STORAGE_KEY = 'kleinewelt:user';

const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: () => {},
  updateUser: () => {},
  authError: null,
  setAuthError: () => {},
  isAuthenticating: false,
});


function applyAuthToken(token) {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
}

function readStoredUser() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to read stored auth user', error);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    applyAuthToken(user?.token);
  }, [user?.token]);

  async function login(identifier, password) {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      console.info('API Log: Sende Login-Anfrage');
      const response = await axios.post('/api/auth/login', { identifier, password });
      console.info('Nutzer angemeldet', response.data?.id);
      const authenticatedUser = response.data;
      applyAuthToken(authenticatedUser?.token);
      setUser(authenticatedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser));
      return response.data;
    } catch (error) {
      console.error('Login failed', error);
      setAuthError(error.response?.data?.message || 'Anmeldung fehlgeschlagen.');
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }

  function logout() {
    console.info('Nutzer abgemeldet');
    applyAuthToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  function updateUser(partialUser) {
    setUser((current) => {
      if (!current) {
        return current;
      }
      const updated = { ...current, ...partialUser };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  const value = useMemo(
    () => ({ user, login, logout, updateUser, authError, setAuthError, isAuthenticating }),
    [user, authError, isAuthenticating],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
