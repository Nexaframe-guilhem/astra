/** Petits utilitaires SVG sans dépendance (rendu serveur, intégrable partout : Webflow, PDF, e-mail). */

export const esc = (s: string | number): string =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const f = (n: number): string => (Math.round(n * 100) / 100).toString();

export function attrs(a: Record<string, string | number | undefined>): string {
  return Object.entries(a)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}="${esc(v as string | number)}"`)
    .join(' ');
}

/** Variation selector U+FE0E : force le rendu texte (et non emoji) des glyphes astrologiques. */
export const TEXT_VS = '︎';
