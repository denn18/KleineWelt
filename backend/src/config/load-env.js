import fs from 'fs';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envCandidates = [
  // Project root .env (preferred location)
  path.resolve(__dirname, '../../../.env'),
  // Legacy backend/.env fallback so existing deployments keep working
  path.resolve(__dirname, '../../.env'),
];

envCandidates.forEach((envPath) => {
  if (fs.existsSync(envPath)) {
    config({ path: envPath, override: true });
  }
});
