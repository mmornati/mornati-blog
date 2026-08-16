---
title: 'Les coulisses : La section Admin de Cyber Code Academy'
tags:
- ia
- code
- python
- developpeur
- apprentissage
date: '2025-12-31T17:51:16.624000+00:00'
categories: [Développement, IA, Éducation]
slug: behind-the-scenes-cyber-code-academy-admin
description: Explorez les puissants outils d'administration de Cyber Code Academy pour la création de défis, la surveillance, la validation sémantique et la gestion de la plateforme pilotée par l'IA
---


## Introduction

Cyber Code Academy est une plateforme moderne et gamifiée pour maîtriser Python à travers des défis interactifs, des competitions en temps réel et une génération de problèmes alimentée par l'IA. Pendant que les étudiants se concentrent sur la résolution de défis de codage, les administrateurs ont besoin d'outils robustes pour créer, gérer et surveiller le contenu et l'infrastructure de la plateforme.

Dans cet article, nous allons plongeons en profondeur dans la section admin, une suite complète d'outils qui simplifie tout, de la création de défis à la surveillance de l'infrastructure. Nous allons explorer comment nous utilisons le stockage JSON, la validation sémantique, la génération alimentée par l'IA, les services de traduction et l'exécution basée sur Docker pour créer une plateforme évolutive et maintenable.

![](/images/behind-the-scenes-the-admin-section-of-cyber-code-academy/00-55251afa-b32c-4157-afe8-1088f4139e75.png)

*Le tableau de bord admin fournit une vue centralisée de toutes les opérations de la plateforme*

---

## Gestion des Défis : Stockage Flexible et Validation Sémantique

### Stockage des Tests en JSON

L'une des décisions de conception clés dans Cyber Code Academy a été de stocker les tests de défis sous forme de JSON dans les colonnes JSONB de PostgreSQL. Cette approche offre plusieurs avantages :

* **Flexibilité** : Les tests peuvent avoir différentes structures (basés sur des assertions, sur la sortie, ou validation personnalisée)
    
* **Interrogeabilité** : Les opérateurs JSONB de PostgreSQL nous permettent d'interroger et de filtrer les défis par propriétés de test
    
* **Versioning** : Facile à suivre les changements des suites de tests au fil du temps
    
* **Pas de Migrations de Schéma** : Ajouter de nouveaux types de tests ne nécessite pas de migrations de base de données
    

Chaque défi stocke ses tests dans un tableau JSONB comme ceci :

```json
{
  "tests": [
    {
      "name": "test_basic",
      "code": "assert solve([1, 2, 3]) == 6",
      "hidden": false
    },
    {
      "name": "test_edge_case",
      "code": "assert solve([]) == 0",
      "hidden": true
    }
  ]
}
```

Le modèle de base de données utilise le type `JSONB` de SQLAlchemy pour stocker cette structure flexible :

```python
tests = Column(JSONB, nullable=False)  # Array of test objects
```

![](/images/behind-the-scenes-the-admin-section-of-cyber-code-academy/01-1b0a3203-af0e-4d74-b9bc-b69b663cf888.png)

*L'éditeur de défis affiche une interface utilisateur sur la structure JSON des tests, facilitant la compréhension et la modification des cas de test*

### Validation Sémantique : Au-delà des Résultats de Tests

Mientras que les tests unitaires vérifient que le code produit des sorties correctes, ils ne garantissent pas que les étudiants apprennent les concepts souhaités. Un étudiant pourrait résoudre un défi en utilisant une solution de contournement ou une approche non prévue qui passe tous les tests mais qui manque l'objectif éducatif.

C'est là qu'intervient la **validation sémantique**. Nous avons implémenté un système de validation à deux niveaux :

#### Validation Basée sur l'AST (Rapide & Déterministe)

Pour les défis qui nécessitent des motifs ou structures de code spécifiques, nous utilisons le module **Abstract Syntax Tree (AST)** de Python pour effectuer une validation rapide et déterministe. Le validateur AST peut vérifier :

* Définitions de fonctions requises
    
* Imports ou fonctions interdits
    
* Structures de contrôle requises (boucles, conditionnels)
    
* Contraintes de complexité de code
    
* Exigences d'algorithmes spécifiques
    

Le validateur AST analyse le code en un AST et utilise un pattern visitor pour vérifier les contraintes :

```python
class ASTValidator:
    def validate(self, code: str, constraints: Dict[str, Any]) -> ValidationResult:
        tree = ast.parse(code)
        visitor = ASTConstraintVisitor(constraints)
        visitor.visit(tree)
        return ValidationResult(
            passed=len(visitor.errors) == 0,
            errors=visitor.errors,
            warnings=visitor.warnings
        )
```

