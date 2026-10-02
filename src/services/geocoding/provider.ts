/**
 * Géocodage lieu -> coordonnées. Interface seulement en Phase 1 : le prototype reçoit
 * latitude / longitude directement. Le fuseau est ensuite déduit hors ligne (core/birth-data/geolocation.ts).
 * Choix du fournisseur à trancher (cf. docs/AUDIT-ARCHITECTURE.md §6) ; il sera appelé côté serveur
 * uniquement, une fois, au moment de la saisie, et le résultat est stocké avec les données de naissance.
 */
export interface GeocodingResult {
  label: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  source: string;
}

export interface GeocodingProvider {
  search(query: string, options?: { language?: string; limit?: number }): Promise<GeocodingResult[]>;
}
