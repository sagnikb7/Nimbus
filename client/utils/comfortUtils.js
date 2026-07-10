// Comfort helpers. Dew point is the honest "muggy" metric — unlike relative
// humidity, it maps directly to how sticky the air feels. Thresholds in °C
// (standard dew-point comfort scale).
export function getDewComfort(dpC) {
  if (dpC == null || Number.isNaN(dpC)) return '';
  if (dpC < 10) return 'Dry';
  if (dpC < 16) return 'Comfortable';
  if (dpC < 18) return 'Humid';
  if (dpC < 21) return 'Muggy';
  return 'Oppressive';
}
