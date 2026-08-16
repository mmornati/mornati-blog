---
title: 'Arrêtez de vous répéter avec l''IA : Comment j''ai construit un système RAG local pour les assistants de codage'
tags:
- ai
- coding
- rag
date: '2026-01-11T21:40:36.640000+00:00'
categories: [IA, Développement, DevOps]
slug: stop-repeating-yourself-to-ai-how-i-built-a-local-rag-system-for-coding-assistants
description: Construisez un système RAG local pour donner aux assistants de codage IA une mémoire persistante et améliorer l'efficacité. Présentation de Nexus-Dev, une solution open source
---




Si vous me suivez, vous savez que je suis un grand fan des assistants de codage IA. Je les utilise quotidiennement, GitHub Copilot, Cursor, Claude, et ils ont vraiment transformé ma façon d'écrire du code. Mais il y a une chose qui me frustre depuis des mois : **ces assistants n'ont pas de mémoire**.

Chaque fois que je démarre une nouvelle session, mon assistant IA doit ré-apprendre ma base de code. Il scanne les fichiers, me pose les mêmes questions, et brûle des tokens juste pour comprendre un contexte qu'il connaissait déjà hier. C'est comme travailler avec un collègue brillant qui souffre d'amnésie chaque nuit.

Alors j'ai construit [Nexus-Dev](https://github.com/mmornati/nexus-dev), un système RAG local open source qui donne aux agents de codage IA une mémoire persistante.

## Qu'est-ce que RAG ? (Pour ceux qui découvrent l'IA)

Avant de nous plonger, clarifions quelques termes :

**RAG (Retrieval-Augmented Generation)** est une technique où, au lieu de nourrir l'IA avec un document entier, vous stockez l'information dans une base de données consultable et récupérez uniquement les morceaux pertinents quand nécessaire. Pensez-y comme donner à l'IA un index intelligent de votre base de code plutôt que de la forcer à tout lire.

**MCP (Model Context Protocol)** est un standard ouvert introduit par Anthropic qui permet aux agents IA de se connecter à des outils et sources de données externes. Si vous avez utilisé GitHub Copilot, Cursor ou Claude avec des plugins, vous utilisez déjà MCP.

**Les embeddings** sont des représentations numériques du texte qui capturent le sens. Les textes similaires ont des embeddings similaires, ce qui permet la recherche sémantique, trouver du contenu par le sens, pas juste par mots-clés.

## Le problème : Les agents IA souffrent d'amnésie

### Pas de mémoire entre les sessions

Quand vous fermez votre IDE et le rouvrez le lendemain, votre assistant IA oublie tout. Il ne se souvient pas des décisions d'architecture que vous avez prises, des bugs que vous avez corrigés ensemble, ou des patterns que votre base de code utilise.

### La consommation de tokens s'accumule

Chaque session, l'IA a besoin de "chauffer" en relisant votre base de code. Cela consomme des tokens, et les tokens coûtent de l'argent. Des recherches montrent que donner aux agents IA *plus* de contexte peut en fait les rendre *pires*. La précision peut chuter significativement (de 87% à 54%) à cause de la surcharge de contexte.

### Les solutions existantes sont basées sur le cloud

Plusieurs solutions abordent ce problème :

