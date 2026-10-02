/**
 * Astrologie : valeurs publiées (Meeus, "Astronomical Algorithms", 2e éd.)
 * + propriétés géométriques + comparaison croisée avec circular-natal-horoscope-js
 * (éphéméride Moshier, implémentation indépendante d'astronomy-engine).
 */
import pkg from 'circular-natal-horoscope-js';
import { describe, expect, it } from 'vitest';
import { calculateAstrology } from '../src/core/astrology/index.js';
import { ascendant, computeHouses, houseOf, midheaven } from '../src/core/astrology/houses.js';
import { normalizeBirthData } from '../src/core/birth-data/normalize.js';
import { bodyLongitude, earthOrientation, trueNodeLongitude } from '../src/core/ephemeris/index.js';
import { DEG, RAD, norm360, separation } from '../src/core/shared/angles.js';
import { REFERENCE_CASES } from './fixtures/reference-inputs.js';

const { Origin, Horoscope } = pkg as any;

describe('éphéméride : valeurs de référence Meeus', () => {
  it('Soleil apparent, exemple 25.b (1992-10-13 0h TD) = 199°54′21.8″', () => {
    const utc = Date.UTC(1992, 9, 13) - 59.3 * 1000; // ΔT ≈ 59 s en 1992
    expect(separation(bodyLongitude('sun', utc), 199.906061)).toBeLessThan(0.0005);
  });
  it('Lune apparente, exemple 47.a (1992-04-12 0h TD) = 133.167265°', () => {
    const utc = Date.UTC(1992, 3, 12) - 59 * 1000;
    expect(separation(bodyLongitude('moon', utc), 133.167265)).toBeLessThan(0.003);
  });
  it('temps sidéral apparent, exemple 12.a (1987-04-10 0h UT) = 13h10m46.1351s', () => {
    const expected = (13 + 10 / 60 + 46.1351 / 3600) * 15;
    expect(separation(earthOrientation(Date.UTC(1987, 3, 10)).gast, expected)).toBeLessThan(0.0001);
  });
  it('obliquité vraie, exemple 22.a (1987-04-10 0h TD) = 23°26′36.850″', () => {
    expect(Math.abs(earthOrientation(Date.UTC(1987, 3, 10)).trueObliquity - 23.443569)).toBeLessThan(0.0001);
  });
});

describe('nœud lunaire vrai (osculateur)', () => {
  it('coïncide avec la Lune quand elle traverse l’écliptique', async () => {
    const A = await import('astronomy-engine');
    let ev = A.SearchMoonNode(new Date('2000-01-01T00:00:00Z'));
    for (let i = 0; i < 10; i++) {
      const t = ev.time.date.getTime();
      const moon = bodyLongitude('moon', t);
      const expected = ev.kind === A.NodeEventKind.Ascending ? moon : norm360(moon + 180);
      expect(separation(trueNodeLongitude(t), expected)).toBeLessThan(0.0005);
      ev = A.NextMoonNode(ev);
    }
  });
});

describe('angles et maisons : propriétés géométriques', () => {
  const eps = 23.44;
  it('MC et ASC à l’équateur pour RAMC = 0 : MC = 0° Bélier, ASC = 90°', () => {
    expect(midheaven(0, eps)).toBeCloseTo(0, 9);
    expect(ascendant(0, eps, 0)).toBeCloseTo(90, 9);
  });
  it('Placidus vérifie sa définition (trisection de l’arc semi-diurne)', () => {
    const ramc = 123.4, phi = 45;
    const asc = ascendant(ramc, eps, phi), mc = midheaven(ramc, eps);
    const { cusps } = computeHouses('placidus', ramc, eps, phi, asc, mc);
    const check = (lambda: number, fraction: number) => {
      const ra = norm360(Math.atan2(Math.sin(lambda * DEG) * Math.cos(eps * DEG), Math.cos(lambda * DEG)) * RAD);
      const decl = Math.asin(Math.sin(eps * DEG) * Math.sin(lambda * DEG));
      const sda = 90 + Math.asin(Math.tan(phi * DEG) * Math.tan(decl)) * RAD;
      expect(norm360(ra - ramc)).toBeCloseTo(fraction * sda, 6);
    };
    check(cusps[10]!, 1 / 3);
    check(cusps[11]!, 2 / 3);
  });
  it('cuspides opposées à 180° et maisons en signes entiers alignées sur 0°', () => {
    const { cusps } = computeHouses('placidus', 200, eps, 48, ascendant(200, eps, 48), midheaven(200, eps));
    for (let i = 0; i < 6; i++) expect(separation(cusps[i]!, cusps[i + 6]!)).toBeCloseTo(180, 9);
    const ws = computeHouses('whole-sign', 200, eps, 48, 95, 0).cusps;
    expect(ws[0]).toBe(90);
  });
  it('houseOf gère le passage 360° -> 0°', () => {
    const cusps = [350, 20, 50, 80, 110, 140, 170, 200, 230, 260, 290, 320];
    expect(houseOf(355, cusps)).toBe(1);
    expect(houseOf(5, cusps)).toBe(1);
    expect(houseOf(349.9, cusps)).toBe(12);
  });
});

