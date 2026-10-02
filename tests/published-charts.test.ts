/**
 * Référence EXTERNE : nos résultats comparés à des cartes publiées par d'autres logiciels.
 * C'est le test qui valide les conventions (roue HD, 88°, maisons, nœud), pas seulement le code.
 */
import { describe, expect, it } from 'vitest';
import { calculateAstrology } from '../src/core/astrology/index.js';
import { normalizeBirthData } from '../src/core/birth-data/normalize.js';
import { calculateHumanDesign } from '../src/core/human-design/index.js';
import { SIGNS } from '../src/core/shared/zodiac.js';
import { separation } from '../src/core/shared/angles.js';
import { PUBLISHED_CHARTS } from './fixtures/published-charts.js';

describe.each(PUBLISHED_CHARTS.filter((c) => c.humanDesign))('Human Design publié : $name', ({ input, humanDesign: ref }) => {
  const hd = calculateHumanDesign(normalizeBirthData(input).birth);
  it('type, autorité, profil, définition', () => {
    expect(hd.type.id).toBe(ref!.type);
    expect(hd.authority.id).toBe(ref!.authority);
    expect(hd.profile.id).toBe(ref!.profile);
    expect(hd.definition.id).toBe(ref!.definition);
  });
  it('croix d’incarnation', () => {
    const g = hd.incarnationCross.gates;
    expect(hd.incarnationCross.angle).toBe(ref!.angle);
    expect([g.personalitySun, g.personalityEarth, g.designSun, g.designEarth]).toEqual(ref!.cross);
  });
});

describe.each(PUBLISHED_CHARTS.filter((c) => c.astrology))('Astrologie publiée : $name', ({ input, astrology: ref }) => {
  const a = calculateAstrology(normalizeBirthData(input).birth, { nodeType: 'mean' });
  const points: Record<string, number> = {
    ...Object.fromEntries(Object.values(a.bodies).map((b) => [b.id, b.longitude])),
    ascendant: a.angles.ascendant.longitude,
    midheaven: a.angles.midheaven.longitude,
  };
  it.each(Object.entries(ref!.positions))('%s', (id, [sign, d, m]) => {
    const published = SIGNS.indexOf(sign as (typeof SIGNS)[number]) * 30 + d + m / 60;
    // La source arrondit à la minute : écart attendu ≤ 0,5′, toléré 1,2′.
    expect(separation(points[id]!, published)).toBeLessThan(0.02);
  });
});