* [**Qodo**](https://qodo.ai) : Intelligence de code basée sur RAG (propriétaire)
    
* [**Zep**](https://getzep.com) et [**Pieces**](https://pieces.app) : Plateformes de mémoire d'agent (basées sur le cloud)
    

Mais je voulais quelque chose **local-first** (mon code ne quitte jamais ma machine), **open-source** (je contrôle la stack), et **cross-project** (les connaissances acquises dans un projet aident les autres).

## La solution : Comment fonctionne Nexus-Dev

![](/images/stop-repeating-yourself-to-ai-how-i-built-a-local-rag-system-for-coding-assistants/00-f7da345c-9802-4c97-b9ce-ff21a30218e3.png)

Le diagramme montre les deux flux principaux :

**Indexation (flux supérieur)** : Code source → Chunker → Embeddings → LanceDB **Recherche (flux inférieur)** : Requête → Embeddings → LanceDB → Résultats pertinents

### Étape 1 : Chunking conscient du langage

La première révélation est que **le fractionnement de texte naïf ne fonctionne pas pour le code**. Couper une fonction en deux détruit son sens.

Au lieu de cela, Nexus-Dev utilise [tree-sitter](https://tree-sitter.github.io/tree-sitter/) pour parser le code en Abstract Syntax Tree (AST) et extraire les unités sémantiques : fonctions, classes et méthodes.

```python
# Chaque chunk contient des métadonnées riches pour une meilleure recherche
@dataclass
class CodeChunk:
    content: str           # Le code actuel
    chunk_type: ChunkType  # function, class, method
    name: str              # ex., "authenticate_user"
    docstring: str | None  # La documentation aide la recherche !
    signature: str | None  # Signature de fonction
    start_line: int        # Emplacement précis
    end_line: int
```

Langages supportés : Python, JavaScript/TypeScript, Java et Markdown/RST pour la documentation.

### Étape 2 : Embeddings multi-providers

Les embeddings convertissent les chunks de code en vecteurs qui capturent le sens. Nexus-Dev supporte plusieurs providers :

| Provider | Idéal pour |
| --- | --- |
| **OpenAI** | Configuration facile, usage général |
| **Ollama** | Confidentialité, hors ligne, gratuit |
| **Google/AWS** | Environnements d'entreprise |
| **Voyage AI** | Meilleure qualité RAG |

> ⚠️ **Important** : Les embeddings ne sont pas portables entre providers. Changer nécessite de ré-indexer.

Pour les équipes axées sur la confidentialité, Ollama s'exécute entièrement en local :

```json
{
  "embedding_provider": "ollama",
  "embedding_model": "nomic-embed-text"
}
```

### Étape 3 : Stockage vectoriel LanceDB

[LanceDB](https://lancedb.github.io/lancedb/) est une base de données vectorielle locale, pas de serveur à exécuter, juste un fichier sur le disque.

```python
# La recherche sémantique trouve le code par le sens, pas par mots-clés
results = database.search(
    query="authentication middleware",
    doc_type=DocumentType.CODE,
    limit=5
)
# Retourne les fonctions/classes les plus pertinentes
```

### Étape 4 : L'arme secrète : Leçons apprises

Après avoir corrigé un bug tricky, enregistrez-le :

```python
record_lesson(
    problem="JWT validation fails with special characters",
    solution="Use base64url decode instead of base64",
    code_snippet="claims = base64url.decode(token.split('.')[1])"
)
```

La prochaine fois que vous rencontrerez un problème similaire, l'IA le trouvera automatiquement. Cela crée une **mémoire institutionnelle** qui survit aux changements d'équipe.

## Commencer

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

## Les 7 outils que votre IA obtient

| Outil | Ce qu'il fait |
| --- | --- |
| `search_code` | Trouver fonctions, classes par le sens |
| `search_docs` | Rechercher dans la documentation |
| `search_lessons` | Trouver des solutions passées |
| `search_knowledge` | Tout rechercher |
| `index_file` | Ajouter des fichiers à la base de connaissances |
| `record_lesson` | Sauvegarder les insights de debugging |
| `get_project_context` | Voir les stats du projet |

## Exemple concret

```plaintext
Vous: "J'ai besoin d'ajouter l'authentification à l'API"

IA: Laissez-moi chercher dans la base de code...
    [Appelle search_code("authentication middleware")]
    
    Trouvé 3 résultats pertinents :
    1. auth_middleware.py:15-45 - Classe JWTAuthMiddleware
    2. user_service.py:23-67 - Fonction authenticate_user
```

Plus besoin de lire des fichiers entiers. L'IA trouve exactement ce qui est pertinent.

## Résultats

Depuis le déploiement de Nexus-Dev :

* **Démarrages de session plus rapides** : L'IA a immédiatement le contexte
    
* **Utilisation réduite des tokens** : On récupère seulement ce qui est nécessaire
    
* **Apprentissage cross-project** : Les leçons d'un projet aident les autres
    
* **Tout en local** : Pas de cloud, pas de coûts API pour le stockage
    

---

**Nexus-Dev est open source :** [**github.com/mmornati/nexus-dev**](https://github.com/mmornati/nexus-dev)