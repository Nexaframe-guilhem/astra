/**
 * Cartes publiées par des sources indépendantes, servant de référence externe.
 * Données de naissance : notées AA (Rodden) sur astro-charts.com / Astrodatabank.
 * Valeurs Human Design : flowwithhumandesign.com (calcul indépendant du nôtre).
 * Valeurs astrologiques : astro-charts.com (Placidus, nœud moyen, minutes arrondies).
 * Relevées le 2 octobre 2026.
 */
export interface PublishedChart {
  id: string;
  name: string;
  input: Record<string, unknown>;
  humanDesign?: {
    source: string;
    type: string;
    authority: string;
    profile: string;
    definition: string;
    angle: 'right' | 'juxtaposition' | 'left';
    /** Portes de la croix telles que publiées : Soleil/Terre Personnalité | Soleil/Terre Design. */
    cross: [number, number, number, number];
    note?: string;
  };
  astrology?: {
    source: string;
    /** [signe, degrés, minutes] arrondis à la minute par la source. Nœud nord = nœud moyen. */
    positions: Record<string, [string, number, number]>;
  };
}

const person = (firstName: string, birthDate: string, birthTime: string, birthPlace: string, latitude: number, longitude: number, timezone: string) =>
  ({ firstName, lastName: 'Reference', birthDate, birthTime, birthPlace, latitude, longitude, timezone });

export const PUBLISHED_CHARTS: PublishedChart[] = [
  {
    id: 'ra-uru-hu',
    name: 'Ra Uru Hu (fondateur du Human Design)',
    input: person('Ra', '1948-04-09', '00:14', 'Montréal', 45.5017, -73.5673, 'America/Toronto'),
    humanDesign: { source: 'https://flowwithhumandesign.com/chart/ra-uru-hu-human-design-chart/', type: 'manifestor', authority: 'splenic', profile: '5/1', definition: 'single', angle: 'left', cross: [51, 57, 61, 62] },
  },
  {
    id: 'barack-obama',
    name: 'Barack Obama',
    input: person('Barack', '1961-08-04', '19:24', 'Honolulu', 21.3069, -157.8583, 'Pacific/Honolulu'),
    humanDesign: { source: 'https://flowwithhumandesign.com/chart/barack-obama-human-design/', type: 'projector', authority: 'emotional', profile: '6/2', definition: 'single', angle: 'left', cross: [33, 19, 2, 1] },
    astrology: {
      source: 'https://astro-charts.com/persons/chart/barack-obama/',
      positions: {
        sun: ['leo', 12, 33], moon: ['gemini', 3, 21], mercury: ['leo', 2, 20], venus: ['cancer', 1, 47], mars: ['virgo', 22, 35],
        jupiter: ['aquarius', 0, 52], saturn: ['capricorn', 25, 20], uranus: ['leo', 25, 16], neptune: ['scorpio', 8, 36], pluto: ['virgo', 6, 59],
        ascendant: ['aquarius', 18, 3], midheaven: ['scorpio', 28, 54], northNode: ['leo', 27, 54],
      },
    },
  },
  {
    id: 'steve-jobs',
    name: 'Steve Jobs',
    input: person('Steve', '1955-02-24', '19:15', 'San Francisco', 37.7749, -122.4194, 'America/Los_Angeles'),
    astrology: {
      source: 'https://astro-charts.com/persons/chart/steve-jobs/',
      positions: {
        sun: ['pisces', 5, 45], moon: ['aries', 7, 45], mercury: ['aquarius', 14, 22], venus: ['capricorn', 21, 10], mars: ['aries', 29, 5],
        jupiter: ['cancer', 20, 30], saturn: ['scorpio', 21, 10], uranus: ['cancer', 24, 8], neptune: ['libra', 28, 3], pluto: ['leo', 25, 19],
        ascendant: ['virgo', 22, 17], midheaven: ['gemini', 21, 19], northNode: ['capricorn', 2, 30],
      },
    },
  },
  {
    id: 'elizabeth-ii',
    name: 'Élisabeth II',
    input: person('Elizabeth', '1926-04-21', '02:40', 'Londres', 51.5074, -0.1278, 'Europe/London'),
    humanDesign: { source: 'https://flowwithhumandesign.com/chart/queen-elizabeth-human-design/', type: 'projector', authority: 'emotional', profile: '5/1', definition: 'split', angle: 'left', cross: [3, 50, 41, 31] },
  },
  {
    id: 'madonna',
    name: 'Madonna',
    input: person('Madonna', '1958-08-16', '07:05', 'Bay City', 43.5945, -83.8889, 'America/Detroit'),
    humanDesign: { source: 'https://flowwithhumandesign.com/chart/madonna-human-design/', type: 'generator', authority: 'sacral', profile: '5/1', definition: 'split', angle: 'left', cross: [4, 49, 8, 14] },
  },
  {
    id: 'marilyn-monroe',
    name: 'Marilyn Monroe',
    input: person('Marilyn', '1926-06-01', '09:30', 'Los Angeles', 34.0522, -118.2437, 'America/Los_Angeles'),
    humanDesign: {
      source: 'https://flowwithhumandesign.com/chart/marilyn-monroe-human-design-chart/',
      type: 'projector', authority: 'emotional', profile: '6/2', definition: 'split', angle: 'left', cross: [16, 9, 63, 64],
      note: 'La page publie « 16/9 | 64/63 » ; la croix d’Identification à angle gauche issue de 16/9 est 16/9 | 63/64 (Soleil Design en 63). Inversion de saisie probable, à confirmer.',
    },
  },
  {
    id: 'john-lennon',
    name: 'John Lennon',
    input: person('John', '1940-10-09', '18:30', 'Liverpool', 53.4084, -2.9916, 'Europe/London'),
    humanDesign: { source: 'https://flowwithhumandesign.com/chart/john-lennon-human-design/', type: 'generator', authority: 'emotional', profile: '2/4', definition: 'single', angle: 'right', cross: [57, 51, 53, 54] },
  },
  {
    id: 'david-bowie',
    name: 'David Bowie',
    input: person('David', '1947-01-08', '09:00', 'Londres (Brixton)', 51.4613, -0.1156, 'Europe/London'),
    humanDesign: { source: 'https://flowwithhumandesign.com/chart/david-bowie-human-design/', type: 'manifesting-generator', authority: 'sacral', profile: '3/5', definition: 'single', angle: 'right', cross: [54, 53, 57, 51] },
  },
];
