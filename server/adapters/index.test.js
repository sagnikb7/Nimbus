import { describe, it, expect } from 'vitest';
import { getAdapter, adapters, DEFAULT_PROVIDER, isAvailable, listProviders } from './index.js';

describe('adapter registry', () => {
  it('resolves known providers to an adapter with fetchWeather + meta', () => {
    expect(typeof getAdapter('weatherapi').fetchWeather).toBe('function');
    expect(typeof getAdapter('open-meteo').fetchWeather).toBe('function');
    expect(getAdapter('open-meteo').meta.id).toBe('open-meteo');
  });

  it('throws a clear error on an unknown provider', () => {
    expect(() => getAdapter('bogus')).toThrow(/Unknown weather provider/);
  });

  it('registers exactly the known providers', () => {
    expect(Object.keys(adapters).sort()).toEqual(['open-meteo', 'weatherapi']);
  });

  it('defaults to the keyless provider', () => {
    expect(DEFAULT_PROVIDER).toBe('open-meteo');
    expect(isAvailable('open-meteo')).toBe(true); // keyless → always available
  });

  it('listProviders exposes capabilities but never leaks keys', () => {
    const list = listProviders();
    expect(list.map((p) => p.id).sort()).toEqual(['open-meteo', 'weatherapi']);
    for (const p of list) {
      expect(p).toHaveProperty('label');
      expect(p).toHaveProperty('keyRequired');
      expect(p).toHaveProperty('available');
      // Secrets / env-var names must not appear in the client-facing payload.
      expect(p).not.toHaveProperty('key');
      expect(p).not.toHaveProperty('keyEnvVar');
    }
    expect(list.find((p) => p.id === 'open-meteo').available).toBe(true);
  });
});
