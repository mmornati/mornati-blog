---
title: 'Votre agent IA mérite un harnais, pas un Far West'
tags:
- ai
- machine-learning
- software-engineering
- benchmarking
- llm
- ai-engineering
- enterprise-ai
- ai-agent
- model-context-protocol
- mcp
- llm-observability
- token-optimization
date: '2026-05-31T16:47:18.187000+00:00'
slug: your-ai-agent-deserves-a-tool-harness-not-a-wild-west
description: Au-delà du far west des agents IA. Découvrez comment construire un écosystème piloté par proxy, validé par benchmarks pour optimiser vos outils MCP et vos coûts de tokens.
---




Nous avons commencé comme tout le monde : donner au LLM accès à tout et espérer qu'il se débrouille. Connecter le MCP GitHub, le MCP Jira, le MCP de l'API produit interne, ajouter un ou deux schémas de base de données, et laisser le modèle errer.

Ça a marché, vaguement. Le modèle pouvait répondre aux questions. Il pouvait effectuer des actions. Mais chaque session était imprévisible. Il appelait le mauvais outil, cyclait à travers des APIs irrelevantes, hallwayucinait des paramètres d'endpoint, et brûlait des tokens sur des données dont il n'avait jamais besoin.

Il y a quelques semaines, nous avons commencé à construire quelque chose de différent : un harnais. Pas juste plus d'outils, mais un écosystème curaté avec un proxy qui observe tout, un moteur de benchmark qui mesure ce qui compte, et une boucle d'apprentissage qui transforme les captures brutes en améliorations mesurables.

Les premiers résultats sont déjà intéressants, et nous venons tout juste de commencer.

* * *

## Principe 1 : Un MCP au-dessus d'une API produit n'est pas une UX

La chose la plus facile au monde est d'envelopper une API interne dans un serveur MCP et de l'appeler fait. Vous générez une spec OpenAPI, pointez un outil dessus, et le LLM a maintenant accès à 47 endpoints.

Est-ce que ça aide ? Marginalement. Le modèle voit des signatures de fonctions au lieu de chemins REST. Mais il doit toujours comprendre quel endpoint appeler, dans quel ordre, avec quels paramètres, et quoi faire quand ça échoue.

Un MCP n'est pas une interface utilisateur. **Un MCP est une couche de transport.** La valeur ne vient pas d'exposer plus d'endpoints, elle vient de concevoir des opérations qui correspondent à ce que le LLM veut réellement accomplir.

### Exemple réel : Panier e-commerce

Votre API produit a :

* `POST /cart/items` — ajouter un article
* `PUT /cart/items/{id}` — mettre à jour la quantité
* `DELETE /cart/items/{id}` — supprimer un article
* `POST /cart/checkout` — démarrer le checkout
* `GET /cart/delivery-options` — options de livraison disponibles
* `POST /cart/delivery-option` — sélectionner la livraison
* `POST /cart/payment` — soumettre le paiement
* `GET /cart/order-confirmation` — obtenir le reçu

Le LLM ne veut pas orchestrer un flux de checkout en 8 étapes. Il veut un outil MCP appelé `complete_checkout(cart_id, shipping_method, payment_token) → order_summary` qui gère l'orchestration en interne. Les endpoints API bruts sont disponibles pour les humains de l'équipe frontend. Le MCP devrait exposer **des intents**, pas des endpoints.

**La règle :** si une signature d'outil MCP ressemble à quelque chose copié d'une interface Swagger, vous vous y prenez mal. Un MCP devrait simplifier la charge cognitive du modèle, pas refléter la structure interne de l'API. Si vous voulez utiliser des APIs brutes, créez un SKILL, ajoutez le doc OpenAPI comme sources et le LLM saura quoi faire sans créer un MCP supplémentaire.

* * *

## Principe 2 : Les Skills sont des descripteurs de processus, pas des extraits de code

Les outils bruts disent au LLM *ce qu'il peut faire*. Un **Skill** lui dit *comment* faire quelque chose : le processus, l'ordre, la récupération d'erreur, les cas limites à vérifier.

