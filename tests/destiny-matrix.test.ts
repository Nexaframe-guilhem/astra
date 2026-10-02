import { describe, expect, it } from 'vitest';
import { calculateDestinyMatrix, destinyMatrixResultSchema, reduceArcana } from '../src/core/destiny-matrix/index.js';

/**
 * Jeux de référence repris de la bibliothèque MIT destiny-matrix/matrix-calculator
 * (tests/MatrixCalculatorTest.php), qui sert de référence de convention pour les formules.
 */
const REFERENCE: Record<string, Record<string, number>> = {
  '1990-12-29': {
    A: 11, B: 12, C: 19, D: 6, E: 12, F: 5, G: 4, H: 17, I: 7, J: 18, K: 4, L: 22, M: 8, N: 4, O: 16, P: 18, Q: 5, R: 6,
    S: 5, T: 6, U: 6, V: 18, W: 17, X: 18, F2: 11, F1: 16, G2: 10, G1: 14, I2: 13, I1: 20, H2: 5, H1: 22,
  },
  '1985-01-03': {
    A: 3, B: 1, C: 5, D: 9, E: 18, F: 4, G: 6, H: 12, I: 14, J: 9, K: 5, L: 14, M: 19, N: 5, O: 6, P: 20, Q: 10, R: 18,
    S: 21, T: 19, U: 9, V: 9, W: 12, X: 10, F2: 13, F1: 17, G2: 15, G1: 21, I2: 5, I1: 19, H2: 21, H1: 6,
  },
};

describe('Matrice du destin', () => {
  it('réduit les sommes aux 22 arcanes', () => {
    expect(reduceArcana(22)).toBe(22);
    expect(reduceArcana(23)).toBe(5);
    expect(reduceArcana(29)).toBe(11);
    expect(reduceArcana(88)).toBe(16);
  });

  for (const [date, expected] of Object.entries(REFERENCE)) {
    it(`concorde avec la bibliothèque de référence pour ${date}`, () => {
      const r = calculateDestinyMatrix({ birthDate: date }, new Date('2026-01-01T00:00:00Z'));
      expect(Object.fromEntries(r.points.map((p) => [p.id, p.value]))).toEqual(expected);
      expect(destinyMatrixResultSchema.safeParse(r).success).toBe(true);
    });
  }

  it('calcule les destinations à partir des lignes ciel/terre et masculine/féminine', () => {
    const r = calculateDestinyMatrix({ birthDate: '1990-12-29' });
    // ciel B+D = 18, terre A+C = 30 -> 3, personnelle 21 ; masculine F+I = 12, féminine G+H = 21, sociale 33 -> 6 ; spirituelle 27 -> 9
    expect(r.purposes).toEqual({ sky: 18, earth: 3, personal: 21, male: 12, female: 21, social: 6, spiritual: 9 });
  });

  it('rattache chaque position à ses clés de contenu', () => {
    const r = calculateDestinyMatrix({ birthDate: '1990-12-29' });
    const byId = Object.fromEntries(r.positions.map((p) => [p.id, p]));
    expect(byId.center!.arcanaContentKey).toBe('destinyMatrix.positionArcana.center.12');
    expect(byId.karmicTail!.values).toEqual([6, 6, 18]);
    expect(byId.karmicTail!.arcanaContentKey).toBeNull();
    for (const p of r.points) expect(p.contentKey).toBe(`destinyMatrix.arcana.${p.value}`);
  });

  it('couvre toutes les dates sans sortir de 1 à 22', () => {
    const d = new Date(Date.UTC(1900, 0, 1));
    for (let i = 0; i < 73000; i += 7) {
      const day = new Date(d.getTime() + i * 86400000).toISOString().slice(0, 10);
      const r = calculateDestinyMatrix({ birthDate: day });
      for (const p of r.points) expect(p.value >= 1 && p.value <= 22).toBe(true);
    }
  });

  it('refuse une date mal formée', () => {
    expect(() => calculateDestinyMatrix({ birthDate: '29/12/1990' })).toThrow();
  });
});