/**
 * circular-natal-horoscope-js déduit lui-même le fuseau (tz-lookup) et convertit l'heure locale.
 * On lui fournit l'heure murale correspondant à NOTRE instant UTC dans SON fuseau, afin
 * d'isoler la comparaison astronomique de la gestion des fuseaux (testée à part).
 */
function reference(caseInput: Record<string, unknown>) {
  const { birth } = normalizeBirthData(caseInput);
  const probe = new Origin({ year: 2000, month: 0, date: 1, hour: 12, minute: 0, latitude: birth.latitude, longitude: birth.longitude });
  const zone: string = probe.timezone.name;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
      .formatToParts(new Date(birth.utc)).map((p) => [p.type, Number(p.value)]),
  );
  const origin = new Origin({
    year: parts.year, month: parts.month! - 1, date: parts.day, hour: parts.hour, minute: parts.minute,
    latitude: birth.latitude, longitude: birth.longitude,
  });
  const h = new Horoscope({ origin, houseSystem: 'placidus', zodiac: 'tropical', aspectTypes: ['major'], language: 'en' });
  return { birth, h };
}

describe.each(REFERENCE_CASES)('comparaison croisée circular-natal-horoscope-js : $id', ({ input }) => {
  const { birth, h } = reference(input);
  const ours = calculateAstrology(birth, { nodeType: 'mean' });
  const theirs = Object.fromEntries(h.CelestialBodies.all.map((b: any) => [b.key, b.ChartPosition.Ecliptic.DecimalDegrees]));
  const sameUtc = new Date(h.origin.utcTime.format()).toISOString() === birth.utc;

  it('le moteur de référence a calculé le même instant UTC', () => {
    expect(sameUtc).toBe(true);
  });
  it.each(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'])('%s à moins de 0.02°', (id) => {
    expect(separation(ours.bodies[id]!.longitude, theirs[id])).toBeLessThan(0.02);
  });
  it('nœud nord moyen à moins de 0.001°', () => {
    const node = h.CelestialPoints.all.find((p: any) => p.key === 'northnode').ChartPosition.Ecliptic.DecimalDegrees;
    expect(separation(ours.bodies.northNode!.longitude, node)).toBeLessThan(0.001);
  });
  it('Ascendant à moins de 0.05° et MC à moins de 0.02°', () => {
    // L'Ascendant est très sensible au temps sidéral aux hautes latitudes (Tromsø : ~0.03°).
    expect(separation(ours.angles.ascendant.longitude, h.Ascendant.ChartPosition.Ecliptic.DecimalDegrees)).toBeLessThan(0.05);
    expect(separation(ours.angles.midheaven.longitude, h.Midheaven.ChartPosition.Ecliptic.DecimalDegrees)).toBeLessThan(0.02);
  });
  // circular-natal-horoscope-js approxime Placidus (jusqu'à ~0.45° d'écart avec la définition) ;
  // nos cuspides vérifient la définition à 1e-6° près (test géométrique ci-dessus). Tolérance large ici.
  it('cuspides Placidus à moins de 0.5° (hors latitude polaire)', () => {
    if (ours.houseSystem !== 'placidus') {
      expect(ours.warnings.some((w) => w.startsWith('POLAR_LATITUDE'))).toBe(true);
      return;
    }
    h.Houses.forEach((house: any, i: number) => {
      expect(separation(ours.houses[i]!.longitude, house.ChartPosition.StartPosition.Ecliptic.DecimalDegrees)).toBeLessThan(0.5);
    });
  });
});
