---
title: "Un humain, un tableau et une équipe d'agents : comment je développe aujourd'hui (et pourquoi mon estimation était fausse)"
categories:
- ai-coding-agents
tags:
- ai
- claude-code
- multi-agent
- github-projects
- software-engineering
- sdlc
- estimation
- productivity
- team-topology
date: '2026-10-31T17:00:00.000000+00:00'
draft: false
slug: un-humain-un-tableau-et-une-equipe-dagents
translationKey: human-agents-board
cover: cover.jpg
showHero: true
description: "Une expérience pour réorganiser le cycle de développement autour d'un tableau GitHub Project partagé par un humain et une équipe d'agents IA. Des tickets écrits avec Claude et validés par moi, une seule consigne (« suis le tableau »), trois agents par story (construire, relire de façon indépendante, corriger) et un protocole simple pour les moments où un humain est nécessaire. L'estimation disait qu'un humain avec des agents serait plus lent que trois développeurs. Après 36 stories, les trois premiers jalons, prévus sur 23 semaines, ont été fusionnés en moins de deux jours. Ce que disent les chiffres, ce qui se passe quand le quota d'utilisation arrête tout, et comment un second projet, Angelia, fait évoluer l'organisation."
summary: "L'estimation disait qu'un humain avec quatre agents mettrait 76 semaines là où trois développeurs en mettent 22. Après 36 stories, le travail des agents a pris environ un tiers du temps estimé, personne n'a dû reprendre la main, et les trois premiers jalons, prévus sur 23 semaines, ont été fusionnés en moins de deux jours. Le goulot reste l'humain, mais pas là où le modèle le plaçait. En plus : ce qu'apprennent les arrêts de quota, et un second tableau, Angelia."
projects:
- horae
- angelia
---

Depuis quelques semaines, je teste jusqu'où le cycle de développement logiciel peut changer quand humains et agents travaillent **sur le même tableau**. Pas « une IA qui écrit du code pour moi », mais un espace de travail partagé : le backlog, les colonnes, les pull requests et les décisions vivent tous dans un GitHub Project, et humains comme agents le lisent et le mettent à jour.

Le premier vrai test, c'est **Horae**, un projet personnel que je construis surtout avec des agents. Avant d'écrire la moindre ligne de code, j'ai demandé à Claude de l'estimer de deux façons : en **jours humains**, si une équipe de développeurs le construisait, et en **jours IA**, si une équipe d'agents le construisait sous ma supervision. La réponse était claire, et un peu décevante : **un humain avec quatre agents serait plus lent que trois développeurs**. 76 semaines contre 22, parce que ma supervision serait le goulot d'étranglement.

Je n'étais pas convaincu. J'ai donc organisé le projet pour que le tableau lui-même me donne la réponse : chaque story porte son estimation, et chaque story reçoit ses chiffres réels une fois terminée. Puis j'ai donné aux agents une seule consigne : *suis le tableau*.

