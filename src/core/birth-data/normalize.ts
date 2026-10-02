import { AstraError } from '../shared/errors.js';
import { round } from '../shared/angles.js';
import { timezonesAt } from './geolocation.js';
import { julianDayFromUtcMs, localToUtc, isValidTimezone } from './timezone.js';
import { birthInputSchema, type BirthData, type BirthInput } from './types.js';

/** Valide puis normalise la saisie de naissance (validation serveur obligatoire). */
export function normalizeBirthData(rawInput: unknown): { input: BirthInput; birth: BirthData } {
  const parsed = birthInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new AstraError('INVALID_INPUT', 'Données de naissance invalides', {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  const input = parsed.data;
  const [year, month, day] = input.birthDate.split('-').map(Number) as [number, number, number];
  const [hour, minute, second = 0] = input.birthTime.split(':').map(Number) as [number, number, number?];

  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new AstraError('INVALID_INPUT', 'Date de naissance inexistante', {});
  }
  if (hour > 23 || minute > 59 || second > 59) {
    throw new AstraError('INVALID_INPUT', 'Heure de naissance invalide', {});
  }
  if (year < 1800 || year > 2100) {
    throw new AstraError('OUT_OF_RANGE', 'Année hors de la plage validée (1800-2100)', {});
  }

  const warnings: string[] = [];
  const zonesAtCoords = timezonesAt(input.latitude, input.longitude);
  let timezone = input.timezone;
  let timezoneSource: BirthData['timezoneSource'] = 'input';
  if (!timezone) {
    timezone = zonesAtCoords[0];
    timezoneSource = 'coordinates';
    if (!timezone) throw new AstraError('UNKNOWN_TIMEZONE', 'Aucun fuseau trouvé pour ces coordonnées', {});
  } else if (!isValidTimezone(timezone)) {
    throw new AstraError('UNKNOWN_TIMEZONE', `Fuseau horaire inconnu : ${timezone}`, {});
  } else if (zonesAtCoords.length && !zonesAtCoords.includes(timezone)) {
    warnings.push(`TIMEZONE_MISMATCH: le fuseau saisi (${timezone}) diffère de celui des coordonnées (${zonesAtCoords.join(', ')}).`);
  }

  const { utcMs, offsetMinutes } = localToUtc({ year, month, day, hour, minute, second }, timezone, input.dstAmbiguity);
  if (year < 1900) warnings.push('HISTORICAL_TIME: avant 1900, l’heure locale est souvent une heure solaire (LMT) ; vérifier la source.');

  return {
    input,
    birth: {
      date: input.birthDate,
      time: input.birthTime,
      place: input.birthPlace,
      country: input.country ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      timezone,
      timezoneSource,
      utcOffsetMinutes: round(offsetMinutes, 4),
      utc: new Date(utcMs).toISOString(),
      julianDayUT: round(julianDayFromUtcMs(utcMs), 8),
      timezonesAtCoordinates: zonesAtCoords,
      warnings,
    },
  };
}
