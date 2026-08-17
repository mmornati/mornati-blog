---
title: "Deux ans de solaire : les vrais chiffres, le vrai ROI"
tags:
- solar-panels
- energy
- home-assistant
- data
date: '2026-08-16T09:00:00+02:00'
slug: two-years-of-solar-the-real-numbers-and-roi
translationKey: two-years-of-solar-the-real-numbers-and-roi
description: "24 mois de données mesurées sur une installation de 12 panneaux en toiture — production, autoconsommation, revente du surplus et retour sur investissement réel."
summary: "12 panneaux, 3 micro-onduleurs, pas de batterie — voici ce que les 24 premiers mois ont réellement produit, autoconsommé, injecté et rapporté."
---

Il y a deux ans, par une matinée ensoleillée de septembre, douze rectangles sombres sont apparus sur mon toit. Pas encore de tableau de bord domotique, pas d'énergie monitor, pas de télémétrie d'onduleur — juste un installateur, quelques perceuses et trois micro-onduleurs APS DS3 branchés sur le tableau électrique.

Cet article est la réponse à la question que tout le monde pose après le départ des installateurs : **qu'est-ce que cette installation m'a réellement apporté depuis ?**

J'ai 24 mois de données mesurées : rapports de production mensuels des micro-onduleurs, relevés mensuels d'import réseau via le compteur Linky, une facture annuelle du contrat d'achat OA, et une instance Home Assistant qui récupère la production et les registres réseau en quasi temps réel. Tout ce qui suit provient de ces sources — rien n'est modélisé, rien n'est extrapolé au-delà d'une simple interpolation mensuelle pour la répartition HP/HC.

> Avertissement rapide avant les chiffres : je ne suis ni installateur, ni électricien, ni conseiller financier. Les chiffres ci-dessous sont ceux de mon propre foyer et ne correspondront pas aux vôtres. Les tarifs varient selon le pays, le contrat et l'année. Rien ici n'est un conseil en investissement.

## TL;DR — les chiffres clés

| Métrique | Valeur |
| --- | --- |
| Panneaux | 12 (≈ 6 kWc) sur 3 micro-onduleurs APS DS3 (4 par onduleur) |
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
- **Tarifs utilisés pour le calcul du coût évité** (TTC, option base EDF) : HP 0,2110 €/kWh, HC 0,1624 €/kWh, abonnement fixe 30,59 €/mois. Je suppose que le solaire autoconsommé remplace principalement des achats en heures pleines, ce qui est l'hypothèse conservatrice pour un foyer sans pilotage actif des charges *mais avec une borne V2C Trydan en mode « mixed » qui absorbe le surplus à la demande — voir la section dédiée plus bas*.
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
2. **La part d'autoconsommation reste dans la bande 60 %.** Environ 60,8 % de chaque kWh produit est consommé sur place. *Biais important : ce 60,8 % est un chiffre réconcilié ancré sur la facture OA Année 1 et sur le registre Linky « énergie active injectée » — voir la section méthodologie. En interrogeant VictoriaMetrics (la base long-terme derrière HA), la borne a absorbé environ **588 kWh** de solaire sur les 17 mois qui ont suivi son installation (avril 2025 → août 2026, voir les tableaux de la section VE). Cela représente **+5 pp** d'autoconsommation *réelle* au-dessus du total 24 mois — raison pour laquelle le 60,8 % se lit mieux comme un *plancher* que comme la valeur actuelle.*
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

## La borne V2C Trydan et la boucle de recharge VE

