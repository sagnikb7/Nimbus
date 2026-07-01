import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

// Load .env here (Node config context) and forward the vars to the test workers
// via test.env — `import 'dotenv/config'` inside a worker does not populate
// process.env reliably under Vitest.
dotenv.config();

// Backend tests only. Several are LIVE integration tests that hit the real
// weather providers (Open-Meteo is keyless; WeatherAPI tests self-skip unless
// its key is set in .env) — hence the generous network timeout.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.js'],
    testTimeout: 20000,
    hookTimeout: 20000,
    env: {
      // Forward the WeatherAPI key (new name + legacy fallback) to workers.
      WEATHERAPI_KEY: process.env.WEATHERAPI_KEY ?? '',
      WEATHER_API_KEY: process.env.WEATHER_API_KEY ?? '',
    },
  },
});
