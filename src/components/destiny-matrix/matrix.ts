/**
 * Schéma de la Matrice du destin en SVG (fonction pure) : carré personnel (A, B, C, D),
 * carré ancestral tourné à 45° (F, G, H, I), centre E, points intérieurs sur chaque axe
 * et canal relations/argent (K, L, M) entre J et N.
 */
import type { DestinyMatrixResult } from '../../core/destiny-matrix/validation.js';
import { esc, f } from '../shared/svg.js';

const INK = '#1f2433';
const PERSONAL = '#7a4fb5';
const ANCESTRAL = '#2f7d8c';
const CENTER = '#c8962e';
const CHANNEL = '#b5475b';
const LINE = '#c9c4d6';

/** Positions sur une grille de 400 × 400 centrée en (200, 200). */
const R_OUT = 160;
const DIAG = R_OUT / Math.SQRT2;
const at = (angleDeg: number, r: number): [number, number] => {
  const a = (angleDeg * Math.PI) / 180;
  return [200 + r * Math.cos(a), 200 - r * Math.sin(a)];
};
const LAYOUT: Record<string, { xy: [number, number]; size: number; color: string }> = {
  A: { xy: at(180, R_OUT), size: 19, color: PERSONAL }, O: { xy: at(180, 122), size: 13, color: PERSONAL }, S: { xy: at(180, 86), size: 12, color: PERSONAL }, W: { xy: at(180, 50), size: 10, color: PERSONAL },
  B: { xy: at(90, R_OUT), size: 19, color: PERSONAL }, P: { xy: at(90, 122), size: 13, color: PERSONAL }, T: { xy: at(90, 86), size: 12, color: PERSONAL }, X: { xy: at(90, 50), size: 10, color: PERSONAL },
  C: { xy: at(0, R_OUT), size: 19, color: PERSONAL }, Q: { xy: at(0, 122), size: 13, color: PERSONAL }, N: { xy: at(0, 86), size: 12, color: PERSONAL },
  D: { xy: at(270, R_OUT), size: 19, color: PERSONAL }, R: { xy: at(270, 122), size: 13, color: PERSONAL }, J: { xy: at(270, 86), size: 12, color: PERSONAL },
  F: { xy: at(135, R_OUT), size: 17, color: ANCESTRAL }, F1: { xy: at(135, 122), size: 11, color: ANCESTRAL }, F2: { xy: at(135, 90), size: 10, color: ANCESTRAL },
  G: { xy: at(45, R_OUT), size: 17, color: ANCESTRAL }, G1: { xy: at(45, 122), size: 11, color: ANCESTRAL }, G2: { xy: at(45, 90), size: 10, color: ANCESTRAL },
  H: { xy: at(225, R_OUT), size: 17, color: ANCESTRAL }, H1: { xy: at(225, 122), size: 11, color: ANCESTRAL }, H2: { xy: at(225, 90), size: 10, color: ANCESTRAL },
  I: { xy: at(315, R_OUT), size: 17, color: ANCESTRAL }, I1: { xy: at(315, 122), size: 11, color: ANCESTRAL }, I2: { xy: at(315, 98), size: 10, color: ANCESTRAL },
  E: { xy: [200, 200], size: 22, color: CENTER },
  U: { xy: [168, 232], size: 10, color: ANCESTRAL }, V: { xy: [232, 168], size: 10, color: CENTER },
  K: { xy: [221, 265], size: 11, color: CHANNEL }, L: { xy: [243, 243], size: 12, color: CHANNEL }, M: { xy: [265, 221], size: 11, color: CHANNEL },
};

export interface MatrixFigureOptions { width?: number }

export function renderDestinyMatrix(m: DestinyMatrixResult, options: MatrixFigureOptions = {}): string {
  const width = options.width ?? 400;
  const value = Object.fromEntries(m.points.map((p) => [p.id, p.value]));
  const xy = (id: string) => LAYOUT[id]!.xy;
  const line = (a: [number, number], b: [number, number], stroke = LINE, w = 1.2) =>
    `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${stroke}" stroke-width="${w}"/>`;
  const out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${f(width)}" height="${f(width)}" role="img" aria-label="Matrice du destin" font-family="'DejaVu Sans', 'Segoe UI', sans-serif">`);
  out.push('<rect width="400" height="400" fill="#fff"/>');
  // Carrés, axes et diagonales
  out.push(`<polygon points="${['A', 'B', 'C', 'D'].map((k) => xy(k).map(f).join(',')).join(' ')}" fill="none" stroke="${PERSONAL}" stroke-opacity=".45" stroke-width="1.5"/>`);
  out.push(`<polygon points="${['F', 'G', 'I', 'H'].map((k) => xy(k).map(f).join(',')).join(' ')}" fill="none" stroke="${ANCESTRAL}" stroke-opacity=".45" stroke-width="1.5"/>`);
  for (const [a, b] of [['A', 'C'], ['B', 'D'], ['F', 'I'], ['G', 'H']]) out.push(line(xy(a!), xy(b!)));
  out.push(line(xy('J'), xy('N'), CHANNEL, 1.4));
  // Points
  for (const [id, { xy: [x, y], size, color }] of Object.entries(LAYOUT)) {
    const v = value[id];
    if (v === undefined) continue;
    const main = size >= 17;
    out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${size}" fill="${main ? color : '#fff'}" stroke="${color}" stroke-width="1.6"/>`);
    out.push(`<text x="${f(x)}" y="${f(y + size * 0.36)}" text-anchor="middle" font-size="${f(size * 0.95)}" font-weight="${main ? 700 : 600}" fill="${main ? '#fff' : INK}">${esc(v)}</text>`);
  }
  // Repères des points principaux
  const tags: Array<[string, string, number, number]> = [['A', 'A · jour', -2, 32], ['B', 'B · mois', 0, -26], ['C', 'C · année', 2, 32], ['D', 'D', 0, 33], ['E', 'E', 0, 36]];
  for (const [id, text, dx, dy] of tags) {
    const [x, y] = xy(id);
    out.push(`<text x="${f(x + dx)}" y="${f(y + dy)}" text-anchor="middle" font-size="9.5" fill="#6b6578">${esc(text)}</text>`);
  }
  out.push(`<text x="226" y="289" font-size="8.5" fill="${CHANNEL}">relations</text>`);
  out.push(`<text x="280" y="238" font-size="8.5" fill="${CHANNEL}">argent</text>`);
  out.push('</svg>');
  return out.join('');
}
