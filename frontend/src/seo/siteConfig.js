export const SITE_URL = 'https://www.wimmel-welt.de';
export const SITE_HOST = 'www.wimmel-welt.de';
export const SITE_NAME = 'Wimmel Welt';

export const SEO_CITY_SLUGS = [
  'bielefeld',
  'guetersloh',
  'herzberg',
  'schloss-holte-stukenbrock',
  'spenge-wallenbrueck',
];

export const SITEMAP_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/kindertagespflege', changefreq: 'weekly', priority: '0.9' },
  { path: '/familienzentrum', changefreq: 'weekly', priority: '0.8' },
  { path: '/faq', changefreq: 'monthly', priority: '0.6' },
  { path: '/kontakt', changefreq: 'monthly', priority: '0.6' },
  { path: '/datenschutz', changefreq: 'yearly', priority: '0.2' },
  { path: '/impressum', changefreq: 'yearly', priority: '0.2' },
  ...SEO_CITY_SLUGS.map((slug) => ({
    path: `/kindertagespflege/${slug}`,
    changefreq: 'weekly',
    priority: '0.8',
  })),
];

export function toAbsoluteUrl(pathname = '/') {
  const normalizedPath = pathname === '/' ? '/' : `/${`${pathname}`.replace(/^\/+/, '')}`;
  return new URL(normalizedPath, SITE_URL).toString();
}
