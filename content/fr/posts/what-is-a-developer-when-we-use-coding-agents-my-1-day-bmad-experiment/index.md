---
title: 'Qu''est-ce qu''un développeur quand on utilise des agents de codage ? Mon expérience BMAD d''une journée'
categories:
- ai-coding-agents
tags:
- ai
- development
- developer
- ai-coding-agent
date: '2026-03-14T17:41:36.693000+00:00'
slug: what-is-a-developer-when-we-use-coding-agents-my-1-day-bmad-experiment
description: Le codage est-il mort ? Une expérience d'une journée avec la méthode BMAD. Découvrez pourquoi Agent Supervisor est l'avenir et pourquoi l'architecture est la seule stack qui compte
---




J'ai passé la majeure partie de l'année dernière à faire du "vibecoding" avec l'IA. Les résultats de codage ont été assez bons, mais récemment, j'ai cherché à améliorer le haut de l'entonnoir : comment passer sans accroc d'une idée brute à un projet strictement défini, "prêt à développer" qui fait *exactement* ce que je veux.

Pour tester cela, j'ai décidé de consacrer une journée entière à vraiment explorer la **méthode BMAD** (qui signifie *Breakthrough Method for Agile AI-Driven Development*). Si vous ne la connaissez pas, BMAD est un framework open-source qui applique essentiellement la discipline Agile au codage IA. Au lieu de traiter l'IA comme un simple outil d'autocomplétion chaotique, BMAD vous force à interagir avec des "personas" IA spécialisées (comme un Analyste, un Product Manager et un Architecte). Il vous fait générer des artifacts stricts, versionnés, comme un PRD et une architecture technique, *avant* que tout code ne soit écrit.

Je l'avais utilisée quelques fois auparavant et l'avais trouvée un peu longue, mais cette fois, je lui ai donné le temps qu'elle méritait. L'objectif ? Prendre une idée brute à travers chaque phase de conception logicielle en utilisant ces agents IA, jusqu'au point de codage. Voici comment ça s'est passé, et plus important encore, ce que cela m'a appris sur l'avenir de nos métiers.

## Le voyage de l'idée au MVP

![](/images/what-is-a-developer-when-we-use-coding-agents-my-1-day-bmad-experiment/00-98800595-ad89-403a-9e15-ec74bdbc0497.png)

En utilisant la méthode BMAD, j'ai fait passer mon idée de test à travers cinq phases distinctes :

* **1\. Recherche marché :** Soyons honnêtes, la plupart de nos idées "de génie" ont déjà été construites par quelqu'un d'autre ! L'agent Analyste vous guide à travers une analyse de marché complète, en compilant des données et des résultats. Il sert de vérification précoce de réalité pour voir si le projet vaut vraiment la peine d'être poursuivi.

* **2\. L'Analyste (Construire le PRD) :** C'est ici que vous construisez le Document d'Exigences Produit, et c'est là où j'ai passé *beaucoup* de temps. La méthode vous pousse dans différentes directions, posant des questions intransigeantes et s'adaptant à vos réponses. C'était fascinant parce que mon idée s'est réellement renforcée tout au long du processus. Pas à pas, l'IA m'a aidé à ajouter de nouvelles fonctionnalités pour améliorer le produit core.

* **3\. Épics et Histoires :** Une fois le PRD verrouillé, l'agent Product Manager entre en scène pour définir les épics et les user stories pour le MVP. L'agent continue de guider et de poser des questions, mais vous avez le contrôle total pour adapter ses propositions.

* **4\. L'Architecte Tech :** Voici où le rubber meets the road. Vous passez des exigences fonctionnelles/non-fonctionnelles aux techniques. L'agent Architecte propose des stacks et des directions d'architecture basées sur les exigences SLA. Vous le guidez ensuite vers votre solution préférée : identifier les composants, frameworks, versions spécifiques et stratégies de déploiement.

* **5\. L'UX :** Comme mon application avait un frontend, je suis entré dans la phase de design. L'agent a généré des fichiers Markdown décrivant les styles de page et a même craché des pages HTML d'exemple pour visualiser le résultat.

À ce stade, vous demandez à l'agent un "check de préparation". Il passe tout en revue, corrige quelques problèmes persistants, et boom : l'étape uno de votre projet est terminée.

## Briser l'"esthétique IA" avec Stitch

Il y a une réalité frustrante dans le vibe coding : si vous ne donnez pas à l'IA des prompts hautement spécifiques, elle va defaults vers le même style de thème. Toutes les apps générées par IA commencent à se ressembler dangereusement.

Pour corriger cela, j'ai passé du temps à utiliser un autre outil pour l'UX. Comme j'ai un abonnement Google AI, je me suis lancé dans **Stitch**. Honnêtement, c'était assez impressionnant.

