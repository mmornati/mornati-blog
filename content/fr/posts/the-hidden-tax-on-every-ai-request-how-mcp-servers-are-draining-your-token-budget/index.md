---
title: 'La taxe cachée sur chaque requête IA : Comment les serveurs MCP vident votre budget de tokens'
tags:
- ai
- openai
- gemini
- mcp
- claude-code
- token-optimization
date: '2026-05-05T21:24:42.989000+00:00'
slug: the-hidden-tax-on-every-ai-request-how-mcp-servers-are-draining-your-token-budget
description: Exécuter 4 serveurs MCP m'a coûté 515$/mois en tokens gaspillés. Des données réelles de mon setup prouvent que la taxe de schéma à 99,7% est réelle.
---




Le mois dernier, j'ai publié une comparaison : [MCP Servers vs. CLI](https://blog.mornati.net/the-future-of-agentic-tooling-mcp-servers-vs-cli-a-data-driven-comparison). Un seul serveur (GitHub), test contrôlé, conclusion claire : Le MCP natif gaspille 99,7% en taxe de schéma dans les sessions typiques.

Mais c'est un test en laboratoire. En réalité, je ne fais pas tourner un serveur MCP. J'en fais tourner quatre : GitHub, Garmin, Stitch, Intervals.icu. 2 pour mes sections développement et 2 que j'utilise pour planifier et suivre mon coaching santé et sport. Et parfois je ne fais pas attention aux serveurs MCP et je fais mes requêtes avec tous activés. Et vous ? Je suppose que vous aussi avez configuré plusieurs serveurs MCP et puis les avez oubliés.

**Cet article pose la même question dans le monde réel :** Mesurer la consommation réelle de tokens à travers une config multi-serveur où vous travaillez réellement — pas une preuve de concept, mais des données de production.

Voici le problème : chaque serveur MCP que vous activez injecte son **schéma d'outils entier** dans chaque requête — que vous l'utilisiez réellement ou pas. Et dans l'ère de l'IA où on paie à l'utilisation, cette taxe invisible vous coûte de l'argent réel.

## Le changement dont personne ne nous avait prévenus

Vous vous souvenez quand les APIs IA avaient des forfaits mensuels ? Ces jours sont révolus. Depuis début 2026, l'industrie a pleinement transitionné vers la tarification [pay-per-use basée sur les tokens](https://www.stackspend.app/resources/blog/ai-api-pricing-guide-2026).

Les grands acteurs ont été très clairs :

