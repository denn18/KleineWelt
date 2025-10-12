import { describe, it, beforeEach, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import axios from 'axios';
import { AuthProvider, useAuth } from '../context/AuthContext.jsx';

function createWrapper() {
  return ({ children }) => <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    axios.post.mockReset();
  });

  it('stores the authenticated user and persists it in localStorage', async () => {
    const user = { id: 'user-1', role: 'parent', email: 'test@example.com' };
    axios.post.mockResolvedValueOnce({ data: user });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.login('test@example.com', 'secret');
    });

    expect(result.current.user).toEqual(user);
    expect(localStorage.getItem('kleinewelt:user')).toContain('"user-1"');
    expect(result.current.authError).toBeNull();
  });

  it('surfaces an authentication error when login fails', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { message: 'Fehler' } } });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await expect(result.current.login('wrong@example.com', 'bad')).rejects.toBeDefined();

    await waitFor(() => {
      expect(result.current.authError).toBe('Fehler');
      expect(result.current.isAuthenticating).toBe(false);
    });
  });

  it('allows updating partial user data and keeps storage in sync', async () => {
    const user = { id: 'user-2', role: 'caregiver', email: 'care@example.com' };
    axios.post.mockResolvedValueOnce({ data: user });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.login('care@example.com', 'secret');
    });

    await act(async () => {
      result.current.updateUser({ firstName: 'Anna' });
    });

    expect(result.current.user.firstName).toBe('Anna');
    expect(JSON.parse(localStorage.getItem('kleinewelt:user')).firstName).toBe('Anna');
  });
});
