import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import router from './weather.js';

function makeApp() {
  const app = express();
  app.use(router);
  return app;
}

describe('GET /api/providers', () => {
  it('lists providers with capabilities and no secrets', async () => {
    const res = await request(makeApp()).get('/api/providers');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const openMeteo = res.body.find((p) => p.id === 'open-meteo');
    expect(openMeteo).toBeTruthy();
    expect(openMeteo.available).toBe(true); // keyless
    expect(openMeteo.keyRequired).toBe(false);
    expect(openMeteo.forecastDays).toBeGreaterThan(3); // extended forecast capability
    expect(openMeteo.supportsAlerts).toBe(false);
    expect(openMeteo.supportsAirQuality).toBe(true);

    const weatherapi = res.body.find((p) => p.id === 'weatherapi');
    expect(weatherapi.supportsAlerts).toBe(true);
    expect(weatherapi.supportsAirQuality).toBe(true);
    expect(weatherapi.forecastDays).toBe(3);
    expect(weatherapi.supportsMoonPhase).toBe(true);
    expect(weatherapi.supportsCloudCover).toBe(true);
    expect(openMeteo.supportsMoonPhase).toBe(false);
    expect(openMeteo.supportsCloudCover).toBe(true);

    for (const p of res.body) {
      expect(p).not.toHaveProperty('key');
      expect(p).not.toHaveProperty('keyEnvVar');
    }
  });
});