| Provider | Entrée ($/1M tokens) | Sortie ($/1M tokens) | Note |
| --- | --- | --- | --- |
| OpenAI GPT-5.4 | $2.50 | $15.00 | [Cache : $0.25](https://openai.com/api/pricing/) |
| Claude Sonnet 4.6 | $3.00 | $15.00 | Premium long-context au-dessus de 200K |
| Gemini 2.5 Pro | $2.00 | $12.00 | 2x au-dessus de 128K tokens |

Chaque token compte maintenant. Et voici ce dont personne ne parle : chaque serveur MCP que vous connectez brûle silencieusement des tokens à chaque prompt.

## Je l'ai mesuré en live sur ma propre config IA

J'ai requêté mon propre environnement de travail (personnel) via LeanProxy (mon nouvel outil) pour obtenir des vrais chiffres. Voici ce que j'ai trouvé :

| Serveur MCP | Outils disponibles | Tokens par requête |
| --- | --- | --- |
| Garmin | 100 | ~10 000 |
| GitHub | 41 | ~4 100 |
| Stitch (Google) | 12 | ~1 200 |
| Intervals.icu | 10 | ~1 000 |
| **Total** | **163** | **~16 300 tokens** |

C'est approximativement **$0.04-$0.08 par requête** juste pour avoir les outils disponibles. Même si vous n'utilisez GitHub que deux fois dans une session.

### Le vrai coût : 3 sessions de travail

Nous avons simulé trois workflows réalistes :

#### Vérification sport du matin (4 prompts)

```plaintext
garmin_get_stats → intervals_get_events → 
intervals_get_activity_intervals → intervals_add_or_update_event
```

C'est 4 opérations d'outils — mais une vraie vérification matinale n'est pas juste 4 prompts. Vous vérifiez les stats, puis demandez : "Suis-je récupéré ?", "Quelle est ma готовность à l'entraînement ?", "Comparer à la semaine dernière ?", "Des avertissements ?", "Quelle intensité pour aujourd'hui ?", "Vérifier l'impact météo...", "Ajuster le plan de demain basé sur ça...".

Plus réaliste : 15 prompts × 16 300 tokens = **~244 500 tokens**

* MCP natif : ~244 500 tokens
* Avec LeanProxy : ~2 000 tokens
* **Vous économisez : ~99%**

#### Session développement (5 prompts)

```plaintext
github_search_repositories → github_get_file_contents → 
stitch_list_projects → stitch_generate_screen_from_text → 
github_create_pull_request
```

Mais il n'y a pas de 5 prompts dans une vraie session de développement. Vous ouvrez votre IDE, demandez une issue, obtenez le code. Puis 10 prompts supplémentaires : "corrige ce bug", "ajoute des tests", "refactorise ça", "pourquoi ça échoue ?" Chacun inclut le schéma MCP complet. Les outils GitHub/Stitch ne sont utilisés que deux fois, mais vous payez pour les 163 outils sur chaque prompt.

Une répartition plus réaliste pour une session de 15 prompts :

* Prompts 1-2 : Opérations GitHub/Stitch (2 invocations d'outils)
* Prompts 3-15 : Codage, debug, refactoring (0 invocation d'outils)

C'est 15 prompts × 16 300 tokens (schéma complet) = **244 500 tokens** juste pour avoir les outils disponibles.

* MCP natif : ~244 500 tokens
* Avec LeanProxy : ~2 500 tokens
* **Vous économisez : ~99%**

#### Journée complète (7 prompts)

```plaintext
garmin_get_training_readiness → intervals_get_events → 
stitch_list_projects → github_get_file_contents → 
stitch_generate_screen_from_text → garmin_log_food → github_push_files
```

Mais c'est 7 opérations d'outils à travers la journée — pas 7 prompts. Une vraie journée ressemble plutôt à :

* **Matin** (prompts 1-3) : Vérifier Garmin, planifier la session dans Intervals, revoir la semaine dernière
* **Midi** (prompts 4-12) : "Pourquoi ma FC a-t-elle explosé ?", "Quelle était ma distribution de zones ?", "Suis-je assez récupéré ?", "Planifier la session de demain", "Ajuster l'intensité basée sur le sommeil"...
* **Soir** (prompts 13-15) : Logger la nourriture, revoir l'effet de l'entraînement, vérifier Intervals pour la semaine prochaine
* **Travail dev** (prompts 16-25) : Coder, bugfix, refactor...

C'est 25 prompts × 16 300 tokens = **~407 500 tokens** juste pour avoir vos outils MCP chargés.

* MCP natif : ~407 500 tokens
* Avec LeanProxy : ~4 000 tokens
* **Vous économisez : ~99%**

## L'illusion du Cache Read

Vous pourriez penser : "Mais le caching des prompts ! 90% de réduction !"

[Ça ne marche pas comme ça](https://www.aicosts.ai/learn/what-is-token-based-pricing). Les cache hits coûtent toujours de l'argent — ils ne sont pas gratuits :

**Anthropic (Claude Sonnet 4.6)** :

| Catégorie | Prix par 1M tokens |
| --- | --- |
| Entrée fraîche | $3.00 |
| Écriture cache (5 min) | $3.75 (1.25x) |
| **Cache hit (lecture)** | **$0.30** (0.1x) |
| Sortie | $15.00 |

**OpenAI (GPT-4o)** :

| Catégorie | Prix par 1M tokens |
| --- | --- |
| Entrée fraîche | $2.50 |
| **Cache hit** | **$1.25** (0.5x) |
| Sortie | $10.00 |

Les cache hits ne sont PAS gratuits — ils sont juste réduits. Et les schémas d'outils MCP sont identiques à chaque requête, donc 100% de cache hit signifie :

```plaintext
16 300 tokens × coût cache = tokens "effectifs" qui vous coûtent encore
Avec Claude Sonnet: 16 300 × $0.30/M = ~$0.005/requête
Avec GPT-4o: 16 300 × $1.25/M = ~$0.02/requête
```

Pas énorme — mais multiplié à travers les sessions, c'est de l'argent réel. Et cela suppose que votre cache reste valide (TTL de 5 min sur la plupart des providers).

## Comment cela change notre workflow

Voici le changement de pensée :

**Avant** : "Activez tous les serveurs MCP, l'IA utilisera ce dont elle a besoin."

**Après** : "Activez les serveurs MCP à la demande. L'IA demandera ce dont elle a besoin."

Avoir MCP prêt n'est pas une question de tout charger en amont. C'est une question de rendre la capacité disponible à travers une passerelle intelligente qui ne charge les schémas d'outils que quand ils sont réellement invoqués. Ou... se souvenir de les activer et désactiver quand ils ne sont pas nécessaires.

## D'autres proxies existent — Pourquoi en construire un autre ?

Il y a d'autres solutions proxy MCP, mais chacune a des compromis :

* [**dynamic-mcp**](https://github.com/asyrjasalo/dynamic-mcp) : Approche similaire d'optimisation de tokens — il n'expose que 2 outils initialement (`get_dynamic_tools`, `call_dynamic_tool`) et charge le reste à la demande. C'est une implémentation Rust, supporte OAuth, et se concentre sur le même objectif. Pas si différent de LeanProxy, mais quand je l'ai testé je n'ai pas réussi à le faire fonctionner correctement avec les MCP que j'avais. (Je devrais peut-être réessayer)

* [**mcp-proxy**](https://github.com/punkpeye/mcp-proxy) : Proxy TypeScript pour convertir stdio en HTTP/SSE. Utile pour le bridging de transport mais n'a pas d'optimisation de tokens — il passe tous les schémas d'outils à travers.

* [**LiteLLM's dynamic-mcp_route**](https://github.com/BerriAI/litrellm) : Partie du proxy LiteLLM. Connu pour avoir [des problèmes de buffering SSE](https://github.com/BerriAI/litellm/issues/22073), pas idéal pour les réponses d'outils en streaming. Et c'est assez gros pour un simple proxy MCP à utiliser localement (pas destiné à ce cas d'usage local)

LeanProxy est conçu spécifiquement pour le problème précis : minimiser la surcharge de tokens tout en supportant les transports stdio, HTTP et SSE — avec un focus sur les workflows CLI-first.

## LeanProxy : Focus performance

Construit en Go pour la performance, pas juste pour la commodité Python/Node :

```bash
# Le démarrage est instantané
time leanproxy-mcp server run --stdio "npx -y @modelcontextprotocol/server-filesystem ./my-project"
# Réel : <50ms cold start

# Dry-run pour les rapports d'économies de tokens
leanproxy-mcp compactor --manifest ./mcp.json

# Management centralisé des serveurs
leanproxy-mcp server list
```

Pas de dépendances runtime lourdes. Pas de npm install. Juste un binaire unique.

## Exemples réels

### Avant : MCP natif

```plaintext
$ leanproxy-mcp server list
# Affiche les 4 serveurs configurés, mais avec les schémas d'outils complets
# dans chaque prompt
NAME                 STATUS     TRANSPORT       COMMAND
--------------------------------------------------------------
garmin               enabled    stdio           uvx --python 3.12 --from git+https://github.com/Taxuspt/garmin_mcp garmin-mcp
Intervals.icu        enabled    stdio           /opt/homebrew/bin/uv run --with mcp[cli] --with-editable /opt/intervals-mcp-server mcp run /opt/intervals-mcp-server/src/intervals_mcp_server/server.py
stitch               enabled    http            https://stitch.googleapis.com/mcp
github               enabled    stdio           docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server

4 server(s)
```

### Après : Avec LeanProxy

```plaintext
$ leanproxy-mcp server run --stdio "npx -y @modelcontextprotocol/server-filesystem ./my-project"
# Schéma routeur seulement : ~110 tokens

# Première invocation d'outil (ex: garmin_get_stats):
# → Schéma charge JIT : ~500 tokens
# → Prompts suivants : mis en cache
```

### Voir les économies de tokens

```plaintext
$ leanproxy-mcp compactor --manifest ~/.config/opencode/opencode.json
Token Report:
- Native MCP: 16,300 tokens/requête
- LeanProxy: ~2,000 tokens/requête
- Économies: 87%
```

## Pourquoi c'est important maintenant

Le marché des APIs IA en 2026 est pay-per-use. Un développeur typique faisant 20-30 sessions/jour avec 4 serveurs MCP activés brûle :

* À 16 300 tokens/session × 30 sessions × $0.04/1K = **~$19.56/jour**
* À 2 000 tokens/session × 30 sessions × $0.04/1K = **~$2.40/jour**

Différence mensuelle : **~$515/mois** rien qu'en surcharge MCP.

## Obtenez LeanProxy

Disponible sur GitHub : [https://github.com/mmornati/leanproxy-mcp](https://github.com/mmornati/leanproxy-mcp)

> **Recherche associée** : Lisez la [comparaison MCP vs CLI](https://blog.mornati.net/the-future-of-agentic-tooling-mcp-servers-vs-cli-a-data-driven-comparison) plus tôt pour les données de labo single-serveur. Cet article l'étend avec des mesures réelles de production.

Installez :

```bash
brew tap mmornati/leanproxy-mcp
brew install leanproxy-mcp

# Ou télécharger depuis les releases
curl -fsSL https://github.com/mmornati/leanproxy-mcp/releases/latest/download/...
```

* * *

## Qu'est-ce qui suit ?

Activez vos serveurs MCP intelligemment. Gardez la capacité, perdez la taxe.

Le futur n'est pas d'avoir moins. C'est d'utiliser ce dont vous avez besoin, quand vous en avez besoin.