# Astrologie védique (Jyotish)

Moteur `astra-jyotish` 0.1.0. Calcul pur à partir de l'instant de naissance (UTC) et des coordonnées, sur les mêmes positions astronomiques que l'astrologie tropicale (astronomy-engine, MIT).

## Conventions retenues

- **Zodiaque sidéral, ayanamsa Lahiri (Chitrapaksha).** Valeur moyenne de 23,245524743° au 21 mars 1956 (JD 2435553,5), propagée par la précession générale en longitude (IAU 1976). La nutation en longitude est ajoutée, comme dans Swiss Ephemeris, pour l'appliquer aux positions vraies de la date. Valeur moyenne en J2000 : 23,85709° (23°51′25″).
- **Maisons (bhavas) en signes entiers** à partir du signe du lagna.
- **Rahu et Ketu** : nœud lunaire moyen par défaut (usage traditionnel), Ketu exactement opposé. Le nœud vrai est disponible en réglage.
- **Nakshatras** : 27 divisions de 13°20′, chacune en 4 padas de 3°20′. Maître du nakshatra selon l'ordre de la Vimshottari.
- **Navamsa (D9)** : signe = partie entière de (longitude × 9 / 30), modulo 12.
- **Dignités** : exaltation, chute et domicile des sept planètes classiques. Aucune dignité n'est attribuée à Rahu et Ketu, faute de consensus entre écoles.
- **Vimshottari dasha** : 120 ans, ordre Ketu, Vénus, Soleil, Lune, Mars, Rahu, Jupiter, Saturne, Mercure. Le solde de la première période est proportionnel à la part du nakshatra lunaire qui reste à parcourir. Les antardashas durent (années de la mahadasha × années de la sous-période) / 120. Année de 365,25 jours.
- **Carte** : style nord-indien (losanges fixes, lagna en haut). Les nombres indiquent les signes (1 = Bélier).

## Vérifications

`tests/jyotish.test.ts` compare le moteur à natalengine (MIT) sur les huit profils de référence : positions sidérales des sept planètes à moins de 0,01°, même nakshatra, même maître de première dasha et même solde à 0,05 an près. L'écart restant vient du modèle d'ayanamsa (linéaire chez natalengine) et de la nutation. Le nœud vrai de natalengine est une approximation : Rahu et Ketu ne sont pas comparés.

## À valider par l'école

- Ayanamsa : Lahiri est le standard officiel indien ; Raman ou Krishnamurti sont possibles.
- Rahu et Ketu en nœud moyen ou vrai.
- Style de carte : nord-indien, ou sud-indien (signes fixes).
- Année des dashas : 365,25 jours ou année « savana » de 360 jours.
- Dignités de Rahu et Ketu, si l'école en utilise.

## Contenus

- `jyotish.lagna.<signe>` (12), `jyotish.grahas.<graha>` (9), `jyotish.nakshatras.<nakshatra>` (27), `jyotish.dashas.<graha>` (9) : P1, rédigés.
- `jyotish.grahaInRashi.<graha>.<signe>` (108, P2) et `jyotish.grahaInBhava.<graha>.<maison>` (108, P3) : composés à partir de briques (thème du graha, manière du signe, domaine de la maison, dignité).

Textes originaux, symbolique traditionnelle du domaine public.
