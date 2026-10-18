import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import ProfilePage from '../pages/ProfilePage.jsx';
import * as push from '../utils/pushNotifications.js';

const auth = vi.hoisted(() => ({ user: { id: 'caregiver-1', role: 'caregiver' }, updateUser: vi.fn(), logout: vi.fn() }));
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: () => auth }));
vi.mock('../utils/pushNotifications.js', () => ({
  isPushSupported: vi.fn(() => false), getNotificationPermission: vi.fn(() => 'granted'),
  getActivePushSubscription: vi.fn(async () => null), requestNotificationPermission: vi.fn(async () => 'granted'),
  fetchVapidPublicKey: vi.fn(async () => 'test-key'), subscribeToPush: vi.fn(), unsubscribeFromPush: vi.fn(async () => true),
}));
const profile = {
  id: 'caregiver-1', role: 'caregiver', firstName: 'Eva', lastName: 'Muster',
  email: 'eva@example.test', phone: '12345', address: 'Musterweg 1', postalCode: '33332',
  city: 'Gütersloh', username: 'eva', daycareName: 'Sonnenkinder', birthDate: '1988-05-12',
  caregiverSince: '2018-03', emailNotificationsEnabled: true,
  careTimes: [{ startTime: '07:00', endTime: '16:00', activity: 'Betreuung' }],
  dailySchedule: [{ startTime: '08:00', endTime: '09:00', activity: 'Frühstück' }],
  closedDays: [], roomImages: ['/one.png', '/two.png', '/three.png', '/four.png'],
  profileImageUrl: '/profile.png', logoImageUrl: '/logo.png', conceptUrl: '/concept.pdf',
  contractDocuments: [{ name: 'Vertrag', file: '/contract.pdf' }],
};
let current;
beforeEach(() => {
  vi.clearAllMocks();
  current = structuredClone(profile);
  push.isPushSupported.mockReturnValue(false);
  push.getActivePushSubscription.mockResolvedValue(null);
  axios.get.mockImplementation(async () => ({ data: current }));
  axios.patch.mockImplementation(async (_url, payload) => {
    current = { ...current, ...payload };
    return { data: current };
  });
  axios.delete = vi.fn(async () => ({ data: {} }));
});
async function ready() {
  render(<ProfilePage />);
  await screen.findByRole('button', { name: 'Profil speichern' });
}
function section(title) { return within(screen.getByRole('heading', { name: title }).closest('section')); }

it('undoes profile-image, logo and concept removals without saving removal flags', async () => {
  await ready();
  const user = userEvent.setup();
  const media = section('Profil, Logo & Team');
  for (const name of ['Bild entfernen', 'Logo entfernen', 'Konzeption entfernen']) {
    await user.click(media.getByRole('button', { name }));
    await user.click(media.getByRole('button', { name: 'Entfernung rückgängig machen' }));
  }
  await user.click(screen.getByRole('button', { name: 'Profil speichern' }));
  await waitFor(() => expect(axios.patch).toHaveBeenCalled());
  const payload = axios.patch.mock.calls[0][1];
  expect(payload.profileImage).toBeUndefined();
  expect(payload.logoImage).toBeUndefined();
  expect(payload.conceptFile).toBeUndefined();
});

it('accepts the same profile-image file again after removing it', async () => {
  await ready();
  const user = userEvent.setup();
  const file = new File(['image'], 'portrait.png', { type: 'image/png' });
  const input = screen.getByLabelText('Profilbild wählen');
  await user.upload(input, file);
  await waitFor(() => expect(input).toHaveValue(''));
  await user.click(section('Profil, Logo & Team').getByRole('button', { name: 'Bild entfernen' }));
  await user.upload(input, file);
  await waitFor(() => expect(input).toHaveValue(''));
  await user.click(screen.getByRole('button', { name: 'Profil speichern' }));
  await waitFor(() => expect(axios.patch).toHaveBeenCalledWith('/api/caregivers/caregiver-1', expect.objectContaining({
    profileImage: expect.stringContaining('data:image/png;base64,'), profileImageName: 'portrait.png',
  })));
});

