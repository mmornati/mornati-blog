---
title: Qu'est-ce qu'un développeur quand on utilise des agents de codage ? Mon expérience BMAD d'une journée
tags:
- ia
- développement
- développeur
- agent-de-codage-ia
date: '2026-03-14T17:41:36.693000+00:00'
slug: what-is-a-developer-when-we-use-coding-agents-my-1-day-bmad-experiment
description: Le codage est-il mort ? Une expérience d'une journée avec la méthode BMAD.
  Découvrez pourquoi Agent Supervisor est l'avenir et pourquoi l'architecture est la
  seule stack qui compte.
---




J'ai passé la majeure partie de l'année dernière à faire du "vibecoding" avec l'IA. Les résultats de codage ont été assez bons, mais récemment, j'ai cherché à améliorer le haut de l'entonnoir : comment passer sans friction d'une idée brute à un projet strictement défini, "prêt pour le développement", qui fait *exactement* ce que je veux.

Pour tester cela, j'ai décidé de consacrer une journée entière à explorer en profondeur la **méthode BMAD** (qui signifie *Breakthrough Method for Agile AI-Driven Development*). Si vous ne la connaissez pas, BMAD est un framework open-source qui applique essentiellement la discipline Agile au codage par IA. Au lieu de traiter l'IA comme un simple outil d'autocomplétion chaotique, BMAD vous force à interagir avec des "personas" IA spécialisés (comme un Analyste, un Product Manager et un Architecte). Il vous fait générer des artefacts stricts et versionnés, comme un PRD et une architecture technique, *avant* tout code réel écrit.

Je l'avais utilisée quelques fois auparavant et l'avais trouvée un peu longue, mais cette fois, je lui ai accordé le temps qu'elle méritait. L'objectif ? Faire passer une idée brute par chaque phase de conception logicielle en utilisant ces agents IA, jusqu'au point de codage. Voici comment ça s'est passé, et plus important encore, ce que cela m'a appris sur l'avenir de nos métiers.

## Le parcours de l'idée au MVP

![](/images/what-is-a-developer-when-we-use-coding-agents-my-1-day-bmad-experiment/00-98800595-ad89-403a-9e15-ec74bdbc0497.png)

En utilisant la méthode BMAD, j'ai fait passer mon idée de test par cinq phases distinctes :

*   **1\. Recherche de marché :** Soyons honnêtes, la plupart de nos idées "de génie" ont déjà été construites par quelqu'un d'autre ! L'agent Analyste vous guide à travers une analyse de marché complète, en collectant des données et des résultats. Il agit comme une vérification précoce de la réalité pour voir si le projet vaut vraiment la peine d'être pursued.

*   **2\. L'Analyste (Construction du PRD) :** C'est ici que vous construisez le Document d'Exigences Produit, et c'est là où j'ai passé *beaucoup* de temps. La méthode vous pousse dans différentes directions, posant des questions intransigeantes et s'adaptant à vos réponses. C'était fascinant parce que mon idée s'est réellement renforcée tout au long du processus. Pas à pas, l'IA m'a aidé à ajouter de nouvelles fonctionnalités pour améliorer le produit cœur.

*   **3\. Epics et Stories :** Une fois le PRD verrouillé, l'agent Product Manager entre en scène pour définir les epics et les user stories du MVP. L'agent continue de guider et de poser des questions, mais vous avez le contrôle total pour adapter ses propositions.

*   **4\. L'Architecte Tech :** C'est ici que le rubber meets the road. Vous passez des exigences fonctionnelles/non-fonctionnelles aux exigences techniques. L'agent Architecte propose des stacks et des directions d'architecture basées sur les exigences SLA. Vous le guidez ensuite vers votre solution préférée : identifier les composants, les frameworks, les versions spécifiques et les stratégies de déploiement.

*   **5\. L'UX :** Comme mon application avait un frontend, je suis entré dans la phase de conception. L'agent a généré des fichiers Markdown décrivant les styles des pages et a même produit des pages HTML d'exemple pour visualiser le résultat.

À ce stade, vous demandez à l'agent un "check de préparation". Il passe tout en revue, corrige quelques problèmes persistants, et boom : l'étape uno de votre projet est terminée.

## Briser l'"esthétique IA" avec Stitch

Il y a une réalité frustrante dans le vibe coding : si vous ne donnez pas à l'IA des prompts hautement spécifiques, elle va defaults vers le même style de thème exact. Toutes les applications générées par IA commencent à se ressembler dangereusement.

Pour corriger cela, j'ai passé du temps à utiliser un outil différent pour l'UX. Comme j'ai un abonnement Google AI, j'ai sauté sur **Stitch**. Honnêtement, c'était assez impressionnant.

