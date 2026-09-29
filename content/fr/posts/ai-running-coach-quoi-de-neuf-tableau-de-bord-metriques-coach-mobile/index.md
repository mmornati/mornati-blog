---
title: 'ai-running-coach, neuf jours après : un tableau de bord, une vingtaine de métriques et le coach dans la poche'
categories:
- ai-coding-agents
tags:
- ai
- agents
- trail
- running
- garmin
- mcp
- claude-code
- dashboard
date: '2026-09-28T04:50:00.000000+00:00'
draft: false
slug: ai-running-coach-quoi-de-neuf-tableau-de-bord-metriques-coach-mobile
translationKey: ai-running-coach-whats-new
cover: cover.jpg
showHero: true
description: Depuis mon article sur l'ultra-trail, ai-running-coach a reçu plus de 120 pull requests. Au programme, un tableau de bord local, des métriques taillées pour le trail à partir des fichiers FIT, des garde-fous déterministes et un journal des décisions, un plan d'allures tiré de mon propre modèle pente → allure, les premières contributions externes, et un coach à qui je parle depuis mon téléphone grâce à Claude Code Remote Control sur une machine Linux, synchronisé par un bon vieux cron.
summary: Un tableau de bord, une pile de nouvelles métriques, des garde-fous capables de dire non, et un coach qui tourne sur une machine Linux à la maison et me répond depuis le téléphone. Voici ce qui a bougé dans ai-running-coach depuis l'ultra, et pourquoi la synchro automatique passe par cron plutôt que par une routine Claude.
projects:
- ai-running-coach
---

Le 19 septembre, j'ai publié [Préparer un ultra-trail avec ai-running-coach](/fr/preparer-un-ultra-trail-avec-ai-running-coach/). J'y racontais l'Ultra 110 km du Trail Côte d'Opale et comment une équipe d'agents IA, qui travaillent dans de simples fichiers Markdown, m'avait accompagné jusqu'à la ligne d'arrivée.

