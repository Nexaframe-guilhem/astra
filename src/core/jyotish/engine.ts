/**
 * Jyotish (astrologie védique) : zodiaque sidéral, maisons en signes entiers depuis le lagna,
 * nakshatras, navamsa (D9) et Vimshottari dasha. Calcul pur à partir des positions tropicales
 * apparentes d'astronomy-engine.
 *
 * Ayanamsa Lahiri (Chitrapaksha) : valeur moyenne 23,245524743° au JD 2435553,5 (21 mars 1956),
 * propagée par la précession générale en longitude (IAU 1976) ; on y ajoute la nutation en
 * longitude pour l'appliquer aux positions vraies de la date (convention de Swiss Ephemeris).
 */
import { bodyEcliptic, earthOrientation, longitudeSpeed, nodeLongitude, nutationAndCenturies, type NodeType, type PlanetId } from '../ephemeris/index.js';
import { ascendant } from '../astrology/houses.js';
import { norm360 } from '../shared/angles.js';
import { SIGNS, type SignId } from '../shared/zodiac.js';
import {
  DASHA_ORDER, DASHA_YEARS, DEBILITATION, EXALTATION, GRAHAS, NAKSHATRAS, OWN_SIGNS, nakshatraLord,
  type Dignity, type GrahaId, type NakshatraId,
} from './data.js';

export interface JyotishSettings {
  ayanamsa: 'lahiri';
  /** Rahu/Ketu : nœud moyen (usage traditionnel) ou vrai. */
  nodeType: NodeType;
  /** Longueur de l'année des dashas, en jours. */
  dashaYearDays: number;
}
export const DEFAULT_JYOTISH_SETTINGS: JyotishSettings = { ayanamsa: 'lahiri', nodeType: 'mean', dashaYearDays: 365.25 };

const LAHIRI_T0 = (2435553.5 - 2451545.0) / 36525;
const LAHIRI_MEAN_T0 = 23.245524743;
const precession = (T: number) => (5029.0966 * T + 1.11113 * T * T - 0.000006 * T * T * T) / 3600;

/** Ayanamsa Lahiri moyen et vrai (avec nutation), en degrés. */
export function lahiriAyanamsa(utcMs: number): { mean: number; true: number } {
  const { dpsi, T } = nutationAndCenturies(utcMs);
  const mean = LAHIRI_MEAN_T0 + precession(T) - precession(LAHIRI_T0);
  return { mean, true: mean + dpsi };
}

const SPAN = 360 / 27;
export function nakshatraOf(siderealLongitude: number): { id: NakshatraId; index: number; pada: number; lord: GrahaId; fraction: number } {
  const lon = norm360(siderealLongitude);
  const index = Math.min(26, Math.floor(lon / SPAN));
  const within = lon - index * SPAN;
  return { id: NAKSHATRAS[index]!, index, pada: Math.min(4, Math.floor(within / (SPAN / 4)) + 1), lord: nakshatraLord(index), fraction: within / SPAN };
}

/** Signe de navamsa (D9) : chaque signe est divisé en 9 parts de 3°20′. */
export const navamsaSign = (siderealLongitude: number): SignId => SIGNS[Math.floor((norm360(siderealLongitude) * 9) / 30) % 12]!;

export function dignityOf(graha: GrahaId, sign: SignId): Dignity {
  if (EXALTATION[graha] === sign) return 'exalted';
  if (DEBILITATION[graha] === sign) return 'debilitated';
  if (OWN_SIGNS[graha]?.includes(sign)) return 'own';
  return 'neutral';
}

export interface RawGraha {
  id: GrahaId;
  tropicalLongitude: number;
  longitude: number;
  speed: number;
}

export interface RawJyotish {
  ayanamsa: number;
  lagnaTropical: number;
  lagna: number;
  grahas: RawGraha[];
}

export function computeJyotishRaw(utcMs: number, latitude: number, longitude: number, settings: JyotishSettings): RawJyotish {
  const ayan = lahiriAyanamsa(utcMs).true;
  const grahas: RawGraha[] = GRAHAS.filter((g) => g !== 'rahu' && g !== 'ketu').map((id) => {
    const tropical = bodyEcliptic(id as PlanetId, utcMs).longitude;
    return {
      id,
      tropicalLongitude: tropical,
      longitude: norm360(tropical - ayan),
      speed: longitudeSpeed((t) => bodyEcliptic(id as PlanetId, t).longitude, utcMs, id === 'moon' ? 0.05 : 0.25),
    };
  });
  const nodeFn = (t: number) => nodeLongitude(settings.nodeType, t);
  const rahu = nodeFn(utcMs);
  const nodeSpeed = longitudeSpeed(nodeFn, utcMs, 0.05);
  grahas.push({ id: 'rahu', tropicalLongitude: rahu, longitude: norm360(rahu - ayan), speed: nodeSpeed });
  grahas.push({ id: 'ketu', tropicalLongitude: norm360(rahu + 180), longitude: norm360(rahu + 180 - ayan), speed: nodeSpeed });

  const { trueObliquity, gast } = earthOrientation(utcMs);
  const lagnaTropical = ascendant(norm360(gast + longitude), trueObliquity, latitude);
  return { ayanamsa: ayan, lagnaTropical, lagna: norm360(lagnaTropical - ayan), grahas };
}

export interface DashaPeriod { lord: GrahaId; start: string; end: string }
export interface MahaDasha extends DashaPeriod { years: number; antardashas: DashaPeriod[] }

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/**
 * Vimshottari : la première dasha est celle du maître du nakshatra de la Lune, réduite de la part
 * déjà parcourue du nakshatra. Les antardashas suivent l'ordre à partir du maître de la mahadasha,
 * chacune durant (années MD × années AD / 120).
 */
export function vimshottari(moonSidereal: number, birthUtcMs: number, yearDays: number): { balanceYears: number; mahadashas: MahaDasha[] } {
  const nak = nakshatraOf(moonSidereal);
  const yearMs = yearDays * 86400000;
  const first = DASHA_ORDER.indexOf(nak.lord);
  const balanceYears = (1 - nak.fraction) * DASHA_YEARS[nak.lord];
  // Début théorique de la première mahadasha (avant la naissance), pour caler les antardashas.
  let cursor = birthUtcMs - nak.fraction * DASHA_YEARS[nak.lord] * yearMs;
  const mahadashas: MahaDasha[] = [];
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[(first + i) % 9]!;
    const years = DASHA_YEARS[lord];
    const start = cursor;
    const end = start + years * yearMs;
    const antardashas: DashaPeriod[] = [];
    let a = start;
    for (let j = 0; j < 9; j++) {
      const sub = DASHA_ORDER[(DASHA_ORDER.indexOf(lord) + j) % 9]!;
      const aEnd = a + ((years * DASHA_YEARS[sub]) / 120) * yearMs;
      if (aEnd > birthUtcMs) antardashas.push({ lord: sub, start: isoDate(Math.max(a, birthUtcMs)), end: isoDate(aEnd) });
      a = aEnd;
    }
    mahadashas.push({ lord, years: i === 0 ? balanceYears : years, start: isoDate(Math.max(start, birthUtcMs)), end: isoDate(end), antardashas });
    cursor = end;
  }
  return { balanceYears, mahadashas };
}