Ce billet raconte comment cela fonctionne au quotidien (le tableau, les agents, les moments où l'on a besoin de moi), ce que disent 36 stories terminées face à l'estimation, ce qui se passe quand le quota d'utilisation arrête tout en plein milieu, comment un second projet, **Angelia**, fait évoluer l'organisation, et ce qui change quand votre « équipe » est une personne et quelques agents plutôt qu'une équipe à deux pizzas.

## 0. Le résultat d'abord

Voici toute la boucle en une centaine de secondes. Comme [mes vidéos précédentes](/fr/videos-narrees-sans-fichier-video-canvas-javascript/), ce n'est pas un fichier vidéo : chaque image est dessinée en JavaScript, sur une voix de synthèse.

<div style="container-type:inline-size;margin:1.5rem 0">
<iframe src="/videos/human-agents-board/?embed=1&lang=fr" title="Un humain, un tableau, une équipe d'agents" loading="lazy" allow="fullscreen; autoplay" allowfullscreen style="display:block;width:100%;height:calc(56.25cqw + 40px);border:0;border-radius:8px;background:#f7f9fc"></iframe>
</div>

*Appuyez sur Lecture (avec le son). Changez de langue dans la barre de contrôle ou activez les sous-titres. [Ouvrez-la en pleine page](/videos/human-agents-board/?lang=fr) pour avoir la liste des chapitres.*

## 1. Le projet : Horae

[**Horae**](https://github.com/horae-dev/horae) est un agent personnel prévisible et auto-hébergé : des pipelines fixes au lieu d'une boucle d'agent, au plus une étape LLM bornée, des plugins aux permissions déclarées installés depuis git. Le brief du matin, des rappels, quelques intégrations avec mes notes et mes mails. Un vrai produit avec de vraies contraintes : des entrées non fiables, des secrets, des plugins que je n'ai pas écrits.

C'est aussi le premier projet que j'ai décidé de construire **surtout avec des agents dès le premier jour**, avec moi comme mainteneur à temps partiel : environ 15 heures par semaine, le soir et le week-end.

## 2. D'abord les tickets, et c'est l'humain qui les valide

Rien de ce qui suit ne fonctionne sans cette étape, et c'est celle qui m'a pris le plus de temps.

En quelques sessions, Claude et moi avons écrit le plan (`PLAN.md`), les décisions d'architecture à prendre et le backlog. Puis j'ai demandé à Claude de tout mettre sur GitHub : une organisation, 15 dépôts et un projet public, la [Horae Roadmap](https://github.com/orgs/horae-dev/projects/1). Il a créé **130 tickets** : 23 epics, 90 stories, 7 tâches réservées aux humains et 10 risques (les « burning points »), avec des types de tickets (Epic, Story, Risk), des sous-tickets et des liens « bloqué par ».

J'ai lu et validé les tickets avant que la moindre ligne de code existe. C'est la partie que je ne déléguerais jamais : décider ce que veut dire « terminé ».

Chaque story a la même forme : un résumé, des **critères d'acceptation**, un tableau d'estimation, des instructions pour les agents, et une section **Actuals** vide à remplir à la fin.

![Le tableau d'estimation de la story #13 : taille, estimation humaine en jours idéaux, exécutant, classe de risque, réussite attendue d'un agent au premier essai, durée attendue de l'agent et supervision humaine attendue](/images/one-human-a-board-and-a-team-of-agents/issue-estimate.webp)

Le projet a des champs personnalisés qui rendent le tableau lisible par les humains comme par les agents :

| Champ | Valeurs | Pourquoi |
|---|---|---|
| **Executor** | Agent · Agent + human check · Human-led · Human-only | qui fait le travail, pour que les agents sachent quoi laisser de côté |
| Size | XS · S · M · L | pour l'estimation |
| Risk class | Normal · Docs/CI · Core contract · Security · Integration · External API · Design/prompt | la sécurité et les API externes demandent beaucoup plus de supervision |
| Human days, Agent hours, Supervision hours, First-pass % | nombres | les deux estimations, par story et par epic |

![La vue « Backlog by milestone » : chaque epic avec son jalon, sa date cible, ses jours humains, ses heures d'agent et ses heures de supervision](/images/one-human-a-board-and-a-team-of-agents/estimates-by-epic.webp)

Chaque dépôt a aussi un `AGENTS.md` (installation, commandes, conventions, définition de « terminé ») et une politique `graft.yaml` qui dit quels chemins demandent ma relecture. Les règles vivent dans le dépôt, pas dans un prompt.

## 3. Le tableau est l'interface

La vue tableau a six colonnes. Leurs descriptions comptent, parce qu'elles sont le contrat entre les agents et moi :

| Colonne | Signification |
|---|---|
| **Backlog** | pas encore prêt |
| **Ready** | spécification complète, on peut commencer |
| **In progress** | un agent ou un humain y travaille |
| **In review** | PR ouverte, relecture par Graft et/ou le mainteneur |
| **Human needed** | bloqué sur le mainteneur |
| **Done** | fusionné et accepté |

![Le tableau Horae le 31 octobre : 69 éléments en Backlog, 1 en Ready, 10 en cours, 1 en attente de l'humain et 40 terminés, dont les epics des trois premiers jalons à 100 %](/images/one-human-a-board-and-a-team-of-agents/board.webp)

Autour, cinq autres vues : **Roadmap**, **Backlog by milestone** (avec les estimations), **Agent-ready** (filtre `label:agent-ready status:Ready` : ce qu'un agent peut prendre maintenant), **Human work** (les éléments Human-led et Human-only, le vrai goulot) et **Burning points** (les risques).

![La vue « Human work » : chaque élément Human-led et Human-only avec ses heures de supervision, de 8 à 28 heures chacun](/images/one-human-a-board-and-a-team-of-agents/human-work.webp)

C'est cette dernière capture que je regarde le plus. Elle me dit où vont passer mes soirées.

## 4. Une seule consigne : suis le tableau

Puis j'ai écrit ceci (en anglais, fautes comprises) :

> Following the project on github https://github.com/orgs/horae-dev/projects/1/views/3 Start in the right order the epics/issues ready for agents dev.
> Use the proper workflow with subagents when needed assigning the proper model based on the complexity, make a full review with another agent and fix then all the findings with a third agent.
> Create the PR referencing the issue, wait for the CI to be green, merge and move on.

Et un second message une minute plus tard : *"be sure to assign each task before to start to be able to track the time"*.

À partir de là, la session Claude Code principale a piloté le tableau. Pour chaque story Ready, dans l'ordre des dépendances :

1. **Assigner** le ticket (à moi) et le passer en **In progress** : l'horodatage lance le chronomètre.
2. **Construire** : un sous-agent l'implémente sur une branche `story/<n>-<slug>`. L'agent principal choisit le modèle selon la complexité : Sonnet pour l'échafaudage, la CI et le workflow des agents ; Opus pour les JSON Schemas, la validation des intents, les ADR et tout ce qui touche à la sécurité.
3. **Relire** : un agent distinct relit le travail au regard des critères d'acceptation, de `PLAN.md` et des stories qui en dépendent. Il ne modifie rien : il reproduit les problèmes dans un clone jetable et écrit ses remarques. Les stories de sécurité ont un relecteur spécialisé en sécurité.
4. **Corriger** : un troisième agent corrige *toutes* les remarques.
5. Ouvrir la PR qui référence le ticket, **attendre que la CI soit verte**, fusionner.
6. Publier les **Actuals** sur le ticket et passer la carte en **Done**.

![La story #13 dans l'historique du ticket : passée en Ready, assignée, passée en In progress, fermée par la PR fusionnée, puis le commentaire Actuals : 1 implémentation, 1 relecture avec 20 remarques (8 majeures), 1 passe de correction, environ 32 minutes d'agent, pas de reprise humaine](/images/one-human-a-board-and-a-team-of-agents/issue-actuals.webp)

Les cartes dont l'Executor est **Human-led** sont laissées de côté tant que je n'ai pas pris les décisions. Quand des stories indépendantes sont en Ready, l'agent principal les lance **en parallèle**, chacune dans son propre worktree git : trois ou quatre à la fois, c'est normal.

Après la première soirée, mes consignes sont devenues encore plus courtes, et toujours **un jalon à la fois** : *"Start M2"*, puis *"Can you proceed with the next user stories ready to dev?"*. Je n'ai jamais demandé tout le backlog d'un coup. Cela s'est révélé important (section 8).

### Ce que les relecteurs ont trouvé

C'est la partie qui m'a convaincu que la boucle fonctionne. L'implémenteur disait toujours « tous les contrôles passent ». Le relecteur trouvait toujours quelque chose de réel, et souvent de sérieux. Sur 36 stories, les Actuals recensent **plus de 360 remarques de relecture**, toutes corrigées avant fusion. Quelques exemples :

- **#15 workflow des agents** : le hook de commit utilisait le premier `python3` du PATH. Avec le Python 3.9 par défaut de macOS, il plantait et **bloquait tous les commits**, y compris les miens.
- **#13 schémas** (20 remarques, dont 8 majeures) : un chemin de note pouvait sortir du coffre Obsidian vers `.obsidian/plugins` (exécution de code sur mon portable), `notify.push` acceptait des liens `javascript:`, et le lockfile acceptait des URL git `ext::`.
- **#18 stockage SQLite** : les clés étrangères étaient activées avant les migrations, donc une future reconstruction de table aurait effacé en silence toutes les entrées du journal. Le relecteur a reproduit la perte de données.
- **#19 cycle de vie des exécutions** : la vivacité d'une exécution était jugée sur le nom d'hôte et l'identifiant de processus, ce qui ne marche pas dans des conteneurs. La correction est devenue un verrou de fichier noyau par pipeline.
- **#32 cache** : après l'annulation d'une exécution, l'exécution suivante, inchangée, aurait réappliqué les mêmes intents depuis le cache, gratuitement, pendant jusqu'à 7 jours, y compris des intents issus d'une injection de prompt.
- **#30 backends locaux** : une réponse gzip de 305 Ko se décompressait en 300 Mio, et elle était acceptée.

Et une que les relecteurs ne pouvaient pas trouver : le backend claude-cli (#29) passait tous les tests avec mocks, mais la première exécution réelle avec mon vrai token a fait échouer quatre tests. Le vrai CLI enveloppe le JSON dans des blocs de code, réfléchit avant de répondre et relance en silence les réponses tronquées jusqu'à trois fois, si bien qu'un appel plafonné à 64 tokens en facturait 256. Les mocks sont d'accord avec vos hypothèses ; la réalité, non.

## 5. Quand on a besoin d'un humain

Certaines stories sont à moi par conception : le modèle de menaces, l'hôte de plugins, tout ce où un mauvais choix par défaut devient une faille. Pour celles-là, l'agent ne devine pas. Il écrit une **note de conception** dans une PR en brouillon, avec des questions numérotées et une recommandation pour chacune, et la carte passe en **Human needed**.

Le protocole tient en deux étapes :

1. **Répondre sur la PR**, en gardant les numéros des questions. Des réponses courtes suffisent ; « tout comme proposé » aussi.
2. **Remettre la carte en Ready.** C'est le signal. La prochaine fois qu'un agent la prend, il lit mes commentaires, transforme la note en livrable réel et relance la boucle habituelle construire → relire → corriger → fusionner.

![La pull request #85, la note de conception de l'hôte de plugins : dix questions numérotées pour le mainteneur, et en dessous mes réponses, une ligne chacune](/images/one-human-a-board-and-a-team-of-agents/pr-questions-answers.webp)

Dix questions, dix réponses d'une ligne, une carte remise en Ready. C'est toute l'interface. Jusqu'ici, je l'ai fait six fois : l'hôte de plugins, le backend claude-cli, la désidentification, le garde-fou des actions, le masquage des secrets et les liens d'action signés. Ma plus longue réponse fait dix lignes.

Le même schéma revient pour les petites décisions. Quand `PLAN.md` était ambigu, les agents **ont choisi l'option la plus stricte** (assouplir une règle plus tard ne casse rien, la durcir si), l'ont notée comme provisoire et me l'ont listée : à la fin de M3, il y avait plus de 50 décisions numérotées dans `schemas/README.md`. Les ADR et le format des skills (« Agent + human check ») sont restés non fusionnés jusqu'à ce que j'écrive « Accept and merge ».

Les agents m'ont aussi dit clairement ce qu'ils *ne pouvaient pas* faire : installer une GitHub App privée sur l'organisation, rendre l'image de conteneur publique, activer le réglage « Template repository », ou lancer le test réel avec mon token. Ces tâches sont à moi, et elles figurent dans chaque rapport.

## 6. L'estimation, et pourquoi j'en doutais

Voici ce que disait le modèle, dans son cas probable :

| | Équipe humaine | Un humain + 4 agents |
|---|---|---|
| Effort | 218 jours-personne | 325 heures d'agent + **1 134 h de ma supervision** |
| Calendrier | **22 semaines** à 3 développeurs · 67 semaines seul | **76 semaines** à 15 h/semaine · 38 semaines à plein temps |

Le modèle était soigneux et ses sources étaient bonnes : les [horizons temporels de METR](https://metr.org/blog/2026-1-29-time-horizon-1-1/), l'[étude METR de 2025](https://metr.org/blog/2026-02-24-uplift-update/) où des développeurs expérimentés étaient 19 % *plus lents* avec l'IA, les rapports de [CodeRabbit](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report) et de [Veracode](https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf) sur les défauts du code écrit par l'IA. Ses hypothèses principales :

- La **réussite au premier essai** d'un agent chute vite avec la taille et le risque : 85 % pour une story S, 30 % pour une L, encore divisée par deux pour la sécurité.
- Chaque essai raté coûte une **relecture humaine** d'environ 15 % de l'effort humain, le double pour la sécurité.
- Après trois échecs, **un humain reprend** la story à 60 % de l'effort humain.
- Durée d'un agent : 0,75 h pour une story S, 2 h pour une M, 5 h pour une L.

Donc l'essentiel des 1 134 heures, c'était moi, en train de relire des diffs et de sauver des agents. Et la roadmap construite dessus plaçait les trois premiers jalons (les fondations, le squelette fonctionnel, l'étape LLM) à **23 semaines**, du 2 novembre 2026 au 12 avril 2027.

## 7. Ce que dit le tableau après 36 stories

La première version de ce billet comptait six stories. Deux jours plus tard, le tableau en avait 36, alors voici une image plus complète. Le « temps d'agent mesuré » est la somme des durées des trois agents (construire, relire, corriger) telle que publiée sur chaque ticket ; il ne compte pas l'attente de la CI.

| Jalon | Stories | Temps d'agent estimé | **Temps d'agent mesuré** | Supervision estimée | Calendrier prévu | **Calendrier réel** |
|---|---|---|---|---|---|---|
| M0 Fondations | 6 | 14,3 h | **1,1 h**¹ | 36 h | 4,4 semaines | première soirée + une relecture |
| M1 Squelette fonctionnel | 11 | 36,6 h | **9,4 h** | 88 h | 9,0 semaines | **une journée** (28 oct., 08:48 → 15:18) |
| M2 Étape LLM | 12² | 36,7 h | **17,9 h** | 101 h | 9,8 semaines | **18 heures** (28 oct. 15:32 → 29 oct. 09:22) |
| M3 Dogfood (en cours) | 7 pour l'instant | 15,8 h | **5,8 h** | 28 h | 18,4 semaines | une soirée pour l'instant |
| **Total** | **36** | **103 h** | **34 h** | **252 h** | | **0 reprise** |

¹ Le modèle de menaces (#14) a été relu par moi et n'est pas chronométré. ² Inclut #113, la correction issue du test réel qui ne figurait pas dans le backlog initial, et #29, dont les 3 h 40 min incluent l'attente de fusions en parallèle.

M0 à M2 étaient prévus sur **23 semaines de calendrier** et ont été terminés **en moins de deux jours**, avant même la date de début prévue. Même l'équipe de trois développeurs de l'estimation aurait eu besoin d'environ 7 semaines pour eux.

Trois choses ressortent :

1. **Le temps d'agent était environ 3 fois inférieur à l'estimation, pas 9 fois.** Les six premières stories suggéraient ×9, mais c'étaient les plus faciles. Les stories suivantes avaient des relecteurs sécurité, des seconds tours de relecture et des fusions entre branches parallèles : une story M a pris en moyenne **65 minutes** contre 3,6 heures estimées, une story S **48 minutes** contre 1,1 heure (proche de l'estimation), et les stories de sécurité Human-led ont pris environ la moitié du temps d'agent estimé. De toute façon, le temps d'agent n'a jamais été le goulot.
2. **Aucune reprise, sur 36 stories.** Le modèle s'attendait à ce que les stories M ratent leur premier essai la plupart du temps et retombent sur moi. Elles ne sont pas retombées sur moi : le relecteur a trouvé les problèmes et le correcteur les a corrigés. Un premier essai raté est devenu une itération interne peu coûteuse, pas un sauvetage humain.
3. **Ma supervision n'a pas disparu, elle s'est déplacée.** L'estimation mettait **252 heures** de supervision sur ces 36 stories, surtout pour relire des diffs. Je n'ai relu aucun diff. Ce que j'ai réellement fait pendant ces deux jours : une douzaine de messages dans le chat, des réponses sur six notes de conception, une relecture du modèle de menaces, deux « Accept and merge » et un test réel avec mon token. Je ne l'ai pas chronométré, mais cela a tenu autour d'une journée de travail normale. Le reste de mon temps est allé *en amont*, dans les sessions de planification et la validation de 130 tickets.

### Pourquoi le modèle se trompait

Le modèle n'était pas bâclé. Il était **construit sur des chiffres de 2025, et il plaçait l'humain au mauvais endroit**.

- **Les données ont vieilli vite.** La mise à jour de METR place le temps de doublement de la longueur des tâches que savent mener les modèles de pointe à [environ 89 jours pour les modèles depuis 2024](https://metr.org/blog/2026-1-29-time-horizon-1-1/), et Anthropic parle d'un doublement [« environ tous les quatre mois, contre tous les sept mois auparavant »](https://www.anthropic.com/institute/recursive-self-improvement). Une estimation faite en octobre à partir d'études du début 2025 est calibrée sur des modèles qui ont deux ou trois doublements de retard.
- **Il supposait qu'un humain relit chaque essai.** Dans ce workflow, c'est un agent indépendant qui relit, et moi je relis les décisions. C'est aussi la direction que prennent les grandes équipes : Anthropic écrit que [« la relecture de code humaine est devenue un nouveau goulot »](https://www.anthropic.com/institute/recursive-self-improvement), avec plus de 80 % de son code fusionné désormais écrit par Claude. L'équipe .NET de Microsoft, après dix mois avec l'agent de code Copilot, [désigne elle aussi la relecture comme le goulot](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/).
- **La « réussite au premier essai » était la mauvaise unité.** Elle mesure si le premier diff est fusionnable. Avec un relecteur et un correcteur dans la boucle, ce qui compte, c'est si la *boucle* converge sans humain. 36 sur 36 l'ont fait.

### Ce que le modèle dit encore de juste

Je ne veux pas remplacer un chiffre faux par un autre, alors voici les limites honnêtes :

- **Rien n'est encore en production.** « Fusionné avec une CI verte après une relecture indépendante » ne veut pas dire « correct ». M3 est le jalon du dogfooding, et ce sera la première fois qu'Horae tournera sur mes vraies notes. Le garde-fou des actions (#35) a encore besoin d'une passe de red team manuelle que la relecture automatisée ne pouvait pas faire.
- **Les parties les plus difficiles n'ont pas commencé.** L'isolation des plugins, la marketplace et les API externes non officielles sont dans des jalons ultérieurs.
- **Les défauts ne disparaissent pas.** Les études trouvent toujours plus de problèmes dans les PR écrites par l'IA ([1,7 fois plus de problèmes majeurs pour CodeRabbit](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report), [44 % des tâches avec une vulnérabilité à risque pour Veracode](https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf), plus d'instabilité pour DORA). Mes 360 remarques disent la même chose : le premier jet est souvent faux. Ce qui a changé, c'est qui le rattrape.
- **Le temps en amont est réel.** Écrire et valider 130 bons tickets m'a pris plus longtemps qu'il n'en a fallu aux agents pour livrer trois jalons. L'équipe .NET a vu la même chose : le taux de réussite de leur agent est passé de 38 % à 69 % après de meilleures instructions, et ils concluent que [« la préparation compte plus que le modèle »](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/).

L'estimation avait donc raison de dire que **je suis le goulot**. Elle se trompait sur *le genre* de travail que j'allais faire. Elle me comptait comme relecteur de code. Je travaille comme product owner et comme architecte qui répond à des questions.

## 8. Les arrêts font partie du workflow

Voici une chose qu'aucune estimation ne mentionne : le travail **s'arrête**. Pas parce que quelque chose casse, mais parce que l'humain n'est pas là, ou parce que le quota d'utilisation est épuisé. Horae n'est pas terminé, et en ce moment il n'avance pas : mon quota hebdomadaire est presque épuisé.

Voici la chronologie d'Horae jusqu'ici (heure de Paris) :

| Pause | Pourquoi | Ce qui a relancé |
|---|---|---|
| 27 oct. 23:22 → 28 oct. 07:58 | la nuit ; les ADR attendaient mon acceptation | *"Accept and merge"* |
| 28 oct. 22:12 → 22:50 | limite d'utilisation atteinte | *"continue"* |
| 29 oct. 01:25 → 08:15 | M2 terminé sauf une story qui attendait mon test réel | *"Merge #29 without it"*, puis l'exécution réelle |
| 29 oct. 09:22 → 18:24 | ma journée de travail ; plus rien en Ready | *"Can you proceed with the next user stories ready to dev?"* |
| 29 oct. 22:16 → maintenant | limite de session, puis le quota hebdomadaire | pas encore |

Sur environ 48 heures de calendrier, les agents ont réellement tourné environ 23 heures. Le reste du temps, ils m'attendaient, ou attendaient le quota.

Ce que les arrêts m'ont appris :

- **Le tableau est la sauvegarde.** Quand tout s'arrête, rien n'est perdu : chaque carte dit où elle en est, chaque PR garde ses questions, chaque story terminée a ses Actuals. La session suivante, ou la personne suivante, commence par lire le tableau, pas un historique de chat.
- **Demander un jalon à la fois, c'est ce qui rend les arrêts peu coûteux.** Comme j'ai demandé M1, puis M2, puis « les stories suivantes », chaque arrêt est tombé entre deux lots ou au milieu d'un petit lot. Si j'avais demandé tout le backlog, le quota aurait coupé un lot bien plus gros en plein milieu.
- **Un arrêt au milieu d'une story a un coût.** À la dernière limite, quatre stories de plugins étaient In progress : l'une avait une PR, les autres seulement une branche ou un worktree. Quand la première limite d'utilisation est tombée, l'agent principal a volontairement arrêté ses deux agents en cours au lieu de brûler ce qui restait du quota, et il a noté où en était chacun (branche, chemin du worktree, ce qui restait à faire). C'est cette note qui rend une reprise possible. J'en ferais maintenant une règle : **avant un arrêt, chaque carte In progress reçoit un commentaire de point de reprise.**
- **Le protocole humain fonctionne à travers les arrêts, mais seulement si l'agent principal relit le tableau.** Le 29 octobre, j'ai répondu aux dix questions de la note sur les liens d'action signés à 19:18 et remis #38 en Ready. Trois heures plus tard, le rapport de l'agent principal listait encore #38 comme « en attente de vos réponses » : il travaillait à partir de ses propres notes, pas du tableau. La carte est toujours en Ready aujourd'hui. La correction est simple : relire le tableau entre les stories, pas seulement au début.
- **Le quota se comporte comme une limite de WIP.** Il plafonne la quantité de travail en cours, et comme toute limite de WIP, il récompense les petits lots et le fait de finir avant de commencer.

La vraie boucle n'est donc pas « les agents tournent sans fin ». C'est **les agents exécutent un lot, l'humain décide et relance**. L'humain est aussi l'ordonnanceur.

## 9. Un second tableau : Angelia

Le 30 octobre, j'ai démarré un second projet, [**Angelia**](https://github.com/angelia-dev/angelia) : un bus d'événements de releases auto-hébergé qui surveille PyPI, npm, crates.io, les releases GitHub et les registres OCI, et livre un CloudEvent signé par nouvelle version à la CI, aux chats et aux agents IA. Écrit en Go, cette fois.

J'ai demandé à Claude de reprendre ce que nous avions fait sur horae-dev et de construire "a full board agent + human development oriented to work together", où **les agents décident quand un humain est nécessaire**, et où **le modèle est choisi selon la complexité**. En environ 45 minutes, il a mis en place cinq dépôts et **129 tickets** sur l'[Angelia Roadmap](https://github.com/orgs/angelia-dev/projects/1).

![Le tableau Angelia : 87 éléments en Backlog, 6 en Ready, 1 en cours et 1 en relecture. Chaque carte affiche son exécutant, son modèle et sa taille, et les premières cartes sont des tâches réservées aux humains](/images/one-human-a-board-and-a-team-of-agents/angelia-board.webp)

C'est similaire, mais pas identique. Voici ce qui a changé, surtout grâce à ce qu'Horae m'a appris :

| | Horae | Angelia |
|---|---|---|
| Dépôts | 15 | 5 |
| Tickets | 130 | 129 |
| **Choix du modèle** | l'agent principal choisit story par story | un champ **Complexity** pilote un champ **Model** sur chaque carte : Low → Haiku, Medium → Sonnet, High et Very high → Opus ; je peux le modifier |
| **Quand demander à un humain** | le champ Executor, plus le jugement de l'agent | des déclencheurs explicites dans `AGENTS.md` : un contrat public, un choix de sécurité, une nouvelle dépendance, une spécification ambiguë, ou le même contrôle de CI qui échoue trois fois |
| **Escalade** | rien d'écrit | trois échecs de CI ou deux fois le temps estimé → un nouvel essai avec le modèle au-dessus → puis un humain |
| **Niveau de détail des spécifications** | chaque story détaillée dès le départ | Phases 0 et 1 détaillées (`agent-ready`) ; les Phases 2 et 3 sont **27 ébauches** (`needs-spec`), détaillées juste avant de démarrer |
| **Première phase** | les fondations | un **spike** avec six benchmarks et un go/no-go humain sur le choix du langage et des plugins |
| **Relecture** | Graft repoussé | l'installation de Graft est l'une des premières cartes |
| **Vues** | 6 | 8, avec en plus un tableau **Human needed** et un **Model planner** |

![La vue « Model planner » : les stories ouvertes avec leur statut, le modèle suggéré, la phase, la complexité, la taille, l'exécutant et les heures d'agent](/images/one-human-a-board-and-a-team-of-agents/angelia-model-planner.webp)

Deux de ces changements répondent à des problèmes que j'ai eus sur Horae :

- **Des spécifications juste à temps.** Sur Horae, j'ai validé 130 tickets détaillés avant toute ligne de code. C'était l'étape humaine la plus coûteuse, et les derniers tickets seront obsolètes quand les agents y arriveront. Sur Angelia, seules les deux prochaines phases sont détaillées ; le reste attend que le spike ait répondu aux grandes questions.
- **Le modèle est sur la carte.** Sur Horae, l'agent principal choisissait le modèle au fil de l'eau, ce qui fonctionnait, mais restait invisible. Sur Angelia, le choix est visible, relisible et modifiable avant l'exécution, et les Actuals diront si Haiku suffisait pour les stories « Low ».

Rien n'est encore fusionné sur Angelia, et regardez ce qu'il y a en tête du tableau : des **tâches réservées aux humains**. Installer l'application de relecture, configurer l'environnement d'exécution des agents et les limites de dépense, réserver les noms, préparer l'environnement de benchmark. L'humain passe en premier.

L'estimation d'Angelia utilise toujours la même grille qu'Horae (une story M = 3,5 heures d'agent), pour **220 jours humains, 294 heures d'agent et 431 heures de supervision**. Sa Phase 0 sera un second test du même modèle, sur un autre langage et un autre type de projet.

## 10. Équipe à deux pizzas ou équipe sandwich ?

L'estimation comparait « un humain + des agents » à « trois développeurs ». Je pense que la comparaison la plus intéressante porte sur la forme de l'équipe.

L'**équipe à deux pizzas** d'Amazon (assez petite pour être nourrie avec deux pizzas, soit six à dix personnes) a été pensée pour limiter la coordination. Même ainsi, huit personnes ont **28 canaux de communication** entre elles (n(n−1)/2). Matt Ström-Awn écrit que l'idée [s'est transformée en « équipes à deux sandwichs »](https://mattstromawn.com/writing/high-agency-strategy/) : le même principe, mais avec une équipe de deux personnes. En juillet, [Business Insider a recueilli le même signal chez des dirigeants de la tech](https://finance.yahoo.com/technology/ai/articles/2-pizza-days-over-heres-095501046.html) : le field CTO de Cursor estime que « deux pizzas, c'est trop de pizza », le PDG de Coinbase parle d'« équipes d'une personne ».

Un tableau comme celui-ci est un **moyeu**, pas un maillage. Un humain parle à un agent principal, l'agent principal parle aux agents de travail, et ceux-ci ne se parlent jamais entre eux. Avec quatre agents, cela fait quatre canaux, pas 28. Ce n'est pas un détail : la recherche sur la coopération entre agents trouve que des agents qui se coordonnent entre eux [font nettement moins bien qu'un agent seul](https://www.mintlify.com/cooperbench/CooperBench/results/findings). Le moyeu est donc aussi la bonne forme pour les agents.

Ce que j'en retiens :

- **L'unité de débit, ce sont maintenant les décisions par jour, pas les lignes de code par jour.** La capacité de décision d'une personne est le plafond. Mes 15 heures par semaine sont la vraie contrainte, comme le disait le modèle, simplement dépensées autrement. Et il y a désormais un second plafond : le quota d'utilisation.
- **Une équipe sandwich de deux personnes est probablement le bon équilibre.** Deux personnes doublent la capacité de décision pour un seul canal de plus, et le tableau continue d'avancer quand l'une des deux est occupée. Sur Horae, le partage évident serait produit et architecture d'un côté, sécurité et stories Human-led de l'autre.
- **Une équipe à deux pizzas devient plusieurs équipes sandwich**, chacune responsable d'un produit ou d'un dépôt avec son propre tableau, plutôt que huit personnes sur un seul backlog. C'est littéralement ce que je fais avec Horae et Angelia : deux tableaux, un humain, chacun avec ses propres agents. La coordination qui reste se fait entre tableaux, et elle peut être explicite : liens « bloqué par », contrats dans `schemas/`, ADR.
- **Les équipes à deux pizzas gagnent encore** là où le travail est irréductiblement humain et parallèle : revues de sécurité, astreintes, connaissance du métier, échanges avec les utilisateurs, et le facteur bus. Une équipe sandwich avec des agents a un facteur bus de un ou deux.

L'étude de terrain de Microsoft sur Claude Code et Copilot CLI a mesuré [environ 24 % de PR fusionnées en plus](https://arxiv.org/abs/2607.01418) chez les adoptants, dans une organisation qui a gardé la forme de ses équipes. C'est un vrai gain, mais rien à voir avec ce qu'on observe quand le processus est reconstruit autour des agents. Je soupçonne que l'essentiel de la différence tient à la forme de l'équipe et au processus, pas au modèle.

## 11. Le mettre en place chez vous

Si vous voulez essayer sur votre propre projet, voici le minimum qui l'a fait fonctionner, avec ce qu'Angelia a ajouté :

1. **Écrivez le backlog avec l'agent, validez-le vous-même.** Des critères d'acceptation sur chaque story. Mais ne détaillez que la prochaine phase ou les deux suivantes ; gardez le reste sous forme d'ébauches.
2. **Ajoutez un champ Executor** (Agent, Agent + human check, Human-led, Human-only) et une **vue Agent-ready**. Les agents doivent savoir quoi laisser de côté.
3. **Mettez le modèle sur la carte** : un champ Complexity et un Model suggéré que vous pouvez modifier.
4. **Décrivez les colonnes.** « Ready = spécification complète », « Human needed = bloqué sur le mainteneur ». Les descriptions sont le protocole.
5. **Écrivez quand un agent doit s'arrêter et demander** : contrats publics, choix de sécurité, nouvelles dépendances, spécifications ambiguës, échecs de CI répétés.
6. **Mettez une estimation et une section Actuals vide dans chaque story.** Demandez à l'agent de remplir les Actuals à la fin. Après 15 stories, vous aurez votre propre calibrage au lieu de l'étude de quelqu'un d'autre.
7. **Séparez les rôles** : constructeur, relecteur indépendant, correcteur. Celui qui écrit n'approuve jamais.
8. **Faites de la CI la porte d'entrée** : un contrôle agrégé « CI OK », et on ne fusionne que sur du vert.
9. **Mettez-vous d'accord sur le protocole Human needed** : questions numérotées dans la PR, réponses sur la PR, carte remise en Ready. Et faites en sorte que l'agent principal **relise le tableau entre les stories**.
10. **Demandez un jalon à la fois**, et faites en sorte que chaque carte In progress porte un point de reprise avant un arrêt.

Ce que je n'ai pas encore fait, et que je devrais : une protection de branche qui *exige* « CI OK » (aujourd'hui ce n'est qu'une convention), [Graft](/fr/six-semaines-en-une-nuit-construire-un-produit-a-lere-des-agents/) sur Horae pour enregistrer quel agent et quel modèle ont écrit chaque PR, et la mesure du coût en tokens par story, maintenant que le quota a montré que c'est une vraie contrainte.

## 12. Pour conclure

L'estimation disait que je serais le goulot, et je le suis. Mais les heures que j'y passe ne sont pas dans les diffs. Elles sont dans les tickets, avant que le code existe, dans les questions auxquelles les agents ne peuvent pas, et ne doivent pas, répondre, et dans la décision d'appuyer sur « continue ». Tout ce qui se passe entre ces moments prend désormais quelques minutes, ou quelques heures pour un jalon entier.

Écrivez bien vos tickets. Laissez le tableau piloter. Gardez les décisions humaines.

## Liens

- 🗂️ [Horae Roadmap](https://github.com/orgs/horae-dev/projects/1) : le tableau public, avec toutes ses vues
- 📦 [horae-dev/horae](https://github.com/horae-dev/horae) : le code, `docs/ESTIMATION.md` et `docs/ROADMAP.md`
- 🗂️ [Angelia Roadmap](https://github.com/orgs/angelia-dev/projects/1) et [angelia-dev/angelia](https://github.com/angelia-dev/angelia) : le second tableau, avec `docs/ESTIMATION.md` et `AGENTS.md`
- 🎬 [La vidéo en pleine page](/videos/human-agents-board/?lang=fr), faite avec [canvas-video-skill](https://github.com/mmornati/canvas-video-skill)
- 📖 [Six semaines en une nuit](/fr/six-semaines-en-une-nuit-construire-un-produit-a-lere-des-agents/) : l'expérience précédente, avec Graft

**Sources :** [METR, Time Horizon 1.1](https://metr.org/blog/2026-1-29-time-horizon-1-1/) (janv. 2026) · [METR, uplift update](https://metr.org/blog/2026-02-24-uplift-update/) (févr. 2026) · [Anthropic, When AI builds itself](https://www.anthropic.com/institute/recursive-self-improvement) (mis à jour en sept. 2026) · [Murphy-Hill, Butler et Savelieva, les agents de code en ligne de commande chez Microsoft](https://arxiv.org/abs/2607.01418) (juil. 2026) · [Équipe .NET, dix mois avec l'agent de code Copilot](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/) (mars 2026) · [CodeRabbit, code IA contre code humain](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report) (déc. 2025) · [Rapport GenAI 2026 de Veracode](https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf) · [Matt Ström-Awn, High-agency strategy](https://mattstromawn.com/writing/high-agency-strategy/) · [Business Insider, la fin des équipes à deux pizzas](https://finance.yahoo.com/technology/ai/articles/2-pizza-days-over-heres-095501046.html) (juil. 2026) · [Résultats de CooperBench](https://www.mintlify.com/cooperbench/CooperBench/results/findings)
