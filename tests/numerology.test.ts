/** Numérologie : cas calculés à la main, conventions configurables. */
import { describe, expect, it } from 'vitest';
import { calculateNumerology } from '../src/core/numerology/index.js';
import { normalizeNameParts, reduce } from '../src/core/numerology/engine.js';
import { NUMEROLOGY_PRESETS } from '../src/core/numerology/presets.js';
import type { NumerologySettings } from '../src/core/numerology/types.js';

const S: NumerologySettings = { ...NUMEROLOGY_PRESETS['astra-standard'], masterNumbers: [11, 22, 33], karmicDebtNumbers: [13, 14, 16, 19] };

const jean = { firstName: 'Jean', lastName: 'Dupont', birthDate: '1990-06-15', referenceDate: '2026-10-02' };

describe('réduction', () => {
  it('préserve les nombres maîtres si configuré', () => {
    expect(reduce(29, S)).toMatchObject({ value: 11, chain: [29, 11], isMaster: true });
    expect(reduce(29, { ...S, preserveMasterNumbers: false }).value).toBe(2);
    expect(reduce(38, S).value).toBe(11);
  });
  it('détecte les dettes karmiques dans la chaîne', () => {
    expect(reduce(13, S).karmicDebt).toBe(13);
    expect(reduce(49, S)).toMatchObject({ chain: [49, 13, 4], karmicDebt: 13 });
    expect(reduce(28, S).karmicDebt).toBeNull();
  });
});

describe('normalisation des noms', () => {
  it('accents, ligatures, tirets et apostrophes', () => {
    expect(normalizeNameParts("Hélène-Œdipe D'Arcy", S)).toEqual(['HELENEOEDIPE', 'DARCY']);
    expect(normalizeNameParts('Jean-Pierre', { ...S, ignoreHyphens: false })).toEqual(['JEAN', 'PIERRE']);
    expect(normalizeNameParts('François Müller', S)).toEqual(['FRANCOIS', 'MULLER']);
  });
});

describe('Jean Dupont, 15/06/1990 (calcul manuel, méthode pythagoricienne)', () => {
  const r = calculateNumerology(jean);
  // JEAN = 1+5+1+5 = 12 -> 3 ; DUPONT = 4+3+7+6+5+2 = 27 -> 9 ; 3 + 9 = 12 -> 3
  it('Expression 3', () => expect(r.expression).toMatchObject({ value: 3, compound: 12 }));
  // Voyelles : E+A = 6 ; U+O = 9 ; 15 -> 6
  it('Élan spirituel 6', () => expect(r.soulUrge.value).toBe(6));
  // Consonnes : J+N = 6 ; D+P+N+T = 18 -> 9 ; 15 -> 6
  it('Personnalité 6', () => expect(r.personality.value).toBe(6));
  // 6 + 6 + (1990 -> 19 -> 10 -> 1) = 13 -> 4, dette karmique 13
  it('Chemin de vie 4 avec dette karmique 13', () => {
    expect(r.lifePath).toMatchObject({ value: 4, compound: 13, karmicDebt: 13 });
    expect(r.karmicDebt).toContainEqual(expect.objectContaining({ number: 13, source: 'lifePath' }));
  });
  it('Maturité 7, Jour de naissance 6', () => {
    expect(r.maturity.value).toBe(7);
    expect(r.birthday).toMatchObject({ value: 6, day: 15 });
  });
  // AP = 6 + 6 + (2026 -> 10 -> 1) = 13 -> 4 ; MP = 4 + 10 -> 1 = 5 ; JP = 5 + 2 = 7
  it('Cycles personnels au 02/10/2026', () => {
    expect(r.personalCycles.personalYear.value).toBe(4);
    expect(r.personalCycles.personalMonth.value).toBe(5);
    expect(r.personalCycles.personalDay.value).toBe(7);
  });
  it('Leçons karmiques : 8 et 9 absents du nom', () => {
    expect(r.karmicLessons.map((k) => k.number)).toEqual([8, 9]);
  });
  it('Réalisations : 3, 7, 1, 7 ; première jusqu’à 32 ans (36 - 4)', () => {
    expect(r.cycles.pinnacles.map((p) => p.value)).toEqual([3, 7, 1, 7]);
    expect(r.cycles.pinnacles[0]!.toAge).toBe(32);
    expect(r.cycles.challenges.map((c) => c.value)).toEqual([0, 5, 5, 5]);
  });
  it('clés de contenu sans texte', () => {
    expect(r.lifePath.contentKey).toBe('numerology.lifePath.4');
    expect(JSON.stringify(r)).not.toMatch(/signifie|means/);
  });
});

