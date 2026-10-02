# ASTRA · moteurs de calcul et bilan (Phases 1-2)

Calcul **déterministe** d'un profil Astrologie + Human Design + Numérologie à partir des données de naissance.
Aucune IA n'intervient dans le calcul ou la présentation. Audit et architecture : [docs/AUDIT-ARCHITECTURE.md](docs/AUDIT-ARCHITECTURE.md). Bilan, cartes de référence et convention numérologique : [docs/PHASE-2.md](docs/PHASE-2.md).

## Démarrer

Prérequis : Node 22 ou plus récent.

```bash
npm ci
npm test            # 368 tests : Meeus, fuseaux historiques, cartes publiées, oracles, bilan, non-régression
npm run dev         # interface de vérification sur http://localhost:5173
npm run typecheck
```

Autres commandes :

- `npm run profile -- '{"firstName":"Jean","lastName":"Dupont","birthDate":"1990-06-15","birthTime":"14:30","birthPlace":"Toulouse","latitude":43.6047,"longitude":1.4442,"timezone":"Europe/Paris"}'` affiche un profil JSON.
- `npm run report -- madonna --pdf` produit le bilan HTML et PDF d'un profil de référence dans `out/` (`--draft` affiche les textes à rédiger).
- `npm run content:catalog` exporte le cahier de rédaction des 1 774 contenus (`content-catalog/fr.csv`).
- `npm run schema:export` régénère `schema/profile.v1.json`.
- `npm run fixtures:update` régénère les profils de référence figés. Ne le lancer qu'après avoir validé qu'un changement de résultat est voulu ; le diff git sert alors de revue.

## Utilisation

```ts
import { buildProfile, buildProfileContext } from './src/index.js';

const profile = buildProfile(input, {
  astrology: { houseSystem: 'placidus', nodeType: 'true' },
  numerology: { method: 'pythagorean', yAsVowel: 'always' },
  referenceDate: '2026-10-02',
});
const chatbotContext = buildProfileContext(profile, ['humanDesign', 'numerology']);
```

Les moteurs sont aussi utilisables séparément : `calculateAstrology()`, `calculateHumanDesign()`, `calculateNumerology()`.

## Attributions

Les données de fuseaux par coordonnées (geo-tz / timezone-boundary-builder) proviennent d'OpenStreetMap, © contributeurs OpenStreetMap, sous licence ODbL.