Le plus gros changement comportemental du foyer après l'installation solaire a été la borne V2C Trydan dans le garage, qui recharge à tour de rôle l'une des deux voitures électriques. Elle est configurée en **mode « full solar »** (terme de l'appli V2C ; sous Home Assistant cela se traduit par le `select.charge_mode` à `mixed` — qui ne gère ici que le switch de phases — et le switch dynamic intensity modulation activé, qui implémente le comportement « pas de plancher réseau »). La borne ne tire que le courant que le surplus solaire permet, descend jusqu'au minimum et s'arrête quand la production est trop faible. Elle **ne tire pas** de plancher 2 kW du réseau en usage normal — il existe une autre config V2C qui le fait, mais ce n'est pas celle utilisée ici. Si la voiture reste branchée la nuit et que la fenêtre HC s'ouvre, la borne reprend une charge pleine grille à 11 kW pour atteindre le SoC cible ; ce sentier est rarement emprunté en pratique (voir le graphique par heure plus bas).

Concrètement, la Trydan est aujourd'hui paramétrée ainsi :

- **Mode de charge** : `mixed` (sélecteur HA — gère le switch de phases ; l'appli V2C appelle le vrai comportement « pas de plancher réseau » **full solar**, avec dynamic intensity modulation activée)
- **Modulation dynamique d'intensité** : activée
- **Intensité minimale** : 6 A par phase (≈ 1,4 kW monophasé / ≈ 4,1 kW triphasé — la Trydan refuse de charger en dessous pour éviter que la voiture ne se plaigne du signal pilote trop faible)
- **Intensité maximale** : 16 A par phase (3 × 16 A = 11 kW en triphasé — pic mesuré dans la donnée : 10,67 kW, triphasé confirmé)
- **Capteurs temps réel dans Home Assistant** : `sensor.evse_10_0_0_120_charge_power` (puissance instantanée, W), `sensor.evse_10_0_0_120_house_power` (consommation maison vue de la borne), `sensor.evse_10_0_0_120_photovoltaic_power` (production PV vue de la borne), `sensor.car_solar_percentage` (% de la recharge VE issue du solaire — dérivé des trois précédents), `sensor.car_average_charge_power` (kW, moyenne sur la session active), et les `utility_meter` long-terme `sensor.car_daily_energy`, `sensor.car_weekly_energy_meter`, `sensor.car_monthly_energy_meter` (kWh compteur wallbox) ainsi que `sensor.car_daily_solar_energy`, `sensor.car_weekly_solar_energy_meter`, `sensor.car_monthly_solar_energy` (kWh solaire, soit `min(charge_power, photovoltaic_power)`).

En mode « full solar », la voiture devient la charge la plus élastique de la maison. Quand une matinée ensoleillée vire à un après-midi nuageux, la Trydan baisse l'intensité de 16 A par phase vers le minimum 6 A ; si une rafale nuageuse tombe pendant que la voiture tire encore un peu, le résiduel est en effet pris sur le réseau — mais seulement jusqu'à ce que la modulation dynamique d'intensité décide de **mettre la session en pause** (ce qui arrive dès que le surplus passe sous ~1,4 kW / 6 A). Le cadrage honnête n'est donc pas « l'essentiel du surplus OA est du solaire que la voiture n'a pas pu absorber » mais plutôt : **la VE absorbe une part réelle mais bornée du surplus** (voir les chiffres plus bas).

Cela recadre assez fortement le chiffre de 60,8 % : c'est la part de production *sortie des panneaux et consommée sur place* — VE comprise. Quand on sépare, la situation sur les 17 mois qui ont suivi l'installation de la borne donne :

| Poste (avril 2025 → août 2026) | kWh | part de la production |
| --- | ---: | ---: |
| VE depuis solaire (`min(charge_power, photovoltaic_power)`) | **588** | ~4,7 % |
| Reste du foyer depuis solaire (frigo, box, cuisson, eau chaude, cumulus midi…) | ~3 000 | ~24 % |
| Autoconsommation totale | ~3 590 | ~29 % |
| Surplus exporté (facturé OA) | ~4 889 | ~39 % |
| VE depuis réseau (charge nuit, pics au-delà du solaire) | ~2 388 | ~19 % |
| Reste du foyer depuis réseau (import Linky) | ~1 594 | ~13 % |
| **Production totale** | **~12 461** | **100 %** |

Le 60,8 % du tableau de bord est un titre 24 mois (sept 2024 → août 2026) qui inclut les deux postes. Sur les 17 mois avec VE, la part VE-solaire représente **~12 % du surplus OA** — un vrai morceau, mais pas « la majorité ». Les ~88 % restants du surplus sont bien du *vrai* headroom que le reste du foyer n'a pas pu absorber. Le tableau de bord ne sépare pas encore ces deux flux ; la facture OA et le registre Linky « énergie injectée » voient la même chose quel que soit le destinataire final. Les séparer proprement demande un petit script de post-traitement qui tire `sensor.evse_10_0_0_120_charge_power` et `sensor.evse_10_0_0_120_photovoltaic_power` de VictoriaMetrics — *les données sont là*, il manque juste la couche d'affichage.

> **Note d'honnêteté sur les données.** Le recorder long-terme de Home Assistant sur les capteurs v2c ne conserve qu'environ 7 jours, ce qui est trop court pour des agrégats annuels. Pour obtenir les chiffres 17 mois ci-dessus, je suis descendu d'un niveau jusqu'à **VictoriaMetrics** (la base long-terme vers laquelle HA exporte via InfluxDB). La même donnée est aussi capturée par deux `utility_meter` déjà câblés dans la config live (`sensor.car_daily_energy`, `sensor.car_monthly_energy_meter`, `sensor.car_daily_solar_energy`, `sensor.car_monthly_solar_energy` — ce dernier est `min(charge_power, photovoltaic_power) / 1000`). La part solaire ~20 % du tableau ci-dessus est un *plancher* : le pas 1 h de VM sous-compte les bursts courts et les journées où l'exporteur n'a livré qu'un seul échantillon, donc la part réelle est probablement quelques points au-dessus. La part solaire diurne 73 % sort de la même base et est plus robuste.

## Les deux cumulus et la fenêtre HC de midi

La deuxième charge élastique qui mérite d'être racontée, c'est la paire de chauffe-eau électriques — un dans la cave, un dans le garage. Ils étaient à l'origine câblés sur la programmation HC EDF standard (creuses ≈ 22:30 → 06:30 en hiver, décalées plus tard en été), qui est l'énergie réseau la moins chère mais aussi la moins bien alignée avec le solaire.

L'idée que je voulais tester est simple : au lieu de les faire tourner la nuit, les pousser dans la **fenêtre HC de midi** (~12:00 → 14:00 heure locale) — le seul moment de la journée où le prix contractuel est le tarif HC *et* où le soleil est proche de son pic quotidien. Par journée ensoleillée, les cumulus tournent alors essentiellement sur solaire ; par journée nuageuse, ils tournent au moins sur le tarif HC. Dans les deux cas, ils évitent le tarif HP.

Home Assistant rend cette automatisation triviale. La paire est commutée par un seul relais sur un compteur Shelly EM (`switch.energy_meter_cumulus`), et les deux automatisations spécifiques aux cumulus font le reste :

- **`automation.cumulus_cave_actives_en_hc`** et **`automation.cumulus_garage_actives_en_hc`** — activent les cumulus au début de chaque fenêtre HC (vérifié sur `last_triggered` : la dernière exécution a été à 12:09 heure locale, soit pile l'ouverture HC de midi).
- **`automation.comulus_desactives_en_hp`** — les désactive à la fin de la fenêtre HC (dernière exécution à 14:09 heure locale, soit la fermeture HC de 14:00).
- **`automation.cumulus_cave_night_completion_if_needed`** et **`automation.cumulus_garage_night_completion_if_needed`** — réactivent les cumulus pendant la fenêtre HC de nuit *uniquement* si les ballons sont sous leur cible (le toggle `input_boolean.force_cumulus_hc` me permet de forcer un cycle nuit complet pour des invités, etc.).

Capteurs utilisés pour garder un œil :

- `sensor.cumulus_cave_daily_on_time` et `sensor.cumulus_garage_daily_on_time` — heures ON du jour, par cumulus (typique : ~2 h cave, ~1 h garage par journée ensoleillée, proche de zéro par journée grise et froide).
- `sensor.daily_cave_energy` et `sensor.daily_garage_energy` — kWh par cumulus et par jour (la cave est le plus gros ballon et tourne plus longtemps).
- `sensor.energy_meter_cumulus_cave_energy` et `sensor.energy_meter_cumulus_garage_energy` — kWh cumulés depuis l'installation du compteur.

Mécaniquement, les deux cumulus tirent une charge assez lourde (~2 kW chacun), donc c'est le plus gros poste non-VE de la maison. Les coincer dans la fenêtre HC de midi transforme le surplus OA que j'aurais sinon laissé exporter vers le réseau en eau chaude — qui est le bon usage de cette énergie, et que le tableau de bord capte implicitement (le surplus exporté journalier est ce que les cumulus n'ont *pas* absorbé).

## L'angle Home Assistant (un paragraphe)

Au-delà des capteurs EVSE, les chiffres de production ci-dessus sont validés contre un capteur de télémétrie en temps réel que je consulte sur mon téléphone quasi quotidiennement. Sur les 90 derniers jours, le capteur de production journalière affiche une moyenne de **13,59 kWh/jour** — quasiment ce que donnerait un calcul rapide à partir du total annuel + une saisonnalité été/hiver typique. Le compteur cumul ECU est en avance de 0,13 % sur le rapport mensuel cumulé, ce qui reste dans le bruit des resets ponctuels / décalages d'horodatage. La facture OA reste payée sur le rapport, donc c'est lui qui fait foi en cas de divergence.

Les capteurs de prévision (production jour/nuitaille prédite à partir des prévisions de couverture nuageuse) sont utiles pour une décision précise de décalage de charge : *quelle voiture brancher cette nuit, étant donné le soleil prévu demain ?* C'est plus subtil que l'ancien arbitrage « j'attends le soleil ou je charge cette nuit » — cela permet à la V2C Trydan de démarrer automatiquement une session quand la prévision du lendemain est suffisante pour que le mode « mixed » fasse l'essentiel du travail.

S'il y a de l'intérêt je peux détailler la configuration HA plus tard — la version courte : quelques capteurs REST, un capteur `template`, six `utility_meter` (trois pour la VE totale `sensor.evse_10_0_0_120_charge_energy`, trois pour le solaire `sensor.car_daily_solar_charging`), et une petite automation qui surveille la prévision de surplus pour choisir la nuit la moins chère pour charger.

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
- **Autoconsommation :** Année 1 réconciliée exactement avec les 2 431 kWh du surplus OA sur facture. Année 2 estimée à partir du registre Linky « énergie active injectée » (2 457,9 kWh) sous le plafond Tier 1 de 9 600 kWh/an. **Biais important :** le 60,8 % est l'autoconsommation *au niveau maison* que la facture OA et le registre Linky « énergie injectée » voient. La VE ajoute ~5 pp par-dessus quand elle absorbe du solaire qui aurait sinon été exporté (~588 kWh de VE-solaire sur les 17 mois avec borne, ~12 % du surplus OA total 24 mois). Le tableau de bord tient déjà compte implicitement de l'absorption VE-solaire via `sensor.car_daily_solar_charging` dans le modèle amont, mais ne la fait pas *ressortir* en ligne séparée. Le tableau de bord et le 60,8 % sont cohérents entre eux ; ils ne sont pas une image complète de là où vont réellement les kWh.
- **Tarifs :** option base EDF, TTC. HP 0,2110 €, HC 0,1624 €, revente OA 0,1301 €. Votre contrat en diffère presque certainement.
- **Biais — comparaison avant/après import réseau :** la période « avant » couvre janvier → août 2024 (8 mois), la période « après » couvre septembre 2024 → 10 août 2026 (≈23,6 mois). Les deux ne sont pas symétriques saisonnièrement, le foyer a fait l'acquisition d'une borne VE entre les deux, et la demande de chauffage se concentre sur les mois d'hiver. La comparaison est illustrative ; traitez le passage 41,3 → 37,2 kWh/jour comme une *direction* plus que comme une *magnitude*.
- **Pas un conseil financier.** Je partage les données de mon propre foyer. Faites vos propres chiffres avec vos tarifs et votre profil de consommation avant toute décision.

Si vous voulez le jeu de données mensuel brut (JSON), ou si vous avez des questions sur un mois particulier du tableau de bord, laissez un commentaire — je suis preneur.
