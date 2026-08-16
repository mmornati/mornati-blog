---
title: 'Sécuriser l'exécution de code Python : Comment nous avons protégé notre serveur contre le code non fiable'
tags:
- docker
- python
- sécurité
- pentesting
date: '2026-01-01T09:00:08.213000+00:00'
categories: [Sécurité, Développement, DevOps]
slug: securing-python-code-execution-how-we-protected-our-server-from-untrusted-code
description: Apprenez à sécuriser l'exécution de code Python avec des conteneurs Docker, des espaces de noms restreints et des stratégies de défense multicouches
---




L'exécution de code soumis par les utilisateurs sur votre serveur est l'une des choses les plus dangereuses que vous puissiez faire en tant que développeur. Une seule ligne de Python malveillant pourrait supprimer votre base de données, voler des identifiants ou transformer votre serveur en mineur de cryptomonnaie. Pourtant, pour des plateformes comme Cyber Code Academy, une plateforme d'apprentissage interactif de Python, l'exécution de code n'est pas facultative. C'est la fonctionnalité principale.

Dans cet article, je vais vous expliquer comment nous avons construit un système d'exécution de code sécurisé et prêt pour la production utilisant des conteneurs Docker, des espaces de noms Python restreints et plusieurs couches de défense. Nous explorerons les vecteurs d'attaque que nous protégeons, les mesures de sécurité que nous avons mises en place et comment chaque exécution traverse notre système.

## Les risques : Qu'est-ce qui pourrait mal tourner ?

Avant de nous plonger dans notre solution, comprenons les menaces. Lorsque les utilisateurs peuvent soumettre du code Python arbitraire, les attaquants peuvent tenter :

### 1\. **Échappatoire d'espace de noms**

Le dictionnaire `__builtins__` de Python contient des fonctions puissantes comme `exec()`, `eval()`, `compile()` et `__import__()`. Si les attaquants peuvent y accéder, ils peuvent exécuter du code arbitraire ou importer des modules dangereux.

```python
# Tentative d'attaque : Accéder à exec via getattr
dangerous = getattr(__builtins__, 'exec', None)
if dangerous:
    dangerous("import os; os.system('rm -rf /')")
```

### 2\. **Accès au système de fichiers**

Même sans les builtins dangereux, les attaquants pourraient essayer de lire des fichiers sensibles :

* `/etc/passwd` — comptes utilisateurs
    
* `/proc/self/environ` — variables d'environnement (contenant potentiellement des URLs de base de données, des clés API)
    
