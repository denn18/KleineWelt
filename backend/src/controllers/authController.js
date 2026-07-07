import { authenticateUser } from '../services/authService.js';
import { FORGOT_PASSWORD_MESSAGE, requestPasswordReset, resetPassword } from '../services/passwordResetService.js';
import { createAuthToken } from '../utils/authToken.js';

export async function loginController(req, res) {
  const { identifier, password } = req.body || {};

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Benutzername oder Passwort fehlen.' });
  }

  try {
    const user = await authenticateUser(identifier, password);
    const token = createAuthToken({ id: user.id, role: user.role, email: user.email });
    console.info('Successful login', {
      userId: user.id,
      role: user.role,
      email: user.email,
    });
    res.json({ ...user, token });
  } catch (error) {
    console.error('Failed to authenticate user', error);
    const status = error.status || 500;
    res.status(status).json({ message: error.message || 'Anmeldung fehlgeschlagen.' });
  }
}


export async function forgotPasswordController(req, res) {
  try {
    const result = await requestPasswordReset(req.body?.email);
    return res.json(result);
  } catch (error) {
    console.error('Failed to process password reset request', error);
    return res.json({ message: FORGOT_PASSWORD_MESSAGE });
  }
}

export async function resetPasswordController(req, res) {
  try {
    const result = await resetPassword(req.body?.token, req.body?.password);
    return res.json(result);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      message: error.message || 'Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an.',
    });
  }
}
