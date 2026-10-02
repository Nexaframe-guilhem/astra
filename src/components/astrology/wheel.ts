/**
 * Roue du thème natal en SVG (fonction pure : données normalisées -> chaîne SVG).
 * Convention de lecture : Ascendant à gauche, maisons dans le sens inverse des aiguilles d'une montre.
 */
import type { AstrologyResult } from '../../core/astrology/types.js';
import { SIGNS, elementOf } from '../../core/shared/zodiac.js';
import { esc, f } from '../shared/svg.js';
import { BODY_GLYPHS, SIGN_GLYPHS } from './glyphs.js';

export interface WheelOptions {
  size?: number;
  /** Points affichés (dans cet ordre). */
  bodies?: string[];
  showAspects?: boolean;
}

const ELEMENT_FILL: Record<string, string> = { fire: '#fbe3dc', earth: '#e9efdc', air: '#fdf6d8', water: '#dfeaf6' };
const ASPECT_STYLE: Record<string, { stroke: string; dash?: string }> = {
  conjunction: { stroke: '#8a8a8a' },
  sextile: { stroke: '#2f6fb3', dash: '4 3' },
  trine: { stroke: '#2f6fb3' },
  square: { stroke: '#c2412d' },
  opposition: { stroke: '#c2412d', dash: '6 3' },
};