J'ai pris les fichiers Markdown générés à l'étape précédente (décrivant le projet et les pages) et demandé au LLM de dessiner les différentes pages. Stitch agit presque comme un Figma renforcé par l'IA. Vous pouvez ajuster manuellement le texte, les positions et les images, ou simplement demander à l'IA de les modifier pour vous.

![](/images/what-is-a-developer-when-we-use-coding-agents-my-1-day-bmad-experiment/01-54453557-eacf-4b3d-b663-35c39b56ae9f.png)

**Un conseil rapide sur les outils :** Pour tout ce processus de découverte et de conception, j'ai utilisé exclusivement `gemini-cli` (également inclus dans mon abonnement). Comme il utilise un quota différent, cela m'a permis de sauvegarder tous mes tokens dans `antigravity` purement pour les tâches lourdes de la phase de développement réelle.

Une fois la conception terminée, les étapes suivantes sont standard : nourrir les agents développeurs avec les infos produit et l'architecture, leur demander de générer des stories techniques hautement détaillées et "implémentables par IA", et laisser les agents coder et tester.

## Alors... Les développeurs sont-ils remplacés ?

Passer par ce processus m'a fait réfléchir profondément à l'état actuel du "Développeur."

En ce moment, n'importe qui avec une solide idée et suffisamment de connaissances métier pour challenger une IA peut faire presque toute la première partie de ce processus... **sauf pour l'architecture technique.** Quand l'IA propose une architecture, elle pose des questions techniques pour avancer. Elle demande des conseils sur le déploiement, les goulots d'étranglement de performance, les flux de données et les choix de langages. **C'est ici que les compétences techniques sont toujours absolument requises.** Les données récentes de l'industrie soutiennent fortement ce changement. Selon les rapports de fin 2025/début 2026 de firms comme Gartner et DX :

*   **La génération de code est mainstream, mais ce n'est pas tout le travail :** ~93% des développeurs utilisent désormais des assistants de codage IA. De plus, environ **27% de tout le code en production** est désormais entièrement généré par IA.

*   **Le mythe du "développeur 10x" est mort :** Alors que l'IA accélère les tâches de codage brut d'environ 26% (économisant aux devs ~3,6 heures par semaine), la vitesse de livraison *organisationnelle* globale ne s'est améliorée que d'environ 8-10%. Pourquoi ? Parce que le goulot d'étranglement s'est simplement déplacé de l'*écriture* du code à la *revue* et à l'*architecture* des systèmes.

*   **Le problème des 70% :** L'IA vous conduit à 70% du chemin incroyablement vite. Mais combler les 30% restants—corriger les cas limites, assurer la sécurité et lier les microservices complexes entre eux—nécessite une expertise humaine approfondie. En fait, il a été démontré que le code IA non surveillé introduit 1,7x plus de défauts.

![](/images/what-is-a-developer-when-we-use-coding-agents-my-1-day-bmad-experiment/02-bc651568-36a0-4b96-aa6d-daee142bd23a.png)

Je ne veux pas nécessairement appeler "Développeur" quelqu'un qui ne tape pas de code. Peut-être que nous évoluons tous vers de véritables "Ingénieurs Logiciels" au sens le plus pur du terme. Ou peut-être avons-nous besoin d'un titre de travail complètement nouveau : **Agent Supervisor** ? (Gartner prédit effectivement qu'en 2028, le rôle du développeur passera officiellement de l'*implémentation* à l'*orchestration*—donc nous y sommes déjà !).

### Le dilemme des Juniors et des PM

Cette évolution soulève deux questions massives pour l'industrie :

1.  **Et les Juniors ?** Comment quelqu'un qui ne connaît pas encore l'architecture peut-il devenir un "expert" Agent Supervisor ? Des études récentes ont montré une tendance inquiétante : les développeurs qui utilisent l'IA simplement pour générer du code à leur place (sans le comprendre) obtiennent des scores significativement *inférieurs* aux tests de compréhension. S'ils ne tapent pas le code, comment apprennent-ils ? La réponse est la même qu'elle ne l'a jamais été : lire, casser des choses et le mentorship. Les gens doivent travailler ensemble et partager leurs expériences. L'IA ne remplace pas la dynamique de mentorship senior-junior ; elle la rend plus critique que jamais.

2.  **Et les rôles non techniques ?** C'est la pilule la plus dure à avaler. Si un "Agent Supervisor" technique peut utiliser l'IA pour faire toute la découverte, la recherche de marché et l'analyse PRD (comme je l'ai fait en une seule journée), où cela laisse-t-il les Product Managers traditionnels ? Pourquoi les gens techniques ne devraient-ils pas simplement owning la phase de préparation produit et ensuite passer directement aux agents de codage ?

Le paysage change rapidement. Taper le code lui-même devient la partie facile. La vraie valeur est maintenant dans la vision, l'architecture et la capacité de superviser confiance la machine qui la construit.
