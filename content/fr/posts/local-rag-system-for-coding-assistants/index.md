---
title: 'Arrêtez de vous répéter avec l'IA : Comment j'ai construit un système RAG local pour les assistants de codage'
tags:
- ia
- codage
- rag
date: '2026-01-11T21:40:36.640000+00:00'
categories: [IA, Développement, DevOps]
slug: stop-repeating-yourself-to-ai-how-i-built-a-local-rag-system-for-coding-assistants
description: Construisez un système RAG local pour donner aux assistants de codage IA une mémoire persistante et améliorer l'efficacité. Présentation de Nexus-Dev, une solution open-source
---


Si vous me suivez, vous savez que je suis un grand fan des assistants de codage IA. Je les utilise quotidiennement, GitHub Copilot, Cursor, Claude, et ils ont vraiment transformé ma façon d'écrire du code. Mais il y a une chose qui me frustre depuis des mois : **ces assistants n'ont pas de mémoire**.

Chaque fois que je commence une nouvelle session, mon assistant IA doit ré-apprendre ma base de code. Il analyse les fichiers, me pose les mêmes questions, et consomme des tokens juste pour comprendre un contexte qu'il connaissait déjà hier. C'est comme travailler avec un collègue brillant qui souffre d'amnésie chaque nuit.

Alors j'ai construit [Nexus-Dev](https://github.com/mmornati/nexus-dev), un système RAG local open-source qui donne aux agents de codage IA une mémoire persistante.

## Qu'est-ce que le RAG ? (Pour ceux qui découvrent l'IA)

Avant de plonger, clarifions quelques termes :

**RAG (Retrieval-Augmented Generation)** est une technique où, au lieu de fournir un document entier à une IA, vous stockez les informations dans une base de données searchable et récupérez uniquement les morceaux pertinents quand nécessaire. Imaginez que vous donnez à l'IA un index intelligent de votre base de code plutôt que de la forcer à tout lire.

**MCP (Model Context Protocol)** est un standard ouvert introduit par Anthropic qui permet aux agents IA de se connecter à des outils et sources de données externes. Si vous avez utilisé GitHub Copilot, Cursor ou Claude avec des plugins, vous utilisez déjà MCP.

**Les Embeddings** sont des représentations numériques du texte qui capturent le sens. Les textes similaires ont des embeddings similaires, ce qui permet la recherche sémantique, trouver du contenu par le sens, pas juste par les mots-clés.

## Le Problème : Les Agents IA Souffrent d'Amnésie

### Pas de Mémoire Entre les Sessions

Quand vous fermez votre IDE et le rouvrez le lendemain, votre assistant IA oublie tout. Il ne se souvient pas des décisions d'architecture que vous avez prises, des bugs que vous avez corrigés ensemble, ou des patterns que votre base de code utilise.

### La Consommation de Tokens S'Accumule

Chaque session, l'IA a besoin de "s'échauffer" en relisant votre base de code. Cela consomme des tokens, et les tokens coûtent de l'argent. Des recherches montrent que donner aux agents IA *plus* de contexte peut en réalité les rendre *moins* performants. La précision peut chuter significativement (de 87% à 54%) à cause de la surcharge de contexte.

### Les Solutions Existantes Sont Basées sur le Cloud

Plusieurs solutions existent pour adresser ce problème :