```markdown
# internal-app-referential

Récupère les informations d'actifs du registre produit en utilisant des requêtes GraphQL directes.

## Quand utiliser
- L'utilisateur demande des informations sur les produits, composants ou leurs relations
- L'utilisateur a besoin d'informations sur la stack technologique à travers le portfolio
- L'utilisateur demande des vues au niveau domaine (finance, hr, ecommerce, ...)

## Processus
1. Appeler `read_skill` pour charger ces instructions
2. Utiliser `http_request` pour appeler l'endpoint GraphQL
3. Pour les comptages simples : utiliser la requête `aggregateProductCount`
4. Pour le filtrage par domaine : ajouter l'argument `domain`
5. Pour les requêtes technologiques : utiliser la requête `componentsWithStack`
6. Si HTTP 4xx ou 5xx : réessayer une fois, puis rapporter l'erreur à l'utilisateur

## Important
- Toujours requêter les champs spécifiques demandés — ne pas tout fetch
- Paginer lors des requêtes de listes (20 par page)
- Si une requête retourne aucun résultat, rapporter "aucune donnée trouvée" — ne pas deviner
```

Cela peut faire partie d'un vrai skill pour permettre au LLM de naviguer à travers un référentiel produit. Ce n'est pas du code, c'est de la **conception d'instructions**. Le LLM le lit, internalise le processus, et l'exécute avec les outils disponibles.

### Pourquoi les contraintes de taille comptent

Nous avons tous appris ça à nos dépens. Les premiers skills étaient des essais de 3000+ mots couvrant chaque variation possible, essayant de scriptier le monde imprévisible d'un LLM dans un seul chemin prédéterminé. Avons-nous vraiment besoin de l'IA dans ce cas ? Le LLM perdrait la trace du processus réel à l'intérieur de toute la documentation quand la taille augmente.

Chaque skill suit maintenant un **contexte budget** :

* **Nom + Description** : tient dans la liste de skills du prompt système (1-2 lignes chacun)
* **Instructions complètes** : chargées à la demande via `read_skill`, doit tenir dans ~15 étapes agentiques
* **Un processus par skill** : pas de branching dans des workflows non liés

Si un skill dépasse ces contraintes, il est divisé. La mémoire de travail du LLM est finie, traitez-la comme telle.

* * *

## Principe 3 : En juin 2026, chaque token a un prix

