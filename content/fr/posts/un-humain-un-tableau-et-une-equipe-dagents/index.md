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
- estimation
- productivity
- team-topology
date: '2026-10-28T17:00:00.000000+00:00'
draft: false
slug: un-humain-un-tableau-et-une-equipe-dagents
translationKey: human-agents-board
cover: cover.jpg
showHero: true
description: "Comment je construis Horae avec une équipe d'agents IA et un seul tableau GitHub Project : des tickets écrits avec Claude et validés par moi, une seule consigne (« suis le tableau »), trois agents par story (construire, relire de façon indépendante, corriger) et un protocole simple pour les moments où un humain est nécessaire. L'estimation initiale disait qu'un humain avec des agents serait plus lent que trois développeurs. Les six premières stories ont pris de 7 à 32 minutes de travail d'agent chacune, contre des heures dans l'estimation. Pourquoi le modèle se trompait, ce qu'il dit encore de juste, et ce que cela change entre l'équipe à deux pizzas et l'équipe sandwich."
summary: "L'estimation disait qu'un humain avec quatre agents mettrait 76 semaines là où trois développeurs en mettent 22. Puis le tableau s'est mis à bouger : six stories, de 7 à 32 minutes de travail d'agent chacune, 97 remarques de relecture corrigées avant fusion, aucune reprise par l'humain. Le goulot reste l'humain, mais pas là où le modèle le plaçait."
projects:
- horae
---

Hier, j'ai demandé à Claude d'estimer un projet de deux façons : en **jours humains**, si une équipe de développeurs le construisait, et en **jours IA**, si une équipe d'agents le construisait sous ma supervision. La réponse était claire, et un peu décevante : **un humain avec quatre agents serait plus lent que trois développeurs**. 76 semaines contre 22, parce que ma supervision serait le goulot d'étranglement.

Je n'étais pas convaincu. J'ai donc organisé le projet pour que le tableau lui-même me donne la réponse : chaque story porte son estimation, et chaque story reçoit ses chiffres réels une fois terminée. Puis j'ai donné aux agents une seule consigne : *suis le tableau*.

