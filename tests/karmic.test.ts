/**
 * Astrologie karmique : Chiron (table intégrée), Lilith moyenne, lecture des points karmiques.
 * Chiron est vérifié sur des dates publiées (entrées en signe, périhélie, découverte) ; Lilith
 * et Chiron sont aussi comparés à circular-natal-horoscope-js, dont Chiron est képlérien (époque 2012).
 */
import pkg from 'circular-natal-horoscope-js';
import { describe, expect, it } from 'vitest';
import { calculateAstrology } from '../src/core/astrology/index.js';
import { normalizeBirthData } from '../src/core/birth-data/normalize.js';
import { chironLongitude, meanLilithLongitude } from '../src/core/ephemeris/index.js';
import { calculateKarmic, karmicResultSchema } from '../src/core/karmic/index.js';
import { signedDelta } from '../src/core/shared/angles.js';
import { REFERENCE_CASES } from './fixtures/reference-inputs.js';

const { Origin, Horoscope } = pkg as any;
const NOW = new Date('2026-01-01T00:00:00Z');
const at = (iso: string) => chironLongitude(Date.parse(iso))!;

/** Référence à l'équateur, longitude 0 : fuseau UTC, l'heure murale est l'heure UTC. */
function oracle(iso: string) {
  const d = new Date(iso);
  const origin = new Origin({ year: d.getUTCFullYear(), month: d.getUTCMonth(), date: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes(), latitude: 0, longitude: 0 });
  const h = new Horoscope({ origin, houseSystem: 'whole-sign', zodiac: 'tropical', language: 'en' });
  return { chiron: h.CelestialBodies.chiron.ChartPosition.Ecliptic.DecimalDegrees as number, lilith: h.CelestialPoints.lilith.ChartPosition.Ecliptic.DecimalDegrees as number };
}

describe('Chiron', () => {
  it('entre en Poissons le 20 avril 2010 et en Bélier le 17 avril 2018 puis le 18 février 2019', () => {
    expect(at('2010-04-19T00:00:00Z')).toBeLessThan(330);
    expect(at('2010-04-21T00:00:00Z')).toBeGreaterThan(330);
    for (const day of ['2018-04-17', '2019-02-18']) {
      expect(at(`${day}T00:00:00Z`)).toBeGreaterThan(359.9);
      expect(at(`${day}T23:59:00Z`) % 360).toBeLessThan(0.05);
    }
  });
  it('vers 3° Taureau lors de sa découverte (novembre 1977)', () => {
    expect(at('1977-11-01T00:00:00Z')).toBeCloseTo(33.2, 0);
  });
  it('proche de la référence képlérienne autour de son époque (2005-2020)', () => {
    for (let y = 2005; y <= 2020; y += 3) expect(Math.abs(signedDelta(at(`${y}-06-01T12:00:00Z`), oracle(`${y}-06-01T12:00:00Z`).chiron))).toBeLessThan(0.15);
  });
  it('null hors de 1900-2100', () => {
    expect(chironLongitude(Date.parse('1899-06-01T00:00:00Z'))).toBeNull();
    expect(chironLongitude(Date.parse('2100-06-01T00:00:00Z'))).toBeNull();
    expect(chironLongitude(Date.parse('1900-01-01T00:00:00Z'))).not.toBeNull();
  });
});

describe('Lilith moyenne', () => {
  it('identique à circular-natal-horoscope-js à 0,01° près', () => {
    for (const iso of ['1920-03-01T06:00:00Z', '1969-07-20T20:17:00Z', '1990-06-15T12:30:00Z', '2024-12-31T23:00:00Z']) {
      expect(Math.abs(signedDelta(meanLilithLongitude(Date.parse(iso)), oracle(iso).lilith))).toBeLessThan(0.01);
    }
  });
});

describe.each(REFERENCE_CASES)('lecture karmique : $id', ({ input }) => {
  const { birth } = normalizeBirthData(input);
  const astrology = calculateAstrology(birth, {}, NOW);
  const k = calculateKarmic(birth, astrology, NOW);

  it('respecte le schéma et reprend les points du thème', () => {
    expect(karmicResultSchema.safeParse(k).success).toBe(true);
    expect(k.nodes.north.sign).toBe(astrology.bodies.northNode!.sign);
    expect(k.saturn.house).toBe(astrology.bodies.saturn!.house);
    expect(Math.abs(signedDelta(k.nodes.north.longitude, k.nodes.south.longitude))).toBeCloseTo(180, 4);
  });
  it('liste les rétrogrades et la maison 12 de façon cohérente', () => {
    for (const r of k.retrogrades) expect(astrology.bodies[r.id]!.retrograde).toBe(true);
    for (const b of k.house12) {
      const house = b.id === 'chiron' ? k.chiron!.house : b.id === 'lilith' ? k.lilith.house : astrology.bodies[b.id]!.house;
      expect(house).toBe(12);
    }
  });
});
