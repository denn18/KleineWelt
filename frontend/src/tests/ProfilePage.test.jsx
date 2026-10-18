import { describe, it, beforeEach, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import ProfilePage from '../pages/ProfilePage.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

function renderProfile(user) {
  localStorage.setItem('kleinewelt:user', JSON.stringify(user));
  return render(
    <AuthProvider>
      <ProfilePage />
    </AuthProvider>,
  );
}

describe('ProfilePage parent profile editor', () => {
  const parentProfile = {
    id: 'parent-1',
    role: 'parent',
    firstName: 'Anna',
    lastName: 'Muster',
    email: 'anna@example.com',
    phone: '12345',
    address: 'Musterweg 1',
    postalCode: '10115',
    username: 'anna',
    children: [
      { name: 'Emma', age: '4', notes: 'Liebt Musik' },
    ],
  };

  beforeEach(() => {
    axios.defaults = { headers: { common: {} } };
    localStorage.clear();
    axios.get.mockReset();
    axios.patch.mockReset();
  });

  it('allows adding additional children entries', async () => {
    axios.get.mockResolvedValueOnce({ data: parentProfile });

    renderProfile({ id: 'parent-1', role: 'parent' });

    const addButton = await screen.findByRole('button', { name: /weiteres kind hinzufügen/i });

    expect(screen.getAllByLabelText(/name des kindes/i)).toHaveLength(1);

    await userEvent.click(addButton);

    expect(screen.getAllByLabelText(/name des kindes/i)).toHaveLength(2);
  });

  it('saves parent details, children, notes and a new password', async () => {
    axios.get.mockResolvedValue({ data: parentProfile });
    axios.patch.mockResolvedValue({ data: parentProfile });
    renderProfile({ id: 'parent-1', role: 'parent' });
    const user = userEvent.setup();
    await screen.findByRole('button', { name: /weiteres kind hinzufügen/i });
    await user.type(screen.getByLabelText(/neues passwort/i), 'new-password');
    await user.type(screen.getByLabelText(/wunschliste/i), 'Ruhige Eingewöhnung');
    await user.click(screen.getByRole('button', { name: 'Profil speichern' }));
    await waitFor(() => expect(axios.patch).toHaveBeenCalledWith('/api/parents/parent-1', expect.objectContaining({
      password: 'new-password', notes: 'Ruhige Eingewöhnung', numberOfChildren: 1,
      children: [expect.objectContaining({ name: 'Emma', notes: 'Liebt Musik' })],
    })));
    expect(await screen.findByText('Profil erfolgreich aktualisiert.')).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('resets to a blank child entry when the only child is removed', async () => {
    axios.get.mockResolvedValueOnce({ data: parentProfile });

    renderProfile({ id: 'parent-1', role: 'parent' });

    await screen.findByRole('button', { name: /weiteres kind hinzufügen/i });

    const removeButton = screen.getByRole('button', { name: /eintrag entfernen/i });
    await userEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getAllByLabelText(/name des kindes/i)).toHaveLength(1);
      expect(screen.getByLabelText(/name des kindes/i)).toHaveValue('');
    });
  });
});
