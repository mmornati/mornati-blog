---
title: 'Tests de pénétration personnalisés en Vibe Coding : Quand l''IA devient votre partenaire sécurité'
tags:
- ai
- security
- developer
- pentesting
- vibecoding
date: '2026-01-10T09:30:33.669000+00:00'
categories: [Sécurité, IA, Développement]
slug: vibe-coding-custom-penetration-tests-when-ai-becomes-your-security-partner
description: Découvrez comment l'IA peut vous aider à créer des tests de pénétration personnalisés adaptés aux besoins uniques de votre application et améliorer vos tests de sécurité
---




Quand j'ai commencé à construire [Cyber Code Academy](https://play.pygame.ovh), une plateforme de défis de codage où les utilisateurs soumettent du code Python qui s'exécute sur mon serveur, je savais que je jouais avec le feu. Permettre à des inconnus d'exécuter du code sur votre infrastructure, c'est basically une invitation ouverte au désastre. Mais voilà — je ne suis pas un expert en sécurité. Je suis juste un développeur qui voulait construire quelque chose de cool pour son fils.

Alors j'ai fait ce que tout développeur moderne ferait : j'ai demandé de l'aide à mes assistants de codage IA.

Et ce qui s'est passé ensuite était assez remarquable.

## Le problème : Les outils de sécurité génériques ne comprennent pas votre application

Si vous avez déjà exécuté un scanner de sécurité comme OWASP ZAP ou Burp Suite contre votre application, vous connaissez la routine : vous obtenez un tas de résultats sur des headers manquants, des vecteurs XSS potentiels, et peut-être des avertissements d'injection SQL. Ces outils sont excellents. Sérieusement. Utilisez-les.

Mais voici ce qu'ils *ne comprennent pas* :

- **Votre logique métier** : Un utilisateur peut-il manipuler son score XP en soumettant la même solution deux fois ?
- **Votre surface d'attaque personnalisée** : Quelqu'un peut-il échapper à votre sandbox Python en accédant à `__builtins__` ?
- **Votre architecture** : Votre exécuteur Docker isole-t-il correctement l'accès réseau ?

Les scanners génériques testent les vulnérabilités génériques. Mais quand vous construisez quelque chose d'unique — comme une plateforme qui exécute du code Python non fiable — vous avez besoin de tests personnalisés qui comprennent VOS risques spécifiques.

C'est le gap que j'avais besoin de combler.

## Entrer dans le "Vibe Coding" pour la sécurité