Cette approche est :

* **Rapide** : Pas d'appels API, parsing Python pur
    
* **Déterministe** : Le même code produit toujours le même résultat
    
* **Précise** : Peut détecter des motifs de code spécifiques avec une haute précision
    

![](/images/behind-the-scenes-the-admin-section-of-cyber-code-academy/02-2d1ca894-fd25-42de-8e63-26407cbfadf6.png)

*Les administrateurs peuvent configurer les contraintes de validation sémantique pour chaque défi*

Pour les administrateurs, il existe un prompt prédéfini pour aider à écrire un validateur JSON AST approprié !

#### Validation Basée sur les LLM (Flexible & Contextuelle)

Pour les défis où l'objectif d'apprentissage est plus nuancé, nous utilisons les **Large Language Models (LLMs)** pour valider que le code suit les instructions du défi. Le validateur LLM :

* Comprend l'objectif éducatif du défi
    
* Vérifie si l'approche du code correspond au parcours d'apprentissage prévu
    
* Fournit des commentaires sur le style de code et les bonnes pratiques
    
* Détecte les contournements qui passent les tests mais qui manquent l'objectif
    

Le validateur LLM envoie l'objectif du défi, le code de solution et le code utilisateur à un modèle d'IA pour analyse :

```python
class LLMValidator:
    async def validate(self, code: str, challenge: Challenge, db: AsyncSession):
        system_prompt = """You are a code validator for a Python learning platform.
        Check if the user's code follows the challenge instructions exactly."""
        
        user_prompt = f"""Challenge Objective: {challenge.description['objective']}
        Expected Approach: {challenge.solution_code}
        User Code: {code}
        
        Analyze if the user's code follows the challenge instructions."""
        
        # Call LLM with automatic usage tracking
        response = await self._call_llm_with_tracking(...)
        return self._parse_response(response)
```

#### Chaîne de Fallback LLM : Fiabilité par la Redondance

Pour garantir une haute disponibilité et gérer les limites de taux, nous avons implémenté une chaîne de fallback à travers trois fournisseurs de LLM :

1. **Groq** (Primaire) : Inférence rapide avec des modèles comme `llama-3.3-70b-versatile`
    
2. **Google Gemini** (Fallback) : `gemini-2.5-flash` pour des performances fiables
    
3. **OpenAI** (Dernier recours) : `gpt-4-turbo-preview` pour une qualité maximale
    

Le système bascule automatiquement les fournisseurs lorsque :

* Les limites de taux sont atteinte (HTTP 429)
    
* Des erreurs API se produisent
    
* Des timeouts se produisent
    

```python
class AIModelManager:
    def handle_error(self, error: Exception, current_model: str):
        if is_rate_limit_error(error):
            self.current_index += 1
            next_model = self.get_next_model()
            return True, next_model, retry_after_seconds
        # ... handle other errors
```

Cette approche multi-fournisseurs garantit que la validation sémantique reste disponible même lorsque des fournisseurs individuels ont des problèmes, fournissant un système de validation robuste et fiable.

---

## Système de Traduction : Rendre les Défis Accessibles Globalement

Créer du contenu éducatif de qualité prend du temps. Traduire ce contenu en plusieurs langues peut être prohibitivement coûteux et lent. Pour résoudre ce problème, nous avons intégré **LibreTranslate**—un service de traduction open-source—pour traduire automatiquement les défis.

### Support Multi-Langues avec JSONB

Similaire à notre approche de stockage des tests, nous utilisons des colonnes JSONB pour stocker les traductions :

```python
title_i18n = Column(JSONB, nullable=True)  # {"en": "...", "fr": "..."}
description_i18n = Column(JSONB, nullable=True)  # Nested structure
hints_i18n = Column(JSONB, nullable=True)  # Array of translated hints
```

Cette structure nous permet de :

* Stocker plusieurs langues dans une seule ligne
    
* Interroger efficacement par langue
    
* Ajouter de nouvelles langues sans changements de schéma
    
* Maintenir l'historique des traductions
    

### Flux de Travail Auto-Traduction

Le système de traduction fournit un flux transparent pour les administrateurs :

1. **Créer le Défi en Anglais** : Rédigez le défi avec tout le contenu en anglais
    
2. **Auto-Traduire** : Cliquez sur un bouton pour traduire vers la langue cible (par exemple, le français)
    
