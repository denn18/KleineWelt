import { describe, it, beforeEach, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import ForgotPasswordPage from '../pages/ForgotPasswordPage/index.jsx';
import ResetPasswordPage from '../pages/ResetPasswordPage/index.jsx';

describe('Password reset pages', () => {
  beforeEach(() => {
    axios.post.mockReset();
  });

  it('shows a neutral success message on the forgot password page', async () => {
    axios.post.mockResolvedValueOnce({ data: {} });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/E-Mail-Adresse/i), 'person@example.com');
    await user.click(screen.getByRole('button', { name: /Reset-Link anfordern/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/auth/forgot-password', { email: 'person@example.com' });
      expect(screen.getByText(/Wenn ein Konto mit dieser E-Mail-Adresse existiert/i)).toBeInTheDocument();
    });
  });

  it('validates matching passwords on the reset page', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/passwort-zuruecksetzen?token=abc']}>
        <Routes>
          <Route path="/passwort-zuruecksetzen" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/^Neues Passwort$/i), 'new-password');
    await user.type(screen.getByLabelText(/Passwort wiederholen/i), 'other-password');
    await user.click(screen.getByRole('button', { name: /Passwort speichern/i }));

    expect(await screen.findByText(/Die Passwörter stimmen nicht überein/i)).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('submits the token and password on the reset page', async () => {
    axios.post.mockResolvedValueOnce({ data: {} });
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/passwort-zuruecksetzen?token=abc']}>
        <Routes>
          <Route path="/passwort-zuruecksetzen" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/^Neues Passwort$/i), 'new-password');
    await user.type(screen.getByLabelText(/Passwort wiederholen/i), 'new-password');
    await user.click(screen.getByRole('button', { name: /Passwort speichern/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/auth/reset-password', { token: 'abc', password: 'new-password' });
      expect(screen.getByText(/Dein Passwort wurde geändert/i)).toBeInTheDocument();
    });
  });
});
