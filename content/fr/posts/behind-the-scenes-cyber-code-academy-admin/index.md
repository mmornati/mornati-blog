---
title: 'Dans les coulisses : La section Admin de Cyber Code Academy'
tags:
- ai
- code
- python
- developer
- learning
date: '2025-12-31T17:51:16.624000+00:00'
categories: [Development, AI, Education]
slug: behind-the-scenes-the-admin-section-of-cyber-code-academy
description: Explorez les puissants outils d'admin de Cyber Code Academy pour la création de défis, la surveillance, la validation sémantique et la gestion de plateforme pilotée par l'IA
---

## Introduction

Cyber Code Academy est une plateforme moderne et gamifiée pour maîtriser Python à travers des défis interactifs, des competitions en temps réel et une génération de problèmes alimentée par l'IA. Pendant que les étudiants se concentrent sur la résolution de défis de code, les administrateurs ont besoin d'outils robustes pour créer, gérer et surveiller le contenu et l'infrastructure de la plateforme.

Dans cet article, nous plongerons en profondeur dans la section admin, une suite complète d'outils qui simplifie tout, de la création de défis à la surveillance de l'infrastructure. Nous explorerons comment nous exploitons le stockage JSON, la validation sémantique, la génération pilotée par l'IA, les services de traduction et l'exécution basée sur Docker pour créer une plateforme évolutive et maintenable.

![](/images/behind-the-scenes-the-admin-section-of-cyber-code-academy/00-55251afa-b32c-4157-afe8-1088f4139e75.png)

*Le dashboard admin fournit une vue centralisée de toutes les opérations de la plateforme*

---

## Gestion des défis : Stockage flexible et validation sémantique

### Stockage des tests basé sur JSON

L'une des décisions de conception clés dans Cyber Code Academy était de stocker les tests de défis sous forme de JSON dans les colonnes JSONB de PostgreSQL. Cette approche offre plusieurs avantages :

* **Flexibilité** : Les tests peuvent avoir différentes structures (basés sur des assertions, sur la sortie, ou validation personnalisée)
    
* **Interrogeabilité** : Les opérateurs JSONB de PostgreSQL nous permettent de requêter et filtrer les défis par propriétés de test
    
* **Versioning** : Facile de suivre les changements des suites de tests au fil du temps
    
* **Pas de migrations de schéma** : Ajouter de nouveaux types de tests ne nécessite pas de migrations de base de données
    

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

*L'éditeur de défi montre une UI sur la structure JSON des tests, facilitant la compréhension et la modification des cas de test*

### Validation sémantique : Au-delà des résultats de tests

Pendant que les tests unitaires vérifient que le code produit des sorties correctes, ils ne garantissent pas que les étudiants apprennent les concepts visés. Un étudiant pourrait résoudre un défi en utilisant une solution de contournement ou une approche non prévue qui passe tous les tests mais rate l'objectif éducatif.

C'est ici qu'intervient la **validation sémantique**. Nous avons implémenté un système de validation à deux niveaux :

#### Validation basée sur l'AST (Rapide et déterministe)

Pour les défis qui nécessitent des patterns ou structures de code spécifiques, nous utilisons le module **Abstract Syntax Tree (AST)** de Python pour effectuer une validation rapide et déterministe. Le validateur AST peut vérifier :

* Définitions de fonctions requises
    
* Imports ou fonctions interdits
    
* Structures de contrôle requises (boucles, conditionnels)
    
* Contraintes de complexité de code
    
* Exigences d'algorithmes spécifiques
    

Le validateur AST analyse le code en AST et utilise un pattern visitor pour vérifier les contraintes :

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
    
* **Précise** : Peut détecter des patterns de code spécifiques avec une haute précision
    

![](/images/behind-the-scenes-the-admin-section-of-cyber-code-academy/02-2d1ca894-fd25-42de-8e63-26407cbfadf6.png)

*Les admins peuvent configurer les contraintes de validation sémantique pour chaque défi*

Pour les admins, il y a un prompt prédéfini aidant à écrire un validateur JSON AST approprié !

#### Validation basée sur LLM (Flexible et contextuelle)

Pour les défis où l'objectif d'apprentissage est plus nuancé, nous utilisons les Large Language Models (LLMs) pour valider que le code suit les instructions du défi. Le validateur LLM :

