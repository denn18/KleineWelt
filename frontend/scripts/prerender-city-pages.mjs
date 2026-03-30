import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getCitySeoData, getStaticSeoCitySlugs } from '../src/seo/citySeo.js';
import { toAbsoluteUrl } from '../src/seo/siteConfig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function escapeAttribute(value) {
  return `${value ?? ''}`.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function upsertTag(html, { selector, tag }) {
  const patterns = {
    title: /<title>[\s\S]*?<\/title>/i,
    description: /<meta\s+name=["']description["'][^>]*>/i,
    canonical: /<link\s+rel=["']canonical["'][^>]*>/i,
    robots: /<meta\s+name=["']robots["'][^>]*>/i,
    ogUrl: /<meta\s+property=["']og:url["'][^>]*>/i,
  };

  const pattern = patterns[selector];
  if (!pattern) {
    return html;
  }

  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }

  return html.replace('</head>', `  ${tag}\n</head>`);
}

function buildCityHtml(templateHtml, citySlug) {
  const { seoCityName, metaDescription } = getCitySeoData(citySlug);
  const cityPath = `/kindertagespflege/${citySlug}`;

  let html = templateHtml;
  html = upsertTag(html, { selector: 'title', tag: `<title>Tagesmütter & Väter in ${seoCityName} | Wimmel Welt</title>` });
  html = upsertTag(html, {
    selector: 'description',
    tag: `<meta name="description" content="${escapeAttribute(metaDescription)}" />`,
  });
  html = upsertTag(html, {
    selector: 'canonical',
    tag: `<link rel="canonical" href="${toAbsoluteUrl(cityPath)}" />`,
  });
  html = upsertTag(html, {
    selector: 'robots',
    tag: '<meta name="robots" content="index,follow" />',
  });
  html = upsertTag(html, {
    selector: 'ogUrl',
    tag: `<meta property="og:url" content="${toAbsoluteUrl(cityPath)}" />`,
  });

  return html;
}

function buildKindertagespflegeHtml(templateHtml) {
  const { metaDescription } = getCitySeoData('');

  let html = templateHtml;
  html = upsertTag(html, { selector: 'title', tag: '<title>Kindertagespflege finden | Wimmel Welt</title>' });
  html = upsertTag(html, {
    selector: 'description',
    tag: `<meta name="description" content="${escapeAttribute(metaDescription)}" />`,
  });
  html = upsertTag(html, {
    selector: 'canonical',
    tag: `<link rel="canonical" href="${toAbsoluteUrl('/kindertagespflege')}" />`,
  });
  html = upsertTag(html, {
    selector: 'robots',
    tag: '<meta name="robots" content="index,follow" />',
  });
  html = upsertTag(html, {
    selector: 'ogUrl',
    tag: `<meta property="og:url" content="${toAbsoluteUrl('/kindertagespflege')}" />`,
  });

  return html;
}

export async function prerenderCityPages({ rootDir = projectRoot, outDir = 'dist' } = {}) {
  const distDir = path.join(rootDir, outDir);
  const distIndexPath = path.join(distDir, 'index.html');

  const templateHtml = await fs.readFile(distIndexPath, 'utf8');
  const citySlugs = getStaticSeoCitySlugs();
  const kindertagespflegePath = path.join(distDir, 'kindertagespflege', 'index.html');

  await fs.mkdir(path.dirname(kindertagespflegePath), { recursive: true });
  await fs.writeFile(kindertagespflegePath, buildKindertagespflegeHtml(templateHtml), 'utf8');

  await Promise.all(
    citySlugs.map(async (citySlug) => {
      const cityDir = path.join(distDir, 'kindertagespflege', citySlug);
      const cityIndex = path.join(cityDir, 'index.html');
      const cityHtml = buildCityHtml(templateHtml, citySlug);

      await fs.mkdir(cityDir, { recursive: true });
      await fs.writeFile(cityIndex, cityHtml, 'utf8');
    }),
  );

  return citySlugs.length + 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const count = await prerenderCityPages();
  console.log(`Prerendered ${count} city pages in dist/kindertagespflege/:citySlug.`);
}