describe('conventions configurables', () => {
  it('nombre maître au chemin de vie : 29/11/1987 -> 11', () => {
    const r = calculateNumerology({ ...jean, birthDate: '1987-11-29' });
    // 11 (maître) + 11 (29 -> 11) + (1987 -> 25 -> 7) = 29 -> 11
    expect(r.lifePath).toMatchObject({ value: 11, isMaster: true });
    expect(r.masterNumbers).toContainEqual({ number: 11, source: 'lifePath' });
  });
  it('méthode "tous les chiffres" vs "composantes"', () => {
    const allDigits = calculateNumerology({ ...jean, birthDate: '1987-11-29' }, { lifePathMethod: 'allDigits' });
    // 1+9+8+7+1+1+2+9 = 38 -> 11
    expect(allDigits.lifePath).toMatchObject({ compound: 38, value: 11 });
  });
  it('Y voyelle ou consonne', () => {
    const lynn = { ...jean, firstName: 'Lynn', lastName: 'Young' };
    const always = calculateNumerology(lynn, { yAsVowel: 'always' });
    const never = calculateNumerology(lynn, { yAsVowel: 'never' });
    const contextual = calculateNumerology(lynn, { yAsVowel: 'contextual' });
    // LYNN : Y = 7 voyelle ; YOUNG : Y suivi de O -> consonne en mode contextuel
    expect(always.soulUrge.compound).not.toBe(never.soulUrge.compound);
    expect(contextual.soulUrge.value).toBe(reduce(reduce(7, S).value + reduce(6 + 3, S).value, S).value);
  });
  it('méthode chaldéenne', () => {
    const r = calculateNumerology(jean, { method: 'chaldean' });
    // JEAN = 1+5+1+5 = 12 -> 3 ; DUPONT = 4+6+8+7+5+4 = 34 -> 7 ; 10 -> 1
    expect(r.expression.value).toBe(1);
    expect(r.method).toBe('chaldean');
  });
  it('nom de naissance prioritaire et prénoms secondaires', () => {
    const r = calculateNumerology({ ...jean, middleNames: 'Marie', birthLastName: 'Martin' });
    expect(r.normalizedName.parts).toEqual(['JEAN', 'MARIE', 'MARTIN']);
    const r2 = calculateNumerology({ ...jean, middleNames: 'Marie', birthLastName: 'Martin' }, { includeMiddleNames: false, useBirthLastName: false });
    expect(r2.normalizedName.parts).toEqual(['JEAN', 'DUPONT']);
  });
});

describe('conventions nommées', () => {
  it('la convention est tracée dans la méta', () => {
    expect(calculateNumerology(jean).meta.settings).toMatchObject({ convention: 'astra-standard', customized: false });
    expect(calculateNumerology(jean, { preset: 'decoz' }).meta.settings).toMatchObject({ convention: 'decoz', yAsVowel: 'contextual' });
    expect(calculateNumerology(jean, { preset: 'decoz', masterNumbers: [11, 22] }).meta.settings).toMatchObject({ customized: true });
  });
  it('« simple » : somme de tous les chiffres et Y consonne', () => {
    const r = calculateNumerology({ ...jean, birthDate: '1987-11-29' }, { preset: 'simple' });
    expect(r.lifePath).toMatchObject({ compound: 38, value: 11 });
  });
  it('convention inconnue refusée', () => {
    expect(() => calculateNumerology(jean, { preset: 'inconnue' as never })).toThrowError(/inconnue/);
  });
});
