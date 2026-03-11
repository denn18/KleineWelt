const UMLAUT_MAP = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
};

export function slugify(value) {
  const normalized = `${value ?? ''}`
    .trim()
    .toLowerCase()
    .replace(/[äöüß]/g, (char) => UMLAUT_MAP[char] ?? char)
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[\s_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized;
}

export function buildCaregiverSlugParts(data = {}) {
  const citySource = data.city;
  const daycareSource = data.daycareName || data.name || `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim();

  const citySlug = slugify(citySource) || 'unbekannt';
  const daycareSlug = slugify(daycareSource) || 'kindertagespflege';

  return {
    citySlug,
    daycareSlug,
    profilePath: `${citySlug}/${daycareSlug}`,
  };
}