Le monde des APIs a largement migré vers la tarification pay-per-token. Les forfaits mensuels existent encore pour certains produits grand public (GitHub Copilot, par exemple), mais les principaux providers LLM : OpenAI, Anthropic, Google, facturent par token consommé. [\[1\]](https://www.stackspend.app/resources/blog/ai-api-pricing-guide-2026) [\[2\]](https://openai.com/api/pricing) [\[3\]](https://docs.anthropic.com/en/docs/about-claude/pricing) [\[4\]](https://cloud.google.com/vertex-ai/generative-ai/pricing)

Pour l'accès API, il n'y a plus de facture mensuelle prévisible, juste des compteurs qui tournent sur chaque requête, chaque prompt système, chaque schéma d'outil, chaque réponse verbose.

| Provider | Entrée ($/1M tokens) | Sortie ($/1M tokens) | Notes |
| --- | --- | --- | --- |
| OpenAI GPT-5.2 | $1.75 | $14.00 |  |
| OpenAI GPT-5 Mini | $0.25 | $2.00 | Tier low-cost |
| Claude Sonnet 4.6 | $3.00 | $15.00 | Premium long-context au-dessus de 200K entrée |
| Gemini 2.5 Pro | $1.25 | $10.00 | Taux plus élevés au-dessus de 200K entrée |
| GitHub Copilot Pro | $10/mois | flat seat | Des limites d'utilisation s'appliquent ; pause des nouvelles inscriptions depuis avril 2026 [\[5\]](https://github.blog/news-insights/company-news/changes-to-github-copilot-individual-plans/) |

> **GitHub Copilot change ses plans individuels le 1er juin 2026.** [\[5\]](https://github.blog/news-insights/company-news/changes-to-github-copilot-individual-plans/) L'entreprise a annoncé des limites d'utilisation plus strictes, des changements de disponibilité de modèle (Opus retiré des plans Pro), et un shift vers des limites hebdomadaires basées sur les tokens. Si vous utilisez Copilot dans votre harnais, ça vaut le coup de surveiller.

Chaque token dans chaque prompt système, chaque schéma d'outil injecté, chaque réponse API verbose : vous payez pour.

Cela change comment vous concevez votre harnais. Quand l'IA veut un nom de client, lui donner l'objet client complet (adresse, préférences, historique de commandes, méthodes de paiement, 15 relations imbriquées) n'est pas juste une mauvaise conception, c'est **une mauvaise conception coûteuse**.

### Vos APIs originales doivent aussi être prêtes pour l'IA

Voici la partie qu'il m'a fallu un moment pour articuler clairement : ce n'est pas juste la couche MCP qui a besoin d'être repensée. **Vos APIs produit elles-mêmes devraient être conçues en pensant à l'utilisation par LLM.**

Un LLM appelant un endpoint REST standard reçoit tout en retour : chaque champ, chaque objet imbriqué, chaque ressource liée. C'est fine pour un frontend qui peut afficher ce dont il a besoin et ignorer le reste (c'est bien, mais vous gaspillez quand même des ressources). Pour un LLM, chaque champ est un token qu'il doit traiter, et les tokens coûtent de l'argent.

La solution n'est pas toujours "ajouter un MCP par-dessus". Parfois, ça vaut le coup de retourner à l'API elle-même et de demander : à quoi cela ressemblerait-si un agent IA en était le consommateur principal ?

**Le pattern que nous pourrions utiliser :** soit concevoir des endpoints "lookup" dédiés qu'un LLM pourrait requêter pour ne récupérer qu'un sous-ensemble de champs, soit envelopper les APIs existantes avec une fine couche MCP qui fait le filtrage et la conversion :

```graphql
# Ce que l'API produit expose aux humains
query {
  customer(id: "123") {
    name, email, address, phone, preferences, paymentMethods,
    orders { items, total, status, history }
  }
}

# Ce qu'une API friendly LLM pourrait exposer
query {
  customer(id: "123") {
    name              # → "Marco Mornati"
    # C'est tout. Juste ce que le modèle a demandé.
  }
}
```

La deuxième requête coûte une fraction de la première en tokens, et le modèle obtient exactement l'information dont il a besoin sans bruit.

Cela s'applique au-delà de GraphQL : partout où votre LLM fait des appels API (REST, gRPC, n'importe quoi), le principe est le même : **requêtez ce dont vous avez besoin, pas ce qui existe**. Soit l'API supporte la sélection fine de champs, soit une couche MCP filtre la réponse avant qu'elle n'atteigne le modèle. Le MCP est souvent le bon choix pour les produits existants que vous ne pouvez pas modifier, mais pour les nouvelles APIs, concevez-les nativement pour l'IA dès le départ.

* * *

## Principe 4 : Observez tout, puis améliorez

Vous ne pouvez pas optimiser ce que vous ne mesurez pas. C'est là que les outils **proxy** et **benchmark** peuvent tout changer.

### Le Proxy : Une couche d'observation transparente

Le proxy se situe entre chaque client LLM et le provider en amont. Chaque requête, réponse, appel d'outil, métrique de timing, et comptage de tokens est capturé, sans changer une seule ligne de code applicatif.

![](/images/your-ai-agent-deserves-a-tool-harness-not-a-wild-west/00-80d278b0-a376-408d-9864-84f9618b9393.png)

Le proxy a deux modes :

1. **Mode serveur** : fonctionne comme un serveur HTTP. Pointez n'importe quel client compatible OpenAI dessus, et chaque interaction est transparemment capturée.

2. **Mode benchmark/CLI** : fonctionne headless depuis des fichiers config YAML, exécutant des prompts à travers le LLM avec une exécution automatisée MCP/Skill, puis sauvegardant tout pour analyse.

### Le Benchmark : Tests unitaires pour le comportement IA

C'est la partie qui m'enthousiasme le plus. Un fichier config de benchmark ressemble à ça :

```yaml
project: my-app

model: gpt-5-mini

system_prompt: >-
  You are a helpful assistant. Skills provide specialised instructions.
  Always use `read_skill` to load skill instructions before acting.

skills:
  - name: my-skill
    path: ./skills/my-skill/SKILL.md

env:
  - GRAPH_URL
  - API_KEY

max_iterations: 30

prompts:
  - text: "How many products and components do we have?"
    asserts:
      - type: tool_called
        tool: read_skill
        times: 1
      - type: tool_called
        tool: http_request
        times_min: 1
      - type: tool_result_not_contains
        tool: http_request
        value: "HTTP 4"
      - type: response_contains
        value: "product"
      - type: response_contains
        value: "component"

  - text: "Which services have no monitoring? Flag any Tier-1 ones."
    asserts:
      - type: tool_called
        tool: read_skill
        times: 1
      - type: tool_called
        tool: http_request
        times_min: 1
      - type: tool_result_not_contains
        tool: http_request
        value: "HTTP 5"
      - type: response_contains
        value: "monitor"
```

Ce sont **des tests unitaires pour le comportement IA**. Chaque prompt a des assertions qui vérifient :

* Est-ce que le bon outil a été appelé ? (`tool_called`)
* A-t-il été appelé le bon nombre de fois ? (`times:`, `times_min:`, `times_max:`)
* L'outil a-t-il retourné des erreurs ? (`tool_result_not_contains: "HTTP 4"`)
* La réponse finale contenait-elle l'information attendue ? (`response_contains:`)

Le moteur de benchmark exécute chaque prompt à travers le LLM, exécute tous les appels d'outils que le modèle fait (incluant les outils MCP), évalue chaque assertion, et produit un rapport pass/fail :

```plaintext
Running benchmark: my-app
Model: gpt-5-mini | Prompts: 9 | Skills: 1

[1/9] "How many products and components do we have?"
  ✓ tool_called: read_skill (1)
  ✓ tool_called: http_request (min 1)
  ✓ tool_result_not_contains: http_request → "HTTP 4"
  ✓ response_contains: product
  ✓ response_contains: component
  Score: 1.0 / Assertions: 5 passed, 0 failed

[2/9] "Which services have no monitoring?"
  ✓ tool_called: read_skill (1)
  ✓ tool_called: http_request (min 1)
  ✓ tool_result_not_contains: http_request → "HTTP 5"
  ✓ response_contains: monitor
  Score: 1.0 / Assertions: 4 passed, 0 failed

...

Run score: 92.3 — passing
```

Chaque capture est aussi notée automatiquement basée sur la qualité des appels d'outils :

| Condition | Score |
| --- | --- |
| Exécution d'outil échouée (erreur) | **0.0** |
| Résultat vide (`""` ou `{}`) | **0.3** |
| Durée > 30 000ms | **0.2** |
| 1 000ms < Durée ≤ 30 000ms | Décroissance linéaire 1.0 → 0.0 |
| Durée ≤ 1 000ms | **1.0** |
| Aucun appel d'outil | **1.0** |

Le score de run est la moyenne à travers toutes les captures, vous donnant un nombre unique (0–100) qui vous dit à quel point votre harnais fonctionne.

### La boucle d'apprentissage

C'est là que ça devient puissant. Le benchmark n'est pas une validation one-shot — c'est une **boucle d'apprentissage** :

![](/images/your-ai-agent-deserves-a-tool-harness-not-a-wild-west/01-c8a26213-0a67-4cc1-a5b0-89467ddbe666.png)

**Étape 1 : Exécutez le benchmark.** Le proxy exécute chaque prompt, sauvegarde chaque capture comme un fichier JSONL dans `~/.benchmark/`.

**Étape 2 : Inspectez les captures.** Chaque capture est un objet JSON contenant la requête complète, la réponse, chaque appel d'outil que le modèle a fait (avec arguments, résultats, timing), et les résultats d'assertions.

**Étape 3 : Analysez les échecs.** Pourquoi le modèle a-t-il appelé le mauvais outil ? Pourquoi a-t-il reçu HTTP 400 ? Pourquoi a-t-il sauté l'étape de récupération d'erreur ? Les captures brutes vous disent exactement ce qui s'est passé — pas de devinette.

**Étape 4 : Améliorez le skill.** Modifiez le SKILL.md, clarifiez le processus, ajoutez la gestion d'erreur manquante, ajustez la description pour mieux router. Puis donnez le fichier skill ET les captures qui échouent à un LLM et demandez : "Voici ce qui s'est mal passé. Corrigez-le."

**Étape 5 : Bouclez.** Ré-exécutez le benchmark. Le score s'est-il amélioré ? Des prompts précédemment réussis ont-ils régressé ?

Le but est d'exécuter cette boucle régulièrement : benchmark, inspecter, améliorer, re-benchmark. Même les premières itérations nous ont montré des choses que nous n'aurions jamais attrapées sans les captures. Plus la boucle est cohérente, plus le harnais s'améliore rapidement. Et, si vous ne vous souciez pas beaucoup de vos tokens (jusqu'ici nous avons pu le faire) vous pouvez demander au LLM de faire cette boucle de manière autonome avec un KPI d'arrêt. Il peut tourner pendant des heures !!

