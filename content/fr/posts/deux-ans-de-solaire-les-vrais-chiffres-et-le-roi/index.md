---
title: "Deux ans de solaire : les vrais chiffres, le vrai ROI"
tags:
- solar-panels
- energy
- home-assistant
- data
date: '2026-08-16T09:00:00+02:00'
slug: deux-ans-de-solaire-les-vrais-chiffres-et-le-roi
description: "24 mois de données mesurées sur une installation de 12 panneaux en toiture — production, autoconsommation, revente du surplus et retour sur investissement réel."
summary: "12 panneaux, 3 micro-onduleurs, pas de batterie — voici ce que les 24 premiers mois ont réellement produit, autoconsommé, injecté et rapporté."
url: /fr/deux-ans-de-solaire-les-vrais-chiffres-et-le-roi/
aliases:
  - /deux-ans-de-solaire-les-vrais-chiffres-et-le-roi
---

Il y a deux ans, par une matinée ensoleillée de septembre, douze rectangles sombres sont apparus sur mon toit. Pas encore de tableau de bord domotique, pas d'énergie monitor, pas de télémétrie d'onduleur — juste un installateur, quelques perceuses et trois micro-onduleurs APS DS3 branchés sur le tableau électrique.

Cet article est la réponse à la question que tout le monde pose après le départ des installateurs : **qu'est-ce que cette installation m'a réellement apporté depuis ?**

J'ai 24 mois de données mesurées : rapports de production mensuels des micro-onduleurs, relevés mensuels d'import réseau via le compteur Linky, une facture annuelle du contrat d'achat OA, et une instance Home Assistant qui récupère la production et les registres réseau en quasi temps réel. Tout ce qui suit provient de ces sources — rien n'est modélisé, rien n'est extrapolé au-delà d'une simple interpolation mensuelle pour la répartition HP/HC.

> Avertissement rapide avant les chiffres : je ne suis ni installateur, ni électricien, ni conseiller financier. Les chiffres ci-dessous sont ceux de mon propre foyer et ne correspondront pas aux vôtres. Les tarifs varient selon le pays, le contrat et l'année. Rien ici n'est un conseil en investissement.

## TL;DR — les chiffres clés

| Métrique | Valeur |
| --- | --- |
| Panneaux | 12 (≈ 3 kWc) sur 3 micro-onduleurs APS DS3 (4 par onduleur) |
| Mise en service | septembre 2024 |
| Production totale (24 mois) | **12 461 kWh** |
| Autoconsommée | **7 572 kWh (60,8 %)** |
| Surplus injecté / facturé OA | **4 889 kWh** |
| Gain total estimé (achat évité + revente OA) | **2 234 €** |
| Retour sur investissement sur 13 000 € TTC | **≈ 11,1 ans** |

Le tableau de bord interactif derrière ces chiffres — production, import, bilan mensuel, gain et cumul — est accessible à **`/solar-analysis/`**. Il contient les mêmes données que la suite de cet article ; tout ce qui suit est résumé, le tableau de bord est explorable.

## L'installation, en bref

- **12 panneaux**, répartis équitablement en 3 strings de 4 (un string par micro-onduleur). Pas d'optimiseur par panneau — les DS3 font leur propre MPPT par panneau.
- **Pas de batterie.** Tout le surplus est réinjecté sur le réseau et payé au tarif de l'Obligation d'Apart (OA) résidentiel à 13,01 c€/kWh (Tier 1, plafond 9 600 kWh/an), puis 5,00 c€/kWh au-delà.
- **Tarifs utilisés pour le calcul du coût évité** (TTC, option base EDF) : HP 0,2110 €/kWh, HC 0,1624 €/kWh, abonnement fixe 30,59 €/mois. Je suppose que le solaire autoconsommé remplace principalement des achats en heures pleines, ce qui est l'hypothèse conservatrice pour un foyer sans pilotage actif des charges.
- **Monitoring** : Home Assistant avec :
  - le compteur énergie de l'ECU APS (`sensor.ecu_lifetime_energy`, actuellement 12 476,8 kWh),
  - le rapport mensuel officiel des micro-onduleurs (les chiffres derrière chaque graphique ici),
  - les registres Linky « énergie active injectée » et « énergie active soutirée ».

Une discussion plus détaillée sur *faut-il ajouter une batterie maintenant*, à la lumière de ces chiffres, se trouve dans mon précédent article [Une batterie solaire est-elle rentable en 2026 ?](/fr/une-batterie-solaire-est-elle-rentable-en-2026/) — réponse courte pour les francophones : pas encore, les gains sont trop faibles au regard du coût de la batterie sauf évolution tarifaire majeure.

## Année 1 vs Année 2 vs 12 derniers mois

Le tableau récapitulatif ci-dessous provient du bloc « Bilan annuel » du tableau de bord, qui utilise la facture pour l'Année 1 et le registre Linky pour l'Année 2. L'Année 2 est partielle (données au 10 août 2026).