* [**Qodo**](https://qodo.ai) : Intelligence de code basée sur le RAG (propriétaire)
    
* [**Zep**](https://getzep.com) et [**Pieces**](https://pieces.app) : Plateformes de mémoire pour agents (basées sur le cloud)
    

Mais je voulais quelque chose **local-first** (mon code ne quitte jamais ma machine), **open-source** (je contrôle la stack), et **cross-project** (les connaissances acquises dans un projet aident les autres).

## La Solution : Comment Fonctionne Nexus-Dev

![](/images/stop-repeating-yourself-to-ai-how-i-built-a-local-rag-system-for-coding-assistants/00-f7da345c-9802-4c97-b9ce-ff21a30218e3.png)

Le diagramme montre les deux flux principaux :

**Indexation (flux supérieur)** : Code source → Chunker → Embeddings → LanceDB **Recherche (flux inférieur)** : Requête → Embeddings → LanceDB → Résultats Pertinents

### Étape 1 : Chunking Aware du Langage

La première insight est que **le split de texte naïf ne fonctionne pas pour le code**. Couper une fonction en deux détruit son sens.

Au lieu de cela, Nexus-Dev utilise [tree-sitter](https://tree-sitter.github.io/tree-sitter/) pour parser le code en Abstract Syntax Tree (AST) et extraire les unités sémantiques : fonctions, classes et méthodes.

```python
# Chaque chunk contient des métadonnées riches pour une meilleure recherche
@dataclass
class CodeChunk:
    content: str           # Le code actuel
    chunk_type: ChunkType  # function, class, method
    name: str              # ex. "authenticate_user"
    docstring: str | None  # La documentation aide la recherche !
    signature: str | None  # Signature de la fonction
    start_line: int        # Position précise
    end_line: int
```

Langages supportés : Python, JavaScript/TypeScript, Java, et Markdown/RST pour la documentation.

### Étape 2 : Embeddings Multi-Providers

Les embeddings convertissent les chunks de code en vecteurs qui capturent le sens. Nexus-Dev supporte plusieurs providers :

| Provider | Idéal Pour |
| --- | --- |
| **OpenAI** | Configuration facile, usage général |
| **Ollama** | Vie privée, hors ligne, gratuit |
| **Google/AWS** | Environnements enterprise |
| **Voyage AI** | Meilleure qualité RAG |

> ⚠️ **Important** : Les embeddings ne sont pas portables entre providers. Changer de provider nécessite de ré-indexer.

Pour les équipes soucieuses de la vie privée, Ollama fonctionne entièrement en local :

```json
{
  "embedding_provider": "ollama",
  "embedding_model": "nomic-embed-text"
}
```

### Étape 3 : Stockage Vectoriel avec LanceDB

[LanceDB](https://lancedb.github.io/lancedb/) est une base de données vectorielle locale, pas de serveur à exécuter, juste un fichier sur le disque.

```python
# La recherche sémantique trouve du code par le sens, pas les mots-clés
results = database.search(
    query="authentication middleware",
    doc_type=DocumentType.CODE,
    limit=5
)
# Retourne les fonctions/classes les plus pertinentes
```

### Étape 4 : L'Arme Secrète : Les Leçons Apprises

Après avoir corrigé un bug tricky, enregistrez-le :

```python
record_lesson(
    problem="JWT validation fails with special characters",
    solution="Use base64url decode instead of base64",
    code_snippet="claims = base64url.decode(token.split('.')[1])"
)
```

La prochaine fois que vous rencontrez un problème similaire, l'IA le trouve automatiquement. Cela crée une **mémoire institutionnelle** qui survit aux changements d'équipe.

## Pour Commencer

```bash
# Installer
pip install nexus-dev

# Initialiser
cd your-project
nexus-init --project-name "my-project" --embedding-provider openai

# Définir la clé API
export OPENAI_API_KEY="sk-..."

# Indexer votre code
nexus-index src/ docs/ -r

# Vérifier
nexus-status
```

Ajoutez à la configuration MCP de votre IDE :

**Pour Cursor** (`.cursor/mcp.json`) :

```json
{
  "mcpServers": {
    "nexus-dev": { "command": "nexus-dev" }
  }
}
```

**Pour VS Code** (`.vscode/mcp.json`) :

```json
{
  "mcpServers": {
    "nexus-dev": { "command": "nexus-dev" }
  }
}
```

## Les 7 Outils que Votre IA Obtient

| Outil | Ce Qu'il Fait |
| --- | --- |
| `search_code` | Trouver des fonctions, classes par le sens |
| `search_docs` | Rechercher dans la documentation |
| `search_lessons` | Trouver des solutions passées |
| `search_knowledge` | Rechercher partout |
| `index_file` | Ajouter des fichiers à la base de connaissances |
| `record_lesson` | Sauvegarder les insights de debugging |
| `get_project_context` | Voir les stats du projet |

## Exemple Réel

```plaintext
Vous : "J'ai besoin d'ajouter l'authentification à l'API"

IA : Laissez-moi rechercher dans la base de code...
    [Appelle search_code("authentication middleware")]
    
    Trouvé 3 résultats pertinents :
    1. auth_middleware.py:15-45 - Classe JWTAuthMiddleware
    2. user_service.py:23-67 - Fonction authenticate_user
```

Plus besoin de lire des fichiers entiers. L'IA trouve exactement ce qui est pertinent.

## Résultats

Depuis le déploiement de Nexus-Dev :

* **Démarrages de session plus rapides** : L'IA a immédiatement le contexte
    
* **Utilisation réduite des tokens** : On récupère uniquement ce qui est nécessaire
    
* **Apprentissage cross-project** : Les leçons d'un projet aident les autres
    
* **Tout en local** : Pas de cloud, pas de coûts API pour le stockage
    

---

**Nexus-Dev est open source :** [**github.com/mmornati/nexus-dev**](https://github.com/mmornati/nexus-dev)
