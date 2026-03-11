const UMLAUT_FORWARD_MAP = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
};

const UMLAUT_BACKWARD_PATTERNS = [
  [/ae/g, 'ä'],
  [/oe/g, 'ö'],
  [/ue/g, 'ü'],
  [/ss/g, 'ß'],
];

export function slugifyCity(value) {
  return `${value ?? ''}`
    .trim()
    .toLowerCase()
    .replace(/[äöüß]/g, (char) => UMLAUT_FORWARD_MAP[char] ?? char)
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[\s_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function toReadableCityName(citySlug) {
  const normalizedSlug = `${citySlug ?? ''}`.trim().toLowerCase();
  if (!normalizedSlug) {
    return 'deiner Stadt';
  }

  const withSpaces = normalizedSlug.replace(/-/g, ' ');
  const withUmlauts = UMLAUT_BACKWARD_PATTERNS.reduce((value, [pattern, replacement]) => {
    return value.replace(pattern, replacement);
  }, withSpaces);

  return withUmlauts
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