export function renderAstroWheel(astro: AstrologyResult, options: WheelOptions = {}): string {
  const size = options.size ?? 560;
  const c = size / 2;
  const R = { outer: c - 6, zodiacIn: c - 46, houseIn: c - 150, planet: c - 82, aspect: c - 160 };
  const asc = astro.angles.ascendant.longitude;
  const ang = (lon: number) => ((180 + lon - asc) * Math.PI) / 180;
  const pt = (lon: number, r: number) => [c + r * Math.cos(ang(lon)), c - r * Math.sin(ang(lon))] as const;
  const out: string[] = [];

  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Roue du thème natal" font-family="'DejaVu Sans', 'Segoe UI Symbol', 'Noto Sans Symbols', sans-serif">`);
  out.push(`<rect width="${size}" height="${size}" fill="#fff"/>`);

  // Anneau zodiacal
  SIGNS.forEach((sign, i) => {
    const a0 = i * 30, a1 = a0 + 30;
    const [x0, y0] = pt(a0, R.outer), [x1, y1] = pt(a1, R.outer);
    const [x2, y2] = pt(a1, R.zodiacIn), [x3, y3] = pt(a0, R.zodiacIn);
    out.push(`<path d="M${f(x0)} ${f(y0)} A${R.outer} ${R.outer} 0 0 0 ${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} A${R.zodiacIn} ${R.zodiacIn} 0 0 1 ${f(x3)} ${f(y3)} Z" fill="${ELEMENT_FILL[elementOf(sign)]}" stroke="#b9b6ad" stroke-width="0.8"/>`);
    const [gx, gy] = pt(a0 + 15, (R.outer + R.zodiacIn) / 2);
    out.push(`<text x="${f(gx)}" y="${f(gy)}" font-size="20" text-anchor="middle" dominant-baseline="central" fill="#3b3a36">${SIGN_GLYPHS[sign]}</text>`);
    for (let d = 5; d < 30; d += 5) {
      const [tx0, ty0] = pt(a0 + d, R.zodiacIn), [tx1, ty1] = pt(a0 + d, R.zodiacIn + (d % 10 === 0 ? 7 : 4));
      out.push(`<line x1="${f(tx0)}" y1="${f(ty0)}" x2="${f(tx1)}" y2="${f(ty1)}" stroke="#b9b6ad" stroke-width="0.6"/>`);
    }
  });
  out.push(`<circle cx="${c}" cy="${c}" r="${R.houseIn}" fill="#fff" stroke="#b9b6ad"/>`);
  out.push(`<circle cx="${c}" cy="${c}" r="${R.aspect}" fill="#fafaf8" stroke="#d8d6cf"/>`);

  // Maisons
  astro.houses.forEach((h, i) => {
    const angular = i % 3 === 0;
    const [x0, y0] = pt(h.longitude, R.zodiacIn), [x1, y1] = pt(h.longitude, R.aspect);
    out.push(`<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${angular ? '#3b3a36' : '#a9a69c'}" stroke-width="${angular ? 1.6 : 0.8}"/>`);
    const next = astro.houses[(i + 1) % 12]!.longitude;
    const span = ((next - h.longitude) % 360 + 360) % 360;
    const [nx, ny] = pt(h.longitude + span / 2, R.aspect + 12);
    out.push(`<text x="${f(nx)}" y="${f(ny)}" font-size="10" text-anchor="middle" dominant-baseline="central" fill="#8a877e">${h.house}</text>`);
  });

  // Axes ASC / MC
  for (const [label, lon] of [['AC', asc], ['MC', astro.angles.midheaven.longitude]] as const) {
    const [x, y] = pt(lon, R.outer + 0);
    const [lx, ly] = pt(lon, R.zodiacIn - 10);
    out.push(`<line x1="${f(x)}" y1="${f(y)}" x2="${f(lx)}" y2="${f(ly)}" stroke="#1d1d1b" stroke-width="2"/>`);
    const [tx, ty] = pt(lon, R.zodiacIn - 20);
    out.push(`<text x="${f(tx)}" y="${f(ty)}" font-size="11" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="#1d1d1b">${label}</text>`);
  }

  // Aspects
  const ids = options.bodies ?? ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northNode'];
  const lonOf = (id: string) => (id === 'ascendant' ? asc : id === 'midheaven' ? astro.angles.midheaven.longitude : astro.bodies[id]?.longitude);
  if (options.showAspects ?? true) {
    for (const a of astro.aspects) {
      if (a.type === 'conjunction') continue;
      const la = lonOf(a.a), lb = lonOf(a.b);
      if (la === undefined || lb === undefined) continue;
      const [x0, y0] = pt(la, R.aspect), [x1, y1] = pt(lb, R.aspect);
      const st = ASPECT_STYLE[a.type]!;
      out.push(`<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${st.stroke}" stroke-width="${a.orb < 2 ? 1.4 : 0.8}" ${st.dash ? `stroke-dasharray="${st.dash}"` : ''} opacity="0.85"/>`);
    }
  }

  // Planètes, avec écartement des glyphes trop proches (l'aiguille garde la position exacte)
  const placed = ids
    .filter((id) => astro.bodies[id])
    .map((id) => ({ id, lon: astro.bodies[id]!.longitude, shown: astro.bodies[id]!.longitude }))
    .sort((a, b) => a.lon - b.lon);
  const minGap = 8;
  for (let pass = 0; pass < 20; pass++) {
    let moved = false;
    for (let i = 0; i < placed.length; i++) {
      const p = placed[i]!, q = placed[(i + 1) % placed.length]!;
      if (p === q) break;
      const gap = ((q.shown - p.shown) % 360 + 360) % 360;
      if (gap < minGap) {
        const push = (minGap - gap) / 2;
        p.shown -= push;
        q.shown += push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  for (const p of placed) {
    const b = astro.bodies[p.id]!;
    const [x0, y0] = pt(p.lon, R.zodiacIn), [x1, y1] = pt(p.lon, R.zodiacIn - 8);
    out.push(`<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="#1d1d1b" stroke-width="1.2"/>`);
    const [gx, gy] = pt(p.shown, R.planet);
    out.push(`<text x="${f(gx)}" y="${f(gy)}" font-size="19" text-anchor="middle" dominant-baseline="central" fill="#1d1d1b"><title>${esc(p.id)}</title>${BODY_GLYPHS[p.id]}</text>`);
    const [dx, dy] = pt(p.shown, R.planet - 24);
    out.push(`<text x="${f(dx)}" y="${f(dy)}" font-size="9" text-anchor="middle" dominant-baseline="central" fill="#5c5a53">${b.dms.degrees}°${String(b.dms.minutes).padStart(2, '0')}${b.retrograde ? ' R' : ''}</text>`);
  }

  out.push('</svg>');
  return out.join('');
}
