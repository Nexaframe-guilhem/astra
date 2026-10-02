# ASTRA · Phase 1 : audit des bibliothèques et architecture

*2 octobre 2026. Ce document accompagne le prototype `astra-engines` 0.1.0.*

## 1. En bref

- **Une seule dépendance de calcul en production : Astronomy Engine (MIT, zéro dépendance).** Nos trois moteurs (astrologie, Human Design, numérologie) sont écrits en TypeScript au-dessus d'elle, derrière `calculateAstrology()`, `calculateHumanDesign()` et `calculateNumerology()`.
- **Les bibliothèques proposées (DeepNatal, Circular Natal Horoscope, NatalEngine, free-human-design) ne sont pas intégrées en production.** Elles servent d'*oracles* dans les tests et dans l'interface de développement : chaque résultat est comparé à 2 ou 3 implémentations indépendantes. Les raisons sont détaillées au §2.
- **Arbre de production 100 % permissif** (MIT, ISC, BSD-3, 0BSD, Unlicense). Aucune AGPL, pas de Swiss Ephemeris, aucune API payante, aucun coût par calcul.
- **225 tests passent**, y compris sous trois fuseaux serveur différents (UTC, Paris, Los Angeles), sur 8 profils de référence choisis pour leurs pièges.
- **Trois conventions doivent être validées par l'école** avant la mise en production (§8) : la roue Human Design, le nœud lunaire vrai ou moyen, et les règles de numérologie.

## 2. Audit des bibliothèques

L'API GitHub n'était pas accessible depuis l'environnement de travail. L'audit s'appuie donc sur le registre npm (versions, dates, dépendances) et sur une **lecture du code publié** de chaque paquet. Les étoiles et les tickets GitHub n'ont pas été comptés.

| Bibliothèque | Version | Licence | Dépendances runtime | Maintenance | Verdict |
|---|---|---|---|---|---|
| **astronomy-engine** | 2.1.19 | MIT | aucune | Mature, dernière version en déc. 2023, ~580 k téléchargements/mois, validée par l'auteur contre JPL/NOVAS | **Fondation retenue.** Seul fichier qui l'importe : `src/core/ephemeris/index.ts` |
| circular-natal-horoscope-js | 1.1.0 | Unlicense | moment, moment-timezone 0.5 (données de fuseaux figées en 2022), tz-lookup | Inactif depuis avril 2022 | **Test uniquement.** Planètes exactes à 0,01° près, mais ses cuspides Placidus s'écartent jusqu'à 0,45° de la définition (vérifié) |
| DeepNatal | 0.1.3 | MIT | SDK MCP (express, hono…), circular-natal-horoscope-js, zod | Créé le 29/08/2026, 4 versions | **Non retenu** : trop jeune, enveloppe la bibliothèque précédente. Ses bonnes idées sont reprises (refus des heures inexistantes, repli polaire, vérification croisée) |
| NatalEngine | 1.6.0 | MIT | SDK MCP (17 dépendances directes dont express) + astronomy-engine | Créé en déc. 2025, 11 versions | **Test HD uniquement.** API en décalage UTC numérique (pas IANA), « nœud vrai » approché par une série courte (jusqu'à 0,08° d'erreur mesurée), pas de maisons, embarque des textes d'interprétation (Gene Keys) aux droits incertains |
| free-human-design | 1.0.1 | MIT | astronomia, luxon, @vvo/tzdb, city-timezones | Créé en juil. 2026, 2 versions | **Test HD uniquement.** Sa roue des portes est décalée d'environ 0,036° (2′) par rapport à la convention standard, ce qui suffit à changer le Type d'un de nos 8 profils de test |
| Open Human Design | – | non vérifiée | – | – | Référence visuelle pour le BodyGraph en Phase 2. Licence à vérifier avant de réutiliser un SVG |
| NUMERON | – | MIT (page GitHub) | application React/Electron | Non publié sur npm, 0 étoile | **Référence de règles seulement.** Le moteur numérologique est réécrit (≈ 250 lignes testées) |
| Swiss Ephemeris | – | AGPL ou commerciale | – | – | **Écarté**, comme demandé |
| geo-tz | 8.1.9 | MIT (code) | turf, geobuf, pbf (MIT/ISC/BSD) | Active, sept. 2026 | **Retenu** pour déduire le fuseau des coordonnées hors ligne. Données issues d'OpenStreetMap (**ODbL : attribution requise**). Pèse 74 Mo |
| zod | 4.6.5 | MIT | aucune | Très active | **Retenu** : validation serveur et export du schéma JSON |

