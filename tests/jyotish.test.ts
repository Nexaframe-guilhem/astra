/**
 * Jyotish : ayanamsa Lahiri, nakshatras, navamsa, Vimshottari, puis comparaison croisée avec
 * natalengine (ayanamsa linéaire moyen, nœud vrai approché).
 */
import { calculateLahiriAyanamsa, calculateVedic } from 'natalengine';
import { describe, expect, it } from 'vitest';
import { normalizeBirthData } from '../src/core/birth-data/normalize.js';
import { calculateAstrology } from '../src/core/astrology/index.js';
import { calculateJyotish, jyotishResultSchema, lahiriAyanamsa, nakshatraOf, navamsaSign, vimshottari } from '../src/core/jyotish/index.js';
import { signedDelta } from '../src/core/shared/angles.js';
import { REFERENCE_CASES } from './fixtures/reference-inputs.js';

const NOW = new Date('2026-01-01T00:00:00Z');

describe('ayanamsa Lahiri', () => {
  it('vaut 23°15′ au 21 mars 1956 et ≈ 23°51′25″ (moyen) en J2000', () => {
    expect(lahiriAyanamsa(Date.UTC(1956, 2, 21)).mean).toBeCloseTo(23.2455, 3);
    expect(lahiriAyanamsa(Date.UTC(2000, 0, 1, 12)).mean).toBeCloseTo(23.85709, 4);
  });
  it('reste à moins de 0,01° du modèle de natalengine sur 1900-2100', () => {
    for (let y = 1900; y <= 2100; y += 25) {
      const ms = Date.UTC(y, 0, 1);
      const jd = ms / 86400000 + 2440587.5;
      expect(Math.abs(lahiriAyanamsa(ms).mean - calculateLahiriAyanamsa(jd))).toBeLessThan(0.01);
    }
  });
});

describe('divisions', () => {
  it('nakshatras de 13°20′ et padas de 3°20′', () => {
    expect(nakshatraOf(0)).toMatchObject({ id: 'ashwini', pada: 1, lord: 'ketu' });
    expect(nakshatraOf(13.3334)).toMatchObject({ id: 'bharani', pada: 1, lord: 'venus' });
    expect(nakshatraOf(10.01)).toMatchObject({ id: 'ashwini', pada: 4 });
    expect(nakshatraOf(359.99)).toMatchObject({ id: 'revati', pada: 4, lord: 'mercury' });
  });
  it('navamsa : Bélier commence en Bélier, Taureau en Capricorne, Gémeaux en Balance', () => {
    expect(navamsaSign(0.1)).toBe('aries');
    expect(navamsaSign(30.1)).toBe('capricorn');
    expect(navamsaSign(60.1)).toBe('libra');
    expect(navamsaSign(29.9)).toBe('sagittarius');
  });
  it('Vimshottari : 120 ans, solde proportionnel au reste du nakshatra', () => {
    const birth = Date.UTC(2000, 0, 1);
    const v = vimshottari(0, birth, 365.25); // début exact d'Ashwini : Ketu complet
    expect(v.balanceYears).toBeCloseTo(7, 9);
    expect(v.mahadashas.map((m) => m.lord)).toEqual(['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury']);
    expect(v.mahadashas[8]!.end).toBe(new Date(birth + 120 * 365.25 * 86400000).toISOString().slice(0, 10));
    const half = vimshottari(360 / 54, birth, 365.25); // milieu d'Ashwini
    expect(half.balanceYears).toBeCloseTo(3.5, 9);
    expect(half.mahadashas[0]!.antardashas[0]!.start).toBe('2000-01-01'); // antardashas déjà écoulées retirées
  });
});

describe.each(REFERENCE_CASES)('Jyotish : $id', ({ input }) => {
  const { birth } = normalizeBirthData(input);
  const ours = calculateJyotish(birth, {}, NOW, '2026-10-02');
  const oursTrue = calculateJyotish(birth, { nodeType: 'true' }, NOW);
  const utc = new Date(birth.utc);
  const theirs = calculateVedic(birth.utc.slice(0, 10), utc.getUTCHours() + utc.getUTCMinutes() / 60, 0, birth.latitude, birth.longitude);

  it('respecte le schéma', () => {
    expect(jyotishResultSchema.safeParse(ours).success).toBe(true);
  });

  it('sidéral = tropical − ayanamsa, lagna cohérent avec le thème tropical', () => {
    const tropical = calculateAstrology(birth, {}, NOW);
    expect(signedDelta(ours.lagna.longitude + ours.ayanamsa.value, tropical.angles.ascendant.longitude)).toBeCloseTo(0, 2);
    for (const g of ours.grahas) expect(signedDelta(g.longitude + ours.ayanamsa.value, g.tropicalLongitude)).toBeCloseTo(0, 3);
  });

  it('grahas à moins de 0,01° de natalengine (même signe et nakshatra hors limites)', () => {
    for (const g of oursTrue.grahas.filter((x) => x.id !== 'rahu' && x.id !== 'ketu')) {
      const t = theirs.positions[g.id];
      expect(Math.abs(signedDelta(g.longitude, t.longitude))).toBeLessThan(0.01);
      const nakEdge = g.longitude % (360 / 27);
      if (nakEdge > 0.02 && nakEdge < 360 / 27 - 0.02) expect(g.nakshatra.index + 1).toBe(t.nakshatra.number);
    }
  });

  it('même maître de dasha et même solde que natalengine', () => {
    expect(oursTrue.dashas.mahadashas[0]!.lord).toBe(theirs.dasha.birthLord.toLowerCase());
    expect(Math.abs(oursTrue.dashas.balanceYears - theirs.dasha.yearsRemaining)).toBeLessThan(0.05);
  });

  it('maisons en signes entiers depuis le lagna, Ketu opposé à Rahu', () => {
    for (const g of ours.grahas) expect(g.house).toBe(((g.signIndex - ours.lagna.signIndex + 12) % 12) + 1);
    const rahu = ours.grahas.find((g) => g.id === 'rahu')!;
    const ketu = ours.grahas.find((g) => g.id === 'ketu')!;
    expect(Math.abs(signedDelta(rahu.longitude, ketu.longitude))).toBeCloseTo(180, 6);
    expect((rahu.house + 5) % 12 + 1).toBe(ketu.house);
  });
});