* `/var/run/docker.sock` — socket Docker (permettrait l'échappée du conteneur)
    

### 3\. **Accès réseau**

Du code malveillant pourrait exfiltrer des données ou télécharger des logiciels malveillants :

* Faire des requêtes HTTP vers des serveurs contrôlés par des attaquants
    
* Ouvrir des connexions socket
    
* Accéder aux ressources réseau internes
    

### 4\. **Épuisement des ressources (DoS)**

Les attaquants pourraient consommer toutes les ressources du serveur :

* Des boucles infinies consommant le CPU
    
* De grandes allocations de mémoire
    
* Épuisement des descripteurs de fichiers
    

### 5\. **Échappée du conteneur**

Si l'exécution se fait dans Docker, les attaquants pourraient essayer de :

* Accéder à la socket Docker pour contrôler l'hôte
    
* Monter le système de fichiers de l'hôte
    
* Sortir de l'isolation du conteneur
    

### 6\. **Injection de code**

Divers mécanismes Python pourraient être exploités pour exécuter du code arbitraire :

* Les fonctions `eval()`, `exec()`, `compile()`
    
* `__import__()` pour charger des modules dangereux
    
* Attaques basées sur les métaclasses
    

Pour valider notre sécurité, nous avons créé une suite de tests complète avec **24 tests de sécurité** couvrant tous ces vecteurs d'attaque. Chaque test doit échouer — si l'un d'eux réussit, nous avons une vulnérabilité.

## Notre solution : Défense en profondeur

Nous avons implémenté plusieurs couches de sécurité, chacune protégeant contre différents vecteurs d'attaque. Si une couche échoue, les autres fournissent une protection de secours.

### Aperçu de l'architecture

```plaintext
┌─────────────────────────────────────┐
│     Point de terminaison FastAPI     │
│  POST /api/v1/execute               │
│  (Authentification, Validation)     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     Service ExecutorPool            │
│  - Sémaphore (limite de concurrence)│
│  - Gestion du cycle de vie des     │
│    conteneurs                       │
│  - Application des limites de       │
│    ressources                       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     Conteneur Docker                │
│  - Réseau : none (isolé)           │
│  - Capacités : TOUTES retirées      │
│  - Système de fichiers : lecture    │
│    seule                           │
│  - Mémoire : 512Mo max              │
│  - CPU : 1 cœur max                │
│  - Délai d'expiration : 10-30 sec   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  executor_entrypoint.py             │
│  - Espace de noms restreint         │
│  - Délai d'expiration par signal    │
│  - Exécution des tests              │
└─────────────────────────────────────┘
```

## Couche 1 : Isolation du conteneur Docker

La première ligne de défense est l'isolation du conteneur Docker. Chaque exécution de code s'exécute dans un conteneur complètement isolé.

### L'image de l'exécuteur

Notre image d'exécuteur (`infra/docker/executor.Dockerfile`) est conçue spécifiquement pour la sécurité :

```dockerfile
FROM python:3.13-slim

# Image de base minimale - uniquement les bibliothèques essentielles
RUN apt-get update && apt-get install -y --no-install-recommends \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Créer un utilisateur non-root
RUN useradd -m -s /sbin/nologin executor

WORKDIR /executor

# Copier le script d'entrée de l'exécuteur
COPY --chown=executor:executor executor_entrypoint.py /executor/

# Passer à l'utilisateur non-root
USER executor

ENTRYPOINT ["python", "/executor/executor_entrypoint.py"]
```

Fonctionnalités de sécurité clés :

* **Image de base minimale** : `python:3.13-slim` ne contient que les paquets essentiels
    
* **Utilisateur non-root** : Le code s'exécute en tant qu'utilisateur `executor`, pas root
    
* **Aucun paquet inutile** : Réduit la surface d'attaque
    

### Drapeaux de sécurité du conteneur

Lorsque nous exécutons le conteneur, nous appliquons des contraintes de sécurité strictes :

```python
cmd = [
    "docker", "run",
    "--rm",  # Auto-suppression après exécution
    "--memory=512m",  # Limite de mémoire
    "--memory-swap=512m",  # Pas de swap (empêche les attaques via swap)
    "--cpus=1.0",  # Limite CPU
    "--network=none",  # Pas d'accès réseau
    "--read-only",  # Système de fichiers root en lecture seule
    "--cap-drop=ALL",  # Retirer toutes les capacités Linux
    "--tmpfs=/tmp:size=10m,mode=1777",  # Seul /tmp inscriptible (limite 10Mo)
    "-i",  # stdin interactif pour l'entrée
    "cyber-code-executor"
]
```

Expliquons ce que chaque drapeau empêche :

| Drapeau | Protection contre |
| --- | --- |
| `--network=none` | Accès réseau, exfiltration de données, téléchargement de malware |
| `--cap-drop=ALL` | Élévation de privilèges, appels système nécessitant des capacités |
| `--read-only` | Écriture dans le système de fichiers, modification de fichiers système |
| `--tmpfs /tmp` | Limite l'espace inscriptible à 10Mo (empêche l'épuisement du disque) |
| `--memory=512m` | Attaques DoS par épuisement de mémoire |
| `--cpus=1.0` | Épuisement CPU via boucles infinies |
| `--rm` | Assure le nettoyage du conteneur (aucun état persistant) |

Même si du code malveillant arrive à contourner les restrictions de Python, l'isolation Docker l'empêche d'accéder au système hôte, au réseau ou à d'autres conteneurs.

## Couche 2 : Espace de noms Python restreint

La deuxième couche restreint les fonctions et modules Python disponibles pour le code utilisateur. Nous créons un dictionnaire `__builtins__` personnalisé ne contenant que des fonctions sûres.

### Créer l'espace de noms restreint

Dans `executor_entrypoint.py`, nous construisons un espace d'exécution restreint :

```python
import builtins

exec_namespace = {
    "__builtins__": {
        # Fonctions builtin sûres
        "print": print,
        "len": len,
        "range": range,
        "str": str,
        "int": int,
        "float": float,
        "list": list,
        "dict": dict,
        "set": set,
        "tuple": tuple,
        "zip": zip,
        "enumerate": enumerate,
        "sorted": sorted,
        "sum": sum,
        "min": min,
        "max": max,
        "abs": abs,
        "all": all,
        "any": any,
        "map": map,
        "filter": filter,
        "bool": bool,
        "isinstance": isinstance,
        "type": type,
        "callable": callable,
        "hasattr": hasattr,
        "getattr": getattr,
        "id": id,
        
        # Types d'exceptions limités
        "Exception": Exception,
        "ValueError": ValueError,
        "TypeError": TypeError,
        "IndexError": IndexError,
        "KeyError": KeyError,
        
        # Requis pour la création de classes
        "__build_class__": builtins.__build_class__,
        "super": super,
    },
    "__name__": "__main__",
    "__doc__": None,
}

# Exécuter le code utilisateur dans l'espace de noms restreint
exec(code, exec_namespace)
```