### Coût des tokens dans la boucle

La boucle d'apprentissage tient aussi compte des coûts. Après chaque run, nous mesurons :

* **Total tokens consommés** (entrée + sortie)
* **Tokens par assertion passée** : une métrique d'efficacité-cout
* **Surcharge de tokens par prompt** : combien de tokens ont été dépensés sur les schémas d'outils vs les données réelles

Quand on améliore un skill, on suit si la correction a réduit ou augmenté l'utilisation de tokens. Parfois une instruction de skill plus détaillée pousse le modèle à appeler plus d'outils, consommant plus de tokens. Le dashboard signale ces régressions pour que nous puissions trouver le juste milieu entre précision et coût.

Exemple du moteur de scoring :

```plaintext
Run: asset-knowledge-graph-direct v3 → v4
  Score: 85.3 → 92.1  (+6.8)
  Tokens/run: 12,450 → 14,220  (+14%)
  Cost/run: $0.032 → $0.037

Efficiency score: 6.8 / (14% token increase) = 0.49 pts per % cost
Verdict: Amélioration acceptable. Surveiller pour scope creep.
```

### Routing Jeopardy : Attrapez l'ambiguïté avant qu'elle ne coûte

Encore une fonctionnalité worth mentioning : avant qu'un benchmark ne s'exécute même, un mode optionnel **routing jeopardy** pré-calcule vers quel skill ou MCP chaque prompt *devrait* router. Si deux skills ont des descriptions suffisamment similaires pour confondre le LLM (similarité Jaccard à 5 points près), ça signale un conflit.

