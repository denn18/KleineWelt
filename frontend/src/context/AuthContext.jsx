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
  isAuthReady: false,
  getValidAccessToken: () => null,
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
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const restoredUser = readStoredUser();
    setUser(restoredUser);
    applyAuthToken(restoredUser?.token);
    setIsAuthReady(true);
  }, []);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    applyAuthToken(user?.token);
  }, [isAuthReady, user?.token]);

  async function login(identifier, password) {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const response = await axios.post('/api/auth/login', { identifier, password });
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

  function getValidAccessToken() {
    const token = user?.token;
    if (!token || typeof token !== 'string') {
      return null;
    }

    try {
      const payloadPart = token.split('.')[0];
      const payload = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));
      const now = Math.floor(Date.now() / 1000);
      if (typeof payload?.exp === 'number' && payload.exp <= now) {
        logout();
        return null;
      }
      return token;
    } catch (_error) {
      logout();
      return null;
    }
  }

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      updateUser,
      authError,
      setAuthError,
      isAuthenticating,
      isAuthReady,
      getValidAccessToken,
    }),
    [user, authError, isAuthenticating, isAuthReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