### Qu'est-ce qui est bloqué ?

Notez ce qui n'est **pas** dans l'espace de noms :

* ❌ `eval()`, `exec()`, `compile()` — Exécution de code
    
* ❌ `__import__()` — Importation de modules
    
* ❌ `open()`, `file()` — Opérations sur les fichiers
    
* ❌ `input()` — Entrée utilisateur
    
* ❌ `os`, `subprocess`, `sys` — Accès système (pas dans l'espace de noms)
    
* ❌ `socket`, `urllib`, `requests` — Accès réseau (pas dans l'espace de noms)
    

### Pourquoi `getattr` est sûr

Vous pourriez remarquer que `getattr` est autorisé. Les attaquants ne pourraient-ils pas l'utiliser pour accéder à des fonctions dangereuses ?

```python
# Cette tentative d'attaque échoue :
dangerous = getattr(__builtins__, 'exec', None)
```

Elle échoue parce que `__builtins__` dans notre espace de noms est un **dictionnaire**, pas le vrai module `builtins`. Le dictionnaire ne contient que les fonctions que nous avons explicitement ajoutées. Il n'y a pas de clé `exec` dans ce dictionnaire, donc `getattr` retourne `None`.

### Application du délai d'expiration

Nous utilisons l'application du délai d'expiration basée sur les signaux comme filet de sécurité :

```python
class TimeoutException(Exception):
    pass

def timeout_handler(signum, frame):
    raise TimeoutException("L'exécution du code a dépassé la limite de délai")

signal.signal(signal.SIGALRM, timeout_handler)
signal.alarm(timeout_seconds)  # Définir le délai

try:
    exec(code, exec_namespace)
finally:
    signal.alarm(0)  # Annuler l'alarme
```

Le conteneur Docker a également un délai d'expiration au niveau du processus, fournissant une défense en profondeur. Si le code utilisateur essaie de modifier les gestionnaires de signaux, le délai d'expiration de Docker terminera quand même le conteneur.

## Couche 3 : Flux d'exécution

Maintenant, voyons comment tout fonctionne ensemble lorsqu'un utilisateur soumet du code.

### 1\. Arrivée de la requête

Un utilisateur soumet du code via l'API :

```python
POST /api/v1/execute
{
    "code": "def add(a, b): return a + b",
    "tests": [
        {
            "name": "test_add",
            "assertion": "assert add(2, 3) == 5",
            "hidden": false
        }
    ],
    "timeout_seconds": 10
}
```

### 2\. Service ExecutorPool

Le service `ExecutorPool` gère l'exécution du conteneur :

```python
class ExecutorPool:
    def __init__(self, max_pool_size: int = 5):
        self.semaphore = asyncio.Semaphore(max_pool_size)  # Limite de concurrence
        self.executions: Dict[str, ExecutionResult] = {}
    
    async def execute(self, request: ExecutionRequest):
        async with self.semaphore:  # Limiter les exécutions concurrentes
            # Préparer le JSON d'entrée
            execution_input = {
                "code": request.code,
                "tests": request.tests,
                "timeout_seconds": request.timeout_seconds
            }
            
            # Exécuter dans le pool de threads (Docker est bloquant I/O)
            result = await loop.run_in_executor(
                None,
                self._execute_blocking,
                execution_input,
                request.execution_id,
                request.timeout_seconds
            )
            return result
```

Fonctionnalités clés :

* **Sémaphore** : Limite les exécutions concurrentes (par défaut : 5)
    
* **Pool de threads** : Les opérations Docker sont bloquantes, donc nous les exécutons dans un pool de threads pour éviter de bloquer la boucle d'événements async
    
* **Mise en cache des résultats** : Stocke les résultats pour récupération ultérieure
    

### 3\. Exécution du conteneur

La fonction d'exécution bloquante crée et exécute le conteneur :

```python
def _execute_blocking(self, execution_input: dict, execution_id: str, timeout_seconds: int):
    # Construire la commande docker run avec tous les drapeaux de sécurité
    cmd = [
        "docker", "run",
        "--rm",
        "--memory=512m",
        "--memory-swap=512m",
        "--cpus=1.0",
        "--network=none",
        "--read-only",
        "--cap-drop=ALL",
        "--tmpfs=/tmp:size=10m,mode=1777",
        "-i",
        "cyber-code-executor"
    ]
    
    # Exécuter le conteneur avec l'entrée JSON via stdin
    result = subprocess.run(
        cmd,
        input=json.dumps(execution_input),
        capture_output=True,
        text=True,
        timeout=timeout_seconds + 10  # Tampon pour le démarrage du conteneur
    )
    
    # Analyser la sortie JSON depuis stdout
    result_data = json.loads(result.stdout)
    return ExecutionResult(**result_data)
```

### 4\. À l'intérieur du conteneur

Le script d'entrée du conteneur (`executor_entrypoint.py`) lit le JSON depuis stdin :

```python
def main():
    # Lire l'entrée depuis stdin
    request = json.loads(sys.stdin.read())
    
    code = request.get("code", "")
    tests = request.get("tests", [])
    timeout = request.get("timeout_seconds", 10)
    
    # Exécuter le code dans l'espace de noms restreint
    result = execute_code(code, tests, timeout)
    
    # Sortir les résultats en JSON vers stdout
    print(json.dumps(result), file=sys.stdout)
    sys.exit(0)
```

La fonction `execute_code` :

1. Configure le délai d'expiration basé sur les signaux
    
2. Crée l'espace de noms restreint
    
3. Exécute le code utilisateur avec `exec(code, exec_namespace)`
    
4. Exécute les assertions de test dans le même espace de noms
    
5. Capture stdout/stderr
    
6. Retourne les résultats structurés
    

### 5\. Retour des résultats

Le conteneur sort le JSON vers stdout, que le backend analyse :

```json
{
    "passed": true,
    "test_results": [
        {
            "name": "test_add",
            "passed": true,
            "error": null
        }
    ],
    "error": null,
    "output": "",
    "execution_time_ms": 145
}
```

Le conteneur est automatiquement supprimé (`--rm`), assurant aucun état persistant.

## Tests de sécurité

Nous maintenons une suite de tests de sécurité complète avec 24 tests couvrant tous les vecteurs d'attaque. Chaque test doit **échouer** — si l'un d'eux réussit, nous avons une vulnérabilité.

### Exemple de test : Accès au système de fichiers

```python
"""
Test : Tentative de lecture de fichiers depuis le système de fichiers
Niveau de risque : ÉLEVÉ
"""
result = "SAFE"

# Tentative 1 : Essayer d'utiliser open() directement (doit être bloqué)
try:
    with open('/etc/passwd', 'r') as f:
        content = f.read()
        result = f"VULNERABLE: Can read /etc/passwd: {content[:100]}"
except Exception as e:
    error_type = type(e).__name__
    if error_type == 'NameError':
        result = "BLOCKED: open() not available"
    else:
        result = f"BLOCKED: open() failed: {str(e)}"

print(result)
```

Résultat attendu : `"BLOCKED: open() not available"` (parce que `open` n'est pas dans l'espace de noms restreint)

### Exemple de test : Accès à la socket Docker

```python
"""
Test : Tentative d'accès à la socket Docker
Niveau de risque : CRITIQUE
"""
result = "SAFE"

# Tentative 1 : Essayer de lire le fichier de socket Docker
try:
    with open('/var/run/docker.sock', 'rb') as f:
        result = "VULNERABLE: Can read Docker socket"
except:
    pass

# Tentative 2 : Essayer de se connecter via le module socket
try:
    import socket
    s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    s.connect('/var/run/docker.sock')
    result = "VULNERABLE: Can connect to Docker socket"
except:
    pass

print(result)
```

Résultat attendu : `"SAFE"` (parce que `open` est bloqué et `socket` ne peut pas être importé)

### Catégories de tests

Notre suite de tests couvre :

1. **Échappatoire d'espace de noms** (4 tests) — Accès aux builtins dangereux
    
2. **Accès au système de fichiers** (3 tests) — Lecture/écriture de fichiers
    
3. **Accès réseau** (2 tests) — Connexions socket, requêtes HTTP
    
4. **Échappée Docker** (2 tests) — Socket Docker, système de fichiers hôte
    
5. **Épuisement des ressources** (2 tests) — DoS mémoire/CPU
    
6. **Contournement d'import** (3 tests) — Contourner les restrictions d'import
    
7. **Injection de code** (2 tests) — eval, exec, compile
    
8. **Variables d'environnement** (2 tests) — Fuite d'identifiants
    
9. **Techniques avancées** (3 tests) — Attaques métaclasses, abus de descripteurs
    

Tous les tests doivent échouer. Les exécuter régulièrement assure que nos mesures de sécurité restent efficaces.

## Défense en profondeur : Comment les couches fonctionnent ensemble

Chaque couche de sécurité protège contre différents vecteurs d'attaque :

1. **Isolation Docker** — Empêche l'accès au système hôte, au réseau et au système de fichiers
    
2. **Limites de ressources** — Empêche les attaques DoS (mémoire, CPU, délai)
    
3. **Espace de noms restreint** — Empêche l'injection de code et les imports dangereux
    
4. **Utilisateur non-root** — Limite les dégâts si l'isolation est violée
    
5. **Système de fichiers en lecture seule** — Empêche les modifications de fichiers
    
6. **Capacités retirées** — Empêche l'élévation de privilèges
    

Même si une couche échoue, les autres fournissent une protection de secours. Par exemple :

* Si l'échappatoire d'espace de noms réussit → L'isolation Docker empêche les dégâts
    
* Si l'échappée Docker réussit → L'utilisateur non-root limite les capacités
    
* Si les limites de ressources échouent → L'application du délai d'expiration termine l'exécution
    

## Résultats en production

En production, nos mesures de sécurité bloquent avec succès toutes les tentatives d'attaque :

* ✅ Les tentatives d'échappatoire d'espace de noms échouent (impossible d'accéder à `exec`, `eval`, `__import__`)
    
* ✅ Les tentatives d'accès au système de fichiers échouent (`open()` n'est pas dans l'espace de noms)
    
* ✅ Les tentatives d'accès réseau échouent (impossible d'importer `socket`, réseau désactivé)
    
* ✅ Les tentatives d'échappée Docker échouent (socket Docker non montée, réseau désactivé)
    
* ✅ Les tentatives d'épuisement des ressources échouent (limites appliquées, délais déclenchés)
    
* ✅ Les tentatives d'injection de code échouent (fonctions dangereuses pas dans l'espace de noms)
    

Les utilisateurs peuvent écrire du code Python normal (fonctions, classes, structures de données, algorithmes), mais ne peuvent pas accéder aux ressources système ni exécuter du code arbitraire.

## Considérations de performance

La sécurité n'a pas de coût nul. Nos mesures :

* **Démarrage du conteneur** : ~200-500ms
    
* **Exécution simple** : ~50-150ms
    
* **Temps total de requête** : ~250-650ms
    

Pour une plateforme d'apprentissage, c'est acceptable. Les bénéfices en termes de sécurité l'emportent largement sur le coût en performance.

Pour optimiser :

* Pré-construire les images d'exécuteur lors du déploiement
    
* Utiliser la mise en cache des couches Docker
    
* Augmenter la taille du sémaphore pour les charges de travail concurrentes
    
* Surveiller et optimiser le nettoyage des conteneurs
    

## Améliorations futures

Bien que notre implémentation actuelle soit prête pour la production, nous envisageons un durcissement supplémentaire :

1. **Profils seccomp** — Filtrage fin des appels système
    
2. **AppArmor/SELinux** — Restrictions supplémentaires au niveau du noyau
    
3. **Bibliothèque RestrictedPython** — Restrictions d'espace de noms plus robustes via transformation AST
    
4. **Espaces de noms réseau** — Politiques réseau personnalisées
    
5. **Quotas de ressources** — Limites d'exécution par utilisateur
    

## Conclusion

Sécuriser l'exécution de code nécessite plusieurs couches de défense. En combinant l'isolation des conteneurs Docker, les limites de ressources et les espaces de noms Python restreints, nous avons créé un système qui permet aux utilisateurs d'exécuter du code en toute sécurité tout en protégeant notre infrastructure.

Points clés à retenir :

1. **Ne faites jamais confiance au code utilisateur** — Supposez toujours qu'il est malveillant
    
2. **Défense en profondeur** — Plusieurs couches de sécurité fournissent une protection de secours
    
3. **Testez votre sécurité** — Maintenez une suite de tests complète
    
4. **Surveillez et journalisez** — Suivez toutes les exécutions pour l'audit de sécurité
    
5. **Restez à jour** — La sécurité est un processus continu, pas une configuration unique
    

Si vous construisez une plateforme qui exécute du code utilisateur, j'espère que cet article fournit une base solide pour votre architecture de sécurité.

---

**Ressources :**

* [Bonnes pratiques de sécurité Docker](https://docs.docker.com/engine/security/)
    
* [OWASP Code Injection](https://owasp.org/www-community/attacks/Code_Injection)
    
* [Guide de sandboxing Python](https://nedbatchelder.com/blog/201206/eval_really_is_dangerous.html)
