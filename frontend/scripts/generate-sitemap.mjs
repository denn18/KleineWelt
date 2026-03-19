import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITEMAP_ROUTES, toAbsoluteUrl } from '../src/seo/siteConfig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const distDir = path.join(projectRoot, 'dist');
const today = new Date().toISOString().slice(0, 10);

function buildSitemapXml() {
  const urls = SITEMAP_ROUTES.map(
    ({ path: routePath, changefreq, priority }) => `  <url>\n    <loc>${toAbsoluteUrl(routePath)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function writeIfPossible(targetPath, content) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content, 'utf8');
}

const sitemapXml = buildSitemapXml();

await writeIfPossible(path.join(publicDir, 'sitemap.xml'), sitemapXml);
await writeIfPossible(path.join(distDir, 'sitemap.xml'), sitemapXml);

console.log(`Sitemap generated with ${SITEMAP_ROUTES.length} www URLs.`);