3. **Réviser & Éditer** : Révisez le contenu auto-traduit et effectuez les ajustements manuels
    
4. **Publier** : Le défi est maintenant disponible dans les deux langues
    

Le service de traduction utilise le cache Redis pour éviter les appels API redondants :

```python
class TranslationService:
    async def translate(self, text: str, target_lang: str, source_lang: str):
        # Check Redis cache first
        cache_key = f"translation:{source_lang}:{target_lang}:{hash(text)}"
        cached = await self.redis.get(cache_key)
        if cached:
            return cached.decode('utf-8')
        
        # Call LibreTranslate API
        translated = await self._call_libretranslate(text, source_lang, target_lang)
        
        # Cache the result
        await self.redis.setex(cache_key, ttl, translated)
        return translated
```

Cette stratégie de cache :

* Réduit les coûts API
    
* Améliore les temps de réponse
    
* Gère les traductions répétées (par exemple, phrases communes)
    

![](/images/behind-the-scenes-the-admin-section-of-cyber-code-academy/03-fb803d64-928f-47a8-b5ba-c2dc9fd74050.png)

*L'éditeur de traduction affiche une comparaison côte à côte du contenu original et traduit*

### Dégradation Progressive

Le système de traduction est conçu pour se dégrader progressivement :

* Si LibreTranslate n'est pas disponible, les administrateurs peuvent toujours traduire manuellement
    
* Les traductions en cache restent disponibles même si l'API est down
    
* Le système enregistre des avertissements mais ne bloque pas la création de défis
    

---

## Générateur de Défis IA : Du Concept au Défi Complet

Créer des défis de codage de haute qualité est un art. Cela nécessite :

* Des énoncés de problèmes clairs
    
* Des niveaux de difficulté appropriés
    
* Des cas de test complets
    
* Des récits engageants (dans notre cas, sur le thème cyberpunk)
    
* Des solutions validées
    

Pour mettre à l'échelle la création de défis, nous avons construit un **Générateur de Défis IA** qui peut créer des défis complets à partir de spécifications simples.

### Comment Ça Marche

Le générateur prend en entrée minimale :

* **Catégorie** : par exemple, "boucles", "fonctions", "listes"
    
* **Difficulté** : "initiate", "hacker", "elite", ou "legend"
    
* **Concept** : Le concept éducatif à enseigner
    
* **Contexte** : Un thème narratif cyberpunk
    
* **Contraintes** : Exigences spéciales optionnelles
    

À partir de cela, il génère :

* Une description complète du défi avec récit
    
* Du code de départ pour les étudiants
    
* Du code de solution avec commentaires
    
* Une suite de tests complète (tests visibles et cachés)
    
* Des indices pour les étudiants en difficulté
    

### Le Processus de Génération

1. **Ingénierie des Prompts** : Le système utilise des prompts soigneusement élaborés qui instruisent l'IA de :
    
    * Suivre le thème cyberpunk
        
    * Créer une difficulté progressive
        
    * Inclure des tests complets
        
    * Retourner du JSON valide correspondant à notre schéma
        
2. **Validation du Schéma** : Le JSON généré est validé contre un JSON Schema pour garantir :
    
    * Que tous les champs requis sont présents
        
    * Que les types de données sont corrects
        
    * Que la structure correspond à notre modèle de défi
        
3. **Test de la Solution** : Le code de solution généré est automatiquement exécuté contre les tests générés pour vérifier :
    
    * Que tous les tests passent
        
    * Que la solution est correcte
        
    * Qu'il n'y a pas d'erreurs de syntaxe
        
4. **Boucle de Raffinement** : Si les tests échouent, le système :
    
    * Envoie l'erreur à l'IA
        
    * Demande des corrections
        
    * Revalide jusqu'à ce que les tests passent (jusqu'à 3 tentatives)
        

```python
async def generate_challenge(self, category, difficulty, concept, context):
    for attempt in range(max_retries):
        # Call AI with model fallback
        response = await self._call_llm(messages, model=current_model)
        challenge_json = self._extract_json(response)
        
        # Validate schema
        self._validate_schema(challenge_json)
        
        # Test solution
        test_result = await self._test_solution(challenge_json)
        if not test_result["passed"]:
            # Request correction
            messages.append({"role": "user", "content": refinement_prompt})
            continue
        
        return challenge_json
```

![](/images/behind-the-scenes-the-admin-section-of-cyber-code-academy/04-e17f3549-d532-4602-916c-6886367f7f56.png)

*Les administrateurs peuvent générer des défis complets avec quelques entrées*

