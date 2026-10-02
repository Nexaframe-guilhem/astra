/**
 * Profil complet : conformité au schéma, déterminisme, et non-régression
 * contre les profils de référence figés (tests/fixtures/golden).
 * Une mise à jour de dépendance qui modifie un résultat fait échouer ce test.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildProfile, buildProfileContext, profileSchema } from '../src/index.js';
import { collectContentKeys } from '../src/content/repository.js';
import { FIXED_NOW, FIXED_REFERENCE_DATE, REFERENCE_CASES } from './fixtures/reference-inputs.js';

const build = (input: unknown) => buildProfile(input, { now: FIXED_NOW, referenceDate: FIXED_REFERENCE_DATE });

describe.each(REFERENCE_CASES)('profil $id', ({ id, input }) => {
  const profile = build(input);

  it('est conforme au schéma 1.0', () => {
    expect(profileSchema.safeParse(profile).success).toBe(true);
    expect(profile.schemaVersion).toBe('1.0');
  });

  it('est déterministe (même entrée => JSON identique)', () => {
    expect(JSON.stringify(build(input))).toBe(JSON.stringify(profile));
  });

  it('enregistre moteur, version et paramètres pour chaque section', () => {
    for (const section of [profile.astrology, profile.humanDesign, profile.numerology]) {
      expect(section.meta).toMatchObject({ schemaVersion: '1.0', calculatedAt: FIXED_NOW.toISOString() });
      expect(section.meta.engineVersion).toMatch(/^\d+\.\d+\.\d+$/);
      expect(section.meta.inputHash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('ne contient que des valeurs et des clés de contenu', () => {
    expect(collectContentKeys(profile).size).toBeGreaterThan(50);
  });

  it('correspond au profil de référence figé (non-régression)', () => {
    const file = new URL(`./fixtures/golden/${id}.json`, import.meta.url);
    expect(existsSync(file), `Fixture manquante : npm run fixtures:update`).toBe(true);
    const golden = JSON.parse(readFileSync(file, 'utf8'));
    // tzdata/ICU peuvent légitimement changer avec Node : comparés via les résultats, pas via la méta.
    const strip = (p: any) => JSON.parse(JSON.stringify(p, (k, v) => (k === 'dependencies' || k === 'inputHash' ? undefined : v)));
    expect(strip(profile)).toEqual(strip(golden));
  });
});

describe('vue chatbot', () => {
  it('produit un contexte compact et sélectionnable', () => {
    const p = build(REFERENCE_CASES[0]!.input);
    const ctx = buildProfileContext(p, ['humanDesign', 'numerology']);
    expect(ctx.astrology).toBeUndefined();
    expect(ctx.humanDesign).toMatchObject({ type: 'manifesting-generator', authority: 'sacral', profile: '2/4' });
    expect(ctx.numerology?.lifePath).toBe(4);
    expect(JSON.stringify(ctx).length).toBeLessThan(2000);
  });
});
