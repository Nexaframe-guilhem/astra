# Matrice du destin (22 arcanes)

Moteur `astra-destiny-matrix` 0.1.0, convention `astra-matrix`. Calcul pur à partir de la date de naissance, sans heure ni lieu.

## Règles de calcul

- Réduction : toute somme supérieure à 22 est remplacée par la somme de ses chiffres, jusqu'à obtenir 1 à 22.
- A = jour (réduit), B = mois, C = somme des chiffres de l'année (réduite), D = A+B+C, E = A+B+C+D (centre).
- Carré ancestral : F = A+B, G = B+C, H = D+A, I = C+D.
- Points intérieurs et canal relations/argent : J = D+E, N = C+E, L = J+N, K = J+L (relations), M = L+N (argent), R = J+D, Q = N+C, S = A+E, T = B+E, O = A+S, P = B+T, U = F+G+H+I, V = E+U, W = S+E, X = T+E, et sur chaque diagonale X2 = X+U, X1 = X+X2.
- Destinations : ciel = B+D, terre = A+C, personnelle = ciel+terre ; masculine = F+I, féminine = G+H, sociale = masculine+féminine ; spirituelle = personnelle+sociale.

Les formules des points A à X et des diagonales reprennent celles de la bibliothèque MIT `destiny-matrix/matrix-calculator`. Ses deux jeux de test sont repris dans `tests/destiny-matrix.test.ts` et concordent exactement.

## À valider par l'école

- Attribution des lignées : paternelle = diagonale F–I, maternelle = G–H.
- Formules des destinations, qui varient selon les écoles.
- Points retenus comme « relations » (K) et « argent » (M), et lecture de la queue karmique D–R–J.
- Les points d'âge et la carte des chakras ne sont pas encore affichés.

## Contenus

- `destinyMatrix.arcana.N` (22 textes, P1) : présentation de chaque arcane, avec sa version équilibrée et déséquilibrée.
- `destinyMatrix.positions.<position>` (13 textes, P2).
- `destinyMatrix.positionArcana.<position>.N` (220 textes, P3, composés).

Les noms des arcanes suivent le tarot de Marseille (domaine public). Les textes sont des rédactions originales, sans reprise des textes de la méthode commerciale.
