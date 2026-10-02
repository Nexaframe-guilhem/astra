/**
 * Human Design : tables de référence, roue des portes, instant Design (88°),
 * puis comparaison croisée avec natalengine et free-human-design.
 */
import fhd from 'free-human-design';
import { calculateHumanDesign as natalEngineHD } from 'natalengine';
import { describe, expect, it } from 'vitest';
import { normalizeBirthData } from '../src/core/birth-data/normalize.js';
import { bodyLongitude } from '../src/core/ephemeris/index.js';
import { calculateHumanDesign } from '../src/core/human-design/index.js';
import { CENTER_GATES, CHANNELS, GATE_CENTER, GATE_ORDER } from '../src/core/human-design/data.js';
import { longitudeToActivation } from '../src/core/human-design/engine.js';
import { separation, signedDelta } from '../src/core/shared/angles.js';
import { REFERENCE_CASES } from './fixtures/reference-inputs.js';

const FHD_CENTER: Record<string, string> = { solarplexus: 'solarPlexus' };
const FHD_AUTHORITY: Record<string, string> = {
  'Emotional (Solar Plexus)': 'emotional', Sacral: 'sacral', Splenic: 'splenic', 'Ego Manifested': 'ego-manifested', 'Ego Projected': 'ego-projected',
  'Self-Projected': 'self-projected', 'Self Projected': 'self-projected', Mental: 'mental', 'None': 'mental', Lunar: 'lunar',
};
const NE_AUTHORITY: Record<string, RegExp> = {
  'Emotional Authority': /^emotional$/, 'Sacral Authority': /^sacral$/, 'Splenic Authority': /^splenic$/,
  'Ego/Heart Authority': /^ego-/, 'Self-Projected Authority': /^self-projected$/, 'Mental/Environment': /^mental$/, 'Lunar Authority': /^lunar$/,
};
const NE_TYPE: Record<string, string> = {
  Generator: 'generator', 'Manifesting Generator': 'manifesting-generator', Manifestor: 'manifestor', Projector: 'projector', Reflector: 'reflector',
};

describe('tables du BodyGraph', () => {
  it('64 portes uniques réparties sur 9 centres, 36 canaux', () => {
    expect(new Set(GATE_ORDER).size).toBe(64);
    expect(Object.values(CENTER_GATES).flat().sort((a, b) => a - b)).toEqual(Array.from({ length: 64 }, (_, i) => i + 1));
    expect(CHANNELS).toHaveLength(36);
  });
  it('identiques à free-human-design (canaux et centres)', () => {
    const theirs = (fhd as any).CHANNELS.map((c: any) => [...c.gates].sort((a: number, b: number) => a - b).join('-')).sort();
    const ours = CHANNELS.map(([a, b]) => `${a}-${b}`).sort();
    expect(ours).toEqual(theirs);
    for (const [gate, center] of Object.entries((fhd as any).GATE_CENTER as Record<string, string>)) {
      expect(GATE_CENTER[Number(gate)]).toBe(FHD_CENTER[center] ?? center);
    }
  });
  it('roue : la porte 25 commence à 0° Bélier - 1°45′ (358.25°), la 41 à 302°', () => {
    expect(longitudeToActivation(302).gate).toBe(41);
    expect(longitudeToActivation(301.999).gate).toBe(60);
    expect(longitudeToActivation(358.25)).toMatchObject({ gate: 25, line: 1, color: 1, tone: 1, base: 1 });
    expect(longitudeToActivation(0).gate).toBe(25);
    expect(longitudeToActivation(302 + 5.625 - 1e-9)).toMatchObject({ gate: 41, line: 6, color: 6, tone: 6, base: 5 });
  });
});

describe.each(REFERENCE_CASES)('Human Design : $id', ({ input }) => {
  const { birth } = normalizeBirthData(input);
  const ours = calculateHumanDesign(birth);
  const oursMean = calculateHumanDesign(birth, { nodeType: 'mean' });

  it('Design = Soleil exactement 88° avant la naissance', () => {
    const pSun = bodyLongitude('sun', Date.parse(birth.utc));
    const dSun = bodyLongitude('sun', Date.parse(ours.design.utc));
    expect(signedDelta(dSun, pSun)).toBeCloseTo(88, 5);
    const days = (Date.parse(birth.utc) - Date.parse(ours.design.utc)) / 86400000;
    expect(days).toBeGreaterThan(85);
    expect(days).toBeLessThan(94);
  });

  it('identique à natalengine (type, autorité, profil, définition, canaux, activations)', () => {
    const offsetHours = birth.utcOffsetMinutes / 60;
    const [h, m] = birth.time.split(':').map(Number) as [number, number];
    const ne: any = natalEngineHD(birth.date, h + m / 60, offsetHours, { nodeType: 'mean' });
    expect(oursMean.type.id).toBe(NE_TYPE[ne.type.name]);
    expect(oursMean.authority.id).toMatch(NE_AUTHORITY[ne.authority.name]!);
    expect(oursMean.profile.id).toBe(ne.profile.numbers);
    expect(oursMean.channels.map((c) => c.id).sort()).toEqual(ne.channels.map((c: any) => [...c.gates].sort((a: number, b: number) => a - b).join('-')).sort());
    // Activations Personnalité : même éphéméride (astronomy-engine), écart attendu ~0.
    for (const a of oursMean.personality.activations) {
      const theirs = ne.positions.personality[a.point];
      expect(separation(a.longitude, theirs.longitude), a.point).toBeLessThan(0.001);
    }
  });

  /**
   * free-human-design place le début de la roue ~0.036° plus loin que la convention standard
   * (porte 41 à 302°, partagée par natalengine). Les activations à moins de 0.06° d'une limite
   * peuvent donc changer de porte : elles sont exclues de la comparaison, et le type/l'autorité
   * ne sont comparés que si aucune activation n'est dans cette zone.
   */
  it('cohérent avec free-human-design hors zones de limite de porte', () => {
    const f: any = (fhd as any).computeChart({ birthdate: birth.date, birthtime: birth.time, timezone: birth.timezone });
    expect(f.input.birth_utc).toBe(birth.utc);
    expect(ours.profile.id).toBe(f.humanDesign.profile);
    let nearBoundary = false;
    for (const side of ['personality', 'design'] as const) {
      for (const theirs of f.humanDesign.activations[side]) {
        if (theirs.body.includes('node')) continue; // modèle de nœud vrai différent (cf. astrology.test.ts)
        const a = ours[side].activations.find((x) => x.point === theirs.body)!;
        if (a.gateBoundaryDistance < 0.06) { nearBoundary = true; continue; }
        expect(a.gate, `${side}.${theirs.body}`).toBe(theirs.gate);
      }
    }
    if (!nearBoundary) {
      expect(ours.type.id).toBe(NE_TYPE[f.humanDesign.type]);
      expect(ours.authority.id).toBe(FHD_AUTHORITY[f.humanDesign.authority] ?? f.humanDesign.authority);
    }
  });
});