| Période | Production | Autoconsommée | Surplus injecté | Évité | Revente OA | Gain total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **Année 1** (sept 2024 → août 2025) | 6 498 kWh | 4 067 kWh | 2 431 kWh | 858,18 € | 316,26 € | **1 174,44 €** |
| **Année 2** (sept 2025 → août 2026, partiel) | 5 963 kWh | 3 505 kWh | 2 458 kWh | 739,59 € | 319,78 € | **1 059,37 €** |
| **12 derniers mois complets** (août 2025 → juillet 2026) | 6 429 kWh | 3 801 kWh | 2 629 kWh | — | — | **1 144 €** |
| **Total 24 mois** | 12 461 kWh | 7 572 kWh | 4 889 kWh | 1 597,77 € | 636,04 € | **2 233,84 €** |

Quelques observations :

1. **La production est plus stable entre années que prévu.** L'Année 1 (sept 2024 → août 2025) a été légèrement plus ensoleillée que l'Année 2 (5 963 kWh vs 6 498 kWh), mais la fenêtre glissante 12 mois (6 429 kWh) se situe pile entre les deux, ce qui suggère essentiellement du bruit météo plutôt qu'une tendance baissière.
2. **La part d'autoconsommation reste dans la bande 60 %.** Environ 60,8 % de chaque kWh produit est consommé sur place. Sans pilotage des charges (pas encore de recharge VE pilotée par la production), c'est la forme naturelle d'un foyer où les charges diurnes sont déjà faibles : frigo, box internet, deux heures de cuisson et c'est à peu près tout.
3. **Le surplus augmente lentement** (2 431 → ~2 458 kWh). Cela suit la dominante estivale de l'Année 2 — plus de soleil aux heures de pointe, plus d'export. La production annuelle est un peu inférieure, mais la part qui arrive quand personne n'est à la maison est plus grande.

## Comment je fais confiance aux chiffres

La production est le plus simple — le rapport mensuel des micro-onduleurs est essentiellement de qualité bancaire : c'est sur lui qu'est construite la facture.

L'autoconsommation est la partie délicate. L'astuce que j'utilise :

- En Année 1, le surplus OA **facturé** est exactement 2 431 kWh. Cette valeur est sur la facture et n'est pas une estimation.
- J'en déduis une « base journalière d'autoconsommation » par dichotomie (recherche binaire techniquement) jusqu'à ce que la production mensuelle modélisée de l'Année 1 moins cette base reproduise les 2 431 kWh de surplus en fin d'année. La base qui y arrive en Année 1 est **13,54 kWh/jour** et en Année 2 est **12,44 kWh/jour** (plus bas car l'Année 2 est partielle et dominée par les mois d'hiver en première moitié).
- Les chiffres d'autoconsommation mensuels présentés dans le tableau de bord sont le résultat de ce modèle — ils sont cohérents avec le surplus facturé mais ne sont pas eux-mêmes de qualité facture.

Ce n'est pas une décomposition parfaite. La répartition entre autoconsommation HP et HC est approximée par interpolation des index HP/HC Linky sur chaque jour. Si vous cherchez une granularité infra-journalière, le pipeline smart-meter qui la produit est sur la liste.

## Le tableau de bord interactif

Tout ce qui précède est un résumé. Le tableau de bord à `/solar-analysis/` est le même jeu de données, en interactif.

Il affiche quatre graphiques sur 24 mois :

1. **Production mensuelle** — issue du rapport micro-onduleurs, valeur exacte.
2. **Import réseau mensuel (HP / HC)** — issu des relevés mensuels du gestionnaire de réseau, répartition HP/HC par interpolation.
3. **Bilan mensuel** — production décomposée en autoconsommée, surplus injecté et import réseau (empilé).
4. **Gain mensuel et cumul** — barres de gain avec une ligne pour le cumul.

Plus le tableau récapitulatif annuel, un rollup sur 12 mois complets, une comparaison avant/après de l'import réseau, et les notes méthodologiques.

**Quelques raisons honnêtes de ne pas l'avoir embarqué en iframe dans l'article :**

- La page est haute (quatre graphiques et plusieurs tableaux). Sur mobile elle imposerait un long défilement avant de revenir à l'histoire.
- Le bundle Chart.js n'est pas anodin et se retéléchargerait à chaque visite de l'article. En page séparée, il n'est chargé que quand quelqu'un veut vraiment explorer.
- Il est plus facile à partager comme URL autonome — utile pour un installateur qui veut montrer à un client ce que « 24 mois de données mesurées » signifie concrètement.

## L'angle Home Assistant (un paragraphe)

C'est le seul endroit où je mentionnerai explicitement Home Assistant, parce qu'il est pertinent : les chiffres de production ci-dessus sont validés contre un capteur de télémétrie en temps réel que je consulte sur mon téléphone quasi quotidiennement. Sur les 90 derniers jours, le capteur de production journalière affiche une moyenne de **13,59 kWh/jour** — quasiment ce que donnerait un calcul rapide à partir du total annuel + une saisonnalité été/hiver typique. Le compteur cumul ECU est en avance de 0,13 % sur le rapport mensuel cumulé, ce qui reste dans le bruit des resets ponctuels / décalages d'horodatage. La facture OA reste payée sur le rapport, donc c'est lui qui fait foi en cas de divergence.

