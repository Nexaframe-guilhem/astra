/** Tables de correspondance lettres -> nombres. */
export type NumerologyMethod = 'pythagorean' | 'chaldean';

const PYTHAGOREAN: Record<string, number> = Object.fromEntries(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l, i) => [l, (i % 9) + 1]),
);

const CHALDEAN: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1, J: 1, K: 2, L: 3, M: 4,
  N: 5, O: 7, P: 8, Q: 1, R: 2, S: 3, T: 4, U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7,
};

export const ALPHABETS: Record<NumerologyMethod, Record<string, number>> = {
  pythagorean: PYTHAGOREAN,
  chaldean: CHALDEAN,
};

export const BASE_VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
