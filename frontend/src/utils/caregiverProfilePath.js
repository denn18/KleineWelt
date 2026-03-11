const UMLAUT_MAP = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
};

function slugify(value) {
  return `${value ?? ''}`
    .trim()
    .toLowerCase()
    .replace(/[äöüß]/g, (char) => UMLAUT_MAP[char] ?? char)
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[\s_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildCaregiverProfileUrl(caregiver) {
  if (caregiver?.profilePath) {
    return `/kindertagespflege/${caregiver.profilePath}`;
  }

  const citySlug = slugify(caregiver?.city) || 'unbekannt';
  const daycareSlug = slugify(caregiver?.daycareName || caregiver?.name) || 'kindertagespflege';

  return `/kindertagespflege/${citySlug}/${daycareSlug}`;
}
