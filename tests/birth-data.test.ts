import { describe, expect, it } from 'vitest';
import { normalizeBirthData } from '../src/core/birth-data/normalize.js';
import { localToUtc } from '../src/core/birth-data/timezone.js';

const base = { firstName: 'A', lastName: 'B', birthPlace: 'X' };
const utcOf = (birthDate: string, birthTime: string, timezone: string, latitude = 48.85, longitude = 2.35, extra = {}) =>
  normalizeBirthData({ ...base, birthDate, birthTime, timezone, latitude, longitude, ...extra }).birth.utc;

describe('conversion heure locale -> UTC (tzdata historique)', () => {
  it('été / hiver en France', () => {
    expect(utcOf('1990-06-15', '14:30', 'Europe/Paris')).toBe('1990-06-15T12:30:00.000Z');
    expect(utcOf('1990-12-15', '14:30', 'Europe/Paris')).toBe('1990-12-15T13:30:00.000Z');
  });
  it('France sous l’Occupation (UTC+1 l’hiver 1943, UTC+2 l’été)', () => {
    expect(utcOf('1943-01-10', '10:00', 'Europe/Paris')).toBe('1943-01-10T09:00:00.000Z');
    expect(utcOf('1943-07-10', '10:00', 'Europe/Paris')).toBe('1943-07-10T08:00:00.000Z');
  });
  it('France sans heure d’été entre 1946 et 1975', () => {
    expect(utcOf('1970-07-01', '12:00', 'Europe/Paris')).toBe('1970-07-01T11:00:00.000Z');
  });
  it('heure moyenne de Paris avant 1911 (PMT, +9 min 21 s)', () => {
    expect(utcOf('1900-01-01', '12:00', 'Europe/Paris')).toBe('1900-01-01T11:50:39.000Z');
  });
  it('heure d’été japonaise 1948-1951', () => {
    expect(utcOf('1950-05-20', '08:00', 'Asia/Tokyo', 35.68, 139.65)).toBe('1950-05-19T22:00:00.000Z');
    expect(utcOf('1960-05-20', '08:00', 'Asia/Tokyo', 35.68, 139.65)).toBe('1960-05-19T23:00:00.000Z');
  });
  it('heure d’été en Chine 1986-1991', () => {
    expect(utcOf('1988-07-01', '12:00', 'Asia/Shanghai', 31.23, 121.47)).toBe('1988-07-01T03:00:00.000Z');
    expect(utcOf('1995-07-01', '12:00', 'Asia/Shanghai', 31.23, 121.47)).toBe('1995-07-01T04:00:00.000Z');
  });
  it('heure inexistante (saut de printemps) refusée', () => {
    expect(() => utcOf('1990-03-25', '02:30', 'Europe/Paris')).toThrowError(/n'a pas existé/);
  });
  it('heure ambiguë (retour d’automne) refusée sans précision, résolue avec', () => {
    expect(() => utcOf('1990-09-30', '02:30', 'Europe/Paris')).toThrowError(/deux fois/);
    expect(utcOf('1990-09-30', '02:30', 'Europe/Paris', 48.85, 2.35, { dstAmbiguity: 'earlier' })).toBe('1990-09-30T00:30:00.000Z');
    expect(utcOf('1990-09-30', '02:30', 'Europe/Paris', 48.85, 2.35, { dstAmbiguity: 'later' })).toBe('1990-09-30T01:30:00.000Z');
  });
  it('hémisphère sud et ligne de changement de date', () => {
    expect(utcOf('2000-01-01', '00:05', 'Pacific/Auckland', -36.85, 174.76)).toBe('1999-12-31T11:05:00.000Z');
  });
  it('localToUtc est indépendant du fuseau du serveur', () => {
    expect(localToUtc({ year: 1990, month: 6, day: 15, hour: 14, minute: 30 }, 'Europe/Paris').utcMs).toBe(Date.UTC(1990, 5, 15, 12, 30));
  });
});

describe('fuseau et coordonnées', () => {
  it('déduit le fuseau des coordonnées si absent', () => {
    const { birth } = normalizeBirthData({ ...base, birthDate: '1990-06-15', birthTime: '14:30', latitude: 43.6047, longitude: 1.4442 });
    expect(birth.timezone).toBe('Europe/Paris');
    expect(birth.timezoneSource).toBe('coordinates');
  });
  it('signale une incohérence fuseau / coordonnées', () => {
    const { birth } = normalizeBirthData({ ...base, birthDate: '1990-06-15', birthTime: '14:30', latitude: 43.6047, longitude: 1.4442, timezone: 'America/New_York' });
    expect(birth.warnings.some((w) => w.startsWith('TIMEZONE_MISMATCH'))).toBe(true);
  });
});

describe('validation serveur de la saisie', () => {
  it.each([
    [{ birthDate: '1990-02-30', birthTime: '12:00' }, /inexistante/],
    [{ birthDate: '15/06/1990', birthTime: '12:00' }, /invalides/],
    [{ birthDate: '1990-06-15', birthTime: '25:00' }, /invalide/],
    [{ birthDate: '1990-06-15', birthTime: '12:00', timezone: 'Mars/Olympus' }, /inconnu/],
    [{ birthDate: '1990-06-15', birthTime: '12:00', latitude: 123 }, /invalides/],
  ])('refuse %j', (patch, error) => {
    expect(() => normalizeBirthData({ ...base, latitude: 48.85, longitude: 2.35, timezone: 'Europe/Paris', ...patch })).toThrowError(error);
  });
});
