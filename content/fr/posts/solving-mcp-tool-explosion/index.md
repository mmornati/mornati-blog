---
title: 'Résoudre l'explosion d'outils MCP : une approche par passerelle pour les agents de codage IA'
tags:
- ai
- codage
- mcp
- mcp-server
- mcp-client
- agent-codage-ia
date: '2026-01-11T21:42:27.378000+00:00'
categories: [IA, Développement, Architecture]
slug: solving-the-mcp-tool-explosion-a-gateway-approach-for-ai-coding-agents
description: Réduisez la surcharge d'outils IA et améliorez l'efficacité des agents de codage avec l'architecture de passerelle de Nexus-Dev, limitant le nombre d'outils tout en maintenant les performances
---

Si vous utilisez des serveurs MCP avec Cursor, VS Code ou d'autres IDE alimentés par l'IA, vous avez probablement rencontré cet avertissement redouté :

> ⚠️ "Vous avez configuré plus de 50 outils. Cela peut dégrader les performances."

Les agents de codage IA modernes se connectent à plusieurs serveurs MCP (Model Context Protocol) : GitHub, PostgreSQL, Filesystem, Slack, Jira... Chaque serveur expose plusieurs outils. Avant même de vous en rendre compte, vous atteignez 50+ outils, et votre agent IA commence à peiner.

