/**
 * Génère un bilan HTML (et PDF si --pdf) pour un profil de référence ou une saisie JSON.
 * Usage : npm run report -- toulouse-1990 [--draft] [--pdf]
 *         npm run report -- '{"firstName":...}' --pdf
 * Le PDF est produit par Chromium (impression du HTML) : en production, un service
 * de rendu serveur (Playwright/Chromium) suivra exactement la même voie.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { buildProfile, buildReport, renderReportHtml } from '../src/index.js';
import { PUBLISHED_CHARTS } from '../tests/fixtures/published-charts.js';
import { REFERENCE_CASES } from '../tests/fixtures/reference-inputs.js';

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--')) ?? 'toulouse-1990';
const draftMode = args.includes('--draft');
const known = [...REFERENCE_CASES, ...PUBLISHED_CHARTS].find((c) => c.id === target);
const input = known ? known.input : JSON.parse(target);
const name = known ? known.id : 'bilan';

const profile = buildProfile(input);
const html = renderReportHtml(buildReport(profile, { draftMode }));
mkdirSync('out', { recursive: true });
writeFileSync(`out/${name}.html`, html);
console.log(`out/${name}.html`);

if (args.includes('--pdf')) {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({ path: `out/${name}.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await browser.close();
  console.log(`out/${name}.pdf`);
}
