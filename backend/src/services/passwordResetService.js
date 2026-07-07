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
  return `${process.env.FRONTEND_URL || 'http://localhost:3000'}`.trim().replace(/\/+$/, '');
}

function buildResetLink(rawToken) {
  const url = new URL('/passwort-zuruecksetzen', buildFrontendBaseUrl());
  url.searchParams.set('token', rawToken);
  return url.toString();
}

function buildPasswordResetEmail(resetLink) {
  const intro = 'Du hast angefordert, dein Passwort bei Wimmel Welt zurückzusetzen. Klicke auf den Button, um ein neues Passwort zu vergeben.';

  const text = [
    'Hallo,',
    '',
    intro,
    '',
    resetLink,
    '',
    'Der Link ist 30 Minuten gültig.',
    '',
    'Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.',
    '',
    'Herzliche Grüße',
    'Dein Wimmel Welt Team',
    '',
    '--',
    'Wimmel Welt - Kindertagespflegevermittlung',
    'support',
    'E-Mail: info@wimmel-welt.de',
    'Telefon: +49 176 80852142',
    'Web: www.wimmel-welt.de',
  ].join('\n');

  const html = [
    '<div style="margin:0;padding:0;background-color:#f0f4f8;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4f8;padding:32px 16px;font-family:Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;">',
    '<tr>',
    '<td align="center">',
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.12);">',
    '<tr>',
    '<td style="background:linear-gradient(160deg,#1a4a8a 0%,#2d6cb4 30%,#e88ca5 70%,#f5c542 100%);padding:48px 32px 82px;text-align:center;">',
    '<img src="https://www.wimmel-welt.de/ww-weiss.png" alt="Wimmel Welt" width="128" height="128" style="display:block;margin:0 auto 16px;border:0;border-radius:24px;box-shadow:0 8px 24px rgba(0,0,0,0.2);" />',
    '<h1 style="margin:0 0 4px;color:#ffffff;font-size:38px;line-height:1.2;font-weight:800;letter-spacing:-0.5px;">Wimmel Welt</h1>',
    '<p style="margin:0;color:rgba(255,255,255,0.75);font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Kindertagespflegevermittlung</p>',
    '</td>',
    '</tr>',
    '<tr>',
    '<td style="padding:0 20px;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:-48px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">',
    '<tr>',
    '<td style="padding:32px 28px;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">',
    '<tr>',
    '<td style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#2d6cb4,#4a8fd4);text-align:center;vertical-align:middle;font-size:16px;line-height:36px;">🔐</td>',
    '<td style="padding-left:8px;font-size:13px;font-weight:600;color:#2d6cb4;">Passwort zurücksetzen</td>',
    '</tr>',
    '</table>',
    '<h2 style="margin:0 0 12px;color:#1a2d42;font-size:20px;line-height:1.3;font-weight:700;letter-spacing:-0.3px;">Hallo 👋</h2>',
    `<p style="margin:0 0 24px;color:#5a6b7d;font-size:15px;line-height:1.75;">${intro}</p>`,
    `<p style="margin:0 0 24px;text-align:center;"><a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#2d6cb4,#4a8fd4);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 22px;border-radius:12px;box-shadow:0 8px 18px rgba(45,108,180,0.28);">Passwort zurücksetzen</a></p>`,
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#f0f6ff 0%,#fdf2f4 100%);border-radius:12px;">',
    '<tr>',
    '<td style="padding:16px 20px;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0">',
    '<tr>',
    '<td style="font-size:20px;vertical-align:middle;padding-right:12px;">⏱️</td>',
    '<td style="font-size:13px;color:#5a6b7d;line-height:1.6;">Der Link ist 30 Minuten gültig. Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    '<tr>',
    '<td style="padding:24px 28px 28px;text-align:center;">',
    '<p style="margin:0 0 20px;color:#8a96a3;font-size:14px;line-height:1.6;">Herzliche Grüße,<br /><strong style="color:#1a2d42;">Dein Wimmel Welt Team</strong></p>',
    '<hr style="border:none;height:1px;background:linear-gradient(90deg,transparent,#e0e7ef,transparent);margin:0 0 16px;" />',
    '<p style="margin:0 0 4px;color:#b0b8c4;font-size:11px;line-height:1.6;">info@wimmel-welt.de · +49 176 80852142</p>',
    '<p style="margin:0;font-size:11px;color:#b0b8c4;"><a href="https://www.wimmel-welt.de" style="color:#2d6cb4;text-decoration:none;font-weight:500;">www.wimmel-welt.de</a></p>',
    '</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    '</table>',
    '</div>',
  ].join('');

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
  const collections = [
    { role: 'parent', collection: getParentsCollection() },
    { role: 'caregiver', collection: getCaregiversCollection() },
  ];

  for (const { role, collection } of collections) {
    const cursor = collection.find({ 'passwordReset.tokenHash': { $exists: true } });
    const users = typeof cursor?.toArray === 'function' ? await cursor.toArray() : [];

    for (const user of users) {
      const reset = user.passwordReset;
      if (!reset?.tokenHash || reset.usedAt) {
        continue;
      }

      const matches = await bcrypt.compare(rawToken, reset.tokenHash);
      if (matches) {
        return { user, collection, role };
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

  console.info('Password reset completed', {
    userId: candidate.user._id?.toString?.() ?? candidate.user._id,
    role: candidate.role,
    email: candidate.user.email,
  });

  return { message: RESET_PASSWORD_SUCCESS_MESSAGE };
}