it('saves both schedules, closed days, documents and gallery changes', async () => {
  await ready();
  const user = userEvent.setup();
  for (const [name, activity] of [['Betreuungszeiten', 'Freispiel'], ['Tagesablauf', 'Mittagessen']]) {
    const editor = section(name);
    await user.click(editor.getByRole('button', { name: /Weiteren Eintrag hinzufügen/ }));
    await user.type(editor.getAllByLabelText('Aktivität')[1], activity);
  }
  await user.click(screen.getByRole('button', { name: 'Montag' }));
  await user.click(section('Räumlichkeiten').getAllByRole('button', { name: 'Entfernen' })[0]);
  await user.click(screen.getByRole('button', { name: 'Profil speichern' }));
  await waitFor(() => expect(axios.patch).toHaveBeenCalledWith('/api/caregivers/caregiver-1', expect.objectContaining({
    careTimes: expect.arrayContaining([expect.objectContaining({ activity: 'Freispiel' })]),
    dailySchedule: expect.arrayContaining([expect.objectContaining({ activity: 'Mittagessen' })]),
    closedDays: ['Montag'], contractDocuments: [{ name: 'Vertrag', file: '/contract.pdf' }],
    roomImages: ['/two.png', '/three.png', '/four.png'],
  })));
});

it('keeps the email preference unchanged when saving fails', async () => {
  await ready();
  axios.patch.mockRejectedValueOnce({ response: { data: { message: 'Speichern fehlgeschlagen' } } });
  const toggle = screen.getByRole('checkbox');
  await userEvent.click(toggle);
  expect(await screen.findByText('Speichern fehlgeschlagen')).toBeInTheDocument();
  expect(toggle).toBeChecked();
});

it('enables and disables push subscriptions', async () => {
  push.isPushSupported.mockReturnValue(true);
  push.subscribeToPush.mockResolvedValue({ endpoint: 'test-endpoint', toJSON: () => ({ endpoint: 'test-endpoint' }) });
  axios.post.mockResolvedValueOnce({ data: {} });
  await ready();
  await userEvent.click(screen.getByRole('button', { name: 'Push aktivieren' }));
  await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/api/push-subscriptions', expect.objectContaining({ userId: 'caregiver-1' })));
  push.getActivePushSubscription.mockResolvedValue({ endpoint: 'test-endpoint' });
  await userEvent.click(screen.getByRole('button', { name: 'Push deaktivieren' }));
  await waitFor(() => expect(axios.delete).toHaveBeenCalledWith('/api/push-subscriptions', { data: { userId: 'caregiver-1', endpoint: 'test-endpoint' } }));
  expect(push.unsubscribeFromPush).toHaveBeenCalled();
});

it('only deletes after confirmation and keeps the account if deletion fails', async () => {
  await ready();
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Profil löschen' }));
  await user.click(screen.getByRole('button', { name: 'Abbrechen' }));
  expect(axios.delete).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Profil löschen' }));
  axios.delete.mockRejectedValueOnce({ response: { data: { message: 'Löschen fehlgeschlagen' } } });
  await user.click(screen.getAllByRole('button', { name: 'Profil löschen' })[1]);
  expect(await screen.findByText('Löschen fehlgeschlagen')).toBeInTheDocument();
  expect(auth.logout).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Profil löschen' }));
  await user.click(screen.getAllByRole('button', { name: 'Profil löschen' })[1]);
  await waitFor(() => expect(auth.logout).toHaveBeenCalledOnce());
  expect(axios.delete).toHaveBeenLastCalledWith('/api/caregivers/caregiver-1');
});


it('preserves unsaved edits when the server rejects a profile update', async () => {
  await ready();
  const input = screen.getByLabelText(/Kurzbeschreibung/);
  await userEvent.type(input, 'Meine Beschreibung');
  axios.patch.mockRejectedValueOnce({ response: { data: { message: 'Profil konnte nicht gespeichert werden' } } });
  await userEvent.click(screen.getByRole('button', { name: 'Profil speichern' }));
  expect(await screen.findByText('Profil konnte nicht gespeichert werden')).toBeInTheDocument();
  expect(input).toHaveValue('Meine Beschreibung');
});
