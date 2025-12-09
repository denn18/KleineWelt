import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadFileByKey } from './filesController.js';

const DEFAULT_INVOICE_NAME = 'Kleine-Welt-Mitgliedsbeitrag.pdf';
const LOCAL_MEMBERSHIP_INVOICE_PATH = '../public/documents/membership-invoice.pdf';

function sendLocalInvoice(res) {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const absolutePath = path.resolve(currentDir, LOCAL_MEMBERSHIP_INVOICE_PATH);

  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ message: 'Die Quittung ist derzeit nicht verfügbar.' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${DEFAULT_INVOICE_NAME}"`);
  return res.sendFile(absolutePath);
}

export function downloadMembershipInvoice(_req, res) {
  const key = process.env.MEMBERSHIP_INVOICE_S3_KEY;
  if (!key) {
    return sendLocalInvoice(res);
  }

  return downloadFileByKey(key, res, DEFAULT_INVOICE_NAME);
}
