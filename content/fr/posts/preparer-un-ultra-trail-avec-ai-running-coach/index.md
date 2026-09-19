---
title: 'Préparer un ultra-trail avec ai-running-coach : de la planification à la ligne d''arrivée'
categories:
- ai-coding-agents
tags:
- ai
- agents
- trail
- running
- garmin
- mcp
- ultra-trail
date: '2026-09-19T07:41:00.000000+00:00'
slug: preparer-un-ultra-trail-avec-ai-running-coach
description: Comment j'ai préparé l'Ultra 110 km Trail Côte d'Opale avec ai-running-coach, un projet open-source d'agents IA connectés à Garmin — planification par périodes, nutrition, analyse des données et stratégie de course.
url: /fr/preparer-un-ultra-trail-avec-ai-running-coach/
aliases:
- /preparer-un-ultra-trail-avec-ai-running-coach
---

Le 13 septembre 2026, à 02h00 du matin, je me suis élancé sur la ligne de départ de l'**Ultra 110 km Trail Côte d'Opale** à Wimereux. 15h26 plus tard, je franchissais la ligne d'arrivée. Entre ces deux moments, il n'y a pas eu que de l'entraînement : il y a eu des mois de **planification, d'analyse et d'ajustements** — et une bonne partie de ce travail a été faite avec l'aide d'agents IA.

Je ne veux pas vous raconter ma course ni mes entraînements : je veux utiliser toutes ces données pour vous montrer comment une **planification appuyée sur des données analysées par l'IA** peut aider à bien préparer une course, quelle qu'elle soit.

Dans cet article, je vous raconte comment j'ai utilisé [ai-running-coach](https://github.com/mmornati/ai-running-coach), un projet open-source que j'ai créé, pour préparer cet objectif : le plan d'entraînement par périodes, la nutrition, l'analyse de mes données Garmin, et la stratégie de course jusqu'au jour J.

## Le projet : des agents IA spécialisés, connectés à Garmin

