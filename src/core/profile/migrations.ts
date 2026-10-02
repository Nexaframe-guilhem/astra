/**
 * Migrations de profils stockés entre versions de schéma.
 * Règle : version mineure = ajout de champs optionnels (pas de migration) ;
 * version majeure = migration explicite ici, OU recalcul depuis les données de naissance
 * (toujours possible puisque les moteurs sont déterministes).
 */
type Migration = (profile: Record<string, unknown>) => Record<string, unknown>;

export const MIGRATIONS: Record<string, { to: string; migrate: Migration }> = {
  // Exemple pour une future v2 : '1.0': { to: '2.0', migrate: (p) => ({ ...p, schemaVersion: '2.0' }) },
};

export function migrateProfile(profile: Record<string, unknown>, target: string): Record<string, unknown> {
  let current = profile;
  const seen = new Set<string>();
  while (current.schemaVersion !== target) {
    const v = String(current.schemaVersion);
    const step = MIGRATIONS[v];
    if (!step || seen.has(v)) throw new Error(`Pas de migration depuis ${v} vers ${target} : recalculer le profil.`);
    seen.add(v);
    current = step.migrate(current);
  }
  return current;
}
