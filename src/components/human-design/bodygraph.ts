/**
 * BodyGraph en SVG (fonction pure). Canaux : moitié par porte, noir = Personnalité,
 * rouge = Design, rayé = les deux. Colonnes latérales : activations Design (gauche) et Personnalité (droite).
 */
import { CENTERS, CHANNELS, type CenterId } from '../../core/human-design/data.js';
import type { HumanDesignResult } from '../../core/human-design/types.js';
import { esc, f } from '../shared/svg.js';
import { BODY_GLYPHS } from '../astrology/glyphs.js';
import { CENTER_SHAPES, GATE_ANCHORS } from './layout.js';

const DEFINED_FILL: Record<CenterId, string> = {
  head: '#f4d35e', ajna: '#7cb87a', throat: '#b9875a', g: '#f4d35e', heart: '#d9534f',
  spleen: '#b9875a', solarPlexus: '#b9875a', sacral: '#d9534f', root: '#b9875a',
};
const P = '#1d1d1b';
const D = '#c2312d';
const INACTIVE = '#e4e2dc';

export interface BodyGraphOptions {
  width?: number;
  showActivationColumns?: boolean;
}

export function renderBodyGraph(hd: HumanDesignResult, options: BodyGraphOptions = {}): string {
  const cols = options.showActivationColumns ?? true;
  const offsetX = cols ? 92 : 0;
  const vbW = 360 + 2 * offsetX;
  const width = options.width ?? vbW;
  const height = (610 / vbW) * width;
  const pGates = new Set(hd.personality.activations.map((a) => a.gate));
  const dGates = new Set(hd.design.activations.map((a) => a.gate));
  const X = (x: number) => x + offsetX;
  const out: string[] = [];

  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} 610" width="${f(width)}" height="${f(height)}" role="img" aria-label="BodyGraph Human Design" font-family="'DejaVu Sans', 'Segoe UI Symbol', sans-serif">`);
  out.push(`<defs><pattern id="both" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="6" fill="${P}"/><rect x="3" width="3" height="6" fill="${D}"/></pattern></defs>`);
  out.push(`<rect width="${vbW}" height="610" fill="#fff"/>`);

  // Canaux (sous les centres)
  for (const [a, b] of CHANNELS) {
    const [ax, ay] = GATE_ANCHORS[a]!, [bx, by] = GATE_ANCHORS[b]!;
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    out.push(`<line x1="${f(X(ax))}" y1="${f(ay)}" x2="${f(X(bx))}" y2="${f(by)}" stroke="${INACTIVE}" stroke-width="7" stroke-linecap="round"/>`);
    for (const [g, gx, gy] of [[a, ax, ay], [b, bx, by]] as const) {
      const color = pGates.has(g) && dGates.has(g) ? 'url(#both)' : pGates.has(g) ? P : dGates.has(g) ? D : null;
      if (color) out.push(`<line x1="${f(X(gx))}" y1="${f(gy)}" x2="${f(X(mx))}" y2="${f(my)}" stroke="${color}" stroke-width="4" stroke-linecap="butt"/>`);
    }
  }

  // Centres
  for (const c of CENTERS) {
    const shape = CENTER_SHAPES[c];
    const defined = hd.centers[c].defined;
    const pts = shape.points.map(([x, y]) => `${f(X(x))},${y}`).join(' ');
    out.push(`<polygon points="${pts}" fill="${defined ? DEFINED_FILL[c] : '#fff'}" stroke="#4a4842" stroke-width="1.4" stroke-linejoin="round"><title>${esc(shape.label)} : ${defined ? 'défini' : 'ouvert'}</title></polygon>`);
  }

  // Numéros de portes
  for (const [gate, [x, y]] of Object.entries(GATE_ANCHORS)) {
    const g = Number(gate);
    const active = pGates.has(g) || dGates.has(g);
    if (active) out.push(`<circle cx="${f(X(x))}" cy="${y}" r="6.2" fill="#fff" stroke="#4a4842" stroke-width="0.6"/>`);
    out.push(`<text x="${f(X(x))}" y="${y}" font-size="${active ? 7.5 : 6.5}" font-weight="${active ? 700 : 400}" text-anchor="middle" dominant-baseline="central" fill="${active ? '#1d1d1b' : '#6d6a62'}">${g}</text>`);
  }

  // Colonnes d'activations
  if (cols) {
    const column = (side: 'design' | 'personality', x: number, color: string, title: string) => {
      out.push(`<text x="${x}" y="22" font-size="10" font-weight="700" text-anchor="middle" fill="${color}">${title}</text>`);
      hd[side].activations.forEach((a, i) => {
        const y = 44 + i * 30;
        out.push(`<text x="${x - 22}" y="${y}" font-size="14" text-anchor="middle" dominant-baseline="central" fill="${color}">${BODY_GLYPHS[a.point] ?? (a.point === 'earth' ? '⊕︎' : a.point)}</text>`);
        out.push(`<text x="${x + 12}" y="${y}" font-size="12" font-weight="600" text-anchor="middle" dominant-baseline="central" fill="${color}">${a.gate}.${a.line}</text>`);
      });
    };
    column('design', 46, D, 'Design');
    column('personality', vbW - 46, P, 'Personnalité');
  }

  out.push('</svg>');
  return out.join('');
}
