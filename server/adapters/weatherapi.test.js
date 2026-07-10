import { describe, it, expect } from 'vitest';
import { fetchWeather } from './weatherapi.js';
import { isAvailable, resolveKey } from './index.js';

describe('weatherapi adapter (offline guard)', () => {
  it('rejects when the API key is missing', async () => {
    await expect(fetchWeather('London', {})).rejects.toThrow(/key/i);
  });
});

// LIVE — needs WEATHERAPI_KEY (or legacy WEATHER_API_KEY) in .env; self-skips
// via the registry's availability check otherwise.
describe.skipIf(!isAvailable('weatherapi'))('weatherapi adapter (live)', () => {
  it('maps forecast.json into the neutral schema', async () => {
    const d = await fetchWeather('London', { apiKey: resolveKey('weatherapi') });

    expect(typeof d.location.timezone).toBe('string');
    expect(typeof d.current.temp.c).toBe('number');
    expect(typeof d.current.temp.f).toBe('number');
    expect(typeof d.current.condition.id).toBe('number');
    expect(d.current.condition.icon_url).toMatch(/^https:/);
    expect(typeof d.current.dewpoint.c).toBe('number');
    expect(typeof d.current.wind.dir).toBe('string');
    expect(Array.isArray(d.alerts)).toBe(true);
    expect(d.daily.length).toBe(3);
    expect(d.daily[0].hour.length).toBeGreaterThan(0);
    expect(typeof d.daily[0].hour[0].chance_of_rain).toBe('number');
    expect(typeof d.daily[0].hour[0].precip_mm).toBe('number');
    expect(typeof d.daily[0].hour[0].snow_cm).toBe('number');

    if (d.current.air_quality) {
      expect(d.current.air_quality.epa_index).toBeGreaterThanOrEqual(1);
      expect(d.current.air_quality.epa_index).toBeLessThanOrEqual(6);
    }
  });
});