Les dépendances de développement (vitest, tsx, typescript, oracles) n'entrent pas dans le produit livré.

## 3. Risques identifiés et parades

| # | Risque | Parade dans le prototype |
|---|---|---|
| 1 | **Limites de portes HD.** Une activation à quelques centièmes de degré d'une limite change de porte, donc parfois de canal et de Type. Cela dépend de l'heure exacte et de la convention de roue. | Chaque activation porte sa distance à la limite (`gateBoundaryDistance`). Un avertissement `GATE_BOUNDARY` est émis sous 0,05°. Roue standard : porte 41 à 302°, identique à NatalEngine |
| 2 | **Nœud lunaire vrai ou moyen.** Les logiciels diffèrent, avec un écart possible d'environ 1,5°. | Paramètre `nodeType`, vrai par défaut. Notre nœud vrai (osculateur, définition de Swiss Ephemeris) est prouvé exact aux passages réels de la Lune sur l'écliptique (test dédié) |
| 3 | **Heures historiques** (heure d'été passée, Occupation, Japon 1948-51, Chine 1986-91, heure locale avant 1911). | Base IANA de Node (ICU), sans heuristique. Heure inexistante refusée, heure ambiguë refusée sauf précision `earlier`/`later`. Version `tzdata` enregistrée dans chaque résultat |
| 4 | **Placidus indéfini au-delà du cercle polaire.** | Repli automatique en signes entiers, avec avertissement `POLAR_LATITUDE` |
| 5 | **Mise à jour d'une dépendance** qui modifie silencieusement un résultat. | Versions figées exactement. 8 profils de référence figés (`tests/fixtures/golden`) dont toute différence fait échouer les tests |
| 6 | **Précision astronomique.** | Tests contre les exemples publiés de Meeus (Soleil, Lune, temps sidéral, obliquité) : écarts mesurés de 0,2″ pour le Soleil, 2,6″ pour la Lune et 0,1″ pour le temps sidéral |
| 7 | **Textes interprétatifs embarqués** dans certaines bibliothèques (droits d'auteur, absence de validation). | Aucun texte tiers n'est utilisé. Le profil ne contient que des valeurs et des `contentKey` |
| 8 | **Données personnelles.** | Validation serveur stricte (zod), erreurs sans donnée personnelle, aucune donnée de naissance dans les logs. RLS prévue au §7 |

## 4. Architecture

```
Saisie ──► birth-data (validation, fuseau IANA, instant UTC)
              │
              ▼
        ephemeris  ◄── seul import d'astronomy-engine
         │      │
         ▼      ▼
   astrology  human-design     numerology (arithmétique pure)
         │      │                  │
         └──────┴───── profile ────┘   (assemblage + validation du schéma 1.0)
                         │
          ┌──────────────┼────────────────┐
          ▼              ▼                ▼
   Supabase (Ph. 3)   Bilan (Ph. 2)   Contexte chatbot (Ph. 5)
                     + content repository
```

Chaque moteur suit le même découpage : `engine.ts` (calcul brut), `normalize.ts` (forme normalisée + `contentKey` + méta), `validation.ts` (schéma zod), `types.ts`, `index.ts` (point d'entrée public). Le reste de l'application n'importe que `src/index.ts`.

```
src/
  core/
    shared/        angles, zodiaque, erreurs typées, méta (version, hash)
    ephemeris/     adaptateur astronomy-engine (positions, nœuds, temps sidéral, recherche solaire)
    birth-data/    types, normalize, timezone (IANA historique), geolocation (geo-tz)
    astrology/     engine, houses (Placidus, signes entiers, égales, Porphyre), aspects, normalize, validation
    human-design/  data (roue, centres, canaux), engine, normalize, validation
    numerology/    alphabets, engine, normalize, validation
    profile/       build-profile, schema, context (vue chatbot), migrations
  content/         repository.ts + fr/labels.json + fr/texts.json
  services/        geocoding (interface), supabase (Phase 3)
  dev/             serveur et interface de vérification (outil interne)
tests/             8 profils de référence, oracles, golden files
schema/            profile.v1.json (JSON Schema 2020-12, généré)
```

## 5. Schéma normalisé et versioning

- Le profil complet (`Profile`) contient `schemaVersion: "1.0"`, `identity`, `birth`, `astrology`, `humanDesign`, `numerology` et `meta`. La source unique du schéma est zod (`src/core/profile/schema.ts`). Il est exporté en JSON Schema dans `schema/profile.v1.json` pour Supabase et les autres modules.
- **Chaque section** porte `meta` : `engine`, `engineVersion`, `schemaVersion`, `calculatedAt`, `dependencies` (astronomy-engine, modèle ΔT), `settings` (tous les paramètres effectifs) et `inputHash`. Même hash signifie même résultat attendu, ce qui permet de détecter les profils à recalculer.
- **Règle de version.** Mineure : ajout de champs optionnels, rien à migrer. Majeure : migration explicite (`profile/migrations.ts`) ou recalcul, toujours possible puisque les moteurs sont déterministes.
- **Valeurs sans texte.** Exemple : `lifePath: { value: 7, compound: 25, chain: [25, 7], isMaster: false, karmicDebt: null, contentKey: "numerology.lifePath.7" }`. Les clés suivent `<domaine>.<catégorie>.<identifiant>`, par exemple `humanDesign.types.generator`, `astrology.bodyInSign.sun.gemini` ou `humanDesign.gateLines.34.3`. Un profil de test référence environ 200 clés distinctes.
- **Déterminisme.** La seule dépendance au temps est `now`, injectable. Les cycles numérologiques personnels utilisent une `referenceDate` explicite, enregistrée dans le résultat.

## 6. Données de naissance et géocodage

Phase 1 : le formulaire fournit latitude et longitude. Le fuseau est déduit des coordonnées hors ligne si absent. S'il est saisi, il est contrôlé contre les coordonnées (avertissement en cas d'écart). Le jeu de données complet de geo-tz est utilisé, car le jeu « depuis 1970 » fusionnerait des zones qui différaient avant 1970.

Pour le géocodage ville vers coordonnées, l'interface est prête (`services/geocoding`). Fournisseur à choisir :

- **GeoNames** (CC-BY, auto-hébergeable) : recommandé, sans coût par requête.
- **Nominatim/OSM** (ODbL, politique d'usage stricte sur le serveur public, à auto-héberger en production).
- **API commerciale** (Google, Mapbox) : à éviter selon vos contraintes.

## 7. Supabase (proposition pour la Phase 3)

| Table | Contenu | Accès |
|---|---|---|
| `birth_data` | `user_id`, date, heure, lieu, lat/lon, fuseau, instant UTC, avertissements | RLS `user_id = auth.uid()` |
| `calculation_results` | `profile_id`, `engine`, `engine_version`, `schema_version`, `input_hash`, `result jsonb`, `calculated_at` | lecture par le propriétaire, écriture par le service serveur uniquement |
| `content_entries` | `key`, `locale`, `title`, `body`, `status` (draft/validated/archived), `version` | lecture publique des textes validés, écriture réservée à l'école |
| `reports` | versions figées du bilan (références aux résultats et versions de contenus) | propriétaire |

Le calcul tourne côté serveur (Edge Function ou service Node), jamais dans le navigateur. Les clés Supabase de service restent côté serveur. La suppression en cascade depuis `auth.users` assure le droit à l'effacement, et l'export utilisateur est un simple JSON du `Profile`. Le futur chatbot lira `buildProfileContext()` sous l'identité de l'utilisateur authentifié, donc sous RLS.

## 8. À valider avec l'école

1. **Roue Human Design.** Début de la porte 41 à 302° (convention standard, NatalEngine). free-human-design utilise environ 302,036°. Fournir 5 à 10 cartes issues du logiciel de référence de l'école pour les figer en tests.
2. **Nœud lunaire** vrai ou moyen, en Human Design comme en astrologie.
3. **Numérologie.** Valeurs par défaut actuelles, toutes paramétrables :
   - méthode pythagoricienne ;
   - maîtres 11/22/33 conservés ;
   - Y toujours voyelle (usage français) ;
   - réduction par prénom/nom puis somme ;
   - chemin de vie par composantes (mois + jour + année réduits) ;
   - nom de naissance prioritaire ;
   - prénoms secondaires inclus ;
   - dettes karmiques 13/14/16/19 ;
   - âges des cycles fondés sur 36 − chemin de vie.
4. **Astrologie.** Système de maisons (Placidus par défaut), orbes (8/8/7/7/5), points inclus dans les aspects, prise en compte ou non de Chiron et de Lilith (non calculés aujourd'hui, car Astronomy Engine ne fournit pas Chiron).
5. **Heure de naissance inconnue** : à prévoir (aujourd'hui l'heure est obligatoire).

## 9. Ce qui reste hors Phase 1

Bilan mis en page, BodyGraph et roue astrologique (Phase 2), Supabase, Auth et Stripe (Phase 3), base documentaire et RAG (Phase 4), chatbot (Phase 5). Le profil et sa vue `buildProfileContext()` sont déjà dimensionnés pour ces phases.
