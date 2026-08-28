---
title: 'L''avenir de l''outillage agentique : MCP Servers vs CLI — Une comparaison basée sur les données'
categories:
- ai-coding-agents
tags:
- ai
- github
- cli
- llm
- ai-agents
- mcp
- developers-tools
- token-optimization
date: '2026-04-27T20:05:48.208000+00:00'
slug: the-future-of-agentic-tooling-mcp-servers-vs-cli-a-data-driven-comparison
description: 'Le MCP natif coûte 137× plus de tokens que la CLI dans une session dev typique. Mesures réelles + framework de décision pour un outillage agentique efficace en tokens.'
---




Alors que les Modèles de Langage (LLMs) évoluent vers des agents de codage autonomes, l'une des décisions architecturales les plus importantes est paradoxalement simple : **comment un agent IA doit-il communiquer avec les services externes ?**

Traditionnellement, nous donnions aux LLMs un accès terminal et les laissions invoquer les interfaces en ligne de commande (CLIs). Mais fin 2024, Anthropic a introduit le **Model Context Protocol (MCP)**, commercialisé comme le "USB-C de l'IA", une alternative structurée qui permet aux agents d'interagir avec les services via des schémas JSON typés plutôt que des commandes shell et du texte brut. L'engouement a été immédiat et énorme. Des milliers de serveurs MCP ont été publiés en quelques semaines, et chaque assistant IA s'est empressé d'ajouter le support.

## La réaction contre MCP : Pourquoi les développeurs remettent en question l'engouement

Mais en 2025, un contre-courant silencieux a commencé à émerger. Les développeurs qui construisent de vrais systèmes agentiques ont commencé à remarquer quelque chose d'inconfortable : **plus ils connectaient de serveurs MCP, plus leurs agents devenaient lents, stupides et coûteux.**

La plainte principale est ce que les ingénieurs ont commencé à appeler **"le gonflement de la fenêtre de contexte"**. Contrairement aux outils CLI, qu'un LLM peut explorer de manière paresseuse via `--help`, MCP nécessite que tous les schémas d'outils enregistrés soient injectés dans le prompt système à l'avance. Un seul serveur MCP GitHub avec ~35 endpoints contribue environ **3 000 tokens** de définitions d'outils à chaque requête, avant même que l'agent n'écrive une seule ligne. Connectez cinq serveurs MCP (GitHub, Slack, Kubernetes, Linear, Postgres) et vous brûlez **15 000+ tokens par requête** rien que pour décrire les outils que l'agent pourrait ne jamais appeler. À grande échelle, cela peut consommer 25–50% de toute la fenêtre de contexte avant que l'agent ne commence à raisonner.