[ai-running-coach](https://github.com/mmornati/ai-running-coach) est un projet **100 % en français** qui fournit des agents IA et des skills pour aider les coureurs à préparer un objectif (course, trail, ultra) directement dans leur IDE préféré (Claude Code, OpenCode, Gemini CLI, Cursor, Windsurf).

Le projet s'appuie sur **4 agents spécialisés** :

| Agent | Rôle |
|:------|:-----|
| 🧠 **coach** | Planifie l'entraînement par périodes, ajuste selon les contraintes (météo, santé, vie perso) |
| 🗺️ **course-strategist** | Analyse les parcours (GPX), définit les allures et la stratégie de course |
| 🩺 **medical** | Analyse les données de santé (HRV, FC repos, sommeil, readiness) et la météo |
| 🥗 **nutritionist** | Construit les plans nutrition entraînement et course |

Et **8 skills** : analyse GPX, comparaison de parcours, planification Garmin, météo, analyse de séances, etc. L'accès à **Garmin Connect** se fait via `garmin-mcp`, avec une liste blanche d'outils.

L'installation se fait en une commande :

```bash
git clone https://github.com/mmornati/ai-running-coach.git
cd ai-running-coach
./install.sh
```

Le script configure automatiquement l'accès Garmin, les dossiers de travail (`activities/`, `medical/`, `nutrition/`, `planning/`, `rapports/`, `resources/`) et l'intégration à votre IDE.

Tout le travail se fait en **markdown, en français**, dans un espace de travail structuré. Chaque séance, chaque rapport, chaque plan est un fichier que l'on peut relire, versionner et partager. C'est exactement ce que j'ai fait pendant 8 mois.

## L'objectif : l'Ultra 110 km Trail Côte d'Opale

Mon objectif était clair : **109,8 km, +1768 m de dénivelé, départ 02h00, sur le littoral de la Côte d'Opale** (sable, dunes, falaises, vent). Un parcours exigeant, avec des barrières horaires à respecter :

| Point | Km | Barrière |
|:------|:---|:---------|
| Châtelet | 42,4 | 09h00 |
| Hervelinghen | 77,6 | 14h30 |
| Cap Gris-Nez | 94,1 | 17h00 |
| Arrivée | 109,8 | 19h35 |

Avec le coach, nous avons défini un **objectif réaliste de 15h00** (allure moyenne 8:12/km), un scénario ambitieux à 12h49 et un scénario sécurité à 16h00. La règle cardiaque était simple : **jamais au-dessus de 140 bpm**, avec une cible de 116-133 bpm (Z2).

## Le plan d'entraînement par périodes

Le plan a été construit **par périodes**, du début de l'année jusqu'au jour J, avec des ajustements permanents basés sur mes contraintes personnelles, la météo et mon état de santé.

### Les phases finales (S1 → S5)

Les 5 dernières semaines illustrent bien la logique :

| Phase | Période | Contenu | Volume |
|:------|:--------|:--------|:-------|
| **S1** | 10-16/08 | Sortie longue 48 km (Vicere-Mara-Sanprimo) | ~55 km |
| **S2** | 17-23/08 | Volume maximal, sorties dunes | ~72 km |
| **S3** | 24-30/08 | Vacances d'été + **PIC 30-40 km** (test nutrition) | ~58 km |
| **S4** | 31/08-06/09 | Taper -40 % | ~42 km |
| **S5** | 07-13/09 | Taper -60/-70 % + course | ~30 km |

![Volume hebdomadaire par phase](/images/preparer-un-ultra-trail-avec-ai-running-coach/07-volume-entrainement.png)

### Les ajustements en cours de route

Ce qui fait la différence, c'est la capacité à **ajuster**. Quelques exemples concrets :

- **Maladie mi-juin** : 14 jours sans entraînement. Le plan a été rééquilibré, sans panique, en décalant les pics.
- **Vacances d'été (S3)** : le coach a intégré la chaleur comme contrainte, avec des sorties plus courtes le matin et de la marche l'après-midi.
- **Météo** : chaque sortie longue était précédée d'une analyse météo (via le skill dédié), avec des fenêtres de départ ajustées.
- **La sortie 48 km coupée à 38 km** : le 10/08, la sortie longue prévue à 48 km a été réduite à 38,5 km. Pourquoi ? L'analyse de la récupération (readiness, HRV) montrait que le corps n'était pas prêt. Résultat : une sortie de 38,5 km / +1849 m en 6h09 à FC 133 — **9 bpm de moins que la même sortie en 2024**. La preuve que l'écoute des données paie.

### Pas que de la course à pied

Le plan n'était pas uniquement du running. Les données Garmin montrent une vraie variété :

- **Trail** : les sorties longues (38,5 km Albavilla, 30,9 km Tournai, 30,5 km Tournai PIC)
- **Randonnée** : les Cinque Terre en vacances (10,4 km, 3h30) — du volume en douceur
- **Marche** : en vacances, récupération active
- **Vélo d'intérieur** : 2 séances en juin-juillet
- **Renforcement** : circuit force phase 3, force allégée en taper

Cette variété est un vrai plus pour un ultra : elle maintient le volume sans marteler les articulations.

## La nutrition : testée, puis planifiée au gramme

La nutrition a été un axe majeur. L'approche : **tester pendant l'entraînement, puis planifier précisément pour le jour J**.

### Le test du 30/08 (sortie pic)

Le 30/08, lors de la sortie pic de 30,5 km, j'ai testé le protocole nutrition complet : produits, rotations, timing. C'est ce qui a permis de valider le plan pour la course.

![Résumé Garmin de la sortie du 30/08](/images/preparer-un-ultra-trail-avec-ai-running-coach/08-garmin-sortie-30-08.png)

*Résumé Garmin de la sortie pic : 30,53 km, 3h46, 1150 m D+, FC moyenne 129 bpm, 2340 kcal — le test complet du protocole nutrition en conditions réelles.*

### Le plan jour J

Le plan nutrition final (v3) était d'une précision remarquable :

| Paramètre | Valeur |
|:----------|:-------|
| **Dépense estimée** | ~8 500-9 500 kcal |
| **Ingestion visée** | ~4 300-4 800 kcal (290-320 kcal/h) |
| **Glucides** | 70-80 g/h (double transporteur : glucose + fructose) |
| **Hydratation** | 500-750 ml/h, ~8,5-10 L au total |
| **Sodium** | 500-700 mg/L (Aptonia Electrolytes) |
| **Coût total** | ~81 € |

Les produits étaient choisis avec précision : **gels Baouw** (fructose), **pâtes de fruits Aptonia** (glucose), **purées salées Baouw** (sodium + anti-écœurement), **barres crunchy** en fin de course. Le tout pour ~1,9 kg de nourriture dans le sac.

Un point important : le protocole a été adapté pour **minimiser l'apport en potassium** pendant la course (protocole bas-K), avec des choix précis : électrolytes Aptonia citron, compotes poire-pomme-menthe, bananes et dattes bannies des ravitos, remplacées par des oranges. Ce genre de détail, c'est exactement ce qu'un agent nutritionniste peut suivre et vérifier.

![Plan nutrition jour J](/images/preparer-un-ultra-trail-avec-ai-running-coach/09-plan-nutrition-jour-j.png)

*Le plan nutrition heure par heure : produit, glucides, cumul et action à chaque ravito — avec les rappels de remplissage des flasques et le protocole bas-K (orange au lieu de banane/datte).*

## L'analyse de mon état via la sync Garmin

Chaque matin, l'agent **medical** analysait mes données Garmin : HRV, FC repos, sommeil, readiness, ACWR, VO2max. Ces rapports guidaient les décisions d'entraînement.

### La tendance VO2max

![Tendance VO2max](/images/preparer-un-ultra-trail-avec-ai-running-coach/05-vo2max-tendance.png)

Le VO2max est passé de 51 à 53 ml/kg/min en août, puis s'est stabilisé à 52 — une belle progression sur la période.

### Des zones cardiaques recalculées, pas celles de Garmin

Un point intéressant : les zones utilisées pour piloter l'entraînement n'étaient **pas celles de Garmin/Strava**. En avril, l'agent coach a recalculé mes zones à partir de mes données (FCmax 177, FC repos 40-45) avec la **méthode de Karvonen** (basée sur la réserve cardiaque), différente de la méthode par pourcentage de FCmax utilisée par défaut.

| Zone | Garmin/Strava (% FCmax) | Karvonen (% réserve) |
|:-----|:------------------------|:---------------------|
| **Z1** | <115 | 109-122 |
| **Z2** | 116-143 | **122-136** |
| **Z3** | 144-158 | 136-150 |
| **Z4** | 159-172 | 150-163 |
| **Z5** | >173 | 163-177 |

La différence est subtile mais importante pour un ultra : la méthode Karvonen intègre la FC repos, donc les zones sont **plus personnalisées** que le simple pourcentage de FCmax. Concrètement, la limite haute de Z2 passait de 143 bpm (Garmin) à **133-136 bpm** — et c'est cette valeur plus stricte qui a guidé mes footings longs et la règle « jamais au-dessus de 140 bpm » le jour J. Le résultat parle de lui-même : 74,8 % du temps en Z1+Z2 sur la course.

> 💡 **Pourquoi c'est différent, et lequel est mieux ?** La méthode % FCmax est simple et universelle, mais ignore la FC repos : deux coureurs avec la même FCmax mais des FC repos très différentes auront les mêmes zones, alors que leur physiologie diffère. La méthode Karvonen (FC réserve = FCmax − FC repos) est plus précise pour les athlètes entraînés, dont la FC repos est basse (40-45 ici) — c'est pour ça que les zones Karvonen sont plus basses et plus strictes. L'intérêt de refaire ce calcul : il est **gratuit, basé sur tes propres données**, et il évite de s'entraîner trop dur en Z2 « apparente » alors qu'on est déjà en Z3 physiologique. La limite : il reste une estimation — un test de seuil lactique (ou un test de terrain type 30 min) affinerait encore les valeurs.

### Le jour J : un cardio maîtrisé

Le jour de la course, l'analyse des données a confirmé une **gestion cardiaque impeccable** :

![Fréquence cardiaque sur la course du 13/09](/images/preparer-un-ultra-trail-avec-ai-running-coach/10-fc-course-13-09.png)

*La trace cardiaque des 15h26 de course : un plateau globalement stable entre 115 et 135 bpm, quelques pics isolés au-dessus de 140 bpm (montées raides, relances), et surtout aucune dérive à la hausse sur la durée — le signe que l'allure était tenable.*

![Répartition par zones cardiaques](/images/preparer-un-ultra-trail-avec-ai-running-coach/04-zones-cardiaques.png)

- **74,8 % du temps en Z1+Z2** (≤133 bpm), 63 % sous 130 bpm
- **FC moyenne : 125 bpm** sur 15h26
- **Aucune dérive cardiaque** : la FC moyenne baisse au fil des blocs (126 → 115 bpm), signe d'une gestion saine

![FC moyenne par bloc de 10 km](/images/preparer-un-ultra-trail-avec-ai-running-coach/01-fc-par-10km.png)

## La planification de la course

### L'analyse GPX

Pour chaque parcours important, l'agent **course-strategist** analysait le GPX : distance, D+, profil, pentes, terrain. Un exemple : l'évaluation du parcours Mont-de-l'Enclus pour la sortie pic du 30/08 — 35,6 km analysés, verdict « trop long », **coupe recommandée à 30-32 km**, avec le point de coupe exact (km 30,1) et le retour par la route. C'est ce niveau de détail qui rend l'outil utile.

### Le plan d'allures et ravitos (J-1)

La veille, le plan final était prêt : un tableau par segment avec allures cibles, passages réalistes et barrières, plus une **auto-évaluation à chaque ravito** (« où dois-je en être ? »).

| Segment | Km | Allure cible | Passage réaliste | Barrière |
|:--------|:---|:-------------|:-----------------|:---------|
| Départ → Ausques | 26,7 | 7:52/km | 05:30 | — |
| Ausques → Châtelet | 15,7 | 7:58/km | 07:35 | 09h00 |
| Châtelet → Sangatte | 14,8 | 7:46/km | 09:30 | — |
| Sangatte → Hervelinghen | 20,4 | 8:05/km | 12:15 | 14h30 |
| Hervelinghen → Cap Gris-Nez | 16,5 | 8:11/km | 14:30 | 17h00 |
| Cap Gris-Nez → Arrivée | 15,7 | 9:33/km | 17:00 | 19h35 |

### La météo, jusqu'à la veille

La météo a été suivie de J-7 à J-1, avec des revalidations successives : J-3 (Open-Meteo, 🟠 pluie 12,8 mm) → J-2 (wttr.in, 🟡) → **veille (🟡 confirmé : départ sec, pic de pluie 0,5 mm à 09h, rafales 43-44 km/h en matinée)**. La décision finale : veste imperméable fine, frontale obligatoire (lune à 4 %), ziplocs étanches pour la nutrition.

### Le matériel : 2 sacs, un drop bag

Le plan matériel prévoyait un **drop bag à Hervelinghen** (km 77,6) avec le ravitaillement de la seconde moitié, et une capacité d'eau portée de **2,5 L** (2 flasques 500 ml + 1 flasque 1,5 L) — le tout avec le matériel existant, sans achat.

## Le jour J : prévu vs réel

Le bilan est raconté par la comparaison prévision vs réel :

![Résumé Garmin de la course du 13/09 : 109,71 km, 15:26:51, 8:27/km, D+ 1 992 m](/images/preparer-un-ultra-trail-avec-ai-running-coach/11-resume-course-13-09.png)

*Le résumé officiel de la course : 109,71 km, 15h26:51, allure moyenne 8:27/km, D+ 1 992 m, 7 955 calories — avec le tracé du parcours sur la Côte d'Opale, de Wimereux jusqu'au sud de Boulogne-sur-Mer et retour, coloré du plus lent (bleu) au plus rapide (rouge).*

![Temps de passage : plan vs réel](/images/preparer-un-ultra-trail-avec-ai-running-coach/06-prevision-vs-reel.png)

| | Temps | Arrivée | Allure |
|:--|:--|:--|:--|
| 🚀 Ambitieux | 12h49 | ~14h49 | 7:00/km |
| 🟡 **Plan réaliste** | **15h00** | ~17:00 | 8:12/km |
| 📍 **RÉEL** | **15h26** | **17:26** | 8:27/km |
| 🟢 Sûr | 16h00 | ~18:00 | 8:44/km |

**+26 minutes par rapport à la cible (+3 %)** — une exécution jugée très solide. Pourquoi cet écart ?

1. **Le parcours était plus dur que prévu** : D+ réel de **1992 m vs 1768 m** (+13 %), soit ~10-15 min.
2. **Marche forcée dans les montées** (km 50-51, 61, 74, 77).
3. **Un épisode gastro isolé** au km 48,6 (~3 min).
4. **Pluie et rafales vers 09h** sur le segment Châtelet → Sangatte.

Mais surtout : **toutes les barrières ont été passées avec de très larges marges** (jusqu'à +2h09 à l'arrivée), le cardio est resté impeccable, et la **finale a été solide** : dernier segment à -10 min par rapport au plan, malgré les 3 derniers km de dunes en marche forcée.

![Allure par bloc de 10 km](/images/preparer-un-ultra-trail-avec-ai-running-coach/02-allure-par-10km.png)

## La récupération, suivie au jour le jour

Après la course, l'agent medical a continué à suivre la récupération :

![HRV : chute et remontée post-course](/images/preparer-un-ultra-trail-avec-ai-running-coach/03-hrv-recuperation.png)

- **J+1** : readiness 1/100, temps de récupération estimé à 96h, HRV effondré (30 ms), sommeil 5,1h (score 28) — le corps a tout donné.
- **J+3** : toujours en récupération, HRV qui remonte progressivement.
- **J+5** : readiness 61/100, sommeil 7,25h (score 86), HRV 69 ms — **premier footing facile confirmé**.

Le HRR (heart rate recovery) de 7 bpm en fin de course était le signal attendu d'un effort maximal — normal après 15h26 d'effort.

## Ce que j'en retiens

Préparer un ultra-trail, c'est un travail de **planification, d'écoute et d'ajustement permanent**. Ce que ai-running-coach m'a apporté :

1. **Une structure** : chaque décision documentée, chaque plan versionné, en markdown.
2. **Une discipline d'analyse** : les données Garmin (HRV, readiness, FC, VO2max) transformées en décisions concrètes.
3. **Une précision chirurgicale** : du point de coupe d'un GPX au gramme de glucides par heure.
4. **Une sérénité le jour J** : quand tout est planifié et testé, il ne reste qu'à exécuter.

Le résultat : **15h26 pour 109,7 km et +1992 m**, un cardio maîtrisé, aucune barrière menacée, et une récupération suivie et maîtrisée. Je ne peux pas garantir que l'IA fait de vous un finisher d'ultra — mais elle peut certainement vous y aider.

Le projet est open-source et disponible sur [GitHub](https://github.com/mmornati/ai-running-coach), avec la [documentation](https://mmornati.github.io/ai-running-coach/) et un script d'installation en une commande. Si vous préparez un objectif trail ou ultra, n'hésitez pas à l'essayer — et à contribuer !