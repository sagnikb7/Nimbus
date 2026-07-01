import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import router from './weather.js';
import { isAvailable } from '../adapters/index.js';

function makeApp() {
  const app = express();
  app.use(router);
  return app;
}

// LIVE route integration — provider is selected via the query param now, so no
// env juggling. Open-Meteo is keyless; the calls hit the real API.
describe('GET /api/weather', () => {
  it('returns 400 when city is missing', async () => {
    const res = await request(makeApp()).get('/api/weather');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('returns the neutral schema for ?provider=open-meteo', async () => {
    const res = await request(makeApp()).get('/api/weather?city=London&provider=open-meteo');
    expect(res.status).toBe(200);
    expect(typeof res.body.current.temp.c).toBe('number');
    expect(res.body.daily.length).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(res.body.alerts)).toBe(true);
  });

  it('defaults to the keyless provider when none is given', async () => {
    const res = await request(makeApp()).get('/api/weather?city=London');
    expect(res.status).toBe(200);
    expect(res.body.daily.length).toBeGreaterThanOrEqual(3);
  });

  it('rejects an unknown provider with 400', async () => {
    const res = await request(makeApp()).get('/api/weather?city=London&provider=bogus');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unknown/i);
  });

  it.skipIf(isAvailable('weatherapi'))('rejects a key-required provider that is unconfigured', async () => {
    const res = await request(makeApp()).get('/api/weather?city=London&provider=weatherapi');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not configured|key/i);
  });
});
