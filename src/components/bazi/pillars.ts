/**
 * Les Quatre Piliers en SVG (fonction pure) : une colonne par pilier, de l'année (à gauche, pour une
 * lecture à la française) à l'heure ; tronc céleste en haut, branche terrestre en bas, couleur de l'élément.
 */
import type { BaziResult } from '../../core/bazi/validation.js';
import { esc, f } from '../shared/svg.js';

export const ELEMENT_COLOR: Record<string, string> = { wood: '#3f8f4f', fire: '#c8453a', earth: '#b0812d', metal: '#7d8794', water: '#2f5f9e' };
const ELEMENT_FR: Record<string, string> = { wood: 'Bois', fire: 'Feu', earth: 'Terre', metal: 'Métal', water: 'Eau' };
const PILLAR_FR = { year: 'Année', month: 'Mois', day: 'Jour', hour: 'Heure' } as const;

export function renderBaziPillars(b: BaziResult, options: { width?: number; stemLabel?: (id: string) => string; branchLabel?: (id: string) => string } = {}): string {
  const width = options.width ?? 440;
  const W = 440, H = 300, colW = 100, x0 = 20;
  const out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${f(width)}" height="${f((width * H) / W)}" role="img" aria-label="Quatre piliers du BaZi" font-family="'DejaVu Sans', 'Segoe UI', sans-serif">`);
  out.push(`<rect width="${W}" height="${H}" fill="#fffdf8"/>`);
  (['year', 'month', 'day', 'hour'] as const).forEach((k, i) => {
    const p = b.pillars[k];
    const cx = x0 + colW * i + colW / 2;
    const isDay = k === 'day';
    out.push(`<text x="${f(cx)}" y="24" text-anchor="middle" font-size="12" font-weight="700" fill="#4a4458">${PILLAR_FR[k]}</text>`);
    if (isDay) out.push(`<rect x="${f(cx - 44)}" y="34" width="88" height="250" rx="10" fill="none" stroke="#c8962e" stroke-width="2" stroke-dasharray="4 3"/>`);
    for (const [row, part] of [[0, p.stem], [1, p.branch]] as const) {
      const y = 44 + row * 118;
      const color = ELEMENT_COLOR[part.element]!;
      out.push(`<rect x="${f(cx - 38)}" y="${y}" width="76" height="76" rx="8" fill="${color}" fill-opacity=".12" stroke="${color}" stroke-width="1.6"/>`);
      out.push(`<text x="${f(cx)}" y="${y + 50}" text-anchor="middle" font-size="40" fill="${color}">${esc(part.hanzi)}</text>`);
      const name = row === 0 ? options.stemLabel?.(part.id) ?? part.id : options.branchLabel?.(part.id) ?? part.id;
      out.push(`<text x="${f(cx)}" y="${y + 92}" text-anchor="middle" font-size="10.5" fill="#4a4458">${esc(name)}</text>`);
      out.push(`<text x="${f(cx)}" y="${y + 105}" text-anchor="middle" font-size="9.5" fill="${color}">${ELEMENT_FR[part.element]} ${part.yang ? 'yang' : 'yin'}</text>`);
    }
  });
  out.push(`<text x="${W / 2}" y="${H - 4}" text-anchor="middle" font-size="9.5" fill="#8a8398">Le pilier du jour (encadré) porte le maître du jour.</text>`);
  out.push('</svg>');
  return out.join('');
}
