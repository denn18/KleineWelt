const UMLAUT_MAP = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
};

export function slugify(value) {
  return `${value ?? ''}`
    .trim()
    .toLowerCase()
    .replace(/[äöüß]/g, (char) => UMLAUT_MAP[char] ?? char)
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[\s_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildCaregiverProfileUrl(caregiver, options = {}) {
  const cityFromContext = slugify(options.citySlug);

  if (caregiver?.profilePath) {
    const [, daycareSlugFromProfile] = `${caregiver.profilePath}`.split('/');
    if (cityFromContext && daycareSlugFromProfile) {
      return `/kindertagespflege/${cityFromContext}/${daycareSlugFromProfile}`;
    }
    return `/kindertagespflege/${caregiver.profilePath}`;
  }

  const citySlug = cityFromContext || slugify(caregiver?.city) || 'unbekannt';
  const daycareSlug = slugify(caregiver?.daycareName || caregiver?.name) || 'kindertagespflege';

  return `/kindertagespflege/${citySlug}/${daycareSlug}`;
}
