/**
 * Matrice du destin (22 arcanes) : calcul pur à partir de la date de naissance.
 *
 * Convention « astra-matrix » : formules des points identiques à la bibliothèque MIT
 * destiny-matrix/matrix-calculator (vérifiée sur ses jeux de test), avec une réduction
 * répétée tant que la somme dépasse 22 (identique en pratique : aucune somme n'atteint 100).
 * Lettres des points : A gauche (jour), B haut (mois), C droite (année), D bas, E centre ;
 * F, G, H, I coins du carré ancestral (F = A+B haut-gauche, G = B+C haut-droite,
 * H = D+A bas-gauche, I = C+D bas-droite).
 */

export const ARCANA_COUNT = 22;

/** Réduit une somme à un arcane de 1 à 22 en additionnant ses chiffres. */
export function reduceArcana(n: number): number {
  let v = n;
  while (v > ARCANA_COUNT) v = String(v).split('').reduce((s, d) => s + Number(d), 0);
  return v;
}

export const POINT_IDS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
  'F1', 'F2', 'G1', 'G2', 'H1', 'H2', 'I1', 'I2',
] as const;
export type PointId = (typeof POINT_IDS)[number];

export interface RawMatrix {
  points: Record<PointId, number>;
  /** Formule de chaque point, pour l'audit (ex. « A+B »). */
  formulas: Record<PointId, string>;
  purposes: { sky: number; earth: number; personal: number; male: number; female: number; social: number; spiritual: number };
}

export function computeMatrixRaw(day: number, month: number, year: number): RawMatrix {
  const r = reduceArcana;
  const p = {} as Record<PointId, number>;
  const formulas = {} as Record<PointId, string>;
  const set = (id: PointId, value: number, formula: string) => { p[id] = value; formulas[id] = formula; };
  const yearDigits = String(year).split('').reduce((s, d) => s + Number(d), 0);

  set('A', r(day), 'jour');
  set('B', month, 'mois');
  set('C', r(yearDigits), 'somme des chiffres de l’année');
  set('D', r(p.A + p.B + p.C), 'A+B+C');
  set('E', r(p.A + p.B + p.C + p.D), 'A+B+C+D');
  set('F', r(p.A + p.B), 'A+B');
  set('G', r(p.B + p.C), 'B+C');
  set('H', r(p.D + p.A), 'D+A');
  set('I', r(p.C + p.D), 'C+D');
  set('J', r(p.D + p.E), 'D+E');
  set('N', r(p.C + p.E), 'C+E');
  set('L', r(p.J + p.N), 'J+N');
  set('M', r(p.L + p.N), 'L+N');
  set('K', r(p.J + p.L), 'J+L');
  set('Q', r(p.N + p.C), 'N+C');
  set('R', r(p.J + p.D), 'J+D');
  set('S', r(p.A + p.E), 'A+E');
  set('T', r(p.B + p.E), 'B+E');
  set('O', r(p.A + p.S), 'A+S');
  set('P', r(p.B + p.T), 'B+T');
  set('U', r(p.F + p.G + p.H + p.I), 'F+G+H+I');
  set('V', r(p.E + p.U), 'E+U');
  set('W', r(p.S + p.E), 'S+E');
  set('X', r(p.T + p.E), 'T+E');
  for (const c of ['F', 'G', 'H', 'I'] as const) {
    set(`${c}2` as PointId, r(p[c] + p.U), `${c}+U`);
    set(`${c}1` as PointId, r(p[c] + p[`${c}2` as PointId]), `${c}+${c}2`);
  }

  // Destinations : ciel (axe vertical), terre (axe horizontal), lignes masculine (F–I) et féminine (G–H).
  const sky = r(p.B + p.D), earth = r(p.A + p.C), male = r(p.F + p.I), female = r(p.G + p.H);
  const personal = r(sky + earth), social = r(male + female);
  return { points: p, formulas, purposes: { sky, earth, personal, male, female, social, spiritual: r(personal + social) } };
}
