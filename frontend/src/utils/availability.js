export function formatAvailableSpotsLabel(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const spots = Number.isFinite(value) ? value : Number.parseInt(value, 10);
  if (!Number.isFinite(spots)) {
    return '';
  }

  const label = spots === 1 ? 'freier Platz' : 'freie Plätze';
  return `${spots} ${label}`;
}
