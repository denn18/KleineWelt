import { downloadFileByKey } from './filesController.js';

const DEFAULT_INVOICE_NAME = 'Kleine-Welt-Mitgliedsbeitrag.pdf';

export function downloadMembershipInvoice(_req, res) {
  const key = process.env.MEMBERSHIP_INVOICE_S3_KEY;
  if (!key) {
    return res.status(404).json({ message: 'Die Quittung ist derzeit nicht verfügbar.' });
  }

  return downloadFileByKey(key, res, DEFAULT_INVOICE_NAME);
}