* Comprend l'objectif éducatif du défi
    
* Vérifie si l'approche du code correspond au parcours d'apprentissage prévu
    
* Fournit des retours sur le style de code et les meilleures pratiques
    
* Détecte les contournements qui passent les tests mais ratent l'essentiel
    

Le validateur LLM envoie l'objectif du défi, le code de solution et le code utilisateur à un modèle IA pour analyse :

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

#### Chaîne de repli LLM : Fiabilité par la redondance

Pour assurer une haute disponibilité et gérer les limites de taux, nous avons implémenté une chaîne de repli à travers trois fournisseurs LLM :

1. **Groq** (Primaire) : Inférence rapide avec des modèles comme `llama-3.3-70b-versatile`
    
2. **Google Gemini** (Repli) : `gemini-2.5-flash` pour des performances fiables
    
3. **OpenAI** (Dernier recours) : `gpt-4-turbo-preview` pour une qualité maximale
    

Le système bascule automatiquement les fournisseurs quand :

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

Cette approche multi-fournisseurs assure que la validation sémantique reste disponible même quand les fournisseurs individuels ont des problèmes, fournissant un système de validation robuste et fiable.

---

## Système de traduction : Rendre les défis accessibles globalement

Créer du contenu éducatif de qualité prend du temps. Traduire ce contenu en plusieurs langues peut être prohibitivement coûteux et lent. Pour résoudre cela, nous avons intégré **LibreTranslate** — un service de traduction open-source — pour traduire automatiquement les défis.

### Support multi-langue avec JSONB

Similaire à notre approche de stockage de tests, nous utilisons des colonnes JSONB pour stocker les traductions :

```python
title_i18n = Column(JSONB, nullable=True)  # {"en": "...", "fr": "..."}
description_i18n = Column(JSONB, nullable=True)  # Nested structure
hints_i18n = Column(JSONB, nullable=True)  # Array of translated hints
```

Cette structure nous permet de :

* Stocker plusieurs langues dans une seule ligne
    
* Requêter par langue efficacement
    
* Ajouter de nouvelles langues sans changements de schéma
    
* Maintenir l'historique des traductions
    

### Flux de travail de auto-traduction

Le système de traduction fournit un flux transparent pour les admins :

1. **Créer le défi en anglais** : Écrivez le défi avec tout le contenu en anglais
    
2. **Auto-traduire** : Cliquez sur un bouton pour traduire vers la langue cible (ex: français)
    
3. **Réviser et modifier** : Révisez le contenu auto-traduit et faites des ajustements manuels
    
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
    
* Gère les traductions répétées (ex: phrases communes)
    

![](/images/behind-the-scenes-the-admin-section-of-cyber-code-academy/03-fb803d64-928f-47a8-b5ba-c2dc9fd74050.png)

*L'éditeur de traduction montre une comparaison côte à côte du contenu original et traduit*

### Dégradation gracieuse

Le système de traduction est conçu pour se dégrader gracieusement :

* Si LibreTranslate est indisponible, les admins peuvent toujours traduire manuellement
    
* Les traductions en cache restent disponibles même si l'API est down
    
* Le système journalise les avertissements mais ne bloque pas la création de défis
    

---

## Générateur de défis IA : Du concept au défi complet

Créer des défis de code de haute qualité est un art. Cela nécessite :

* Des énoncés de problèmes clairs
    
* Des niveaux de difficulté appropriés
    
* Des cas de test complets
    
* Des récits engageants (dans notre cas, thème cyberpunk)
    
* Des solutions validées
    

Pour scaler la création de défis, nous avons construit un **Générateur de défis IA** qui peut créer des défis complets à partir de spécifications simples.

### Comment ça fonctionne

Le générateur prend une entrée minimale :

* **Catégorie** : ex: "boucles", "fonctions", "listes"
    
* **Difficulté** : "initiate", "hacker", "elite", ou "legend"
    
* **Concept** : Le concept éducatif à enseigner
    
* **Contexte** : Un thème de récit cyberpunk
    
* **Contraintes** : Exigences spéciales optionnelles
    

De cela, il génère :

* Une description complète du défi avec le récit
    
* Du code de départ pour les étudiants
    
