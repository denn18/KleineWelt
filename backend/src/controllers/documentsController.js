import path from 'path';
import { fileURLToPath } from 'url';

export function downloadMembershipInvoice(_req, res) {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const invoicePath = path.resolve(currentDir, '../public/documents/membership-invoice.pdf');
  res.download(invoicePath, 'Kleine-Welt-Mitgliedsbeitrag.pdf', (error) => {
    if (error) {
      console.error('Failed to download membership invoice', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Die Quittung konnte nicht bereitgestellt werden.' });
      }
    }
  });
}