Cela capture un problème surprenamment commun : vous ajoutez un nouveau skill, sa description chevauche celle d'un existant, et soudain les prompts commencent à router vers le mauvais skill. Le rapport jeopardy vous le dit avant même que le benchmark ne finisse de s'exécuter.

* * *

## Leçons apprises

1. **Les serveurs MCP ne sont pas des UIs.** Un wrapper 1:1 sur une API produit ajoute une valeur marginale. Un MCP qui expose des intents de haut niveau, correspondant à ce que le LLM demande réellement, vaut dix fois plus.

2. **Les skills ont besoin de limites de taille.** La fenêtre de contexte du LLM est généreuse mais son attention ne l'est pas. Gardez les skills focalisés sur un processus, gardez les instructions sous 15 étapes, et chargez-les à la demande.

3. **Mesurez avant d'optimiser.** Sans proxy et benchmark, vous volez à l'aveugle. Les captures vous surprendront, le LLM appellera des outils que vous n'attendiez pas, sautera des étapes que vous pensiez claires, et brûlera des tokens sur des données que vous n'avez jamais demandées.

4. **Le coût des tokens est maintenant une contrainte de conception.** Dans l'ère pay-per-token, chaque octet dans chaque prompt système a un prix. Concevez vos réponses d'outils pour retourner le minimum de données viables. Et souvenez-vous : cela s'applique aussi à vos APIs produit originales, pas juste à la couche MCP.

5. **La boucle d'apprentissage est le véritable produit.** Le fichier skill initial n'est jamais correct. Ce qui compte, c'est la vitesse à laquelle vous pouvez exécuter la boucle : benchmark → inspecter → améliorer → re-benchmark. Plus tôt vous commencez à mesurer, plus tôt le harnais s'améliore.

6. **Les assertions sont votre filet de sécurité de régression.** Chaque fois que nous divisons un skill ou réécrivons des instructions, le benchmark attrape les régressions. Sans ces assertions, nous ferions des suppositions, ce qui est particulièrement risqué quand vous apprenez encore à quoi "bien" ressemble.

7. **Copilot et les outils similaires basés sur des sièges changent aussi.** Les changements de plans GitHub Copilot de juin 2026 nous rappellent que même les produits par abonnement s'adaptent à l'ère agentique. Surveillez vos coûts d'outils : le paysage des prix change rapidement.

* * *

Le far west du "donnez tout au LLM et espérez" est derrière nous. Les entreprises qui tireront le plus de valeur de l'IA en 2026 seront celles qui traiteront leur harnais d'outils avec la même discipline que leur suite de tests : curaté, mesuré, benchmarké, et continuellement amélioré.

* * *

![](/images/your-ai-agent-deserves-a-tool-harness-not-a-wild-west/02-2b13fbdb-286a-4a21-abc4-5912c95ba303.png)

* * *

## Références

[\[1\]](https://www.stackspend.app/resources/blog/ai-api-pricing-guide-2026) Tarification actuelle des APIs IA Mars 2026 : OpenAI, Grok, Anthropic, Gemini — StackSpend (Mars 2026)

[\[2\]](https://openai.com/api/pricing) Tarification API OpenAI — OpenAI

[\[3\]](https://docs.anthropic.com/en/docs/about-claude/pricing) Tarification API Claude — Anthropic

[\[4\]](https://cloud.google.com/vertex-ai/generative-ai/pricing) Tarification Google Vertex AI Generative AI — Google Cloud

[\[5\]](https://github.blog/news-insights/company-news/changes-to-github-copilot-individual-plans/) Changements aux plans individuels GitHub Copilot — GitHub Blog (20 avril 2026, mis à jour 14 mai 2026)