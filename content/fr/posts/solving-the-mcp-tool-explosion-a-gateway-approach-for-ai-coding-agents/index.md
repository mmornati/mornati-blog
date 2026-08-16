---
title: 'Résoudre l''explosion d''outils MCP : Une approche par passerelle pour les agents de codage IA'
tags:
- ai
- coding
- mcp
- mcp-server
- mcp-client
- ai-coding-agent
date: '2026-01-11T21:42:27.378000+00:00'
categories: [IA, Développement, Architecture]
slug: solving-the-mcp-tool-explosion-a-gateway-approach-for-ai-coding-agents
description: Réduisez la surcharge d'outils IA et augmentez l'efficacité des agents de codage avec l'architecture gateway de Nexus-Dev, limitant le nombre d'outils et maintenant la performance
---




Si vous utilisez des serveurs MCP avec Cursor, VS Code ou d'autres IDE alimentés par IA, vous avez probablement rencontré cet avertissement redouté :

> ⚠️ "Vous avez configuré plus de 50 outils. Cela peut dégrader les performances."

Les agents de codage IA modernes se connectent à plusieurs serveurs MCP (Model Context Protocol) : GitHub, PostgreSQL, Filesystem, Slack, Jira... Chaque serveur expose plusieurs outils. Avant que vous ne vous en rendiez compte, vous êtes à 50+ outils, et votre agent IA commence à peiner.

