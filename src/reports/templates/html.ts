/**
 * Rendu HTML autonome et imprimable du bilan (A4). Sert aussi de source pour l'export PDF.
 * Tout le texte provient du ReportDocument ; ce gabarit ne fait que de la mise en page.
 */
import { esc } from '../../components/shared/svg.js';
import type { ReportBlock, ReportDocument } from '../builder/types.js';

function block(b: ReportBlock): string {
  switch (b.kind) {
    case 'facts':
      return `<dl class="facts">${b.items.map((i) => `<div><dt>${esc(i.label)}</dt><dd>${esc(i.value)}</dd></div>`).join('')}</dl>`;
    case 'table':
      return `<table>${b.caption ? `<caption>${esc(b.caption)}</caption>` : ''}<thead><tr>${b.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${b.rows
        .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`;
    case 'figure':
      return `<figure class="fig-${b.figure}">${b.svg}<figcaption>${esc(b.caption)}</figcaption></figure>`;
    case 'notice':
      return `<p class="notice ${b.level}">${esc(b.text)}</p>`;
    case 'content':
      if (b.status === 'missing') return `<aside class="content missing"><h4>${esc(b.title)}</h4><p>Texte pédagogique à rédiger · <code>${esc(b.contentKey)}</code></p></aside>`;
      return `<aside class="content ${b.status}"><h4>${esc(b.title)}</h4>${(b.body ?? '').split(/\n{2,}/).map((p) => `<p>${esc(p)}</p>`).join('')}${b.status === 'draft' ? `<p class="tag">brouillon · ${esc(b.contentKey)} · v${b.version}</p>` : ''}</aside>`;
  }
}

export function renderReportHtml(doc: ReportDocument): string {
  const date = new Date(doc.generatedAt).toLocaleDateString(doc.locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const toc = doc.sections.map((s) => `<li><a href="#${s.id}">${esc(s.title)}</a></li>`).join('');
  const body = doc.sections.map((s) => `
    <section id="${s.id}" class="section">
      <h2>${esc(s.title)}</h2>
      ${s.subsections.map((sub) => `<div class="sub"><h3>${esc(sub.title)}</h3>${sub.blocks.map(block).join('\n')}</div>`).join('\n')}
    </section>`).join('\n');

  return `<!doctype html>
<html lang="${esc(doc.locale)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(doc.title)} · ${esc(doc.subject)}</title>
<style>
  :root { --ink:#1d1d1b; --muted:#6b6962; --line:#e3e1da; --accent:#6a4c93; --paper:#fff; --soft:#f7f5f0; }
  * { box-sizing: border-box; }
  html { background: var(--soft); }
  body { margin: 0 auto; max-width: 860px; padding: 40px 32px 64px; background: var(--paper); color: var(--ink); font: 15px/1.55 Georgia, 'DejaVu Serif', serif; }
  header.cover { border-bottom: 2px solid var(--ink); padding-bottom: 20px; margin-bottom: 24px; }
  header.cover p.kicker { font: 600 12px/1 system-ui, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); margin: 0 0 10px; }
  h1 { font-size: 34px; margin: 0; font-weight: 600; }
  header.cover p.meta { color: var(--muted); margin: 8px 0 0; font: 13px system-ui, sans-serif; }
  nav.toc ol { columns: 2; font: 14px system-ui, sans-serif; padding-left: 20px; }
  nav.toc a { color: var(--ink); text-decoration: none; border-bottom: 1px solid var(--line); }
  h2 { font-size: 26px; font-weight: 600; margin: 40px 0 8px; padding-bottom: 6px; border-bottom: 1px solid var(--ink); }
  h3 { font: 600 13px system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); margin: 28px 0 10px; }
  h4 { font-size: 16px; margin: 0 0 6px; }
  dl.facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin: 12px 0; }
  dl.facts div { border: 1px solid var(--line); border-radius: 6px; padding: 8px 10px; break-inside: avoid; }
  dt { font: 12px system-ui, sans-serif; color: var(--muted); }
  dd { margin: 2px 0 0; font-size: 16px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0 16px; font: 13px/1.4 system-ui, sans-serif; font-variant-numeric: tabular-nums; }
  caption { text-align: left; font-weight: 600; padding: 4px 0; color: var(--muted); }
  th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { font-size: 12px; color: var(--muted); font-weight: 600; }
  tr { break-inside: avoid; }
  figure { margin: 12px 0 20px; text-align: center; break-inside: avoid; }
  figure svg { max-width: 100%; height: auto; }
  figure.fig-bodygraph svg { max-height: 640px; width: auto; }
  figcaption { font: 12px system-ui, sans-serif; color: var(--muted); margin-top: 6px; }
  .notice { font: 13px system-ui, sans-serif; padding: 8px 12px; border-radius: 6px; background: var(--soft); }
  .notice.warning { background: #fff7e6; border: 1px solid #f3d38b; }
  aside.content { border-left: 3px solid var(--accent); padding: 4px 0 4px 14px; margin: 14px 0; break-inside: avoid; }
  aside.content.missing { border-left-color: #c9c5b9; color: var(--muted); font: 13px system-ui, sans-serif; }
  aside.content.missing h4 { font-size: 13px; }
  aside .tag { font: 11px system-ui, sans-serif; color: #9a6700; }
  footer { margin-top: 48px; padding-top: 12px; border-top: 1px solid var(--line); font: 12px system-ui, sans-serif; color: var(--muted); }
  @page { size: A4; margin: 16mm 14mm; }
  @media print {
    html { background: #fff; }
    body { max-width: none; padding: 0; font-size: 11pt; }
    .section { break-before: page; }
    #identity { break-before: auto; }
    nav.toc { break-after: page; }
  }
</style>
</head>
<body>
<header class="cover">
  <p class="kicker">${esc(doc.title)}</p>
  <h1>${esc(doc.subject)}</h1>
  <p class="meta">Généré le ${esc(date)} · bilan v${esc(doc.reportVersion)} · profil ${esc(doc.profile.schemaVersion)} · ${esc(doc.profile.inputHash.slice(0, 12))}</p>
</header>
<nav class="toc"><ol>${toc}</ol></nav>
${body}
<footer>Bilan compilé à partir de calculs déterministes et de contenus validés par l’école. Textes utilisés : ${doc.contentUsed.length}.</footer>
</body>
</html>`;
}
