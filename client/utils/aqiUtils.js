const LEVELS = [
  { label: 'Good', className: 'good', color: '#10b981' },
  { label: 'Moderate', className: 'moderate', color: '#fbbf24' },
  { label: 'Unhealthy (Sensitive)', className: 'unhealthy-sensitive', color: '#fb923c' },
  { label: 'Unhealthy', className: 'unhealthy', color: '#ef4444' },
  { label: 'Very Unhealthy', className: 'very-unhealthy', color: '#a855f7' },
  { label: 'Hazardous', className: 'hazardous', color: '#881337' },
];

export function getAQILevel(epaIndex) {
  const i = Math.max(0, Math.min(5, (epaIndex || 1) - 1));
  return LEVELS[i];
}
