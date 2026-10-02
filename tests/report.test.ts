/** Phase 2 : bilan, figures SVG et catalogue de contenus. */
import { describe, expect, it } from 'vitest';
import { renderAstroWheel } from '../src/components/astrology/wheel.js';
import { renderBodyGraph } from '../src/components/human-design/bodygraph.js';
import { GATE_ANCHORS } from '../src/components/human-design/layout.js';
import { buildContentCatalog } from '../src/content/catalog.js';
import { collectContentKeys } from '../src/content/repository.js';
import { buildProfile } from '../src/core/profile/build-profile.js';
import { buildReport, renderReportHtml } from '../src/reports/index.js';
import { PUBLISHED_CHARTS } from './fixtures/published-charts.js';
import { FIXED_NOW, FIXED_REFERENCE_DATE, REFERENCE_CASES } from './fixtures/reference-inputs.js';

const ALL = [...REFERENCE_CASES, ...PUBLISHED_CHARTS];
const profiles = ALL.map((c) => ({ id: c.id, profile: buildProfile(c.input, { now: FIXED_NOW, referenceDate: FIXED_REFERENCE_DATE }) }));

describe('catalogue de contenus', () => {
  const catalog = new Set(buildContentCatalog().map((e) => e.key));
  it('n’a pas de doublon', () => {
    expect(catalog.size).toBe(buildContentCatalog().length);
  });
  it.each(profiles)('couvre toutes les clés produites par $id', ({ profile }) => {
    const unknown = [...collectContentKeys(profile)].filter((k) => !catalog.has(k));
    expect(unknown).toEqual([]);
  });
});

describe('figures SVG', () => {
  const { profile } = profiles[0]!;
  it('BodyGraph : 9 centres, ancrage pour les 64 portes, colonnes de 13 activations', () => {
    expect(Object.keys(GATE_ANCHORS)).toHaveLength(64);
    const svg = renderBodyGraph(profile.humanDesign);
    expect(svg.match(/<polygon /g)).toHaveLength(9);
    expect(svg).toMatch(/^<svg[^>]+viewBox/);
    for (const a of profile.humanDesign.personality.activations) expect(svg).toContain(`>${a.gate}.${a.line}<`);
  });
  it('roue : 12 signes, 12 cuspides et toutes les planètes', () => {
    const svg = renderAstroWheel(profile.astrology);
    expect(svg.match(/<path /g)).toHaveLength(12);
    for (const id of ['sun', 'moon', 'pluto']) expect(svg).toContain(`<title>${id}</title>`);
  });
});

describe.each(profiles)('bilan $id', ({ profile }) => {
  const prod = buildReport(profile, { now: FIXED_NOW });
  const draft = buildReport(profile, { now: FIXED_NOW, draftMode: true });
  const blocks = (d: typeof prod) => d.sections.flatMap((s) => s.subsections.flatMap((x) => x.blocks));

  it('contient les 5 sections dans l’ordre', () => {
    expect(prod.sections.map((s) => s.id)).toEqual(['identity', 'astrology', 'humanDesign', 'numerology', 'methodology']);
  });
  it('en production, n’affiche que des textes validés (aucun emplacement vide)', () => {
    expect(blocks(prod).filter((b) => b.kind === 'content' && b.status !== 'validated')).toEqual([]);
  });
  it('en relecture, signale les textes manquants avec leur clé', () => {
    const missing = blocks(draft).filter((b) => b.kind === 'content' && b.status === 'missing');
    expect(missing.length).toBeGreaterThan(10);
  });
  it('est déterministe et rattaché au profil source', () => {
    expect(JSON.stringify(buildReport(profile, { now: FIXED_NOW }))).toBe(JSON.stringify(prod));
    expect(prod.profile.inputHash).toBe(profile.meta.inputHash);
  });
  it('HTML autonome : figures intégrées, aucun script, texte échappé', () => {
    const html = renderReportHtml(prod);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html.match(/<svg /g)!.length).toBeGreaterThanOrEqual(2);
    expect(html).not.toMatch(/<script/i);
  });
});

it('le texte saisi par l’utilisateur est échappé dans le HTML', () => {
  const p = buildProfile({ ...REFERENCE_CASES[0]!.input, firstName: '<img src=x onerror=alert(1)>' }, { now: FIXED_NOW });
  const html = renderReportHtml(buildReport(p, { now: FIXED_NOW }));
  expect(html).not.toContain('<img src=x');
  expect(html).toContain('&lt;img');
});
