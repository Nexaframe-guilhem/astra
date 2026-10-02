# Astrologie chinoise : BaZi (Quatre Piliers)

Moteur `astra-bazi` 0.1.0. Calcul pur à partir de l'instant de naissance, du lieu et, facultativement, du sexe, en s'appuyant sur les positions du Soleil d'astronomy-engine.

## Conventions retenues

- **Pilier de l'année** : il change à Lichun, quand le Soleil atteint 315° de longitude (vers le 4 février), et non au Nouvel An lunaire.
- **Pilier du mois** : il change aux douze termes solaires « jie », tous les 30° à partir de 315°. Le premier mois est celui du Tigre (寅). Le tronc du mois se déduit du tronc de l'année (règle des « cinq tigres »).
- **Pilier du jour** : il suit le cycle sexagésimal continu. Le 1er janvier 2000 est un jour wu-wu (戊午).
- **Pilier de l'heure** : douze doubles heures, de 23 h à 1 h pour le Rat (子). Le tronc de l'heure se déduit du tronc du jour (règle des « cinq rats »).
- **Heure solaire vraie** (réglage par défaut) : le jour et l'heure sont calculés à partir de la position réelle du Soleil au lieu de naissance, et non de l'heure légale. L'écart peut dépasser une heure, par exemple en France en heure d'été. Le réglage `timeBasis: 'clock'` utilise l'heure légale.
- **Changement de jour à minuit** (réglage par défaut) : entre 23 h et minuit, le jour reste celui de la date, mais l'heure prend le tronc du lendemain. C'est la convention du « Rat tardif », celle de lunar-javascript par défaut. Le réglage `dayBoundary: '23h'` fait changer le jour à 23 h.
- **Maître du jour** : le tronc du pilier du jour. Sa force saisonnière (旺相休囚死) se lit d'après l'élément de la branche du mois.
- **Dix dieux** : relation de chaque tronc, visible ou caché, avec le maître du jour.
- **Éléments** : on compte les huit caractères visibles. Un élément présent au moins trois fois est dit dominant ; un élément absent est signalé. Un second décompte inclut les troncs cachés des branches.
- **Piliers de chance** : ils n'apparaissent que si le sexe est renseigné. Le sens est direct pour un homme né une année yang ou une femme née une année yin, inverse sinon. L'âge de départ vaut le nombre de jours jusqu'au terme « jie » suivant (ou depuis le précédent), divisé par 3. On affiche huit cycles de dix ans.

## Vérifications

`tests/bazi.test.ts` compare le moteur à lunar-javascript (MIT), la bibliothèque de référence du calendrier chinois, en heure légale :
- les quatre piliers sont identiques sur 400 naissances de 1901 à 2098, et sur 3 000 lors du développement ;
- l'année change bien à Lichun 2024 ;
- les troncs cachés et les dix dieux sont identiques ;
- les piliers de chance sont identiques, et l'âge de départ concorde à 0,1 an près.

## Données personnelles

Le sexe est facultatif et ne sert qu'au sens des piliers de chance. Il est conservé dans le bloc `bazi` du profil (`sex`). Sans lui, le reste du BaZi est complet.

## À valider par l'école

- Heure solaire vraie, ou heure légale.
- Changement de jour à minuit, ou à 23 h.
- Seuils de l'équilibre des éléments (3 et plus = dominant), et prise en compte ou non des troncs cachés.
- Faut-il ajouter les étoiles symboliques (Shen Sha), les combinaisons de branches ou l'élément utile (Yong Shen) ? Ces calculs relèvent davantage de l'interprétation que du calcul et varient selon les écoles.

## Contenus

- `bazi.dayMaster.<tronc>` (10) et `bazi.animals.<animal>` (12) : P1, rédigés.
- `bazi.seasonal.<état>` (5), `bazi.pillars.<pilier>` (3) et `bazi.tenGods.<dieu>` (10) : P2, rédigés. `bazi.elementBalance.<élément>.<excess|missing>` (10) : P2, composés.
- `bazi.dayPillar.<tronc>-<branche>` (60) : P3, composés.