Si vous avez lu mon [article précédent sur la construction de Cyber Code Academy](https://blog.mornati.net/building-cyber-code-academy-a-pure-vibe-coding-experiment), vous savez que je suis un grand fan de ce que j'appelle le "vibe coding" — la pratique de décrire ce que vous voulez aux assistants IA (Cursor, GitHub Copilot, ou dans ce cas, Antigravity) et les laisser générer le code.

Il s'avère que cette approche fonctionne *magnifiquement* pour les tests de sécurité.

Voici pourquoi : Les connaissances en sécurité sont vastes et spécialisées. La plupart des développeurs (moi y compris) n'ont pas de connaissance encyclopédique de chaque vecteur d'attaque. Mais les assistants IA, eux, les ont. Ils ont été entraînés sur les guides OWASP, les articles de recherche en sécurité, et d'innombrables exemples d'attaques et de défenses.

Alors au lieu d'essayer de mémoriser chaque payload d'injection SQL possible, j'ai simplement décrit ce que je voulais :

```
"J'ai besoin de tester si quelqu'un peut échapper à ma sandbox Python en utilisant 
getattr() pour accéder à __builtins__ puis appeler exec(). Génère 
un test qui tente cela et rapporte si cela réussit."
```

Et l'IA m'a livré :

```python
def test_namespace_escape_getattr(self):
    """Test namespace escape via getattr"""
    namespace_tests = [
        "getattr(__builtins__, 'exec', None)('print(\"ESCAPED\")')",
        "getattr(__builtins__, '__import__', None)('os').system('id')",
        "getattr(globals(), '__builtins__', {}).get('exec', None)('print(\"ESCAPED\")')",
    ]
    
    for code in namespace_tests:
        response = self.session.post(
            f"{self.base_url}/api/v1/execute",
            json={
                "code": code,
                "tests": [{"name": "test", "assertion": "True"}],
                "timeout_seconds": 5
            }
        )
        
        if "ESCAPED" in response.json().get("output", ""):
            self.log_finding(
                "CRITICAL",
                "Namespace escape via getattr",
                "Code can escape restricted namespace using getattr"
            )
```

Je n'avais pas besoin de connaître la syntaxe exacte de ces techniques de contournement — l'IA a apporté cette connaissance. J'avais juste besoin de savoir *quel aspect* je voulais tester.

## Construire une suite complète de tests de sécurité

Au fil de plusieurs sessions, j'ai construit une suite complète de tests de sécurité organisée en catégories qui avaient du sens pour mon application :

```
security-tests/production/
├── recon.py              # Découverte d'endpoints
├── test_auth.py          # Attaques JWT, contournement de token, politique de mot de passe
├── test_authz.py         # IDOR, escalade de rôle, contrôle d'accès
├── test_injection.py     # Injection SQL, XSS, injection de commandes
├── test_code_exec.py     # Échappée de sandbox, contournement Docker, DoS
├── test_api_security.py  # Limitation de débit, headers, CORS
├── test_business_logic.py # Manipulation XP, triche aux scores
└── run_tests.py          # Orchestrateur avec exécution phasée
```

Laissez-moi vous présenter quelques-uns des tests les plus intéressants.

### Manipulation de token JWT

L'une des attaques classiques contre l'authentification basée sur JWT est l'attaque par algorithme "none". Voici ce que l'IA m'a généré :

```python
def test_jwt_none_algorithm(self):
    """Test JWT 'none' algorithm attack"""
    # Decode token without verification
    decoded = jwt.decode(
        self.access_token, 
        options={"verify_signature": False}
    )
    
    # Create token with 'none' algorithm
    payload = decoded.copy()
    payload["alg"] = "none"
    
    malicious_token = jwt.encode(payload, "", algorithm="none")
    
    # Try to use it
    response = requests.get(
        f"{self.base_url}/api/v1/dashboard/me",
        headers={"Authorization": f"Bearer {malicious_token}"}
    )
    
    if response.status_code == 200:
        self.log_finding(
            "CRITICAL",
            "JWT 'none' algorithm accepted",
            "Server accepts tokens with 'none' algorithm, allowing forgery"
        )
```

Honnêtement, je ne connaissais pas cette attaque avant que l'IA ne génère ce test. Maintenant mon application rejette correctement ces tokens ✓

### Payloads d'injection SQL

Pour les tests de validation d'entrée, l'IA a généré une liste complète de payloads d'injection SQL :

```python
sql_payloads = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "admin'--",
    "' UNION SELECT NULL--",
    "'; DROP TABLE users; --",
]

for payload in sql_payloads:
    response = self.session.post(
        f"{self.base_url}/api/v1/auth/login",
        json={"username": payload, "password": "Test1234!"}
    )
    
    # Check for SQL errors in response
    if any(keyword in response.text.lower() 
           for keyword in ["sql", "syntax error", "postgresql"]):
        self.log_finding(
            "CRITICAL",
            "SQL injection in login username",
            f"SQL error detected with payload: {payload}"
        )
```

### Échappée de sandbox Docker

Puisque ma plateforme exécute du code utilisateur dans des conteneurs Docker, j'avais besoin de tester les vulnérabilités d'échappée de conteneur :

```python
def test_docker_socket_access(self):
    """Test accessing Docker socket"""
    docker_socket_tests = [
        "import socket; s = socket.socket(socket.AF_UNIX); "
        "s.connect('/var/run/docker.sock'); print('DOCKER_ACCESSIBLE')",
        "open('/var/run/docker.sock', 'r')",
    ]
    
    for code in docker_socket_tests:
        response = self.session.post(
            f"{self.base_url}/api/v1/execute",
            json={"code": code, "timeout_seconds": 5}
        )
        
        if "DOCKER_ACCESSIBLE" in response.json().get("output", ""):
            self.log_finding(
                "CRITICAL",
                "Docker socket accessible from sandbox",
                "Code can access Docker socket, allowing container escape"
            )
```

## Exécuter les tests : Résultats réels

Laissez-moi vous montrer ce qui se passe quand nous exécutons cela contre le site de production. Voici la sortie réelle d'une série de tests que j'ai faite aujourd'hui :

```
============================================================
PRODUCTION SECURITY PENETRATION TESTING
============================================================
Target: https://play.pygame.ovh
Test User: aitest_security_2025
Start Time: 2026-01-10T10:10:24
============================================================

PHASE 1: RECONNAISSANCE
============================================================
[+] Found docs at /docs
[+] Found: POST /api/v1/auth/register (Status: 422)
[+] Found: POST /api/v1/auth/login (Status: 422)
[+] Found: GET /api/v1/challenges (Status: 200)
[+] Found: POST /api/v1/execute (Status: 401)
...
[+] Reconnaissance complete. Found 20 endpoints.

PHASE 2: AUTHENTICATION TESTS
============================================================
[+] Test user 'aitest_security_2025' created successfully
[+] Login successful, tokens obtained
[+] JWT 'none' algorithm correctly rejected
[+] Weak password correctly rejected: short
[+] Weak password correctly rejected: nouppercase123
...
[+] Authentication tests complete. Found 0 issues.

PHASE 5: CODE EXECUTION TESTS
============================================================
[*] Testing Docker socket access...
[*] Testing host filesystem access...
[*] Testing network access...
[*] Testing namespace escape via getattr...
[*] Testing import bypass...
...
[+] Code execution tests complete. Found 0 issues.
```

Après environ 68 secondes de tests automatisés, voici le rapport résumée :

```
============================================================
TESTING COMPLETE
============================================================
Total Time: 67.85 seconds
Total Findings: 3
  - Critical: 0
  - High: 0
  - Medium: 3
  - Low: 0
============================================================
```

### Ce que les tests ont trouvé

La suite de tests génère automatiquement des rapports en JSON et Markdown. Voici ce qu'elle a trouvé :

| Sévérité | Finding | Description |
|----------|---------|-------------|
| Medium | No rate limiting on registration | Registration endpoint allows rapid requests |
| Medium | Missing security headers | CSP, HSTS, X-XSS-Protection not set |
| Medium | OpenAPI documentation exposed | `/docs` endpoint publicly accessible |

Zéro problème de sévérité critique ou haute. La sandbox tient bon — aucune échappée Docker, aucune injection SQL, aucun contournement JWT. Mais j'ai du ménage à faire sur ces security headers.

## Ce que l'IA fait bien (et mal)

Après cette expérience, voici mon évaluation honnête :

### L'IA excelle dans :

✅ **Générer des patterns d'attaque connus** — OWASP Top 10, techniques de contournement communes, payloads d'injection. L'IA a vu des milliers d'exemples.

✅ **Structurer des suites de tests** — Organisation appropriée, gestion d'erreurs, logging. Le code boilerplate est solide.

✅ **Documentation** — Chaque test inclut des docstrings expliquant ce qu'il teste et pourquoi.

✅ **Couvrir les cas limites** — L'IA suggère souvent des cas de test auxquels je n'aurais pas pensé.

### Où les humains restent essentiels :

⚠️ **Comprendre VOTRE modèle de menace** — Vous devez encore dire à l'IA ce qui est important à tester.

⚠️ **Interpréter les résultats** — Cette trouvaille "Données sensibles dans /docs" est-elle réellement un problème ? (Dans mon cas, c'est une fonctionnalité intentionnelle pour les développeurs.)

⚠️ **Tests responsables** — Ne exécutez jamais ces tests contre des systèmes que vous ne possédez pas ou sans autorisation.

⚠️ **Penser en post-exploitation** — Si une attaque réussit, quel est l'impact réel ? L'IA ne fait pas toujours ces connexions.

## Essayez vous-même : Un guide de démarrage rapide

Vous voulez vibe-coder vos propres tests de sécurité ? Voici comment commencer :

### 1. Définissez votre surface d'attaque

Commencez par lister ce qui rend votre application unique :
- "Mon application exécute du code soumis par les utilisateurs"
- "J'utilise des tokens JWT avec des claims personnalisés"
- "Les utilisateurs peuvent modifier leur profil, y compris les téléchargements d'avatar"

### 2. Prompt par catégorie

Travailler systématiquement à travers les catégories de sécurité :

```
"Génère des tests de sécurité d'authentification pour une application FastAPI 
qui utilise des tokens JWT. Teste : attaque par algorithme none, manipulation 
de token, contournement d'authentification et acceptation de mot de passe faible."
```

### 3. Itérer et affiner

Après la première génération, demandez des améliorations :

```
"Ajoute un test qui tente d'accéder aux données d'autres utilisateurs en 
modifiant le user_id dans le payload JWT"
```

### 4. Revoir et comprendre

Ne lancez pas les tests aveuglément. Lisez le code. Comprenez pourquoi chaque attaque fonctionne (ou devrait être bloquée). Vous deviendrez un meilleur développeur dans le processus.

### 5. Exécuter de manière responsable

Testez toujours d'abord dans un environnement de développement. N'attaquez jamais les systèmes de production sans autorisation explicite. Et supprimez ces comptes de test quand vous avez terminé.

## Conclusion : La sécurité pour tous

Voici ce que j'ai appris : Vous n'avez pas besoin d'être un expert en sécurité pour écrire des tests de sécurité. Vous avez juste besoin de savoir quelles questions poser et d'avoir un assistant IA qui peut fournir les réponses.

La barrière d'entrée pour les tests de sécurité vient de baisser considérablement. Et c'est une bonne chose — car la sécurité ne devrait pas être un luxe réservé aux entreprises avec des équipes de pentest dédiées. Si vous construisez des logiciels, vous devriez tester sa sécurité. Et maintenant, avec l'IA comme votre pair programmer, vous le pouvez.

La suite complète de tests de sécurité que j'ai décrite est open source (lien à la fin de cet article). N'hésitez pas à explorer, à l'adapter à vos besoins et à contribuer à des améliorations. Et si vous voulez la voir en action, vous pouvez essayer de casser [Cyber Code Academy](https://play.pygame.ovh) vous-même.

Sérieusement. Donnez le meilleur de vous-même :P

---

*La suite de tests de sécurité référencée dans cet article est open source. Si vous souhaitez accéder au code source complet avec tous les 24+ scripts de test, n'hésitez pas à me contacter — je suis heureux de partager avec les développeurs intéressés.*

---

**Articles connexes :**
- [Building Cyber Code Academy: A "Pure Vibe Coding" Experiment](https://blog.mornati.net/building-cyber-code-academy-a-pure-vibe-coding-experiment)
- [Sécuriser l'exécution de code Python : Comment nous avons protégé notre serveur contre le code non fiable](https://blog.mornati.net/securing-python-code-execution-how-we-protected-our-server-from-untrusted-code)

---

*Vous avez des questions sur les tests de sécurité assistés par IA ? Vous avez trouvé une vulnérabilité que j'ai manquée ? Faites-le moi savoir dans les commentaires ou contactez-moi sur Twitter !*