Dans cet article, je vais expliquer pourquoi cela se produit et comment [Nexus-Dev](https://github.com/mmornati/nexus-dev) le résout avec une architecture de **passerelle** qui réduit le nombre d'outils de 50+ à seulement 11.

## Contexte rapide : Qu'est-ce que MCP ?

**MCP (Model Context Protocol)** est un standard introduit par Anthropic en novembre 2024 qui permet aux assistants IA de se connecter à des outils et sources de données externes. Lorsque vous installez un serveur MCP GitHub, votre IA peut créer des issues, ouvrir des PR et gérer des dépôts.

Le problème ? Chaque serveur MCP ajoute plus d'outils au contexte de votre IA, et il y a une limite au nombre d'outils qui fonctionnent bien ensemble.

## Le problème : l'explosion des outils

### Comment les outils consomment le contexte

Lorsque vous configurez des serveurs MCP, la définition de chaque outil (nom, description, paramètres) est injectée dans la fenêtre de contexte de l'IA :

| Serveur MCP | Outils typiques |
| --- | --- |
| GitHub | 15-20 (issues, PRs, dépôts...) |
| PostgreSQL | 5-10 (requêtes, tables...) |
| Filesystem | 8-12 (lecture, écriture, liste...) |
| Slack | 10-15 (messages, canaux...) |

**5 serveurs × 10 outils = 50 outils** consommant un contexte précieux.

### Pourquoi les performances se dégradent

La recherche montre que la précision de l'IA peut chuter de 87% à 54% avec une surcharge de contexte. Chaque définition d'outil prend des jetons à votre code et conversation réels. Des plateformes comme Cursor appliquent une limite stricte autour de 40-50 outils pour éviter cela.

### Mais qu'en est-il de la configuration par projet ?

Les IDE modernes supportent désormais la configuration MCP au niveau du projet :

* **VS Code** : `.vscode/mcp.json`
    
* **Cursor** : `.cursor/mcp.json`

C'est mieux que la configuration globale : vous ne chargez que les serveurs pertinents par projet. Mais même un projet full-stack typique peut avoir besoin d'outils GitHub + Base de données + Cloud + Monitoring + Communication. C'est encore 40+ outils pour un seul projet.

## La solution : Nexus-Dev comme passerelle

Au lieu d'exposer tous les outils directement, Nexus-Dev sert de **passerelle** : un seul serveur MCP qui relaie les requêtes vers n'importe quel nombre de serveurs backend.

![](/images/solving-the-mcp-tool-explosion-a-gateway-approach-for-ai-coding-agents/00-8d26be15-c3f7-4ab5-961d-aac343c8df3d.png)

L'idée clé : **votre agent IA ne voit que 11 outils, mais peut accéder à tous les 50+ grâce à la découverte dynamique.**

### Comment ça fonctionne

1. **L'IA demande** : "J'ai besoin de créer une issue GitHub"
    
2. **Nexus-Dev recherche** dans son index RAG : trouve `github.create_issue`
    
3. **L'IA invoque** : `invoke_tool("github", "create_issue", {...})`
    
4. **Nexus-Dev relaie** la requête vers le MCP GitHub
    
5. **Le résultat** est renvoyé à l'IA

Le tout à travers seulement 11 outils de passerelle, pas 50+.

## Les 11 outils de la passerelle

Au lieu d'exposer 50+ outils directement, votre IA voit :

**Outils RAG (7)** : tirés du [précédent article](/blog/nexus-dev-rag-blog-post) :

* `search_code`, `search_docs`, `search_lessons`, `search_knowledge`
    
* `index_file`, `record_lesson`, `get_project_context`

**Outils de passerelle (4)** : pour accéder à n'importe quel backend :

| Outil | Ce qu'il fait |
| --- | --- |
| `list_servers` | Affiche les backends MCP disponibles |
| `search_tools` | Trouve les outils via recherche sémantique |
| `get_tool_schema` | Obtient le schéma complet des paramètres |
| `invoke_tool` | Exécute l'outil sur n'importe quel backend |

## Implémentation : comment ça fonctionne

### 1\. Indexer la documentation des outils

D'abord, indexez tous les outils de vos serveurs MCP dans la base de données RAG :

```bash
# Indexer tous les serveurs configurés
nexus-index-mcp --all

# Ou indexer un serveur spécifique
nexus-index-mcp --server github
```

Cela stocke la description et le schéma de chaque outil pour la recherche sémantique.

### 2\. Découverte d'outils sémantique

Lorsque l'IA demande "comment créer une issue GitHub ?", elle appelle `search_tools` :

```python
# search_tools("create github issue")
# Retourne: github.create_issue - Crée une nouvelle issue
#           Paramètres: owner, repo, title, body...
```

L'IA trouve le bon outil par son sens, pas en connaissant chaque nom d'outil à l'avance.

### 3\. Invocation d'outil avec gestion des erreurs

```python
# L'IA invoque via la passerelle
invoke_tool("github", "create_issue", {
    "owner": "mmornati",
    "repo": "nexus-dev",
    "title": "Fix login bug"
})
```

Nexus-Dev gère :

* Le regroupement et la réutilisation des connexions
    
* Les nouvelles tentatives automatiques avec backoff exponentiel
    
* Les délais d'attente configurables
    
* Les messages d'erreur clairs

### 4\. Configuration des serveurs

Les serveurs sont configurés dans `.nexus/mcp_config.json` :

```json
{
  "version": "1.0",
  "servers": {
    "github": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://..."]
    }
  }
}
```

Deux types de transport supportés :

* **stdio** : Processus locaux (paquets npm, scripts python)
    
* **sse** : Serveurs HTTP distants (points de terminaison MCP hébergés dans le cloud)

## Configuration rapide

```bash
# Importer depuis votre configuration MCP globale existante
nexus-mcp init --from-global

# Ou ajouter des serveurs manuellement
nexus-mcp add github --command "npx" --args "-y" \
  --args "@modelcontextprotocol/server-github"

# Indexer toute la documentation des outils
nexus-index-mcp --all
```

Mettez à jour votre IDE pour utiliser uniquement Nexus-Dev :

```json
{
  "mcpServers": {
    "nexus-dev": { "command": "nexus-dev" }
  }
}
```

C'est tout. Un serveur. 11 outils. Accès à tout.

## Avant vs Après

### Avant : Configuration traditionnelle

```plaintext
Config IDE:
  github:         (15 outils)
  postgres:       (8 outils)
  filesystem:     (10 outils)
  slack:          (12 outils)
  linear:         (8 outils)
  
Total: 53 outils dans le contexte
⚠️ Avertissement: Trop d'outils
```

### Après : Passerelle

```plaintext
Config IDE:
  nexus-dev:      (11 outils)
  
✅ Tous les 53+ outils accessibles via la passerelle
✅ Utilisation minimale du contexte
✅ Pas de dégradation des performances
```

## Exemple concret

```plaintext
Vous: "Créer une issue GitHub pour le bug de connexion"

IA: Laissez-moi trouver le bon outil...
    [search_tools("create github issue")]
    
    Trouvé: github.create_issue
    
    [invoke_tool("github", "create_issue", {
        "owner": "mmornati",
        "repo": "nexus-dev",
        "title": "Corriger la boucle de redirection de connexion",
        "labels": ["bug"]
    })]
    
    ✅ Issue #42 créée
```

Le tout à travers les 11 outils de Nexus-Dev.

## Résumé des avantages

| Traditionnel | Passerelle |
| --- | --- |
| 50+ outils dans le contexte | 11 outils dans le contexte |
| Configurer chaque serveur dans l'IDE | Configurer uniquement Nexus-Dev |
| Redémarrer l'IDE pour ajouter des serveurs | `nexus-mcp add` dynamiquement |
| L'IA doit connaître les noms exacts des outils | La recherche sémantique trouve les outils |

## Conclusion

L'écosystème MCP se développe rapidement, et l'explosion des outils est un vrai problème. En utilisant Nexus-Dev comme passerelle :

* Votre agent IA ne voit que 11 outils
    
* Il peut accéder à 50+ outils via la recherche sémantique
    
* L'utilisation du contexte reste minimale
    
* La configuration reste simple

Combiné avec les capacités RAG du [précédent article](https://blog.mornati.net/stop-repeating-yourself-to-ai-how-i-built-a-local-rag-system-for-coding-assistants), Nexus-Dev devient une solution complète pour rendre votre agent de codage IA plus intelligent et plus efficace.

---

**Nexus-Dev est open source :** [**github.com/mmornati/nexus-dev**](https://github.com/mmornati/nexus-dev)