Ce billet raconte comment cela fonctionne au quotidien (le tableau, les agents, les moments où l'on a besoin de moi), ce que disent les premiers chiffres face à l'estimation, et ce qui change quand votre « équipe » est une personne et quelques agents plutôt qu'une équipe à deux pizzas.

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

![Le tableau Horae ce matin : 106 éléments en Backlog, 3 en Ready, 5 en cours et 6 terminés, chaque carte terminée liée à sa pull request fusionnée](/images/one-human-a-board-and-a-team-of-agents/board.webp)

Autour, cinq autres vues : **Roadmap**, **Backlog by milestone** (avec les estimations), **Agent-ready** (filtre `label:agent-ready status:Ready` : ce qu'un agent peut prendre maintenant), **Human work** (les éléments Human-led et Human-only, le vrai goulot) et **Burning points** (les risques).

![La vue « Human work » : chaque élément Human-led et Human-only avec ses heures de supervision, de 8 à 28 heures chacun](/images/one-human-a-board-and-a-team-of-agents/human-work.webp)

C'est cette dernière capture que je regarde le plus. Elle me dit où vont passer mes soirées.

## 4. Une seule consigne : suis le tableau

Puis j'ai écrit ceci (en anglais, fautes comprises) :

> Following the project on github https://github.com/orgs/horae-dev/projects/1/views/3 Start in the right order the epics/issues ready for agents dev.
> Use the proper workflow with subagents when needed assigning the proper model based on the complexity, make a full review with another agent and fix then all the findings with a third agent.
> Create the PR referencing the issue, wait for the CI to be green, merge and move on.

En clair : suis le projet, démarre dans le bon ordre ce qui est prêt pour les agents, choisis le modèle selon la complexité, fais relire par un autre agent, fais corriger toutes les remarques par un troisième, ouvre la PR qui référence le ticket, attends que la CI soit verte, fusionne et passe au suivant. Une minute plus tard, un second message : *assigne chaque tâche avant de commencer, pour pouvoir suivre le temps*.

À partir de là, la session Claude Code principale a piloté le tableau. Pour chaque story Ready, dans l'ordre des dépendances :

1. **Assigner** le ticket (à moi) et le passer en **In progress** : l'horodatage lance le chronomètre.
2. **Construire** : un sous-agent l'implémente sur une branche `story/<n>-<slug>`. L'agent principal choisit le modèle selon la complexité : Sonnet pour l'échafaudage, la CI et le workflow des agents ; Opus pour les JSON Schemas, la validation des intents et les ADR.
3. **Relire** : un agent Opus distinct relit le travail au regard des critères d'acceptation, de `PLAN.md` et des stories qui en dépendent. Il ne modifie rien : il reproduit les problèmes dans un clone jetable et écrit ses remarques.
4. **Corriger** : un troisième agent corrige *toutes* les remarques.
5. Ouvrir la PR qui référence le ticket, **attendre que la CI soit verte**, fusionner.
6. Publier les **Actuals** sur le ticket et passer la carte en **Done**.

![La story #13 dans l'historique du ticket : passée en Ready, assignée, passée en In progress, fermée par la PR fusionnée, puis le commentaire Actuals : 1 implémentation, 1 relecture avec 20 remarques (8 majeures), 1 passe de correction, environ 32 minutes d'agent, pas de reprise humaine](/images/one-human-a-board-and-a-team-of-agents/issue-actuals.webp)

Les cartes dont l'Executor est **Human-led** sont laissées de côté : elles m'attendent. Le lendemain matin, comme il restait des stories indépendantes, l'agent principal les a lancées **en parallèle**, chacune dans son propre worktree git : une note de modèle de menaces, une note sur l'hôte de plugins, le stockage SQLite, le chargeur de configuration et la validation des intents, pendant que les précédentes étaient encore en relecture.

### Ce que les relecteurs ont trouvé

C'est la partie qui m'a convaincu que la boucle fonctionne. L'implémenteur disait toujours « tous les contrôles passent ». Le relecteur trouvait toujours quelque chose de réel, et souvent de sérieux :

- **#10 échafaudage** (16 remarques) : gitleaks ignorait silencieusement un dossier entier, et Renovate n'aurait jamais mis à jour les hooks pre-commit.
- **#15 workflow des agents** (13) : le hook de commit utilisait le premier `python3` du PATH. Avec le Python 3.9 par défaut de macOS, il plantait et **bloquait tous les commits**, y compris les miens.
- **#13 schémas** (20, dont 8 majeures) : un chemin de note pouvait sortir du coffre Obsidian vers `.obsidian/plugins` (exécution de code sur mon portable), `notify.push` acceptait des liens `javascript:`, les URL de `http.post` pouvaient contourner la liste d'hôtes autorisés, et le lockfile acceptait des URL git `ext::`.
- **#18 stockage SQLite** : les clés étrangères étaient activées avant les migrations, donc une future reconstruction de table aurait effacé en silence tout le journal. Le relecteur a reproduit la perte de données.
- **#16 chargeur de configuration** : 400 `[` imbriqués faisaient planter `horae doctor`, et un secret pouvait fuiter par le contexte d'exception de Python.

En plus, un hook Semgrep a bloqué la session deux fois sur du SQL construit avec des f-strings, et l'agent principal a fait réécrire chaque requête en chaîne fixe à l'agent du stockage. Rien de tout cela n'a eu besoin de moi.

## 5. Quand on a besoin d'un humain

Certaines stories sont à moi par conception : le modèle de menaces, l'hôte de plugins, tout ce où un mauvais choix par défaut devient une faille. Pour celles-là, l'agent ne devine pas. Il écrit une **note de conception** dans une PR en brouillon, avec des questions numérotées, et la carte passe en **Human needed**.

Le protocole tient en deux étapes :

1. **Répondre sur la PR**, en gardant les numéros des questions. Des réponses courtes suffisent ; « tout comme proposé » aussi.
2. **Remettre la carte en Ready.** C'est le signal. La prochaine fois qu'un agent la prend, il lit mes commentaires, transforme la note en livrable réel et relance la boucle habituelle construire → relire → corriger → fusionner.

![La pull request #85, la note de conception de l'hôte de plugins : dix questions numérotées pour le mainteneur, et en dessous mes réponses, une ligne chacune](/images/one-human-a-board-and-a-team-of-agents/pr-questions-answers.webp)

Dix questions, dix réponses d'une ligne, une carte remise en Ready. C'est toute l'interface.

Le même schéma revient pour les petites décisions. Quand `PLAN.md` était ambigu, les agents **ont choisi l'option la plus stricte** (assouplir une règle plus tard ne casse rien, la durcir si), l'ont notée comme provisoire et me l'ont listée : 21 décisions de contrat dans `schemas/README.md`, que j'ai confirmées en un message le lendemain matin. Les ADR (story #12, « Agent + human check ») sont restées non fusionnées jusqu'à ce que je les lise et que j'écrive « Accept and merge ».

Les agents m'ont aussi dit clairement ce qu'ils *ne pouvaient pas* faire : installer une GitHub App privée sur l'organisation, ou configurer les champs de date de la vue Roadmap, que l'API n'expose pas. Ces tâches sont parties dans l'epic « Human operations ».

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

Donc l'essentiel des 1 134 heures, c'était moi, en train de relire des diffs et de sauver des agents.

## 7. Ce que dit le tableau après six stories

Le projet prévoit de « recalibrer après environ 15 stories », donc c'est une première lecture, pas un verdict. Mais l'écart est assez grand pour valoir d'être montré :

| Story | Taille · risque | Temps d'agent estimé | Supervision estimée | **Temps d'agent mesuré** | Remarques de relecture | Résultat |
|---|---|---|---|---|---|---|
| #10 échafaudage uv | S · Docs/CI | 0,9 h | 2,0 h | **7 min** | 16 | fusionnée, [#78](https://github.com/horae-dev/horae/pull/78) |
| #11 pipeline CI | S · Docs/CI | 0,9 h | 2,0 h | **7 min** | 10 (1 bloquante) | fusionnée, [#79](https://github.com/horae-dev/horae/pull/79) |
| #15 workflow des agents | XS · Docs/CI | 0,3 h | 1,0 h | **12 min** | 13 (1 bloquante) | fusionnée, [#80](https://github.com/horae-dev/horae/pull/80) |
| #13 JSON Schemas | M · Core contract | 3,7 h | 7,7 h | **32 min** | 20 (8 majeures) | fusionnée, [#81](https://github.com/horae-dev/horae/pull/81) |
| #12 ADR | M · Design | 4,2 h | 7,5 h | **11 min** | 25 (8 majeures) | acceptée par moi, [#82](https://github.com/horae-dev/horae/pull/82) |
| #20 validation des intents | M · Core contract | 3,7 h | 7,7 h | **20 min** | 13 (4 moyennes) | fusionnée, [#87](https://github.com/horae-dev/horae/pull/87) |
| **Total** | | **13,7 h** | **27,9 h** | **89 min** | **97** | 6 terminées, 0 reprise |

Le « temps d'agent mesuré » est la somme des durées des trois agents (construire, relire, corriger) telle que publiée sur chaque ticket. Il ne compte pas l'attente de la CI, qui ajoutait quelques minutes par story. Les cinq premières se sont déroulées en une soirée, du premier message à 21 h 03 à la dernière PR prête à 22 h 22.

Trois choses ressortent :

1. **Le temps d'agent était surestimé d'environ 9 fois.** 89 minutes là où le modèle en attendait presque 14 heures. C'est la partie qui compte le moins, car le temps d'agent n'a jamais été le goulot.
2. **Aucune reprise.** Le modèle s'attendait à ce que les stories M ratent leur premier essai la plupart du temps (30 à 50 % de réussite) et retombent sur moi. Elles ne sont pas retombées sur moi : le relecteur a trouvé les problèmes et le correcteur les a corrigés. Un premier essai raté est devenu une itération interne peu coûteuse, pas un sauvetage humain.
3. **Ma supervision n'a pas disparu, elle s'est déplacée.** L'estimation mettait environ 28 heures de supervision sur ces six stories, surtout pour relire des diffs. Je n'ai relu aucun diff. Mon temps est allé *en amont* (les sessions de planification et la validation de 130 tickets, quelques soirées) et *sur le côté* (répondre aux questions de conception, confirmer 21 décisions provisoires, accepter six ADR).

### Pourquoi le modèle se trompait

Le modèle n'était pas bâclé. Il était **construit sur des chiffres de 2025, et il plaçait l'humain au mauvais endroit**.

- **Les données ont vieilli vite.** La mise à jour de METR place le temps de doublement de la longueur des tâches que savent mener les modèles de pointe à [environ 89 jours pour les modèles depuis 2024](https://metr.org/blog/2026-1-29-time-horizon-1-1/), et Anthropic parle d'un doublement [« environ tous les quatre mois, contre tous les sept mois auparavant »](https://www.anthropic.com/institute/recursive-self-improvement). Une estimation faite en octobre à partir d'études du début 2025 est calibrée sur des modèles qui ont deux ou trois doublements de retard.
- **Il supposait qu'un humain relit chaque essai.** Dans ce workflow, c'est un agent indépendant qui relit, et moi je relis les décisions. C'est aussi la direction que prennent les grandes équipes : Anthropic écrit que [« la relecture de code humaine est devenue un nouveau goulot »](https://www.anthropic.com/institute/recursive-self-improvement), avec plus de 80 % de son code fusionné désormais écrit par Claude. L'équipe .NET de Microsoft, après dix mois avec l'agent de code Copilot, [désigne elle aussi la relecture comme le goulot](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/).
- **La « réussite au premier essai » était la mauvaise unité.** Elle mesure si le premier diff est fusionnable. Avec un relecteur et un correcteur dans la boucle, ce qui compte, c'est si la *boucle* converge sans humain. Six sur six l'ont fait.

### Ce que le modèle dit encore de juste

Je ne veux pas remplacer un chiffre faux par un autre, alors voici les limites honnêtes :

- **C'étaient les stories les plus faciles.** Les fondations : échafaudage, CI, schémas, documentation. Le modèle lui-même dit que les agents sont presque gratuits sur le travail Docs/CI. La partie difficile (sécurité, bac à sable des plugins, API externes non officielles) est marquée Human-led et n'a pas commencé.
- **Six stories, c'est un tout petit échantillon**, et rien n'est encore en production. « Fusionné avec une CI verte après une relecture indépendante » ne veut pas dire « correct ».
- **Les défauts ne disparaissent pas.** Les études trouvent toujours plus de problèmes dans les PR écrites par l'IA ([1,7 fois plus de problèmes majeurs pour CodeRabbit](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report), [44 % des tâches avec une vulnérabilité à risque pour Veracode](https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf), plus d'instabilité pour DORA). Mes 97 remarques disent la même chose : le premier jet est souvent faux. Ce qui a changé, c'est qui le rattrape.
- **Le temps en amont est réel.** Écrire et valider 130 bons tickets m'a pris plus longtemps qu'il n'en a fallu aux agents pour en livrer six. L'équipe .NET a vu la même chose : le taux de réussite de leur agent est passé de 38 % à 69 % après de meilleures instructions, et ils concluent que [« la préparation compte plus que le modèle »](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/).

L'estimation avait donc raison de dire que **je suis le goulot**. Elle se trompait sur *le genre* de travail que j'allais faire. Elle me comptait comme relecteur de code. Je travaille comme product owner et comme architecte qui répond à des questions.

## 8. Équipe à deux pizzas ou équipe sandwich ?

L'estimation comparait « un humain + des agents » à « trois développeurs ». Je pense que la comparaison la plus intéressante porte sur la forme de l'équipe.

L'**équipe à deux pizzas** d'Amazon (assez petite pour être nourrie avec deux pizzas, soit six à dix personnes) a été pensée pour limiter la coordination. Même ainsi, huit personnes ont **28 canaux de communication** entre elles (n(n−1)/2). Matt Ström-Awn écrit que l'idée [s'est transformée en « équipes à deux sandwichs »](https://mattstromawn.com/writing/high-agency-strategy/) : le même principe, mais avec une équipe de deux personnes. En juillet, [Business Insider a recueilli le même signal chez des dirigeants de la tech](https://finance.yahoo.com/technology/ai/articles/2-pizza-days-over-heres-095501046.html) : le field CTO de Cursor estime que « deux pizzas, c'est trop de pizza », le PDG de Coinbase parle d'« équipes d'une personne ».

Un tableau comme celui-ci est un **moyeu**, pas un maillage. Un humain parle à un agent principal, l'agent principal parle aux agents de travail, et ceux-ci ne se parlent jamais entre eux. Avec quatre agents, cela fait quatre canaux, pas 28. Ce n'est pas un détail : la recherche sur la coopération entre agents trouve que des agents qui se coordonnent entre eux [font nettement moins bien qu'un agent seul](https://www.mintlify.com/cooperbench/CooperBench/results/findings). Le moyeu est donc aussi la bonne forme pour les agents.

Ce que j'en retiens :

- **L'unité de débit, ce sont maintenant les décisions par jour, pas les lignes de code par jour.** La capacité de décision d'une personne est le plafond. Mes 15 heures par semaine sont la vraie contrainte, comme le disait le modèle, simplement dépensées autrement.
- **Une équipe sandwich de deux personnes est probablement le bon équilibre.** Deux personnes doublent la capacité de décision pour un seul canal de plus. Sur Horae, le partage évident serait produit et architecture d'un côté, sécurité et stories Human-led de l'autre.
- **Une équipe à deux pizzas devient plusieurs équipes sandwich**, chacune responsable d'un epic ou d'un dépôt avec son propre tableau, plutôt que huit personnes sur un seul backlog. La coordination qui reste se fait entre tableaux, et elle peut être explicite : liens « bloqué par », contrats dans `schemas/`, ADR.
- **Les équipes à deux pizzas gagnent encore** là où le travail est irréductiblement humain et parallèle : revues de sécurité, astreintes, connaissance du métier, échanges avec les utilisateurs, et le facteur bus. Une équipe sandwich avec des agents a un facteur bus de un ou deux.

L'étude de terrain de Microsoft sur Claude Code et Copilot CLI a mesuré [environ 24 % de PR fusionnées en plus](https://arxiv.org/abs/2607.01418) chez les adoptants, dans une organisation qui a gardé la forme de ses équipes. C'est un vrai gain, mais rien à voir avec ce qu'on observe quand le processus est reconstruit autour des agents. Je soupçonne que l'essentiel de la différence tient à la forme de l'équipe et au processus, pas au modèle.

## 9. Le mettre en place chez vous

Si vous voulez essayer sur votre propre projet, voici le minimum qui l'a fait fonctionner :

1. **Écrivez le backlog avec l'agent, validez-le vous-même.** Des critères d'acceptation sur chaque story. C'est le travail humain qui paie pour tout le reste.
2. **Ajoutez un champ Executor** (Agent, Agent + human check, Human-led, Human-only) et une **vue Agent-ready**. Les agents doivent savoir quoi laisser de côté.
3. **Décrivez les colonnes.** « Ready = spécification complète », « Human needed = bloqué sur le mainteneur ». Les descriptions sont le protocole.
4. **Mettez une estimation et une section Actuals vide dans chaque story.** Demandez à l'agent de remplir les Actuals à la fin. Après 15 stories, vous aurez votre propre calibrage au lieu de l'étude de quelqu'un d'autre.
5. **Séparez les rôles** : constructeur, relecteur indépendant, correcteur. Celui qui écrit n'approuve jamais.
6. **Faites de la CI la porte d'entrée** : un contrôle agrégé « CI OK », et on ne fusionne que sur du vert.
7. **Mettez-vous d'accord sur le protocole Human needed** : questions numérotées dans la PR, réponses sur la PR, carte remise en Ready.
8. **Donnez une seule consigne** : suis le tableau, dans l'ordre, assigne avant de commencer, fusionne sur du vert, publie les Actuals.

Ce que je n'ai pas encore fait, et que je devrais : une protection de branche qui *exige* « CI OK » (aujourd'hui ce n'est qu'une convention), [Graft](/fr/six-semaines-en-une-nuit-construire-un-produit-a-lere-des-agents/) sur l'organisation pour enregistrer quel agent et quel modèle ont écrit chaque PR, et la mesure du coût en tokens par story.

## 10. Pour conclure

L'estimation disait que je serais le goulot, et je le suis. Mais les heures que j'y passe ne sont pas dans les diffs. Elles sont dans les tickets, avant que le code existe, et dans les questions auxquelles les agents ne peuvent pas, et ne doivent pas, répondre. Tout ce qui se passe entre ces deux moments prend désormais quelques minutes.

Écrivez bien vos tickets. Laissez le tableau piloter. Gardez les décisions humaines.

## Liens

- 🗂️ [Horae Roadmap](https://github.com/orgs/horae-dev/projects/1) : le tableau public, avec toutes ses vues
- 📦 [horae-dev/horae](https://github.com/horae-dev/horae) : le code, `docs/ESTIMATION.md` et `docs/ROADMAP.md`
- 🎬 [La vidéo en pleine page](/videos/human-agents-board/?lang=fr), faite avec [canvas-video-skill](https://github.com/mmornati/canvas-video-skill)
- 📖 [Six semaines en une nuit](/fr/six-semaines-en-une-nuit-construire-un-produit-a-lere-des-agents/) : l'expérience précédente, avec Graft

**Sources :** [METR, Time Horizon 1.1](https://metr.org/blog/2026-1-29-time-horizon-1-1/) (janv. 2026) · [METR, uplift update](https://metr.org/blog/2026-02-24-uplift-update/) (févr. 2026) · [Anthropic, When AI builds itself](https://www.anthropic.com/institute/recursive-self-improvement) (mis à jour en sept. 2026) · [Murphy-Hill, Butler et Savelieva, les agents de code en ligne de commande chez Microsoft](https://arxiv.org/abs/2607.01418) (juil. 2026) · [Équipe .NET, dix mois avec l'agent de code Copilot](https://devblogs.microsoft.com/dotnet/ten-months-with-cca-in-dotnet-runtime/) (mars 2026) · [CodeRabbit, code IA contre code humain](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report) (déc. 2025) · [Rapport GenAI 2026 de Veracode](https://www.veracode.com/wp-content/uploads/2026-GenAI-Report-Infographic.pdf) · [Matt Ström-Awn, High-agency strategy](https://mattstromawn.com/writing/high-agency-strategy/) · [Business Insider, la fin des équipes à deux pizzas](https://finance.yahoo.com/technology/ai/articles/2-pizza-days-over-heres-095501046.html) (juil. 2026) · [Résultats de CooperBench](https://www.mintlify.com/cooperbench/CooperBench/results/findings)