### Fallback de Modèle pour la Fiabilité

Le générateur utilise le même système de fallback multi-fournisseurs que la validation sémantique :

* Essaie Groq en premier (rapide et rentable)
    
* Bascule vers Gemini si limité en taux
    
* Utilise OpenAI en dernier recours pour une qualité maximale
    

Cela garantit que la génération de défis reste disponible même pendant les pannes de fournisseurs.

---

## Suivi de l'Utilisation de l'IA : Comprendre les Coûts et les Performances

Lorsqu'on utilise plusieurs fournisseurs d'IA avec différents modèles de tarification, comprendre l'utilisation et les coûts devient critique. Nous avons construit un suivi complet qui enregistre chaque appel API IA.

### Ce Que Nous Suivons

Pour chaque appel IA, nous enregistrons :

* **Fournisseur & Modèle** : Quel service et modèle a été utilisé
    
* **Type d'Appel** : Génération, affinement ou validation
    
* **Statut** : Succès, erreur ou limite de taux
    
* **Performance** : Temps de réponse en millisecondes
    
* **Utilisation des Tokens** : Tokens d'entrée, tokens de sortie, total des tokens
    
* **Estimation des Coûts** : Coût estimé basé sur la tarification du fournisseur
    
* **Info Limite de Taux** : En-têtes retry-after et statut de limite de taux
    
* **Métadonnées** : En-têtes de réponse complets, détails d'erreur et contexte
    

Ces données sont stockées dans la table `ai_call_logs` :

```python
class AICallLog(Base):
    provider = Column(String(50), nullable=False, index=True)
    model = Column(String(100), nullable=False, index=True)
    call_type = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False, index=True)
    response_time_ms = Column(Integer, nullable=True)
    input_tokens = Column(Integer, nullable=True)
    output_tokens = Column(Integer, nullable=True)
    total_tokens = Column(Integer, nullable=True)
    cost_estimate = Column(Numeric(10, 6), nullable=True)
    # ... more fields
```

### Tableau de Bord d'Utilisation

Le tableau de bord admin fournit des analyses complètes :

* **Utilisation Totale** : Appels, tokens et coûts dans le temps
    
* **Répartition par Fournisseur** : Quels fournisseurs sont les plus utilisés
    
* **Performance des Modèles** : Taux de succès et temps de réponse par modèle
    
* **Analyse des Coûts** : Tendances de dépenses et projections
    
* **Suivi des Erreurs** : Limites de taux, échecs et motifs de retry
    

![](/images/behind-the-scenes-the-admin-section-of-cyber-code-academy/05-10dc07bb-a5a7-4fde-88e8-5952dc5869c7.png)

*Le tableau de bord d'utilisation de l'IA affiche des statistiques complètes sur les appels API, les coûts et les performances*

### Suivi Automatique

Chaque appel IA est automatiquement suivi sans nécessiter d'instrumentation manuelle :

```python
async def _call_llm_with_tracking(self, provider, model, prompts, db):
    # Create call log entry
    call_log = AICallLog(
        provider=provider_name,
        model=model_name,
        status=CallStatus.PENDING.value
    )
    db.add(call_log)
    await db.flush()
    
    try:
        # Make API call
        response = await provider.generate_text(...)
        
        # Update with success data
        call_log.status = CallStatus.SUCCESS.value
        call_log.input_tokens = response.usage.input_tokens
        call_log.output_tokens = response.usage.output_tokens
        call_log.cost_estimate = calculate_cost(...)
    except Exception as e:
        # Update with error data
        call_log.status = CallStatus.ERROR.value
        call_log.error_message = str(e)
    
    return response
```

Ce suivi automatique garantit que nous ne manquons jamais un appel et pouvons analyser avec précision les coûts et les performances.

---

## Surveillance de l'Exécuteur : Garantir une Exécution Fiable du Code

L'exécution du code est le cœur d'une plateforme de codage. Les étudiants soumettent du code, et le système doit l'exécuter de manière sécurisée et fiable. Nous utilisons des conteneurs Docker pour l'isolement, et une surveillance complète pour garantir que tout fonctionne correctement.

### Exécution Sécurisée Basée sur Docker

Chaque soumission de code s'exécute dans un conteneur Docker isolé avec :

* **Limites de Ressources** : Contraintes CPU et mémoire
    
* **Isolement Réseau** : Pas d'accès réseau externe
    
* **Application des Timeouts** : Terminaison automatique du code à exécution longue
    
* **Environnement Propre** : Conteneur frais pour chaque exécution
    

