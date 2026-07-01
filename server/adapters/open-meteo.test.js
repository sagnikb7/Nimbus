import { describe, it, expect } from 'vitest';
import { fetchWeather, meta } from './open-meteo.js';

// LIVE tests — hit Open-Meteo (keyless) + BigDataCloud reverse geocoding.
// Assert schema invariants, not exact values (weather changes hour to hour).
function assertNeutralShape(d) {
  expect(typeof d.location.name).toBe('string');
  expect(d.location.name.length).toBeGreaterThan(0);
  expect(typeof d.location.timezone).toBe('string');
  expect(typeof d.location.localtime).toBe('string');

  expect(typeof d.current.temp.c).toBe('number');
  expect(typeof d.current.temp.f).toBe('number');
  expect(typeof d.current.feels_like.c).toBe('number');
  expect(typeof d.current.condition.id).toBe('number');
  expect(typeof d.current.condition.text).toBe('string');
  expect(typeof d.current.wind.dir).toBe('string');
  expect(d.current.wind.dir).toMatch(/^[NSEW]/);
  expect(typeof d.current.wind.degree).toBe('number');

  expect(Array.isArray(d.alerts)).toBe(true);
  expect(d.daily.length).toBe(meta.forecastDays); // provider-driven (7 for Open-Meteo)
  expect(d.daily[0].hour.length).toBeGreaterThan(0);
  expect(typeof d.daily[0].astro.sunrise).toBe('string');
  expect(typeof d.daily[0].high.c).toBe('number');
}

describe('open-meteo adapter (live)', () => {
  it('resolves a city name into the neutral schema', async () => {
    const d = await fetchWeather('London');
    assertNeutralShape(d);
    expect(d.alerts).toEqual([]); // Open-Meteo provides no alerts
    if (d.current.air_quality) {
      expect(d.current.air_quality.epa_index).toBeGreaterThanOrEqual(1);
      expect(d.current.air_quality.epa_index).toBeLessThanOrEqual(6);
    }
  });

  it('resolves "lat,lon" and reverse-geocodes a place name', async () => {
    const d = await fetchWeather('51.5072,-0.1276');
    assertNeutralShape(d);
  });

  it('throws for an unknown city', async () => {
    await expect(fetchWeather('zzzznotacityxyz123')).rejects.toThrow(/not found/i);
  });
});
