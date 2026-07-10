// Shared helpers for the hourly graphs (HourlyForecast, WindHourlyGraph,
// PrecipHourlyGraph) and hour-labelled summaries — one copy each, not six.

// Catmull-Rom → cubic Bézier: a natural-looking curve through every point.
export function smoothLine(pts) {
  if (pts.length < 2) return pts.length ? `M ${pts[0].x} ${pts[0].y}` : '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

// "3 PM" / "12 AM" / "12 PM" from a Date or a time string.
export function formatHour(time) {
  const h = (time instanceof Date ? time : new Date(time)).getHours();
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

// Column label for hourly graphs: "Now" for the current column, else the hour.
export function hourLabel(date, isNow) {
  return isNow ? 'Now' : formatHour(date);
}