Ça ne fait que neuf jours, mais le projet a pas mal changé depuis. Entre le **19 et le 27 septembre**, [le dépôt](https://github.com/mmornati/ai-running-coach) est passé de la PR #1 à la **PR #122**. Au menu : un tableau de bord web, une vingtaine de nouvelles métriques, un moteur de règles qui peut mettre son veto au coach, des commandes pensées pour le téléphone, une deuxième source de données et les premières contributions externes. La [documentation](https://mmornati.github.io/ai-running-coach/) a été entièrement revue au passage, et toutes les captures de cet article en sont tirées. Ce sont de vraies captures de mon workspace, trois jours avant la course.

Petit tour d'horizon de ce qui a changé et, surtout, de ce que ça apporte.

## 1. Un tableau de bord pour voir ce que le coach sait

La première version avait une vraie limite : tout vivait dans des fichiers Markdown. C'est parfait pour versionner et pour les agents, beaucoup moins quand on veut juste savoir à 6 h 30 du matin si on court aujourd'hui ou pas.

J'ai donc ajouté un **tableau de bord local, en lecture seule** ([doc](https://mmornati.github.io/ai-running-coach/dashboard/)). C'est un petit serveur en Python pur (bibliothèque standard) avec une page HTML/CSS/JS. Pas de npm, pas d'étape de build. On le lance avec `scripts/dashboard.sh`, et il s'ouvre sur `http://127.0.0.1:8765/`.

![La vue « Aujourd'hui » : dernier verdict du coach, bilan du matin situé sur mes références, séance du jour et forme](/images/ai-running-coach-quoi-de-neuf/aujourdhui.webp)

*La vue « Aujourd'hui » le 10 septembre, à J-3. On y voit le dernier verdict du coach, le bilan du matin (HRV nocturne, FC de repos, dette de sommeil, readiness, sommeil) placé sur mes propres références, la séance prévue avec son créneau météo, et un résumé de la forme.*

Pour que ça marche, chaque fichier écrit par les agents commence désormais par un petit **bloc JSON ` ```arc `**. C'est un contrat de données, avec des clés en anglais et des unités SI, et une mesure absente est tout simplement omise. Un index SQLite **dérivé** est construit à partir de ces blocs. Il est jetable, reconstruit depuis les fichiers, et mis à jour en moins de 30 secondes dès qu'un agent écrit quelque chose. Le Markdown reste la source de vérité, le tableau de bord ne fait que le mettre en forme.

Chaque vue répond à une question :

| Vue | La question |
|:----|:------------|
| **Aujourd'hui** | Je cours, j'allège ou je me repose ? |
| **Forme & charge** | Où en est ma forme ? |
| **Analyse** | Est-ce que ma technique et ma durabilité progressent ? |
| **Santé** | Comment mon corps encaisse ? |
| **Semaine** | Qu'est-ce qui était prévu, qu'est-ce qui a été fait ? |
| **Séances** | Comment ça s'est passé ? (splits, FC, analyse du coach) |
| **Performance** | Qu'est-ce que je peux viser ? |
| **Trail Shape** | Suis-je prêt pour mon objectif ? |
| **Décisions** | Pourquoi cette séance a-t-elle changé ? |
| **Calendrier / Rapports / Nutrition** | Régularité, conclusions du coach, ravitaillement |

![Forme & charge : condition, fatigue et forme sur six mois, ratio charge aiguë/chronique et volume hebdomadaire](/images/ai-running-coach-quoi-de-neuf/forme.webp)

*Forme & charge sur six mois. Condition (42 j), fatigue (7 j) et forme, le ratio aiguë/chronique avec son repère 0,8-1,3, et les heures d'effort par semaine avec le D+ cumulé.*

![Santé : HRV nocturne avec la bande Garmin et une référence personnelle, FC de repos, readiness et verdicts du coach jour par jour](/images/ai-running-coach-quoi-de-neuf/sante.webp)

*La vue Santé. La HRV affiche deux références : la bande Garmin sur la valeur brute de la nuit, et ma référence personnelle sur la moyenne 7 jours. Juste en dessous, une frise montre le verdict du coach pour chaque jour (maintenir / alléger / repos).*

![Vue Semaine : le plan du coach face au réalisé, jour par jour, avec météo et conformité](/images/ai-running-coach-quoi-de-neuf/semaine.webp)

*La semaine de la course : le plan face au réalisé, jour par jour, avec la catégorie météo et le bilan de conformité.*

Quelques détails pratiques qui comptent pour moi :

- Il **tient sur un téléphone** et a un thème sombre.
- Il peut tourner sur une machine distante et se consulter **par un tunnel SSH**, ou vivre **dans un conteneur Docker derrière un reverse proxy** avec authentification unique (Traefik + Authentik/Authelia).
- Les métriques portent des **noms génériques** (condition / fatigue / forme plutôt que CTL/ATL/TSB), et une page [Marques et métriques](https://mmornati.github.io/ai-running-coach/marques/) donne la formule publiée derrière chaque modèle. Le projet est indépendant, ni affilié à Garmin ni à TrainingPeaks, donc je voulais que ce soit propre.

## 2. Des métriques qui parlent vraiment « trail »

Le deuxième gros chantier, c'est **l'ingestion des fichiers FIT**. Après chaque synchro, le coach télécharge le FIT brut de chaque nouvelle séance de course ou de trail. Il le normalise (échantillons à 5 s, jamais versionnés, reconstructibles à tout moment) et en tire des métriques qu'on ne trouve d'habitude que sur des plateformes payantes :

- **Zones FC, temps en zone et polarisation 80/20** (modèle à trois zones de Seiler), avec la méthode de zones choisie (Karvonen, % du seuil ou % de la FC max).
- **Allure ajustée à la pente (GAP)**, d'après le modèle de coût énergétique de Minetti.
- **Découplage aérobie et facteur d'efficacité** : de combien la FC dérive par rapport à l'allure entre la première et la seconde moitié d'une sortie.
- **VAM** sur les montées détectées automatiquement, et **efficacité en descente** par classe de pente.
- **Durabilité** : de combien le GAP se dégrade sur les sorties longues. C'est LA métrique qui compte sur un ultra.
- **Progression sur une même montée** : chaque passage sur un segment connu est reconnu et comparé aux précédents.

Les FIT, c'est pour la séance elle-même. Pour le reste, le coach s'appuie sur les données du workspace :

- **Conformité au plan** : séances, durée et D+ réalisés face au prévu.
- **Référence HRV personnelle** (moyenne 7 j de ln(HRV) vs 60 j ± 0,5 écart-type), en plus de la bande Garmin.
- **Km-effort ITRA** (distance + D+/100) pour comparer des semaines de trail.
- **Tendance du poids** et **dette de sommeil**.
- **Acclimatation à la chaleur** (séances ≥ 25 °C sur 14 jours).
- **Kilométrage des chaussures**.
- **Glucides par heure et taux de sudation** sur les sorties longues.

Le détail d'une séance affiche le graphique des splits, avec l'allure et la FC tour par tour. Voilà ce que ça donne sur l'ultra :

![Splits de la course de 110 km : allure et FC moyenne pour chacun des 110 tours](/images/ai-running-coach-quoi-de-neuf/seance-ultra.webp)

*110 splits, 15 h 26 de course. La FC reste entre 110 et 140 bpm toute la journée, et on voit bien les passages en marche dans les côtes et les derniers kilomètres dans les dunes.*

## 3. Des garde-fous : un coach qui sait dire non

Le reproche qu'on fait le plus souvent aux coachs IA, c'est une **progression trop agressive**, et des blessures ont été signalées avec des outils du même genre. Un LLM raisonne très bien sur votre semaine, mais ce n'est pas une calculatrice fiable pour un ratio de charge aiguë/chronique.

Il y a donc maintenant un **moteur de règles déterministe** ([doc](https://mmornati.github.io/ai-running-coach/guardrails/)). C'est du Python pur, entièrement testé, et le coach est **obligé** de le consulter avant d'écrire une semaine et avant de pousser les séances dans le calendrier Garmin. Sept règles :

| Règle | Ce qu'elle vérifie |
|:------|:-------------------|
| R1 | ACWR projeté sur la semaine proposée |
| R2 | Hausse du volume hebdomadaire |
| R3 | Hausse du D+ hebdomadaire (trail) |
| R4 | Monotonie de Foster projetée |
| R5 | Séance de qualité le jour même ou le lendemain d'un verdict santé **rouge** (**bloquant**) |
| R6 | Part de la sortie longue dans le volume de la semaine |
| R7 | Deux séances de qualité sur deux jours consécutifs |

Le moteur sait aussi quand **ne pas** s'appliquer : historique trop court, semaine de course, trop peu de séances dans la semaine. C'est un second avis, pas un verrou qui bloque tout. Tous les seuils se règlent, et la doc détaille les réserves scientifiques (l'ACWR est en `warn` par défaut, pas en `block`).

L'autre versant, c'est **l'explicabilité**. Dès que le coach modifie une séance (bilan du matin, garde-fou, blessure, météo ou demande de ma part), il écrit un fichier `decision` avec le déclencheur, les données qui l'ont justifié et l'avant/après. Du coup :

- le tableau de bord affiche un encart **« Pourquoi aujourd'hui ? »** et un **journal des décisions** filtrable ;
- la commande `/why` explique la dernière décision **en citant le journal, sans jamais inventer de raison** ;
- la 5ᵉ ligne de la notification push devient `Pourquoi :` quand quelque chose a été ajusté.

S'y ajoute un **signal de vigilance blessure** composite. Il se lève quand plusieurs indicateurs dérivent en même temps, et il suit une douleur déclarée jusqu'à la recommandation d'aller consulter.

## 4. De l'entraînement au jour J, et retour

Plusieurs nouveautés couvrent la partie de la prépa que j'avais faite à la main pour l'ultra :

- **Un modèle pente → allure personnel**, appris sur vos propres séances.
- **Un plan d'allures segment par segment** : le stratège de course découpe le GPX et prédit chaque tronçon avec *votre* modèle. Pour les ultras, il utilise un Riegel par morceaux et une dégradation additive au-delà de 6 heures.
- **Des cibles personnelles** dans chaque séance (zones, GAP, D+ de côte) plutôt que des allures génériques.
- **Des plans sur plusieurs semaines**, affichés semaine par semaine dans le tableau de bord.
- **Trail Shape**, un score sur 100 qui compare vos 8 dernières semaines à ce qu'exige la course visée.
- **Le débrief d'après course** : prévu contre réalisé par segment, écart d'allure et dérive cumulée, fade, glucides par heure, météo.
- **Les indices de performance ITRA et UTMB**, avec leur historique.

![Trail Shape : score de préparation de 75/100 trois jours avant l'ultra de 110 km, composante par composante](/images/ai-running-coach-quoi-de-neuf/trail-shape.webp)

*Trail Shape à J-3 : 75/100. Km-effort hebdo à 70 % de la cible, plus longue sortie (38,5 km) à 64 %, D+ max sur une séance bien au-delà de la cible. La durabilité est mise de côté faute de sortie longue éligible sur la fenêtre, et son poids est redistribué. C'est un indicateur, jamais un verdict : un bon affûtage peut faire baisser le score, et la page le dit clairement.*

Ce débrief, j'aurais adoré l'avoir le lendemain de la course. Aujourd'hui, c'est une commande.

## 5. Plus simple à installer, plus simple au quotidien

- **La langue des documents se configure** : le français reste la langue par défaut, mais on peut en changer.
- **Un coach sur mesure** : on choisit son staff (avec ou sans l'agent médical), son sport (trail/route), un style de coaching et sa fermeté, et le niveau du bilan santé du matin (`full`, `minimal`, `off`).
- **`/coach-setup`** : un entretien de premier démarrage qui **pré-remplit FC max, FC de repos, seuil et VO2max depuis Garmin**, chacune avec sa source, à confirmer.
- **Des préréglages d'installation** : `./install.sh --preset laptop | coach-server | docker`.
- **Un workspace privé** séparé du moteur (`--workspace ~/mon-workspace`), avec commit et push automatiques après chaque synchro si on le souhaite.
- **`/coach-doctor`** : un diagnostic en une commande (âge des tokens Garmin, accès au MCP, config, profil, fraîcheur de l'index, planification de la synchro, notifications).
- **Une alerte push avant l'expiration des tokens Garmin** (J-14 puis J-3), avec la commande pour les renouveler.
- **Intervals.icu comme source de données principale** (`--source intervals`), avec une table de correspondance outil par outil. Ce qu'Intervals.icu ne sait pas fournir (readiness Garmin, téléchargement FIT, HRR) est **annoncé comme indisponible, jamais simulé**.
- Un [guide de mise à jour](https://mmornati.github.io/ai-running-coach/update/) pour le moteur, le workspace et la machine coach.

En coulisses, une bonne partie du boulot est partie dans les **tests** : échantillons FIT synthétiques, serveur MCP bouchon scriptable, tests « golden » de l'API du tableau de bord, évaluations LLM planifiées, et une vérification que la doc ne dérive pas du code. Un agent qui écrit votre plan d'entraînement mérite la même rigueur que n'importe quel logiciel.

## 6. Les premières contributions de la communauté

C'est sans doute ce qui m'a fait le plus plaisir. Quelques jours après le premier article, **Giovanni Clément ([@gclem](https://github.com/gclem))** a envoyé les premières pull requests externes :

- **Le support de GitHub Copilot** (agents, skills, MCP, instructions) : le projet tourne désormais aussi dans Copilot CLI, Copilot dans VS Code et l'agent cloud Copilot.
- **Le bilan du matin** : HRV + FC de repos (grâce à un nouvel outil `get_rhr_day`) + readiness avant toute décision de séance. C'est devenu la base de la vue Aujourd'hui et des verdicts santé. Il a d'ailleurs enchaîné avec un correctif pour que la FC de repos serve de filtre et non de métrique de charge.
- Un correctif pour `install.sh --dry-run`, qui s'arrêtait dès la première étape, et la normalisation des fins de ligne avec `.gitattributes`.

Merci Giovanni ! 🙏

## 7. Le coach dans la poche : Claude Code Remote Control sur une machine Linux

C'est comme ça que j'utilise le projet au quotidien maintenant, donc ça vaut le coup de rentrer un peu dans le détail ([doc](https://mmornati.github.io/ai-running-coach/mobile/)).

### La contrainte : garder l'abonnement

Je voulais parler au coach depuis mon téléphone, mais **sans payer au token avec une clé API**. Un front mobile maison (bot Telegram, PWA, appli Agent SDK…) ne peut pas utiliser un abonnement Claude Pro/Max, puisqu'Anthropic bloque l'authentification par abonnement pour les outils tiers. La seule voie, ce sont les **surfaces distantes officielles**.

### Le montage : une « machine coach » à la maison

J'ai une **machine Linux** toujours allumée à la maison. Elle héberge :

- le moteur et mon **workspace privé** (un dépôt git) ;
- les tokens Garmin et le serveur `garmin-mcp` ;
- **Claude Code**, connecté avec mon compte claude.ai (pas de clé API) ;
- `claude remote-control`, installé comme **service systemd utilisateur** (`./install.sh --remote-control`, avec `loginctl enable-linger` pour qu'il survive à la déconnexion SSH) ;
- le tableau de bord, pour le consulter de n'importe où.

Depuis le téléphone, j'ouvre l'**appli Claude, onglet Code**, et la session « AI Running Coach » est là. Elle tourne **sur la machine Linux**, avec l'agent `coach`, les skills, le serveur MCP Garmin et mes fichiers. Les confirmations d'outils (quand il faut pousser une séance dans le calendrier Garmin, par exemple) s'affichent sur le téléphone. Le service démarre en mode `acceptEdits` : l'écriture des fichiers Markdown se fait toute seule, mais les outils Garmin qui écrivent me demandent toujours mon accord.

Ce que je tape depuis le téléphone, c'est surtout du court :

```text
/today
/why
/week
/race
/log 2 gels + 500 ml au km 15, genou gauche 3/10, RPE 7
« Décale la séance de jeudi à vendredi et mets-la dans Garmin »
```

Les cinq commandes courtes ont été pensées **pour le téléphone** : une question, une réponse. `/log`, c'est celle que j'utilise le plus en rentrant de sortie. Le modèle extrait les infos, puis un script déterministe fait les calculs (glucides d'après mon catalogue de produits, conversion des volumes) et fusionne le tout dans les fichiers du jour. Produit inconnu ? Il pose la question, sans jamais deviner une valeur nutritionnelle. Douleur à 7/10 ou plus ? Il recommande d'aller consulter.

![Le tableau de bord sur téléphone : la vue Aujourd'hui avec le bilan du matin](/images/ai-running-coach-quoi-de-neuf/mobile-aujourdhui.webp)

*La même vue Aujourd'hui, sur le téléphone.*

### La synchro automatique : pourquoi un cron et pas une routine Claude ?

L'autre moitié du montage, c'est la **synchro automatique**. Chaque matin, avant même que j'ouvre l'appli, les données Garmin (nuit, HRV, readiness, séance de la veille) doivent déjà être écrites dans le workspace, avec un résumé de 5 lignes envoyé sur le téléphone via [ntfy](https://ntfy.sh) :

```text
🏃 Sync Garmin
Séances : 1 nouvelle — trail 12,3 km / 480 m D+ / FC moy 148 / HRR 28 bpm
Sommeil : 7 h 42, score 81
HRV : 62 ms — équilibré (baseline 58-66)
Readiness : 74
Alerte : aucune
```

La question vient toute seule : Claude Code sait planifier des tâches, alors pourquoi passer par `cron` ? J'ai revérifié la doc à jour avant d'écrire ces lignes, pour être sûr que la réponse tient toujours :

| Option | Où ça tourne | Pourquoi ça ne colle pas à une machine Linux sans écran |
|:-------|:-------------|:--------------------------------------------------------|
| **Routines cloud** (`/schedule`) | Dans le cloud d'Anthropic, sur un clone neuf du dépôt | [Aucun accès aux fichiers locaux](https://code.claude.com/docs/en/scheduled-tasks#compare-scheduling-options) : ni le `garmin-mcp` local, ni les tokens de `~/.garminconnect`. Intervalle minimum d'une heure, et un quota d'exécutions par jour. |
| **Tâches planifiées de l'appli de bureau** | Sur votre machine | [Ne se déclenchent que si l'appli est ouverte et l'ordinateur réveillé](https://code.claude.com/docs/en/desktop-scheduled-tasks#how-scheduled-tasks-run). Sous Linux, l'appli de bureau est une bêta graphique, pas franchement adaptée à une machine sans écran. |
| **`/loop` et cron de session** | Dans une session ouverte | [Liés à la session](https://code.claude.com/docs/en/scheduled-tasks#limitations) : ils s'arrêtent avec elle, et les tâches récurrentes expirent au bout de 7 jours. |
| **Environnements auto-hébergés** | Sur vos propres runners | [Bêta publique réservée aux plans Team et Enterprise](https://code.claude.com/docs/en/self-hosted-environments#availability-and-limitations), pas dispo en Pro/Max. |

La doc elle-même oriente dans l'autre sens : pour faire tourner Claude Code sur sa propre machine toujours allumée et la piloter depuis d'autres appareils, il faut passer par **Remote Control**, et c'est exactement la partie interactive de mon montage. Pour la partie sans surveillance, le déclencheur le plus fiable sur une machine sans écran reste **le cron du système**, qui lance le **CLI officiel en mode headless** :

```bash
./install.sh --daily-sync          # installe l'entrée cron
# qui lance, deux fois par jour par défaut (07:15 et 14:15) :
scripts/daily-sync.sh              # → claude -p "/garmin-daily-sync"
```

`claude -p` utilise le même abonnement que les sessions interactives. Le script tire aussi le dépôt du workspace avant de lancer le coach, puis commite et pousse à la fin, pour que le portable et la machine coach restent synchronisés. Il gère aussi un verrou, la notification et les logs. On peut même passer sur `codex exec` si on préfère.

### Le mode « watch » : ne réveiller le LLM que quand Garmin a du neuf

Les horaires fixes ont un défaut : le samedi je me lève tard, ou je cours le soir, et la synchro de 7 h 15 ne trouve rien. Garmin ne propose pas de webhook aux particuliers (son programme développeur est réservé aux entreprises). La toute dernière nouveauté (PR #121, mergée hier) est donc un **watcher**. `scripts/garmin_watch.py` tourne en cron toutes les 15 minutes, **sans aucun LLM** :

1. **Un seul appel** demande l'heure du dernier envoi de la montre. Pas de changement ? On s'arrête là, zéro token.
2. Nouvel envoi ? Il regarde s'il manque la séance ou le fichier de sommeil du jour dans le workspace. Il continue à vérifier pendant 90 minutes, parce que Garmin calcule le score de sommeil quelques minutes *après* l'envoi.
3. Du neuf ? Il attend 10 minutes que tout soit remonté, puis lance `daily-sync.sh`. Au moins 30 minutes entre deux runs, 6 par jour au maximum, des passages espacés en cas de HTTP 429, et un run de repli complet à 21 h 30 si rien n'a tourné dans la journée.

```toml
# config/workspace.user.toml
[sync]
mode = "watch"
```

Résultat : le LLM ne tourne **que quand il y a vraiment quelque chose à faire**, quelques minutes après avoir arrêté ma montre. Le temps de prendre ma douche, la notif est sur le téléphone, le tableau de bord est à jour, et je peux demander « alors, c'était comment ? » depuis le canapé.

## Et maintenant ?

L'ultra est derrière moi, et la récup a été suivie jour après jour. Les prochains objectifs seront préparés avec tout ça dès le départ : un score Trail Shape à suivre, un vrai débrief après la course, et un coach joignable où que je sois.

Pour l'essayer :

```bash
git clone https://github.com/mmornati/ai-running-coach.git
cd ai-running-coach
./install.sh                              # ou --preset coach-server
```

- 📖 Documentation : [mmornati.github.io/ai-running-coach](https://mmornati.github.io/ai-running-coach/)
- 💻 GitHub : [github.com/mmornati/ai-running-coach](https://github.com/mmornati/ai-running-coach)

Issues, idées et pull requests sont les bienvenues, Giovanni a montré l'exemple ! Et comme toujours, c'est un outil pour vous aider à vous préparer : il ne remplace pas l'avis d'un médecin.
