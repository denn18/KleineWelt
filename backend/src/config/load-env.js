// backend/src/config/load-env.js
import { config } from 'dotenv';
import fs from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const candidates = [
  resolve(__dirname, '../../.env'),   // 1) backend/.env (bevorzugt)
  resolve(__dirname, '../../../.env') // 2) Projektroot/.env (Fallback)
];

for (const p of candidates) {
  if (fs.existsSync(p)) {
    const r = config({ path: p, override: true });
    if (r.parsed) {
      console.log('🌱 .env geladen:', p);
      break;
    }
  }
}