* Du code solution avec commentaires
    
* Une suite de tests complète (tests visibles et cachés)
    
* Des indices pour les étudiants en difficulté
    

### Le processus de génération

1. **Ingénierie de prompt** : Le système utilise des prompts soigneusement conçus qui instruisent l'IA de :
    
    * Suivre le thème cyberpunk
        
    * Créer une difficulté progressive
        
    * Inclure des tests complets
        
    * Retourner du JSON valide correspondant à notre schéma
        
2. **Validation de schéma** : Le JSON généré est validé contre un JSON Schema pour assurer :
    
    * Tous les champs requis sont présents
        
    * Les types de données sont corrects
        
    * La structure correspond à notre modèle de défi
        
3. **Test de solution** : Le code solution généré est automatiquement exécuté contre les tests générés pour vérifier :
    
    * Tous les tests passent
        
    * La solution est correcte
        
    * Aucune erreur de syntaxe n'existe
        
4. **Boucle de raffinement** : Si les tests échouent, le système :
    
    * Envoie l'erreur retour à l'IA
        
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

*Les admins peuvent générer des défis complets avec juste quelques entrées*

### Repli de modèle pour fiabilité

Le générateur utilise le même système de repli multi-fournisseurs que la validation sémantique :

* Essaie Groq en premier (rapide et rentable)
    
* Tombe sur Gemini si limité en taux
    
* Utilise OpenAI comme dernier recours pour une qualité maximale
    

Cela assure que la génération de défis reste disponible même pendant les pannes de fournisseurs.

---

## Suivi de l'utilisation de l'IA : Comprendre les coûts et les performances

Quand on utilise plusieurs fournisseurs d'IA avec différents modèles de tarification, comprendre l'utilisation et les coûts devient critique. Nous avons construit un suivi complet qui journalise chaque appel API IA.

### Ce que nous suivons

Pour chaque appel IA, nous journalisons :

* **Fournisseur et modèle** : Quel service et modèle a été utilisé
    
* **Type d'appel** : Génération, raffinement, ou validation
    
* **Statut** : Succès, erreur, ou limite de taux
    
* **Performance** : Temps de réponse en millisecondes
    
* **Utilisation de tokens** : Tokens d'entrée, tokens de sortie, total de tokens
    
* **Estimation de coût** : Coût estimé basé sur la tarification du fournisseur
    
* **Info limite de taux** : En-têtes retry-after et statut de limite de taux
    
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

### Dashboard d'utilisation

Le dashboard admin fournit des analyses complètes :

* **Utilisation totale** : Appels, tokens et coûts dans le temps
    
* **Répartition par fournisseur** : Quels fournisseurs sont les plus utilisés
    
* **Performance par modèle** : Taux de succès et temps de réponse par modèle
    
* **Analyse des coûts** : Tendances de dépenses et projections
    
* **Suivi des erreurs** : Limites de taux, échecs et patterns de retry
    

![](/images/behind-the-scenes-the-admin-section-of-cyber-code-academy/05-10dc07bb-a5a7-4fde-88e8-5952dc5869c7.png)

*Le dashboard d'utilisation IA montre des statistiques complètes sur les appels API, les coûts et les performances*

### Suivi automatique

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

Ce suivi automatique assure que nous ne manquons jamais un appel et pouvons analyser précisément les coûts et performances.

---

## Surveillance de l'exécuteur : Assurer une exécution de code fiable

L'exécution de code est le cœur d'une plateforme de code. Les étudiants soumettent du code, et le système doit l'exécuter de manière sécurisée et fiable. Nous utilisons des conteneurs Docker pour l'isolation, et une surveillance complète pour assurer que tout fonctionne correctement.

### Exécution sécurisée basée sur Docker

Chaque soumission de code s'exécute dans un conteneur Docker isolé avec :

* **Limites de ressources** : Contraintes CPU et mémoire
    
* **Isolation réseau** : Pas d'accès réseau externe
    
* **Application des timeouts** : Terminaison automatique du code qui s'exécute longtemps
    
* **Environnement propre** : Conteneur frais pour chaque exécution
    

Le service exécuteur gère un pool de conteneurs pour gérer efficacement les soumissions concurrentes.

### Surveillance de santé

La section admin fournit une surveillance en temps réel de l'infrastructure d'exécution :

