import { describe, it, expect } from 'vitest';
import {
  cToF, degToCompass, isoToAmPm, isoToSpace,
  localEpoch, usAqiToEpaIndex, wmoToConditionId, wmoToText,
} from './convert.js';

describe('convert helpers (pure)', () => {
  it('cToF', () => {
    expect(cToF(0)).toBe(32);
    expect(cToF(100)).toBe(212);
    expect(cToF(null)).toBeNull();
  });

  it('degToCompass', () => {
    expect(degToCompass(0)).toBe('N');
    expect(degToCompass(90)).toBe('E');
    expect(degToCompass(180)).toBe('S');
    expect(degToCompass(270)).toBe('W');
    expect(degToCompass(45)).toBe('NE');
    expect(degToCompass(360)).toBe('N');
    expect(degToCompass(null)).toBe('');
  });

  it('isoToAmPm', () => {
    expect(isoToAmPm('2026-07-01T06:05')).toBe('6:05 AM');
    expect(isoToAmPm('2026-07-01T13:00')).toBe('1:00 PM');
    expect(isoToAmPm('2026-07-01T00:30')).toBe('12:30 AM');
    expect(isoToAmPm('2026-07-01T12:00')).toBe('12:00 PM');
    expect(isoToAmPm('')).toBe('');
  });

  it('isoToSpace', () => {
    expect(isoToSpace('2026-07-01T17:45')).toBe('2026-07-01 17:45');
  });

  it('usAqiToEpaIndex maps US AQI ranges to EPA 1–6', () => {
    expect(usAqiToEpaIndex(50)).toBe(1);
    expect(usAqiToEpaIndex(51)).toBe(2);
    expect(usAqiToEpaIndex(100)).toBe(2);
    expect(usAqiToEpaIndex(150)).toBe(3);
    expect(usAqiToEpaIndex(200)).toBe(4);
    expect(usAqiToEpaIndex(300)).toBe(5);
    expect(usAqiToEpaIndex(301)).toBe(6);
    expect(usAqiToEpaIndex(null)).toBeNull();
  });

  it('wmoToConditionId + wmoToText', () => {
    expect(wmoToConditionId(0)).toBe(1000);
    expect(wmoToConditionId(3)).toBe(1006);
    expect(wmoToConditionId(95)).toBe(1087);
    expect(wmoToConditionId(999)).toBe(1006); // unknown → overcast fallback
    expect(wmoToText(0)).toBe('Clear');
    expect(wmoToText(95)).toBe('Thunderstorm');
    expect(wmoToText(999)).toBe('Unknown');
  });

  it('localEpoch subtracts the UTC offset from the local wall-clock', () => {
    const e = localEpoch('2026-07-01T00:00', 19800);
    expect(e).toBe(Math.floor(Date.parse('2026-07-01T00:00:00Z') / 1000) - 19800);
  });
});
