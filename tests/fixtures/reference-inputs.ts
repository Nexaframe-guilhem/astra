/**
 * Profils de référence. Choisis pour couvrir les cas qui cassent :
 * heure d'été historique, hémisphère sud, latitude polaire, changement de date UTC,
 * année bissextile, heure de guerre, nombres maîtres.
 * Les résultats attendus figés sont dans fixtures/golden/<id>.json (npm run fixtures:update).
 */
export interface ReferenceCase {
  id: string;
  note: string;
  input: Record<string, unknown>;
}

export const REFERENCE_CASES: ReferenceCase[] = [
  {
    id: 'toulouse-1990',
    note: 'Exemple du cahier des charges (heure d’été France)',
    input: { firstName: 'Jean', lastName: 'Dupont', birthDate: '1990-06-15', birthTime: '14:30', birthPlace: 'Toulouse', country: 'France', latitude: 43.6047, longitude: 1.4442, timezone: 'Europe/Paris' },
  },
  {
    id: 'paris-1943-wartime',
    note: 'Heure allemande imposée sous l’Occupation (UTC+1 en hiver)',
    input: { firstName: 'Marie', lastName: 'Curie', birthDate: '1943-01-10', birthTime: '10:00', birthPlace: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
  },
  {
    id: 'tokyo-1950-dst',
    note: 'Heure d’été japonaise 1948-1951 (UTC+10), souvent oubliée',
    input: { firstName: 'Yuki', lastName: 'Tanaka', birthDate: '1950-05-20', birthTime: '08:00', birthPlace: 'Tokyo', country: 'Japon', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
  },
  {
    id: 'sydney-1985-south',
    note: 'Hémisphère sud, heure d’été australe',
    input: { firstName: 'Olivia', lastName: 'Smith', birthDate: '1985-01-20', birthTime: '06:15', birthPlace: 'Sydney', country: 'Australie', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' },
  },
  {
    id: 'newyork-1969',
    note: 'Ouest de Greenwich, changement de date UTC',
    input: { firstName: 'Neil', lastName: 'Armstrong', birthDate: '1969-07-20', birthTime: '22:56', birthPlace: 'New York', country: 'États-Unis', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' },
  },
  {
    id: 'tromso-1975-polar',
    note: 'Au-delà du cercle polaire : Placidus indéfini, repli en signes entiers',
    input: { firstName: 'Ingrid', lastName: 'Hansen', birthDate: '1975-12-01', birthTime: '12:00', birthPlace: 'Tromsø', country: 'Norvège', latitude: 69.6492, longitude: 18.9553, timezone: 'Europe/Oslo' },
  },
  {
    id: 'losangeles-1996-leap',
    note: '29 février, 23:59, passe au 1er mars en UTC',
    input: { firstName: 'Lynn', lastName: 'Young', birthDate: '1996-02-29', birthTime: '23:59', birthPlace: 'Los Angeles', country: 'États-Unis', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles' },
  },
  {
    id: 'lyon-1987-accents',
    note: 'Accents, tiret, ligature, nom de naissance, nombres maîtres',
    input: { firstName: 'Hélène-Œdipe', middleNames: 'Zoé', lastName: 'Martin', birthLastName: "D'Arcy", birthDate: '1987-11-29', birthTime: '03:05', birthPlace: 'Lyon', country: 'France', latitude: 45.764, longitude: 4.8357, timezone: 'Europe/Paris' },
  },
];

/** Horloge figée pour des sorties strictement reproductibles. */
export const FIXED_NOW = new Date('2026-10-02T00:00:00.000Z');
export const FIXED_REFERENCE_DATE = '2026-10-02';