* **Connexion Docker** : Le daemon Docker est-il accessible ?
    
* **Statut de l'image** : L'image exécuteur est-elle présente et à jour ?
    
* **Métriques du pool** : Taille actuelle du pool, exécutions actives, slots disponibles
    
* **Utilisation** : Pourcentage de capacité du pool en cours d'utilisation
    

![](/images/behind-the-scenes-the-admin-section-of-cyber-code-academy/06-f2d39127-ae43-49ed-9df0-31a72e5fbd06.png)

*Surveillance en temps réel de la santé et du statut du pool d'exécuteurs*

### Statistiques d'exécution

Au-delà des checks de santé, le système suit :

* **Exécutions totales** : Nombre de runs de code dans le temps
    
* **Taux de succès** : Pourcentage d'exécutions réussies
    
* **Temps d'exécution moyen** : Métriques de performance
    
* **Statistiques par utilisateur** : Patterns d'exécution par utilisateur
    
* **Statistiques par défi** : Quels défis ont le plus de soumissions
    

### Débogage des tests échoués

Quand les tests générés par l'IA échouent ou les étudiants rapportent des problèmes, les admins ont besoin de déboguer. Le système de surveillance de l'exécuteur fournit :

* **Historique d'exécution** : Voir toutes les exécutions avec filtres (utilisateur, défi, plage de dates)
    
* **Logs d'exécution échouée** : stdout/stderr complet pour les runs échoués
    
* **Résultats de tests** : Sortie de test détaillée montrant quels tests ont passé/échoué
    

Ceci est particulièrement précieux pour les défis générés par l'IA. Même après révision manuelle, certains cas limites pourraient être manqués. Les logs d'exécution aident à identifier :

* Des cas de test trop stricts
    
* Des cas limites non couverts par les tests
    
* Des problèmes de performance avec l'exécution des tests
    
* Des erreurs de syntaxe dans le code de test généré
    

![](/images/behind-the-scenes-the-admin-section-of-cyber-code-academy/07-0afab2a8-3170-4ef2-9c1f-aa7c0b460ffa.png)

*Les admins peuvent voir les logs détaillés des exécutions échouées pour déboguer les problèmes de test*

### Exemple : Débogage d'un test généré par l'IA

Imaginez qu'un défi généré par l'IA a un test qui échoue de manière inattendue :

1. L'admin voit le défi dans le panneau admin
    
2. Vérifie l'historique d'exécution pour ce défi
    
3. Trouve une exécution échouée
    
4. Voit les logs d'exécution
    
5. Voit l'erreur de test : `AssertionError: Expected [1, 2, 3] but got [1, 2, 3]`
    
6. Réalise que le test compare des listes avec `==` ce qui fonctionne, mais le message d'erreur suggère un problème différent
    
7. Révisé le code de test et corrige l'assertion
    
8. Re-teste le défi
    

Ce flux de travail rend facile l'identification et la correction des problèmes dans le contenu généré par l'IA, assurant la qualité même quand les défis sont créés automatiquement.

---

## Conclusion

La section admin de Cyber Code Academy démontre comment des outils réfléchis peuvent simplifier la gestion de plateforme complexe. En exploitant :

* **Stockage JSONB** pour des structures de données flexibles et interrogeables
    
* **Validation sémantique** (AST + LLM) pour assurer la qualité éducative
    
* **Repli IA multi-fournisseurs** pour la fiabilité
    
* **Auto-traduction** pour scaler le contenu globalement
    
* **Génération IA** pour créer des défis à l'échelle
    
* **Journalisation complète** pour comprendre les coûts et performances
    
* **Surveillance de l'exécuteur** pour assurer une exécution de code fiable
    

Nous avons créé une plateforme qui peut passer de quelques défis à des milliers, d'une langue à plusieurs, et de création manuelle à génération assistée par l'IA — tout en maintenant la qualité et la fiabilité.

Les outils admin ne rendent pas seulement la vie plus facile aux administrateurs ; ils permettent à la plateforme de croître et d'évoluer. Au fur et à mesure que nous ajoutons plus de défis, supportons plus de langues et exploitons davantage l'IA, ces outils assurent que nous pouvons gérer la complexité sans sacrifier la qualité.