Les chercheurs de [lunar.dev](https://lunar.dev) ont documenté un autre mode d'échec : **l'interférence dans l'espace des outils**. À mesure que le nombre d'outils augmente, les agents peinent à distinguer les outils aux noms similaires (ex: `get_status`, `fetch_status`, `query_status`), causant une mauvaise sélection d'outils et des échecs en cascade. Pendant ce temps, les discussions sur [Reddit](https://reddit.com) et les communautés comme [The New Stack](https://thenewstack.io) remettent de plus en plus en question si la surcharge architecturale de MCP est justifiée pour les workflows locaux ou mono-service.

La communauté des développeurs a également noté que les modèles frontier sont **déjà fortement entraînés sur les outils CLI courants**, `git`, `gh`, `kubectl`, `curl`, connaissant souvent les bons flags sans aucune description de schéma. Comme l'a observé [chrlschn.dev](https://chrlschn.dev) : *"La divulgation progressive via* `--help` *pourrait en fait être plus efficace en tokens que le chargement d'un schéma de 3 000 tokens qu'on n'utilise qu'une seule fois."*

Alors : la réaction contre MCP est-elle justifiée ? Ou les développeurs jettent-ils le bébé avec l'eau du bain ? **Nous avons mené une vraie expérience pour le découvrir**, en testant des opérations GitHub identiques sur quatre approches distinctes avec des données de tokens mesurées.

* * *

## L'expérience

Nous avons testé quatre modalités distinctes pour accomplir des opérations GitHub identiques :

| ID | Approche | Description |
| --- | --- | --- |
| **A** | `gh` CLI (brut) | Commandes shell, sortie texte brut |
| **A2** | `gh` CLI + Skill | Commandes shell guidées par un fichier `skill.md` |
| **B** | MCP GitHub natif | Schémas JSON d'outils injectés directement |
| **C** | Passerelle Nexus-Dev | Un seul outil de routage, schémas chargés paresseusement |

### Le workflow

Chaque modalité a effectué les quatre opérations identiques :

1. Créer un nouveau repository public
2. Créer un issue : *"Test Issue for Evaluation"*
3. Poster un commentaire sur l'issue
4. Lister et récupérer les issues ouverts

Les quatre phases ont réussi sans erreurs. Mais en regardant la consommation de tokens, l'histoire est très différente.

* * *

## Consommation de tokens : Les vrais chiffres

> **Méthode de mesure :** Caractères divisés par 4, correspondant à l'approximation du tokenizer cl100k_base utilisé par la plupart des LLMs frontier.

### Tokens par interaction (les 4 opérations ci-dessus)

| Modalités | Tokens d'entrée | Tokens de sortie | **Total** |
| --- | --- | --- | --- |
| CLI (brut) | 74 | 150 | **224** |
| CLI + Skill | 95 | 149 | **244** |
| MCP natif | 86 | 121 | **207** |
| Passerelle Nexus | 135 | 111 | **246** |

### Surcharge fixe de contexte (chargée une fois par session)

| Modalités | Surcharge de schéma |
| --- | --- |
| CLI (brut) | **0 tokens** — pas de schéma en amont |
| CLI + Skill | **480 tokens** — fichier skill chargé une fois |
| MCP natif | **~3 062 tokens** — 35 schémas d'outils toujours présents |
| Passerelle Nexus | **~20 tokens** — seul le schéma du routeur |

### Formule de coût total

Pour une session avec **N** opérations :

| Modalités | Formule | N=10 | N=50 | N=200 |
| --- | --- | --- | --- | --- |
| CLI (brut) | `224N` | 2 240 | 11 200 | 44 800 |
| CLI + Skill | `480 + 244N` | 2 920 | 12 680 | 49 280 |
| MCP natif | `3 062 + 207N` | 5 132 | 13 412 | **44 462** |
| Passerelle Nexus | `20 + 246N` | 2 480 | 12 320 | 49 220 |

* * *

## Le fichier Skill : Un juste milieu

Avant que MCP ne soit largement adopté, les équipes ont développé **les fichiers skill**, documents markdown structurés injectés dans le contexte du LLM qui documentent les commandes exactes, les flags et les formats de sortie. Considérez-le comme un mini-manuel que l'agent lit avant d'agir.

> Le fichier skill complet utilisé dans cette expérience est disponible en tant que Gist public : [**github-cli.skill.md**](https://gist.github.com/mmornati/2bba07f11d6e80075cb54f2cf10fa0fb)

### Ce que fournit le GitHub CLI Skill

```markdown
# Skill: GitHub CLI (`gh`) Operations
## Issue Operations
# Always prefer --json for structured output:
gh issue list -R <owner>/<repo> --json number,title,body,state,comments
gh issue create -R <owner>/<repo> --title "<title>" --body "<body>"
gh issue comment <issue-number> -R <owner>/<repo> --body "<comment>"
```

### Impact sur la qualité de sortie

**Sans le skill** (`gh issue list`), le LLM reçoit :

```plaintext
Showing 1 of 1 open issue in mmornati/mcp-cli-test-repo

ID  TITLE                      LABELS  UPDATED               
#1  Test Issue for Evaluation          less than a minute ago
```

→ Table ASCII avec espaces blancs d'alignement. Pas de structure machine-readable. Les dates sont relatives ("less than a minute ago"), pas de timestamps parseables. Plus du bruit de mise à niveau.

**Avec le skill** (`gh issue list --json number,title,body,state,comments`) :

```json
[{"body":"This is a test issue created via CLI with Skill","comments":[{"id":"IC_kwD...","body":"This is a comment via CLI with Skill","createdAt":"2026-04-27T19:04:12Z"}],"number":1,"state":"OPEN","title":"Test Issue for Evaluation"}]
```

→ Structuré, parseable, sans bruit. Timestamps absolus. IDs machine-readables.

### Analyse du seuil de rentabilité

Le fichier skill coûte **480 tokens en upfront**. En échange, la qualité de sortie par opération s'améliore considérablement.

* **Point de croisement CLI vs CLI+Skill :** La surcharge du skill est récupérée après **~24 opérations** dans une session, après quoi la réduction des tokens de sortie se compose.

* **Le vrai gain du skill n'est pas juste les tokens**, c'est l'élimination de la boucle de découverte où le LLM doit exécuter `gh --help` ou `gh issue --help` pour trouver les flags. Chaque invocation d'aide coûte généralement **400–800 tokens** de sortie supplémentaires à parser.

* * *

## MCP : Structuré par conception

### MCP natif (injection de schéma directe)

Avec le serveur MCP GitHub, le LLM n'a pas besoin de découvrir quoi que ce soit. Chaque outil est pré-décrit dans le prompt système :

```json
// Input — compact et typé :
{"body": "This is a test issue", "method": "create", "owner": "mmornati", "repo": "mcp-native-test-repo", "title": "Test Issue for Evaluation"}

// Output — JSON propre, pas de formatage de table :
{"id": "4338179062", "url": "https://github.com/mmornati/mcp-native-test-repo/issues/1"}
```

Le coût en tokens par interaction est le **plus bas des quatre modalités (207 tokens)**. Cependant, la **surcharge fixe de 3 062 tokens** est significative, et elle est toujours là, même quand l'agent n'utilise pas du tout GitHub.

Si votre assistant IA a 5 serveurs MCP actifs (GitHub, Slack, Kubernetes, Linear, Postgres), vous payez **15 000+ tokens par requête** rien que pour décrire les outils que l'agent pourrait ne jamais appeler. À grande échelle avec des sessions longue durée, cela devient rapidement le coût dominant.

### Passerelle Nexus-Dev (chargement paresseux de schéma)

L'approche passerelle [Nexus-Dev](https://github.com/mmornati/nexus-dev) est architecturalement élégante : injecter un **outil de routage unique** (`invoke_tool`) avec ~20 tokens de surcharge de schéma, et laisser l'agent demander les schémas d'outils à la demande quand il en a besoin.

```json
// L'agent dispatche vers n'importe quel serveur avec un seul outil :
{"server": "github", "tool": "issue_write", "arguments": {"owner": "mmornati", ...}}
```

Les tokens par opération sont légèrement plus élevés (**246**) parce que chaque appel inclut l'enveloppe de routage, mais la surcharge fixe est essentiellement zéro quel que soit le nombre de serveurs backend configurés.

* * *

## La vraie session dev : Un tableau complètement différent

Tous les chiffres ci-dessus mesurent le coût *d'appeler GitHub*. Mais ce n'est pas comme ça que fonctionnent les vraies sessions de codage.

Quand un développeur ouvre Claude Code, Cursor ou Antigravity et commence une fonctionnalité, le pattern réel ressemble à ceci :

> **Prompt 1 :** *"Fetch issue #42 et aide-moi à planifier l'implémentation"* → **1 opération GitHub**  
> **Prompts 2–19 :** *Codage, debug, refactoring, tests, questions de revue de code* → **0 opération GitHub**  
> **Prompt 20 :** *"Crée une PR avec mes changements et lie-la à l'issue"* → **1 opération GitHub**

Dans cette session de 20 prompts, GitHub a été appelé **deux fois**. Mais certaines de nos modalités vous facturent pour GitHub sur *chaque prompt*, que vous l'appeliez ou non.

C'est la question critique : **quand la surcharge est-elle payée ?**

| Modalités | Quand la surcharge est-elle payée ? |
| --- | --- |
| CLI (brut) | Seulement quand une commande `gh` est réellement exécutée |
| CLI + Skill (à la demande) | Une fois, quand le développeur l'invoque explicitement |
| CLI + Skill (toujours actif, ex: dans `.cursorrules`) | **Chaque prompt** |
| MCP GitHub natif | **Chaque prompt** (schémas toujours dans le prompt système) |
| Passerelle Nexus | Chaque prompt, mais seulement ~20 tokens |

### Coût en tokens sur une session dev complète (G=2 ops GitHub)

Le tableau suivant montre le coût total réel en tokens pour une session dev où GitHub est appelé exactement **deux fois** (récupérer issue + créer PR), et le reste de la session est du pur codage :

| Longueur session | CLI (brut) | CLI+Skill (à la demande) | CLI+Skill (toujours actif) | MCP GitHub natif | Passerelle Nexus |
| --- | --- | --- | --- | --- | --- |
| N=5 prompts | 448 | 968 | 2 888 | 15 724 | 592 |
| N=10 prompts | 448 | 968 | 5 288 | 31 034 | 692 |
| N=20 prompts | 448 | 968 | 10 088 | **61 654** | 892 |
| N=50 prompts | 448 | 968 | 24 488 | **153 514** | 1 492 |
| N=100 prompts | 448 | 968 | 48 488 | **306 614** | 2 492 |

> **Données générées par** `session_token_model.py`. Approximation de token : 1 token ≈ 4 caractères.

Les chiffres sont époustouflants. Dans une **session dev de 50 prompts** avec **2 opérations GitHub** :

* **CLI (brut)** coûte **448 tokens** au total pour GitHub, exactement ce que nécessitent ces 2 appels.
* **Passerelle Nexus** coûte **1 492 tokens**, toujours négligeable.
* **MCP GitHub natif** coûte **153 514 tokens**, dont **99,7% sont gaspillés** en descriptions de schémas dont l'agent n'avait pas besoin pour 48 des 50 prompts.

### La taxe de schéma : Quelle est la gravité réelle ?

Pour une session de 20 prompts avec 2 opérations GitHub, la répartition du MCP natif est :

|  | Tokens | % du total |
| --- | --- | --- |
| Surcharge de schéma (3 062 × 20 prompts) | 61 240 | **99,3 %** |
| Vrai travail GitHub (2 ops × 207 tokens) | 414 | 0,7 % |
| **Total** | **61 654** | |

> **Pour chaque 1 token de vrai travail GitHub effectué, le MCP natif vous facture 148 tokens de taxe de schéma.**

### Et si GitHub était utilisé plus intensivement ?

Pour être complet, voici la même session (N=20 prompts) avec différentes fréquences d'appels GitHub :

| Ops GitHub (G) | CLI (brut) | CLI+Skill (à la demande) | MCP GitHub natif | Passerelle Nexus |
| --- | --- | --- | --- | --- |
| G=1 (fetch only) | 224 | 724 | 61 447 | 646 |
| G=2 (fetch + PR) | 448 | 968 | 61 654 | 892 |
| G=5 (utilisation active) | 1 120 | 1 700 | 62 275 | 1 630 |
| G=10 (utilisation intensive) | 2 240 | 2 920 | 63 310 | 2 860 |
| G=20 (chaque prompt) | 4 480 | 5 360 | 65 380 | 5 320 |

Remarquez que passer les appels GitHub de G=1 à G=20 déplace à peine le nombre MCP natif (61 447 → 65 380) parce que la surcharge de schéma domine complètement. La passerelle Nexus, par contraste, scales presque linéairement avec l'utilisation réelle.

### Note importante sur les fichiers Skill

Quand un fichier skill est stocké dans une configuration au niveau du projet (comme `.cursorrules` de Cursor, `CLAUDE.md` de Claude Code, ou le registre de skills d'Antigravity), il est injecté dans **chaque prompt** automatiquement, ce qui signifie qu'il se comporte comme **toujours actif**, coûtant 480 tokens × N prompts. Cependant, si le développeur référence explicitement le fichier skill seulement lors de l'exécution d'opérations GitHub (à la demande), il coûte juste 480 tokens une fois par session. Le modèle à la demande est bien plus efficace mais nécessite de la discipline développeur.

* * *

## Synthèse : Quelle approche utiliser ?

### Matrice de décision

| Critère | CLI | CLI + Skill | MCP natif | MCP Passerelle |
| --- | --- | --- | --- | --- |
| Complexité de setup | ✅ Aucune | ✅ Minimale | ⚠️ Rédaction de schéma | ⚠️ Config passerelle |
| Tokens par op | ✅ Bas | ✅ Bas | ✅ Le plus bas | ⚠️ Modéré |
| Surcharge fixe par prompt | ✅ Zéro | ✅ Zéro (à la demande) | ❌ ~3 062 tokens | ✅ ~20 tokens |
| Coût session (N=20, G=2) | ✅ 448 | ✅ 968 | ❌ 61 654 | ✅ 892 |
| Fiabilité de sortie | ❌ Texte fragile | ⚠️ Meilleur avec `--json` | ✅ JSON typé | ✅ JSON typé |
| Échelle multi-service | ✅ Correct | ✅ Correct | ❌ Explose le contexte | ✅ Scale linéairement |
| Surcharge de découverte | ❌ Élevée (boucles `--help`) | ✅ Éliminée | ✅ Éliminée | ✅ À la demande |
| Meilleur pour ratio G/N | < 5% | 5–15% | > 40% | 5–40% |

### Recommandations

**Utilisez CLI brut** quand :

* Le service a G/N < 5% (appelé rarement dans une session).
* Exécution de scripts ponctuels dans des environnements contraints.

**Utilisez CLI + Skill (à la demande)** quand :

* Le service a G/N < 15% mais vous avez besoin d'une sortie structurée fiable.
* Vous voulez zéro surcharge sauf quand le service est réellement invoqué.
* ⚠️ Ne **pas** mettre le fichier skill dans `.cursorrules` ou `CLAUDE.md`, cela le rend toujours actif et coûte 480 tokens × N prompts.

**Utilisez MCP natif** quand :

* Le service a G/N > 40% (appelé sur presque chaque prompt).
* Vous avez moins de 2–3 serveurs MCP chargés simultanément.
* Exemples : outils système de fichiers, stores mémoire/contexte, bases de données locales dans les sessions data-heavy.

**Utilisez un MCP passerelle** quand :

* L'agent utilise beaucoup de services différents à des fréquences variées.
* Vous voulez des sorties structurées de qualité MCP pour les services à fréquence moyenne (G/N 5–40%).
* **C'est l'architecture par défaut recommandée pour les agents de codage généralistes.**

* * *

## Configuration d'un environnement de développement efficace en tokens

Compte tenu de tout ce que nous avons mesuré, voici un framework pratique pour configurer votre environnement de codage IA, que vous utilisiez Claude Code, Cursor, Antigravity ou tout agent similaire.

### La décision核心 : Le ratio G/N

Pour tout service externe, demandez : **"Dans une session typique de N prompts, combien de prompts (G) appelleront réellement ce service ?"**

| Ratio G/N | Interprétation | Approche recommandée |
| --- | --- | --- |
| > 40% | Core pour presque chaque prompt | **MCP natif** (la surcharge s'amortit rapidement) |
| 15–40% | Utilisé régulièrement mais pas constamment | **MCP passerelle** |
| 5–15% | Utilisation occasionnelle | **MCP passerelle** ou CLI+Skill (à la demande) |
| < 5% | Utilisation rare, en début/fin de session | **CLI** ou skill à la demande |

Pour le contexte : GitHub dans une session d'implémentation de fonctionnalité standard a G/N ≈ 10% (2 ops en 20 prompts). Cela le place fermement dans la zone "utilisation occasionnelle", c'est pourquoi le MCP natif est un si mauvais fit malgré son efficacité par opération.

### Services par fréquence d'utilisation

Tous les services ne sont pas égaux. Voici comment les services MCP courants se divisent par ratio G/N typique :

#### 🟢 Haute fréquence (G/N > 40%) → MCP natif justifié

| Service | Pourquoi haute fréquence | Alternative CLI |
| --- | --- | --- |
| **Système de fichiers / recherche de code** | Appelé sur presque chaque prompt de codage | `find`, `grep`, `cat` |
| **Stores mémoire / contexte** (ex: Nexus) | Constamment requêté pour le contexte projet | — |
| **Navigateur / rendu web** | Fréquent dans les sessions frontend | `curl` (limité) |
| **Base de données locale** | Core quand la session est axée sur les données | `psql`, `sqlite3` |
| **Index de code / embeddings** | Requêté pour chaque demande "trouver similaire" | — |

Pour ceux-ci, la surcharge de schéma s'amortit rapidement et les sorties structurées du MCP natif fournissent une réelle valeur sur chaque prompt.

#### 🟡 Fréquence moyenne (G/N 5–40%) → MCP passerelle

| Service | Ops typiques/session | Meilleure approche |
| --- | --- | --- |
| **Linear / Jira** | Fetch board + mise à jour tickets | ~5–10 ops |
| **Slack / Teams** | Vérifier thread, poster mise à jour | ~2–5 ops |
| **Notion / Confluence** | Chercher docs, mettre à jour notes | ~2–5 ops |
| **Sentry / Datadog** | Investiguer erreurs pendant debug | ~3–8 ops |
| **npm / PyPI registry** | Vérifier versions lors de l'ajout de deps | ~2–6 ops |

Pour ceux-ci, la surcharge de schéma MCP natif est difficile à justifier. Un MCP passerelle vous donne des sorties structurées sans le coût fixe.

#### 🔴 Basse fréquence (G/N < 5%) → CLI ou skill à la demande

| Service | Utilisation typique dans une session | Meilleure approche |
| --- | --- | --- |
| **GitHub** | Fetch issue au début, créer PR à la fin | CLI + skill à la demande |
| **Kubernetes / Helm** | Déployer une fois à la fin d'une fonctionnalité | `kubectl` + skill |
| **AWS / GCP / Azure** | Provisioning infra, rarement en milieu de session | CLI `aws`/`gcloud` |
| **Stripe / APIs paiement** | Vérifier paiements test occasionnellement | `curl` vers l'API |
| **Outils DNS / domaine** | Recherches ponctuelles | `dig`, `nslookup` |

Pour ceux-ci, la taxe de schéma MCP natif est presque entièrement gaspillée. La CLI avec un fichier skill chargé à la demande coûte zéro surcharge quand inactif et deliver clean JSON structuré quand explicitement invoqué.

### Guide de configuration pratique

**Étape 1 : Auditez votre config MCP.** Pour chaque serveur, estimez G/N. Une config typique qui charge naïvement 5 serveurs gaspille ~15 000 tokens par prompt en surcharge de schéma :

```json
// AVANT : 5 serveurs = ~15 000 tokens/prompt en surcharge de schéma
{
  "mcpServers": {
    "github":     { "command": "npx", "args": ["@github/mcp-server"] },
    "kubernetes": { "command": "npx", "args": ["mcp-server-kubernetes"] },
    "slack":      { "command": "npx", "args": ["@slack/mcp-server"] },
    "aws":        { "command": "npx", "args": ["awslabs.aws-mcp-servers"] },
    "linear":     { "command": "npx", "args": ["linear-mcp-server"] }
  }
}
```

**Étape 2 : Appliquez le framework G/N :**

```json
// APRÈS : configuration efficace en tokens
{
  "mcpServers": {
    // ✅ MCP natif : G/N > 40%, core pour chaque prompt
    "memory":        { "command": "npx", "args": ["@modelcontextprotocol/server-memory"] },
    "filesystem":    { "command": "npx", "args": ["@modelcontextprotocol/server-filesystem"] },

    // ✅ Passerelle : route vers slack, linear, sentry à la demande ; seul schéma ~20 tokens
    "nexus-gateway": { "command": "npx", "args": ["nexus-dev-gateway"] }

    // ✅ github, kubernetes, aws → déplacés vers CLI avec fichiers skill à la demande
  }
}
```

**Étape 3 : Stockez les fichiers skill par service, invoquez à la demande :**

```plaintext
project/
├── .skills/
│   ├── github-cli.skill.md       ← invoquez lors des ops GitHub
│   ├── kubernetes.skill.md       ← invoquez lors du déploiement
│   └── aws-cli.skill.md          ← invoquez quand vous touchez l'infra
├── CLAUDE.md                     ← seulement les règles vraiment globales ici (gardez minimal)
```

> ⚠️ Ne mettez jamais les fichiers skill dans `.cursorrules` ou `CLAUDE.md` sauf si vous voulez qu'ils soient chargés à chaque prompt. Les fichiers skill toujours actifs se comportent comme des mini-schémas MCP, coûtant 480 tokens × N prompts à travers votre session.

* * *

## Autres services worth testing

Le framework de fréquence de session s'applique cohéremment à travers l'écosystème :

| Service | CLI | Serveur MCP | G/N typique | Recommandation |
| --- | --- | --- | --- | --- |
| **GitHub** | `gh` | github-mcp-server | ~5–10% | CLI + skill à la demande |
| **Kubernetes** | `kubectl` | kubernetes-mcp-server | ~2–5% | CLI + skill à la demande |
| **PostgreSQL** | `psql` | postgres-mcp-server | ~40–80% (sessions data) | MCP natif si data-heavy |
| **Slack** | `curl` + API | slack-mcp-server | ~10–20% | MCP passerelle |
| **Linear / Jira** | `curl` + API | linear-mcp-server | ~15–25% | MCP passerelle |
| **AWS** | `aws` CLI | awslabs aws-mcp | ~2–5% | CLI + skill à la demande |
| **Sentry** | `curl` + API | sentry-mcp-server | ~10–30% | MCP passerelle |
| **Système de fichiers / Mémoire** | `find`, `cat` | mcp-server-memory | ~60–90% | MCP natif |

La bonne réponse dépend de votre **type de session**. Une session d'analyse de données PostgreSQL-heavy a un profil G/N complètement différent d'une session d'implémentation de fonctionnalité où vous ne touchez la base de données qu'à la fin pour une migration de schéma.

* * *

## L'hypothèse du chemin heureux : Ce que ces chiffres n'incluent pas

Tout ce qui a été mesuré suppose que le LLM **choisit toujours le bon outil, utilise les bons flags et génère des paramètres valides du premier coup**. En réalité, ce n'est pas le cas.

C'est une mise en garde importante. Nos chiffres de tokens sont des lower bounds, ils représentent le cas idéal. Les sessions agentiques réelles sont plus désordonnées.

### Ce que dit la recherche sur la précision des outils LLM

Le [Berkeley Function Calling Leaderboard (BFCL)](https://gorilla.cs.berkeley.edu/leaderboard.html) est le benchmark le plus cité pour la précision d'utilisation d'outils. Principales découvertes de 2024–2025 :

* **Appels de fonctions simples, single-turn :** Les top modèles (GPT-4o, Claude 3.5/4, Gemini) atteignent **>90% de précision** dans des scénarios bien définis et isolés.
* **Tâches complexes, multi-turn, agentiques :** La précision chute significativement, BFCL v4 (2025–2026) montre une **moyenne de ~58%** à travers tous les modèles, avec les top modèles scorant **~73%** sur la suite de tests complète.
* **Détection de pertinence** (savoir quand *ne pas* appeler un outil) reste un point faible cohérent.

Ces chiffres ne correspondent pas directement à nos scénarios, mais ils établissent une baseline importante : **même les top modèles échouent à choisir ou appeler le bon outil correctement 10–40% du temps dans des environnements complexes, multi-outils.**

### Ce que coûte un échec en tokens

Quand un agent choisit le mauvais outil ou utilise de mauvais paramètres, le cycle d'échec typique ressemble à :

```plaintext
1. L'agent génère un mauvais appel d'outil / flag             → ~100 tokens output
2. L'outil retourne un message d'erreur                         → ~50–200 tokens input
3. L'agent raisonne sur l'erreur et réessaie                   → ~150 tokens output
4. (Répétez 1–3 jusqu'à correct ou max retries)
```

Un seul erreur récupérable coûte environ **300–600 tokens supplémentaires**. La recherche sur les agents style ReAct montre que dans certains pipelines, plus de **90% des tentatives de retry ciblent des erreurs structurellement impossibles à corriger** (noms d'outils hallucinés, paramètres invalides), ce qui signifie que l'agent brûle des tokens sur des boucles qui ne peuvent que se terminer en intervention humaine ou reset hard.

### Comment cela affecte chaque modalité différemment

| Modalités | Mode d'échec primaire | Surcharge de retry | Pourquoi |
| --- | --- | --- | --- |
| **CLI (brut)** | Flags hallucinés, mauvais sous-commandes | **Haute** | Interface texte seul ; l'agent infère la syntaxe à partir des données d'entraînement seules |
| **CLI + Skill** | Mauvais flag malgré le guidage du skill | **Moyenne** | Le skill préempt la plupart des erreurs communes ; certains cas limites restent |
| **MCP natif** | Mauvaise sélection d'outil parmi un grand schéma | **Moyenne-Faible** | Le schéma typé empêche les erreurs de paramétrage ; le risque de confusion d'outils grandit avec la taille du schéma |
| **Passerelle Nexus** | Requête mal routée | **Faible** | Un seul routeur avec des labels sémantiques clairs ; schéma appliqué en aval |

> **La découverte contre-intuitive de la recherche :** Le MCP natif a en fait des *taux d'erreur de paramétrage plus bas* que la CLI brute pour le même service, parce que le LLM reçoit une signature de fonction précise et typée au lieu d'inférer les flags de la documentation. La surcharge de schéma est coûteuse, mais elle réduit bien une classe d'erreurs.

### Estimation de la surcharge réelle

Sans données empiriques précises pour nos workflows spécifiques, nous pouvons estimer le coût en tokens ajusté aux erreurs en utilisant une hypothèse conservatrice : dans une session de codage réelle, l'agent fait **~1 erreur récupérable par 5 opérations GitHub** (un taux d'erreur de 20%, cohérent avec la performance mid-range BFCL sur les tâches agentiques).

Avec G=2 opérations GitHub par session, cela arrondit à approximativement une erreur/retry supplémentaire par 2–3 sessions, donc la surcharge d'erreur par session est petite mais non nulle :

| Modalités | Coût session idéal (N=20, G=2) | Estimation ajustée aux erreurs (+1 retry/session @ 400t) |
| --- | --- | --- |
| CLI (brut) | 448 | **848** (+89%) |
| CLI + Skill (à la demande) | 968 | **1 168** (+21%) |
| MCP natif | 61 654 | **61 954** (+0,5%) |
| Passerelle Nexus | 892 | **1 092** (+22%) |

**Observation clé :** La surcharge d'erreur frappe CLI (brut) le plus durement en termes relatifs (+89%), parce qu'il n'y a pas de schéma pour attraper les mauvais paramètres avant l'exécution. Pour le MCP natif, l'ajustement aux erreurs est statistiquement invisible (0,5%), parce que la taxe de schéma domine déjà d'un ordre de grandeur.

> ⚠️ **Note de méthodologie :** Tous les chiffres de tokens dans cet article représentent le **scénario happy-path, single-attempt**. Les estimations ajustées aux erreurs ci-dessus sont extrapolées des données du benchmark BFCL et de la recherche générale sur les agents style ReAct. Ce sont des approximations, pas des valeurs mesurées. Les taux d'erreur réels varient significativement selon le modèle, la qualité du prompt, la clarté du schéma et l'ambiguïté de la tâche. Your mileage will vary.

* * *

## Conclusion

Notre expérience avec de vraies opérations GitHub, créant des repos, ouvrant des issues, postant des commentaires et requêtant des résultats, confirme que la réaction contre MCP est **partiellement justifiée, mais manque la vraie solution**.

### Les chiffres qui comptent le plus

Le coût isolé par opération raconte une histoire :

| Modalités | Tokens par op | Surcharge session |
| --- | --- | --- |
| CLI (brut) | 224 | 0 |
| CLI + Skill (à la demande) | 244 | 480 (une fois) |
| MCP GitHub natif | **207** | **3 062 par prompt** |
| Passerelle Nexus | 246 | 20 par prompt |

Mais le **coût réel de la session dev** (N=20 prompts, G=2 ops GitHub, fetch issue + créer PR) raconte l'histoire qui compte vraiment :

| Modalités | Coût session réel | vs. baseline CLI |
| --- | --- | --- |
| CLI (brut) | **448 tokens** | — |
| CLI + Skill (à la demande) | **968 tokens** | 2,2× |
| Passerelle Nexus | **892 tokens** | 2,0× |
| CLI + Skill (toujours actif) | **10 088 tokens** | 22× |
| MCP GitHub natif | **61 654 tokens** | **137×** |

À N=50 prompts, le MCP natif atteint **153 514 tokens** pour les mêmes 2 appels GitHub, avec **99,7% gaspillés en descriptions de schémas qui n'ont jamais été nécessaires**.

### Trois conclusions

**1. La réaction contre MCP est réelle, mais la cible est mauvaise.** Le problème n'est pas le protocole. C'est le *pattern d'injection natif*, qui charge chaque schéma dans chaque prompt. Revenir à la CLI brute échange un ensemble de problèmes (gonflement de schéma) pour un autre (sortie texte fragile, boucles de découverte `--help`).

**2. La fréquence de service (ratio G/N) est la variable manquante dans chaque débat MCP vs CLI.** GitHub a G/N ≈ 5–10% dans une session dev typique, il appartient à la zone CLI+skill. Les outils système de fichiers et les stores mémoire ont G/N > 60%, ils appartiennent à la zone MCP natif. Concevez votre chaîne d'outils autour de vos patterns d'utilisation réels, pas du cycle de hype.

**3. Le pattern passerelle est la bonne architecture par défaut.** Surcharge fixe quasi-nulle (~20 tokens/prompt), sorties structurées de qualité MCP, et scale linéairement quel que soit le nombre de services backend configurés. Pairz-le avec des fichiers skill à la demande pour les services CLI low-frequency, et gardez le MCP natif seulement pour les outils que votre agent appelle sur presque chaque prompt.

La question que chaque équipe construisant des agents IA devrait se poser n'est pas "devrions-nous utiliser MCP ?" mais : **"Quel est le ratio G/N de ce service dans nos sessions, et payons-nous la taxe de schéma inutilement ?"**

* * *

*Tous les tests ont été exécutés en utilisant GitHub CLI v2.89.0, le* `github-mcp-server`*, et la passerelle* `nexus-dev`*sur macOS. Le fichier skill CLI est publié en tant que* [*Gist public*](https://gist.github.com/mmornati/2bba07f11d6e80075cb54f2cf10fa0fb)*. Les estimations de tokens utilisent l'approximation 1 token ≈ 4 caractères (cl100k_base).*