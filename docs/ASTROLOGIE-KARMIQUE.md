# Astrologie karmique

Moteur `astra-karmic` 0.1.0. Ce n'est pas un nouveau calcul de thème : la lecture karmique s'appuie sur le thème tropical (mêmes maisons, mêmes nœuds, même Saturne) et y ajoute deux points, Chiron et Lilith.

## Points retenus

- **Nœuds lunaires** : Nœud Nord (chemin d'évolution) et Nœud Sud (acquis, habitudes), du type choisi pour le thème (vrai par défaut).
- **Saturne** : signe, maison et rétrogradation.
- **Chiron (2060)** : signe, maison et rétrogradation. Calculé de 1900 à 2100 ; hors de cette période, il est omis et un avertissement s'affiche.
- **Lilith** : Lune noire moyenne, c'est-à-dire l'apogée moyen de l'orbite lunaire (Meeus, *Astronomical Algorithms*, 50.1, + 180°). Elle ne rétrograde pas.
- **Planètes rétrogrades** à la naissance, de Mercure à Pluton.
- **Maison 12** : planètes, Chiron et Lilith qui s'y trouvent.

## Calcul de Chiron

astronomy-engine ne fournit pas Chiron, et Swiss Ephemeris est exclu pour des raisons de licence. Les positions viennent donc d'une table embarquée (`src/core/ephemeris/chiron-table.json`, environ 50 Ko).

La table est produite par `scripts/build-chiron-table.ts` :
- On part des éléments orbitaux osculateurs publiés par le Minor Planet Center (époque JD 2456000,5).
- On intègre numériquement l'orbite avec le simulateur gravitationnel d'astronomy-engine, en tenant compte des perturbations de Jupiter, Saturne, Uranus et Neptune.
- On enregistre une position tous les 40 jours, de 1899 à 2101.

À l'exécution, la position est interpolée (Lagrange à 4 points), corrigée du temps de lumière, puis convertie en longitude géocentrique sur l'écliptique vraie de la date. L'aberration annuelle (au plus 0,006°) est négligée.

Vérifications (`tests/karmic.test.ts`) :
- entrée en Poissons le 20 avril 2010 ;
- entrées en Bélier le 17 avril 2018 et le 18 février 2019 ;
- environ 3° Taureau à la découverte en novembre 1977 ;
- périhélie calculé au 15 février 1996, pour une date publiée du 14 février.

La bibliothèque de comparaison utilise une orbite képlérienne sans perturbations. Elle concorde à 0,15° près autour de 2012, puis s'écarte en s'éloignant de son époque (1,7° en 1950). C'est attendu : le calcul intégré est le plus fiable des deux.

## À valider par l'école

- Lilith moyenne, ou Lilith « vraie » (osculatrice), qui peut s'écarter de 30°.
- Nœud vrai ou moyen pour la lecture karmique (aujourd'hui, le même que pour le thème).
- Choix des points : faut-il ajouter les maîtres des nœuds, les aspects aux nœuds, la Part de Fortune ?
- Le ton des textes : ils présentent la lecture comme symbolique, sans affirmation sur des vies antérieures.

## Contenus

- `karmic.intro` (1), `karmic.<point>.<signe>` pour `nodes`, `saturn`, `chiron` et `lilith` (48) : P1, rédigés. Pour les nœuds, la clé suit le signe du Nœud Nord et le texte décrit l'axe.
- `karmic.<point>House.<maison>` (48, P2, composés), `karmic.retrograde.<planète>` (8, P2, rédigés).
- `karmic.house12.<corps>` (12, P3, rédigés).
