/**
 * Contrôle croisé pour l'interface de développement : compare nos résultats à des
 * implémentations indépendantes (devDependencies uniquement, jamais en production).
 */
import { createRequire } from 'node:module';
import type { Profile } from '../core/profile/schema.js';
import { separation } from '../core/shared/angles.js';

const require = createRequire(import.meta.url);

export interface CrossCheckRow {
  section: 'astrology' | 'humanDesign';
  reference: string;
  field: string;
  ours: string | number;
  theirs: string | number;
  delta?: number;
  ok: boolean;
  note?: string;
}

export async function crossCheck(profile: Profile): Promise<CrossCheckRow[]> {
  const rows: CrossCheckRow[] = [];
  const b = profile.birth;

  // --- Astrologie vs circular-natal-horoscope-js (Moshier) ---
  const { Origin, Horoscope } = require('circular-natal-horoscope-js');
  const probe = new Origin({ year: 2000, month: 0, date: 1, hour: 12, minute: 0, latitude: b.latitude, longitude: b.longitude });
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: probe.timezone.name, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
      .formatToParts(new Date(b.utc)).map((p) => [p.type, Number(p.value)]),
  ) as Record<string, number>;
  const origin = new Origin({ year: parts.year, month: parts.month! - 1, date: parts.day, hour: parts.hour, minute: parts.minute, latitude: b.latitude, longitude: b.longitude });
  const h = new Horoscope({ origin, houseSystem: profile.astrology.houseSystem === 'whole-sign' ? 'whole-sign' : 'placidus', zodiac: 'tropical', language: 'en' });
  const ref = 'circular-natal-horoscope-js';
  for (const body of h.CelestialBodies.all as any[]) {
    const ours = profile.astrology.bodies[body.key];
    if (!ours) continue;
    const theirs = body.ChartPosition.Ecliptic.DecimalDegrees as number;
    const delta = separation(ours.longitude, theirs);
    rows.push({ section: 'astrology', reference: ref, field: body.key, ours: ours.longitude, theirs, delta, ok: delta < 0.02 });
  }
  for (const [field, ours, theirs] of [
    ['ascendant', profile.astrology.angles.ascendant.longitude, h.Ascendant.ChartPosition.Ecliptic.DecimalDegrees],
    ['midheaven', profile.astrology.angles.midheaven.longitude, h.Midheaven.ChartPosition.Ecliptic.DecimalDegrees],
  ] as const) {
    const delta = separation(ours, theirs);
    rows.push({ section: 'astrology', reference: ref, field, ours, theirs, delta, ok: delta < 0.05 });
  }
  (h.Houses as any[]).forEach((house, i) => {
    const ours = profile.astrology.houses[i]!.longitude;
    const theirs = house.ChartPosition.StartPosition.Ecliptic.DecimalDegrees as number;
    const delta = separation(ours, theirs);
    rows.push({ section: 'astrology', reference: ref, field: `house ${i + 1}`, ours, theirs, delta, ok: delta < 0.5, note: profile.astrology.houseSystem === 'placidus' ? 'Placidus approximé côté référence' : undefined });
  });

  // --- Human Design vs natalengine (même éphéméride) et free-human-design (astronomia) ---
  const { calculateHumanDesign } = await import('natalengine');
  const [hh, mm] = b.time.split(':').map(Number) as [number, number];
  const ne: any = calculateHumanDesign(b.date, hh + mm / 60, b.utcOffsetMinutes / 60);
  const hd = profile.humanDesign;
  const typeOf: Record<string, string> = { Generator: 'generator', 'Manifesting Generator': 'manifesting-generator', Manifestor: 'manifestor', Projector: 'projector', Reflector: 'reflector' };
  const neChannels = ne.channels.map((c: any) => [...c.gates].sort((x: number, y: number) => x - y).join('-')).sort().join(', ');
  const ourChannels = hd.channels.map((c) => c.id).sort().join(', ');
  rows.push({ section: 'humanDesign', reference: 'natalengine', field: 'type', ours: hd.type.id, theirs: typeOf[ne.type.name] ?? ne.type.name, ok: typeOf[ne.type.name] === hd.type.id });
  rows.push({ section: 'humanDesign', reference: 'natalengine', field: 'profile', ours: hd.profile.id, theirs: ne.profile.numbers, ok: hd.profile.id === ne.profile.numbers });
  rows.push({ section: 'humanDesign', reference: 'natalengine', field: 'channels', ours: ourChannels, theirs: neChannels, ok: ourChannels === neChannels });
  rows.push({ section: 'humanDesign', reference: 'natalengine', field: 'authority', ours: hd.authority.id, theirs: ne.authority.name, ok: true, note: 'libellés différents, comparer visuellement' });

  const fhd = require('free-human-design');
  const f = fhd.computeChart({ birthdate: b.date, birthtime: b.time, timezone: b.timezone });
  rows.push({ section: 'humanDesign', reference: 'free-human-design', field: 'type', ours: hd.type.id, theirs: typeOf[f.humanDesign.type] ?? f.humanDesign.type, ok: typeOf[f.humanDesign.type] === hd.type.id });
  rows.push({ section: 'humanDesign', reference: 'free-human-design', field: 'profile', ours: hd.profile.id, theirs: f.humanDesign.profile, ok: hd.profile.id === f.humanDesign.profile });
  for (const side of ['personality', 'design'] as const) {
    for (const t of f.humanDesign.activations[side] as any[]) {
      const point = String(t.body).replace('north_node', 'northNode').replace('south_node', 'southNode');
      const a = hd[side].activations.find((x) => x.point === point);
      if (!a) continue;
      const isNode = point.endsWith('Node');
      rows.push({
        section: 'humanDesign', reference: 'free-human-design', field: `${side}.${point}`,
        ours: `${a.gate}.${a.line}`, theirs: `${t.gate}.${t.line}`, delta: separation(a.longitude, t.longitude),
        ok: a.gate === t.gate && a.line === t.line,
        note: isNode ? 'nœud vrai : série de Meeus côté référence, osculateur chez nous'
          : a.gateBoundaryDistance < 0.06 ? 'proche d’une limite de porte (roue décalée de ~0.036° côté référence)'
          : a.lineBoundaryDistance < 0.06 ? 'proche d’une limite de ligne (roue décalée de ~0.036° côté référence)' : undefined,
      });
    }
  }
  return rows;
}