Les capteurs de prévision (production jour/nuitaille prédite à partir des prévisions de couverture nuageuse) sont utiles pour une décision précise de décalage de charge : *brancher la VE cette nuit, ou attendre demain ?* Ce n'est pas une optimisation énorme à cette échelle, mais cela déplace une part significative de la recharge vers les heures productives.

S'il y a de l'intérêt je peux détailler la configuration HA plus tard — la version courte : quelques capteurs REST, un capteur `template`, et un petit script d'aide pour l'estimation du surplus.

## ROI : 11,1 ans. Qu'est-ce qui le change ?

Cas de base : **13 000 € coût installé, 1 144–1 174 € gain annuel → 11,1 ans de payback** (11,4 ans en base glissante).

Quelques sensibilités de mon carnet :

| Scénario | Δ vs base | Nouveau payback |
| --- | --- | --- |
| Tarifs +10 % tous postes (HP, HC, OA) | +114 €/an de gain | **≈ 10,1 ans** |
| Dégradation panneaux 0,5 %/an (chiffre constructeur) | –6 €/an à l'année 12 | **≈ 11,2 ans** |
| Panne onduleurs à l'année 12 (~2 500 € pour 3 remplacements) | somme forfaitaire | **≈ 12,6 ans** |
| Répartition 2/3 est · 1/3 ouest au lieu de plein sud | –8 à –12 % de production | **≈ 12,4 ans** |
| Ajout batterie 5 kWh aujourd'hui (~6 000 €) | rogne le surplus, accroît l'auto mais payback propre ~17 ans | **composite ~13,5 ans** |

La version courte : **le solaire dans le centre-sud/nord de la France est rentable, mais pas spectaculairement.** C'est un compte d'épargne indexé sur l'inflation qui couvre aussi partiellement le risque réseau. Si vous cherchez du *rendement*, vous ne battrez pas historiquement les marchés actions. Si vous cherchez des *économies stables, peu volatiles, sans avoir à regarder un écran*, il fait le job.

## Ce que je changerais si je recommençais

- Je répartirais le champ à environ deux tiers est / un tiers ouest au lieu de plein sud. La production est 8–12 % plus faible en absolu, mais la courbe est plus plate sur la journée et le ratio d'export est nettement plus petit. Avec une future batterie en ligne de mire, c'est un profil plus intéressant.
- Je garderais les micro-onduleurs DS3 — ils sont *très* tolérants aux ombrages partiels des arbres voisins et leur MPPT par panneau paye vraiment son dû ici.
- Je budgéterais la batterie pour l'année 4 ou 5, **pas l'année 1**. Les chiffres de mon article précédent restent valables : au prix matériel actuel, le ROI batterie seul n'est pas attractif, mais l'*optionalité* de disposer d'un point d'arbitrage ou de backup plus tard a une vraie valeur si les tarifs évoluent.

## Méthodologie et avertissement

- **Source production :** rapport mensuel des micro-onduleurs, total 12 461 kWh sur 24 mois. Le compteur ECU HA indique 12 476,8 kWh (≈0,13 % d'écart, dans le bruit des resets ; la valeur micro-onduleurs est ce qui est payé, c'est donc la valeur canonique ici).
- **Import réseau :** relevés mensuels du gestionnaire de réseau (exacts). La répartition HP/HC mensuelle est interpolée linéairement à partir des registres Linky « index HP » / « index HC » — assez précise à résolution mensuelle, pas utilisable pour l'analyse journalière.
- **Autoconsommation :** Année 1 réconciliée exactement avec les 2 431 kWh du surplus OA sur facture. Année 2 estimée à partir du registre Linky « énergie active injectée » (2 457,9 kWh) sous le plafond Tier 1 de 9 600 kWh/an.
- **Tarifs :** option base EDF, TTC. HP 0,2110 €, HC 0,1624 €, revente OA 0,1301 €. Votre contrat en diffère presque certainement.
- **Biais — comparaison avant/après import réseau :** la période « avant » couvre janvier → août 2024 (8 mois), la période « après » couvre septembre 2024 → 10 août 2026 (≈23,6 mois). Les deux ne sont pas symétriques saisonnièrement, le foyer a fait l'acquisition d'une borne VE entre les deux, et la demande de chauffage se concentre sur les mois d'hiver. La comparaison est illustrative ; traitez le passage 41,3 → 37,2 kWh/jour comme une *direction* plus que comme une *magnitude*.
- **Pas un conseil financier.** Je partage les données de mon propre foyer. Faites vos propres chiffres avec vos tarifs et votre profil de consommation avant toute décision.

Si vous voulez le jeu de données mensuel brut (JSON), ou si vous avez des questions sur un mois particulier du tableau de bord, laissez un commentaire — je suis preneur.