J'ai pris les fichiers Markdown générés à l'étape précédente (décrivant le projet et les pages) et demandé au LLM de dessiner les différentes pages. Stitch agit presque comme un Figma empowerment par l'IA. Vous pouvez ajuster manuellement le texte, les positions et les images, ou simplement demander à l'IA de les modifier pour vous.

![](/images/what-is-a-developer-when-we-use-coding-agents-my-1-day-bmad-experiment/01-54453557-eacf-4b3d-b663-35c39b56ae9f.png)

**Une astuce rapide d'outillage :** Pour tout ce processus de découverte et de design, j'ai utilisé strictement `gemini-cli` (également partie de mon abonnement). Parce qu'il utilise un quota différent, cela m'a permis d'économiser tous mes tokens dans `antigravity` purement pour le heavy lifting de la phase réelle de développement.

Une fois le design terminé, les étapes suivantes sont standard : nourrir les agents développeurs avec les infos produit et l'architecture, leur demander de générer des stories tech hautement détaillées et "implémentables par l'IA", et laisser les agents coder et tester.

## Alors... Les développeurs sont-ils remplacés ?

Passer par ce processus m'a fait réfléchir profondément à l'état actuel du "Développeur."

En ce moment, n'importe qui avec une solide idée et suffisamment de connaissances métier pour challenger une IA peut faire presque toute la première partie de ce processus... **sauf pour l'architecture technique.** Quand l'IA propose une architecture, elle pose des questions techniques pour avancer. Elle demande des conseils sur le déploiement, les goulots d'étranglement de performance, les flux de données et les choix de langage. **C'est ici que les compétences techniques sont encore absolument requises.** Les données récentes de l'industrie soutiennent fortement ce changement. Selon les rapports de fin 2025/début 2026 de firms comme Gartner et DX :

* **La génération de code est mainstream, mais ce n'est pas tout le travail :** ~93% des développeurs utilisent maintenant des assistants de codage IA. De plus, environ **27% de tout le code en production** est maintenant entièrement authored par l'IA.

* **Le mythe du "10x Developer" est mort :** Alors que l'IA accélère les tâches de codage brutes d'environ 26% (économisant aux devs ~3,6 heures par semaine), la vitesse de livraison *organisationnelle* globale ne s'est améliorée que d'environ 8-10%. Pourquoi ? Parce que le goulot d'étranglement s'est simplement déplacé de l'*écriture* du code à la *revue* et à l'*architecture* des systèmes.

* **Le problème des 70% :** L'IA vous mène aux 70% du chemin incroyablement vite. Mais franchir ces 30% finaux — corriger les cas limites, assurer la sécurité et lier les microservices complexes ensemble — nécessite une expertise humaine profonde. En fait, il a été prouvé que le code IA non surveillé introduit 1,7x plus de défauts.

![](/images/what-is-a-developer-when-we-use-coding-agents-my-1-day-bmad-experiment/02-bc651568-36a0-4b96-aa6d-daee142bd23a.png)

Je ne veux pas nécessairement appeler quelqu'un qui ne tape pas de code un "Développeur" anymore. Peut-être que nous évoluons tous vers des "Software Engineers" au sens le plus vrai du terme. Ou peut-être avons-nous besoin d'un titre de travail complètement nouveau : **Agent Supervisor** ? (Gartner prédit effectivement que d'ici 2028, le rôle du développeur passera officiellement de l'*implémentation* à l'*orchestration* — donc nous y sommes déjà !).

### Le dilemme des Juniors et des PM

Cette évolution soulève deux questions massives pour l'industrie :

1. **Qu'en est-il des Juniors ?** Comment quelqu'un qui ne connaît pas encore l'architecture peut-il devenir un "expert" Agent Supervisor ? Des études récentes ont montré une tendance inquiétante : les développeurs qui utilisent l'IA juste pour générer du code pour eux (sans le comprendre) scorent significativement *moins* aux tests de compréhension. S'ils ne tapent pas le code, comment apprennent-ils ? La réponse est la même qu'elle n'a jamais été : lecture, casser des choses et mentorat. Les gens doivent travailler ensemble et partager leurs expériences. L'IA ne remplace pas la dynamique de mentorat senior-junior ; elle la rend plus critique que jamais.

2. **Qu'en est-il des rôles non-techniques ?** C'est le plus dur à avaler. Si un "Agent Supervisor" technique peut utiliser l'IA pour faire toute la découverte, la recherche marché et l'analyse PRD (comme je l'ai fait en une seule journée), où cela laisse-t-il les Product Managers traditionnels ? Pourquoi les gens techniques ne devraient-ils pas simplement owns la phase de préparation produit et ensuite passer immédiatement aux agents de codage ?

Le paysage change rapidement. Taper le code lui-même devient la partie facile. La vraie valeur est maintenant dans la vision, l'architecture, et la capacité de superviser avec confiance la machine qui la construit.