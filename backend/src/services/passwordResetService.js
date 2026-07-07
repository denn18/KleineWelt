import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { parentsCollection } from '../models/Parent.js';
import { caregiversCollection } from '../models/Caregiver.js';
import { sendEmail } from './emailService.js';

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MINUTES = 30;
const BCRYPT_SALT_ROUNDS = 10;
export const FORGOT_PASSWORD_MESSAGE =
  'Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir dir eine E-Mail zum Zurücksetzen deines Passworts gesendet.';
export const RESET_PASSWORD_SUCCESS_MESSAGE = 'Dein Passwort wurde geändert. Du kannst dich jetzt einloggen.';
export const RESET_PASSWORD_INVALID_MESSAGE = 'Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an.';

let parentCollectionOverride = null;
let caregiverCollectionOverride = null;
let sendEmailOverride = null;

function getParentsCollection() {
  return parentCollectionOverride ?? parentsCollection();
}

function getCaregiversCollection() {
  return caregiverCollectionOverride ?? caregiversCollection();
}

function getSendEmail() {
  return sendEmailOverride ?? sendEmail;
}

export function __setPasswordResetServiceDependenciesForTesting({ parents, caregivers, emailSender } = {}) {
  parentCollectionOverride = parents ?? null;
  caregiverCollectionOverride = caregivers ?? null;
  sendEmailOverride = emailSender ?? null;
}

export function __resetPasswordResetServiceDependenciesForTesting() {
  parentCollectionOverride = null;
  caregiverCollectionOverride = null;
  sendEmailOverride = null;
}

function normalizeEmail(email) {
  return `${email ?? ''}`.trim().toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFrontendBaseUrl() {
  return `${process.env.FRONTEND_URL || 'http://localhost:5173'}`.trim().replace(/\/+$/, '');
}

function buildResetLink(rawToken) {
  const url = new URL('/passwort-zuruecksetzen', buildFrontendBaseUrl());
  url.searchParams.set('token', rawToken);
  return url.toString();
}

function buildPasswordResetEmail(resetLink) {
  const text = `Hallo,

du hast angefordert, dein Passwort bei Wimmel Welt zurückzusetzen.

Klicke auf den folgenden Link, um ein neues Passwort zu vergeben:
${resetLink}

Der Link ist 30 Minuten gültig.

Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.

Viele Grüße
Dein Wimmel Welt Team`;

  const html = `<p>Hallo,</p>
<p>du hast angefordert, dein Passwort bei Wimmel Welt zurückzusetzen.</p>
<p>Klicke auf den folgenden Link, um ein neues Passwort zu vergeben:<br><a href="${resetLink}">Passwort zurücksetzen</a></p>
<p>Der Link ist 30 Minuten gültig.</p>
<p>Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p>
<p>Viele Grüße<br>Dein Wimmel Welt Team</p>`;

  return { text, html };
}

async function findUserByEmail(email) {
  const query = { email: { $regex: `^${escapeRegExp(email)}$`, $options: 'i' } };
  const parent = await getParentsCollection().findOne(query);
  if (parent) {
    return { user: parent, collection: getParentsCollection() };
  }

  const caregiver = await getCaregiversCollection().findOne(query);
  if (caregiver) {
    return { user: caregiver, collection: getCaregiversCollection() };
  }

  return null;
}

async function findResetCandidate(rawToken) {
  const collections = [getParentsCollection(), getCaregiversCollection()];

  for (const collection of collections) {
    const cursor = collection.find({ 'passwordReset.tokenHash': { $exists: true } });
    const users = typeof cursor?.toArray === 'function' ? await cursor.toArray() : [];

    for (const user of users) {
      const reset = user.passwordReset;
      if (!reset?.tokenHash || reset.usedAt) {
        continue;
      }

      const matches = await bcrypt.compare(rawToken, reset.tokenHash);
      if (matches) {
        return { user, collection };
      }
    }
  }

  return null;
}

export async function requestPasswordReset(emailInput) {
  const email = normalizeEmail(emailInput);

  if (!email) {
    return { message: FORGOT_PASSWORD_MESSAGE };
  }

  const found = await findUserByEmail(email);
  if (!found) {
    return { message: FORGOT_PASSWORD_MESSAGE };
  }

  const rawToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString('base64url');
  const tokenHash = await bcrypt.hash(rawToken, BCRYPT_SALT_ROUNDS);
  const requestedAt = new Date();
  const expiresAt = new Date(requestedAt.getTime() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await found.collection.updateOne(
    { _id: found.user._id },
    {
      $set: {
        passwordReset: {
          tokenHash,
          expiresAt,
          requestedAt,
          usedAt: null,
        },
        updatedAt: requestedAt,
      },
    }
  );

  const resetLink = buildResetLink(rawToken);
  const emailContent = buildPasswordResetEmail(resetLink);
  await getSendEmail()({
    to: email,
    subject: 'Passwort für Wimmel Welt zurücksetzen',
    text: emailContent.text,
    html: emailContent.html,
  });

  return { message: FORGOT_PASSWORD_MESSAGE };
}

export async function resetPassword(rawToken, password) {
  if (!rawToken || !password || `${password}`.length < 8) {
    const error = new Error(RESET_PASSWORD_INVALID_MESSAGE);
    error.status = 400;
    throw error;
  }

  const candidate = await findResetCandidate(rawToken);
  const now = new Date();

  if (!candidate || !candidate.user.passwordReset?.expiresAt || new Date(candidate.user.passwordReset.expiresAt) <= now) {
    const error = new Error(RESET_PASSWORD_INVALID_MESSAGE);
    error.status = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  await candidate.collection.updateOne(
    { _id: candidate.user._id },
    {
      $set: {
        password: hashedPassword,
        passwordUpdatedAt: now,
        updatedAt: now,
      },
      $unset: {
        passwordReset: '',
      },
    }
  );

  return { message: RESET_PASSWORD_SUCCESS_MESSAGE };
}
