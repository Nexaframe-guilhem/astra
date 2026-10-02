import type { BirthData } from '../birth-data/types.js';
import { buildMeta, RUNTIME_VERSIONS } from '../shared/meta.js';
import { round } from '../shared/angles.js';
import { zodiacPosition } from '../shared/zodiac.js';
import { computeJyotishRaw, DEFAULT_JYOTISH_SETTINGS, dignityOf, nakshatraOf, navamsaSign, vimshottari, type JyotishSettings } from './engine.js';
import type { JyotishResult } from './validation.js';

export { jyotishResultSchema, type JyotishResult } from './validation.js';
export { lahiriAyanamsa, nakshatraOf, navamsaSign, vimshottari, DEFAULT_JYOTISH_SETTINGS, type JyotishSettings } from './engine.js';
export * from './data.js';

export const JYOTISH_ENGINE = 'astra-jyotish';
export const JYOTISH_ENGINE_VERSION = '0.1.0';

/** Point d'entrée public du moteur Jyotish. `referenceDate` (AAAA-MM-JJ) sert à situer la dasha en cours. */
export function calculateJyotish(birth: BirthData, overrides: Partial<JyotishSettings> = {}, now?: Date, referenceDate?: string): JyotishResult {
  const settings: JyotishSettings = { ...DEFAULT_JYOTISH_SETTINGS, ...overrides };
  const utcMs = Date.parse(birth.utc);
  const raw = computeJyotishRaw(utcMs, birth.latitude, birth.longitude, settings);
  const lagnaZ = zodiacPosition(raw.lagna);
  const nak = (lon: number) => { const n = nakshatraOf(lon); return { id: n.id, index: n.index, pada: n.pada, lord: n.lord }; };

  const grahas = raw.grahas.map((g) => {
    const z = zodiacPosition(g.longitude);
    const house = ((z.signIndex - lagnaZ.signIndex + 12) % 12) + 1;
    const n = nak(g.longitude);
    return {
      id: g.id,
      longitude: round(g.longitude),
      tropicalLongitude: round(g.tropicalLongitude),
      sign: z.sign, signIndex: z.signIndex, degreeInSign: z.degreeInSign, dms: z.dms,
      house,
      retrograde: g.id === 'rahu' || g.id === 'ketu' ? true : g.speed < 0,
      nakshatra: n,
      navamsaSign: navamsaSign(g.longitude),
      dignity: dignityOf(g.id, z.sign),
      contentKeys: {
        graha: `jyotish.grahas.${g.id}`,
        sign: `jyotish.grahaInRashi.${g.id}.${z.sign}`,
        house: `jyotish.grahaInBhava.${g.id}.${house}`,
        nakshatra: `jyotish.nakshatras.${n.id}`,
      },
    };
  });

  const moon = raw.grahas.find((g) => g.id === 'moon')!;
  const v = vimshottari(moon.longitude, utcMs, settings.dashaYearDays);
  const ref = referenceDate ?? (now ?? new Date()).toISOString().slice(0, 10);
  const md = v.mahadashas.find((m) => m.start <= ref && ref < m.end) ?? null;
  const ad = md?.antardashas.find((a) => a.start <= ref && ref < a.end) ?? null;

  const warnings: string[] = [];
  const lagnaEdge = Math.min(lagnaZ.degreeInSign, 30 - lagnaZ.degreeInSign);
  if (lagnaEdge < 1) warnings.push(`LAGNA_CUSP: le lagna est à ${lagnaEdge.toFixed(2)}° d'un changement de signe ; une heure de naissance imprécise peut changer toutes les maisons.`);

  return {
    meta: buildMeta({
      engine: JYOTISH_ENGINE,
      engineVersion: JYOTISH_ENGINE_VERSION,
      dependencies: { 'astronomy-engine': RUNTIME_VERSIONS['astronomy-engine'] },
      settings: { ...settings, houseSystem: 'whole-sign', zodiac: 'sidereal' },
      hashedInput: { utc: birth.utc, latitude: birth.latitude, longitude: birth.longitude, referenceDate: ref },
      now,
    }),
    ayanamsa: { id: 'lahiri', value: round(raw.ayanamsa) },
    lagna: {
      longitude: round(raw.lagna), sign: lagnaZ.sign, signIndex: lagnaZ.signIndex, degreeInSign: lagnaZ.degreeInSign, dms: lagnaZ.dms,
      nakshatra: nak(raw.lagna), navamsaSign: navamsaSign(raw.lagna), contentKey: `jyotish.lagna.${lagnaZ.sign}`,
    },
    grahas,
    dashas: {
      system: 'vimshottari',
      yearDays: settings.dashaYearDays,
      balanceYears: round(v.balanceYears, 4),
      mahadashas: v.mahadashas.map((m) => ({ ...m, years: round(m.years, 4), contentKey: `jyotish.dashas.${m.lord}` })),
      current: { referenceDate: ref, mahadasha: md?.lord ?? null, antardasha: ad?.lord ?? null },
    },
    warnings,
  };
}
