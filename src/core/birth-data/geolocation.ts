/**
 * Fuseau(x) IANA à partir de coordonnées, hors ligne (geo-tz, données timezone-boundary-builder / OSM).
 * On utilise le jeu de données complet ("all") et non "1970" : ce dernier fusionne des zones
 * identiques depuis 1970 mais différentes avant, ce qui fausserait des naissances anciennes.
 */
import { find } from 'geo-tz/all';

export function timezonesAt(latitude: number, longitude: number): string[] {
  return find(latitude, longitude);
}
