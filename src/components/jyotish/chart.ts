/**
 * Carte védique en style nord-indien (fonction pure) : losanges fixes pour les 12 bhavas,
 * le lagna en haut au centre, maisons dans le sens inverse des aiguilles d'une montre.
 * Chaque case porte le numéro du signe (1 = Bélier) et les grahas qui l'occupent.
 */
import type { JyotishResult } from '../../core/jyotish/validation.js';
import { esc, f } from '../shared/svg.js';

const INK = '#1f2433';
const LINE = '#b58a3c';
const MUTED = '#8a7a5c';
const LAGNA = '#b5475b';

/** Centre des cases et emplacement du numéro de signe, sur une grille de 400 × 400. */
const HOUSES: Record<number, { c: [number, number]; n: [number, number] }> = {
  1: { c: [200, 95], n: [200, 182] }, 2: { c: [100, 38], n: [100, 90] }, 3: { c: [38, 100], n: [86, 104] },
  4: { c: [100, 200], n: [182, 204] }, 5: { c: [38, 300], n: [86, 304] }, 6: { c: [100, 362], n: [100, 318] },
  7: { c: [200, 305], n: [200, 228] }, 8: { c: [300, 362], n: [300, 318] }, 9: { c: [362, 300], n: [314, 304] },
  10: { c: [300, 200], n: [218, 204] }, 11: { c: [362, 100], n: [314, 104] }, 12: { c: [300, 38], n: [300, 90] },
};

/** Abréviations françaises des grahas. */
export const GRAHA_ABBR: Record<string, string> = {
  sun: 'So', moon: 'Lu', mars: 'Ma', mercury: 'Me', jupiter: 'Ju', venus: 'Ve', saturn: 'Sa', rahu: 'Ra', ketu: 'Ke',
};

export interface JyotishChartOptions { width?: number }

export function renderJyotishChart(j: JyotishResult, options: JyotishChartOptions = {}): string {
  const width = options.width ?? 400;
  const out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 412 412" width="${f(width)}" height="${f(width)}" role="img" aria-label="Carte védique (style nord-indien)" font-family="'DejaVu Sans', 'Segoe UI', sans-serif">`);
  out.push('<rect x="-6" y="-6" width="412" height="412" fill="#fffdf7"/>');
  out.push(`<g fill="none" stroke="${LINE}" stroke-width="1.6"><rect x="0" y="0" width="400" height="400"/><path d="M0 0L400 400M400 0L0 400"/><polygon points="200,0 400,200 200,400 0,200"/></g>`);
  for (let h = 1; h <= 12; h++) {
    const { c: [cx, cy], n: [nx, ny] } = HOUSES[h]!;
    const signNumber = ((j.lagna.signIndex + h - 1) % 12) + 1;
    out.push(`<text x="${f(nx)}" y="${f(ny)}" text-anchor="middle" font-size="10" fill="${MUTED}">${signNumber}</text>`);
    const items: Array<{ text: string; color: string }> = [];
    if (h === 1) items.push({ text: `Asc ${j.lagna.dms.degrees}°`, color: LAGNA });
    for (const g of j.grahas.filter((x) => x.house === h)) {
      const retro = g.retrograde && g.id !== 'rahu' && g.id !== 'ketu' ? 'R' : '';
      items.push({ text: `${GRAHA_ABBR[g.id]}${retro} ${g.dms.degrees}°`, color: INK });
    }
    const cols = items.length > 3 ? 2 : 1;
    const rows = Math.ceil(items.length / cols);
    items.forEach((it, i) => {
      const col = cols === 1 ? 0 : (i % 2) - 0.5;
      const row = cols === 1 ? i : Math.floor(i / 2);
      const x = cx + col * 44;
      const y = cy + (row - (rows - 1) / 2) * 12 + 4;
      out.push(`<text x="${f(x)}" y="${f(y)}" text-anchor="middle" font-size="10.5" font-weight="600" fill="${it.color}">${esc(it.text)}</text>`);
    });
  }
  out.push('</svg>');
  return out.join('');
}
