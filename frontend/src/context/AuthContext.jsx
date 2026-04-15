import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { disconnectSocket } from '../realtime/socketClient.js';

const STORAGE_KEY = 'kleinewelt:user';
const REFRESH_GRACE_SECONDS = 30;

const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: () => {},
  updateUser: () => {},
  authError: null,
  setAuthError: () => {},
  isAuthenticating: false,
  isAuthReady: false,
});

function decodeTokenPayload(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  try {
    const [encodedPayload] = token.split('.');
    return JSON.parse(window.atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch (_error) {
    return null;
  }
}

function isTokenExpiredOrNearExpiry(token, graceSeconds = REFRESH_GRACE_SECONDS) {
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return payload.exp - now <= graceSeconds;
}

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

async function requestTokenRefresh(refreshToken) {
  const response = await axios.post(
    '/api/auth/refresh',
    { refreshToken },
    {
      skipAuthRefresh: true,
    },
  );

  return response.data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const userRef = useRef(user);
  const refreshPromiseRef = useRef(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    applyAuthToken(user?.token);
  }, [user?.token]);

  const persistUser = (nextUser) => {
    if (!nextUser) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  };

  const clearSession = () => {
    applyAuthToken(null);
    disconnectSocket();
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const refreshSession = async () => {
    const currentUser = userRef.current;
    if (!currentUser?.refreshToken) {
      throw new Error('No refresh token available.');
    }

    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = requestTokenRefresh(currentUser.refreshToken)
        .then((refreshed) => {
          const mergedUser = { ...currentUser, ...refreshed };
          applyAuthToken(mergedUser.token);
          setUser(mergedUser);
          persistUser(mergedUser);
          return mergedUser;
        })
        .catch((error) => {
          clearSession();
          throw error;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }

    return refreshPromiseRef.current;
  };

  useEffect(() => {
    let active = true;

    async function bootstrapAuth() {
      if (!userRef.current) {
        setIsAuthReady(true);
        return;
      }

      if (!isTokenExpiredOrNearExpiry(userRef.current.token)) {
        setIsAuthReady(true);
        return;
      }

      try {
        await refreshSession();
      } catch (error) {
        console.warn('Initial token refresh failed', error);
      } finally {
        if (active) {
          setIsAuthReady(true);
        }
      }
    }

    bootstrapAuth().catch((error) => {
      console.error('Failed to initialize auth state', error);
      if (active) {
        setIsAuthReady(true);
      }
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config || {};
        const status = error.response?.status;

        if (
          status !== 401
          || originalRequest._retry
          || originalRequest.skipAuthRefresh
          || !userRef.current?.refreshToken
        ) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
          const refreshed = await refreshSession();
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${refreshed.token}`,
          };
          return axios(originalRequest);
        } catch (refreshError) {
          setAuthError('Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.');
          return Promise.reject(refreshError);
        }
      },
    );

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      persistUser(authenticatedUser);
      return response.data;
    } catch (error) {
      console.error('Login failed', error);
      setAuthError(error.response?.data?.message || 'Anmeldung fehlgeschlagen.');
      throw error;
    } finally {
      setIsAuthenticating(false);
      setIsAuthReady(true);
    }
  }

  function logout() {
    console.info('Nutzer abgemeldet');
    clearSession();
  }

  function updateUser(partialUser) {
    setUser((current) => {
      if (!current) {
        return current;
      }
      const updated = { ...current, ...partialUser };
      persistUser(updated);
      return updated;
    });
  }

  const value = useMemo(
    () => ({ user, login, logout, updateUser, authError, setAuthError, isAuthenticating, isAuthReady }),
    [user, authError, isAuthenticating, isAuthReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
