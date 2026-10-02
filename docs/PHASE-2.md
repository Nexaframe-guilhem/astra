# ASTRA · Phase 2 : bilan personnel

*2 octobre 2026.*

## 1. Cartes de référence externes

Les résultats sont maintenant comparés à des cartes **publiées par d'autres logiciels**, et plus seulement à des bibliothèques. Données de naissance notées AA (Rodden) ; valeurs relevées le 2 octobre 2026 (`tests/fixtures/published-charts.ts`, `tests/published-charts.test.ts`).

| Carte | Source | Résultat |
|---|---|---|
| Ra Uru Hu, Barack Obama, Élisabeth II, Madonna, John Lennon, David Bowie | flowwithhumandesign.com (Human Design) | Type, autorité, profil, définition et croix **identiques** pour les 6 |
| Marilyn Monroe | idem | Identique, sauf l'ordre des portes Design de la croix : la page publie « 64/63 », nous calculons 63/64. 63/64 correspond à la croix d'Identification issue de 16/9, d'où une probable inversion de saisie sur la page. **À confirmer avec un logiciel de l'école.** |
| Barack Obama, Steve Jobs | astro-charts.com (Placidus, nœud moyen) | 13 positions chacun (planètes, Ascendant, MC, nœud) **à moins d'une minute d'arc** |

Ces cartes confirment les conventions : roue Human Design avec la porte 41 à 302°, Design à 88° d'arc solaire, maisons Placidus. Quand l'école fournira ses propres cartes, il suffira de les ajouter à ce fichier.

## 2. Convention numérologique retenue

La convention **`astra-standard`** est appliquée par défaut et tracée dans chaque résultat (`meta.settings.convention`). Elle suit la tradition pythagoricienne majoritaire, celle de la littérature de référence (Decoz, Millman) et de la plupart des écoles francophones :

- table pythagoricienne (A=1 … I=9, J=1 …) ;
- chemin de vie : jour, mois et année réduits séparément, puis additionnés ;
- nombres maîtres 11, 22 et 33 conservés ;
- dettes karmiques 13, 14, 16 et 19 ;
- expression, élan spirituel et personnalité : chaque prénom et le nom réduits séparément, puis additionnés ;
- Y compté comme voyelle (usage français) ;
- accents et tirets neutralisés, prénoms secondaires inclus, nom de naissance prioritaire ;
- année personnelle : jour + mois de naissance + année en cours ;
- réalisations et défis : première période jusqu'à 36 − chemin de vie.

Trois variantes sont prêtes et sélectionnables sans toucher au code :

- **`decoz`** : Y voyelle seulement quand il sonne comme une voyelle.
- **`simple`** : la variante des calculateurs grand public, qui additionne tous les chiffres de la date et compte Y comme consonne.
- **`chaldean`** : la table chaldéenne.

## 3. Bilan

```
Profile ──► buildReport()  ──► ReportDocument (JSON : sections, tableaux, figures SVG, textes validés)
                │                         │
     content repository           renderReportHtml() ──► HTML A4 imprimable ──► PDF (Chromium)
```

- **`ReportDocument`** est indépendant du rendu. Il pourra alimenter Webflow, un e-mail ou une application mobile. Il garde le lien vers le profil source (`inputHash`) et la version exacte de chaque texte utilisé (`contentUsed`).
- **Sections** : Identité, Astrologie (roue, planètes, maisons, aspects, éléments), Human Design (BodyGraph, vue d'ensemble, centres, canaux et portes, Personnalité et Design), Numérologie (nombres principaux, cycles, grille d'inclusion), Méthode de calcul.
- **Textes.** En production, seuls les textes au statut `validated` apparaissent ; une section sans texte affiche simplement les données. En mode relecture (`draftMode`), chaque emplacement manquant affiche sa clé, pour que l'école voie exactement ce qu'il reste à rédiger.
- **Figures** : roue du thème natal et BodyGraph, générés en SVG côté serveur par des fonctions pures (`src/components`). La géométrie du BodyGraph est une création ASTRA ; aucun SVG tiers n'a été repris.
- **Avertissements** reformulés pour le lecteur, par exemple « une heure de naissance décalée de quelques minutes pourrait modifier la porte 47 ».
- **PDF** : `npm run report -- madonna --pdf` produit `out/madonna.pdf` (14 pages environ) par impression Chromium. En production, la même voie tournera dans un service serveur.

## 4. Cahier de rédaction pour l'école

`npm run content:catalog` produit `content-catalog/fr.csv`, qui s'ouvre directement dans un tableur. Il recense **1 774 clés de contenu**, chacune avec un titre lisible et une priorité :

- **P1 (89 textes)** : ce qui s'affiche en tête de bilan (types, stratégies, autorités, profils HD ; Soleil, Lune et Ascendant dans les signes ; chemin de vie, expression). **Par où commencer.**
- **P2 (544 textes)** : le détail affiché (planètes en signes, centres, canaux, portes, nombres).
- **P3 (1 141 textes)** : l'approfondissement (lignes de portes, aspects par paire, maisons).

Un test vérifie que toute clé produite par les moteurs figure au catalogue. Les textes rédigés sont réimportés dans `src/content/fr/texts.json`, puis dans la table Supabase `content_entries` en Phase 3.

## 5. Ce qui reste à faire par l'école

1. Rédiger et valider les 89 textes P1 (le bilan reste lisible sans eux).
2. Confirmer la croix de Marilyn Monroe ou, mieux, fournir 5 à 10 cartes issues de son logiciel.
3. Valider la convention `astra-standard`, en particulier Y voyelle.
