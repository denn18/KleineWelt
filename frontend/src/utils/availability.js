const MONTH_LABELS = {
  januar: 'Januar',
  februar: 'Februar',
  maerz: 'März',
  april: 'April',
  mai: 'Mai',
  juni: 'Juni',
  juli: 'Juli',
  august: 'August',
  september: 'September',
  oktober: 'Oktober',
  november: 'November',
  dezember: 'Dezember',
};

export const AVAILABILITY_TIMING_OPTIONS = [
  { value: 'aktuell', label: 'Aktuell' },
  ...Object.entries(MONTH_LABELS).map(([value, label]) => ({ value, label })),
];

function normalizeTiming(value) {
  if (!value) {
    return 'aktuell';
  }
  const normalized = value.toString().trim().toLowerCase();
  if (normalized === 'aktuell') {
    return 'aktuell';
  }
  const normalizedWithUmlauts = normalized
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue');
  if (Object.prototype.hasOwnProperty.call(MONTH_LABELS, normalizedWithUmlauts)) {
    return normalizedWithUmlauts;
  }
  return 'aktuell';
}

export function formatAvailableSpotsLabel({ availableSpots, hasAvailability, availabilityTiming } = {}) {
  if (hasAvailability === false) {
    return 'keine Plätze frei';
  }

  if (availableSpots === null || availableSpots === undefined) {
    return '';
  }

  const spots = Number.isFinite(availableSpots) ? availableSpots : Number.parseInt(availableSpots, 10);
  if (!Number.isFinite(spots)) {
    return '';
  }

  const label = spots === 1 ? 'Platz' : 'Plätze';
  const normalizedTiming = normalizeTiming(availabilityTiming);
  if (normalizedTiming === 'aktuell') {
    return `${spots} ${label} aktuell frei`;
  }
  return `${spots} ${label} ab ${MONTH_LABELS[normalizedTiming]} frei`;
}

export function isAvailabilityHighlighted({ availableSpots, availabilityTiming, hasAvailability } = {}) {
  if (hasAvailability === false) {
    return false;
  }

  const spots = Number.isFinite(availableSpots) ? availableSpots : Number.parseInt(availableSpots ?? '0', 10);
  if (!Number.isFinite(spots)) {
    return true;
  }

  if (spots === 0 && normalizeTiming(availabilityTiming) === 'aktuell') {
    return false;
  }

  return true;
}