Dans cet article, je vais expliquer pourquoi cela se produit et comment [Nexus-Dev](https://github.com/mmornati/nexus-dev) le résout avec une architecture **Gateway** qui réduit le nombre d'outils de 50+ à seulement 11.

## Contexte rapide : Qu'est-ce que MCP ?

**MCP (Model Context Protocol)** est un standard introduit par Anthropic en novembre 2024 qui permet aux assistants IA de se connecter à des outils et sources de données externes. Quand vous installez un serveur MCP GitHub, votre IA peut créer des issues, ouvrir des PRs et gérer des dépôts.

Le problème ? Chaque serveur MCP ajoute plus d'outils au contexte de votre IA, et il y a une limite au nombre d'outils qui fonctionnent bien ensemble.

## Le problème : Explosion d'outils

### Comment les outils consomment le contexte

Quand vous configurez des serveurs MCP, la définition de chaque outil (nom, description, paramètres) est injectée dans la fenêtre de contexte de l'IA :

| Serveur MCP | Outils typiques |
| --- | --- |
| GitHub | 15-20 (issues, PRs, repos...) |
| PostgreSQL | 5-10 (query, tables...) |
| Filesystem | 8-12 (read, write, list...) |
| Slack | 10-15 (messages, channels...) |

**5 serveurs × 10 outils = 50 outils** consommant un contexte précieux.

### Pourquoi les performances se dégradent

Des recherches montrent que la précision de l'IA peut chuter de 87% à 54% avec une surcharge de contexte. Chaque définition d'outil prend des tokens away de votre code actuel et de votre conversation. Des plateformes comme Cursor imposent une limite stricte autour de 40-50 outils pour éviter cela.

### Mais qu'en est-il de la configuration par projet ?

Les IDEs modernes supportent maintenant la configuration MCP au niveau du projet :

* **VS Code** : `.vscode/mcp.json`
    
* **Cursor** : `.cursor/mcp.json`
    

C'est mieux que la configuration globale : vous chargez uniquement les serveurs pertinents par projet. Mais même un projet full-stack typique pourrait avoir besoin de GitHub + Base de données + Cloud + Monitoring + Outils de communication. C'est encore 40+ outils pour un seul projet.

## La solution : Nexus-Dev comme passerelle

Au lieu d'exposer tous les outils directement, Nexus-Dev agit comme une **passerelle** : un seul serveur MCP qui relaie les requêtes vers n'importe quel nombre de serveurs backend.

![](/images/solving-the-mcp-tool-explosion-a-gateway-approach-for-ai-coding-agents/00-8d26be15-c3f7-4ab5-961d-aac343c8df3d.png)

L'idée clé : **Votre agent IA ne voit que 11 outils, mais peut accéder à tous les 50+ via découverte dynamique.**

### Comment ça fonctionne

1. **L'IA demande** : "J'ai besoin de créer une issue GitHub"
    
2. **Nexus-Dev recherche** dans son index RAG : trouve `github.create_issue`
    
3. **L'IA invoque** : `invoke_tool("github", "create_issue", {...})`
    
4. **Nexus-Dev relaie** la requête vers le MCP GitHub
    
5. **Le résultat** est retourné à l'IA
    

Le tout à travers seulement 11 outils gateway, pas 50+.

## Les 11 outils gateway

Au lieu d'exposer 50+ outils directement, votre IA voit :

**Outils RAG (7)** : du [précédent article](/blog/nexus-dev-rag-blog-post) :

* `search_code`, `search_docs`, `search_lessons`, `search_knowledge`
    
* `index_file`, `record_lesson`, `get_project_context`
    

**Outils Gateway (4)** : pour accéder à n'importe quel backend :

| Outil | Ce qu'il fait |
| --- | --- |
| `list_servers` | Afficher les MCP backends disponibles |
| `search_tools` | Trouver des outils via recherche sémantique |
| `get_tool_schema` | Obtenir le schéma complet des paramètres |
| `invoke_tool` | Exécuter un outil sur n'importe quel backend |

## Implémentation : Comment ça fonctionne

### 1\. Indexer la documentation des outils

D'abord, indexer tous les outils de vos serveurs MCP dans la base de données RAG :

```bash
# Indexer tous les serveurs configurés
nexus-index-mcp --all

# Ou indexer un serveur spécifique
nexus-index-mcp --server github
```

Cela stocke la description et le schéma de chaque outil pour la recherche sémantique.

### 2\. Découverte d'outils sémantique

Quand l'IA demande "comment créer une issue GitHub ?", elle appelle `search_tools` :

```python
# search_tools("create github issue")
# Retourne: github.create_issue - Crée une nouvelle issue
#          Paramètres: owner, repo, title, body...
```

L'IA trouve le bon outil par le sens, pas en connaissant chaque nom d'outil à l'avance.

### 3\. Invocation d'outils avec gestion d'erreurs

```python
# L'IA invoque à travers la passerelle
invoke_tool("github", "create_issue", {
    "owner": "mmornati",
    "repo": "nexus-dev",
    "title": "Fix login bug"
})
```

Nexus-Dev gère :

* Le pool de connexions et leur réutilisation
    
* Les nouvelles tentatives automatiques avec backoff exponentiel
    
* Les délais d'expiration configurables
    
* Les messages d'erreur propres
    

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
    
* **sse** : Serveurs HTTP distants (endpoints MCP hébergés sur cloud)
    

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

Mettez à jour votre IDE pour utiliser seulement Nexus-Dev :

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
IDE Config:
  github:         (15 tools)
  postgres:       (8 tools)
  filesystem:     (10 tools)
  slack:          (12 tools)
  linear:         (8 tools)
  
Total: 53 tools in context
⚠️ Warning: Too many tools
```

### Après : Passerelle

```plaintext
IDE Config:
  nexus-dev:      (11 tools)
  
✅ All 53+ tools accessible via gateway
✅ Minimal context usage
✅ No performance degradation
```

## Exemple concret

```plaintext
Vous: "Créer une issue GitHub pour le bug de login"

IA: Laissez-moi trouver le bon outil...
    [search_tools("create github issue")]
    
    Trouvé: github.create_issue
    
    [invoke_tool("github", "create_issue", {
        "owner": "mmornati",
        "repo": "nexus-dev",
        "title": "Fix login redirect loop",
        "labels": ["bug"]
    })]
    
    ✅ Issue #42 créée
```

Le tout à travers les 11 outils de Nexus-Dev.

## Résumé des bénéfices

| Traditionnel | Passerelle |
| --- | --- |
| 50+ outils dans le contexte | 11 outils dans le contexte |
| Configurer chaque serveur dans l'IDE | Configurer seulement Nexus-Dev |
| Redémarrage de l'IDE pour ajouter des serveurs | `nexus-mcp add` dynamiquement |
| L'IA doit connaître les noms exacts des outils | La recherche sémantique trouve les outils |

## Conclusion

L'écosystème MCP croît rapidement, et l'explosion d'outils est un vrai problème. En utilisant Nexus-Dev comme passerelle :

* Votre agent IA ne voit que 11 outils
    
* Il peut accéder à 50+ outils via recherche sémantique
    
* L'utilisation du contexte reste minimale
    
* La configuration reste simple
    

Combiné avec les capacités RAG du [précédent article](https://blog.mornati.net/stop-repeating-yourself-to-ai-how-i-built-a-local-rag-system-for-coding-assistants), Nexus-Dev devient une solution complète pour rendre votre agent de codage IA plus intelligent et plus efficace.

---

**Nexus-Dev est open source :** [**github.com/mmornati/nexus-dev**](https://github.com/mmornati/nexus-dev)