Le service exécuteur gère un pool de conteneurs pour gérer efficacement les soumissions concurrentes.

### Surveillance de la Santé

La section admin fournit une surveillance en temps réel de l'infrastructure d'exécution :

* **Connexion Docker** : Le daemon Docker est-il accessible ?
    
* **Statut de l'Image** : L'image exécuteur est-elle présente et à jour ?
    
* **Métriques du Pool** : Taille actuelle du pool, exécutions actives, emplacements disponibles
    
* **Utilisation** : Pourcentage de la capacité du pool en cours d'utilisation
    

![](/images/behind-the-scenes-the-admin-section-of-cyber-code-academy/06-f2d39127-ae43-49ed-9df0-31a72e5fbd06.png)

*Surveillance en temps réel de la santé et du statut du pool d'exécuteurs*

### Statistiques d'Exécution

Au-delà des vérifications de santé, le système suit :

* **Exécutions Totales** : Nombre d'exécutions de code dans le temps
    
* **Taux de Succès** : Pourcentage d'exécutions réussies
    
* **Temps d'Exécution Moyen** : Métriques de performance
    
* **Statistiques par Utilisateur** : Motifs d'exécution par utilisateur
    
* **Statistiques par Défi** : Quels défis ont le plus de soumissions
    

### Débogage des Tests Échoués

Lorsque les tests générés par l'IA échouent ou que les étudiants signalent des problèmes, les administrateurs ont besoin de déboguer. Le système de surveillance de l'exécuteur fournit :

* **Historique d'Exécution** : Voir toutes les exécutions avec filtres (utilisateur, défi, plage de dates)
    
* **Journaux d'Exécution Échoués** : stdout/stderr complet pour les exécutions échouées
    
* **Résultats des Tests** : Sortie détaillée des tests montrant quels tests ont passé/échoué
    

Cela est particulièrement précieux pour les défis générés par l'IA. Même après une révision manuelle, certains cas limites pourraient être manqués. Les journaux d'exécution aident à identifier :

* Les cas de test trop stricts
    
* Les cas limites non couverts par les tests
    
* Les problèmes de performance avec l'exécution des tests
    
* Les erreurs de syntaxe dans le code de test généré
    

![](/images/behind-the-scenes-the-admin-section-of-cyber-code-academy/07-0afab2a8-3170-4ef2-9c1f-aa7c0b460ffa.png)

*Les administrateurs peuvent visualiser les journaux détaillés des exécutions échouées pour déboguer les problèmes de tests*

### Exemple : Débogage d'un Test Généré par l'IA

Imaginez qu'un défi généré par l'IA a un test qui échoue de manière inattendue :

1. L'administrateur visualise le défi dans le panneau admin
    
2. Vérifie l'historique d'exécution pour ce défi
    
3. Trouve une exécution échouée
    
4. Visualise les journaux d'exécution
    
5. Voit l'erreur de test : `AssertionError: Expected [1, 2, 3] but got [1, 2, 3]`
    
6. Réalise que le test compare des listes avec `==` ce qui fonctionne, mais le message d'erreur suggère un problème différent
    
7. Réviser le code de test et corriger l'assertion
    
8. Retester le défi
    

Ce flux de travail facilite l'identification et la correction des problèmes dans le contenu généré par l'IA, garantissant la qualité même lorsque les défis sont créés automatiquement.

---

## Conclusion

La section admin de Cyber Code Academy démontre comment des outils réfléchis peuvent simplifier la gestion complexe de la plateforme. En exploitant :

* **Le stockage JSONB** pour des structures de données flexibles et interrogeables
    
* **La validation sémantique** (AST + LLM) pour garantir la qualité éducative
    
* **Le fallback IA multi-fournisseurs** pour la fiabilité
    
* **L'auto-traduction** pour mettre à l'échelle le contenu globalement
    
* **La génération IA** pour créer des défis à l'échelle
    
* **La journalisation complète** pour comprendre les coûts et les performances
    
* **La surveillance de l'exécuteur** pour garantir une exécution fiable du code
    

Nous avons créé une plateforme qui peut passer de quelques défis à des milliers, d'une langue à plusieurs, et de la création manuelle à la génération assistée par l'IA—tout en maintenant la qualité et la fiabilité.

Les outils admin ne rendent pas seulement la vie plus facile aux administrateurs ; ils permettent à la plateforme de croître et d'évoluer. À mesure que nous ajoutons plus de défis, supportons plus de langues et exploitons davantage l'IA, ces outils garantissent que nous pouvons gérer la complexité sans sacrifier la qualité.
