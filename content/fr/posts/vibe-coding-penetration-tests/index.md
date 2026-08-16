---
title: 'Tests de Penetration Personnalises en Vibe Coding : Quand l'IA Devient Votre Partenaire de Securite'
tags:
- ia
- securite
- developpeur
- pentesting
- vibecoding
date: '2026-01-10T09:30:33.669000+00:00'
categories: [Securite, IA, Developpement]
slug: vibe-coding-penetration-tests
description: Decouvrez comment l'IA peut vous aider a creer des tests de penetration personnalises
  adaptes aux besoins uniques de votre application et ameliorer vos tests de securite
---


Quand j'ai commence a construire [Cyber Code Academy](https://play.pygame.ovh), une plateforme de.defis de code ou les utilisateurs soumettent du code Python qui s'execute sur mon serveur, je savais que je jouais avec le feu. Laisser des inconnus executer du code sur votre infrastructure c'estBasically une invitation ouverte au desastre. Mais voila le truc — je ne suis pas un expert en securite. Je suis juste un developpeur qui voulait construire quelque chose de cool pour son fils.

Donc j'ai fait ce que tout developpeur moderne ferait : j'ai demande a mes assistants de coding IA de l'aide.

Et ce qui s'est passe ensuite etait assez remarquable.

## Le Probleme : Les Outils de Securite Generiques Ne Comprennent Pas Votre Application

Si vous avez deja execute un scanner de securite comme OWASP ZAP ou Burp Suite contre votre application, vous connaissez la routine : vous obtenez un tas de resultats sur des headers manquants, des vecteurs XSS potentiels, et peut-etre quelques avertissements d'injection SQL. Ces outils sont excellents. Serieusement. Utilisez-les.

Mais voila ce qu'ils *ne comprennent pas* :

- **Votre logique metier** : Un utilisateur peut-il manipuler son score XP en soumettant la meme solution deux fois ?
- **Votre surface d'attaque personnalisee** : Quelqu'un peut-il echapper a votre sandbox Python en accedant a `__builtins__` ?
- **Votre architecture** : Votre executor Docker isole-t-il correctement l'acces reseau ?

Les scanners generiques testent les vulnerabilites generiques. Mais quand vous construisez quelque chose d'unique — comme une plateforme qui execute du code Python non confiance — vous avez besoin de tests personnalises qui comprennent VOS risques specifiques.

C'est le vide que j'avais besoin de combler.

## Entrez le "Vibe Coding" pour la Securite

Si vous avez lu mon [post precedent sur la construction de Cyber Code Academy](https://blog.mornati.net/building-cyber-code-academy-a-pure-vibe-coding-experiment), vous savez que je suis un grand fan de ce que j'appelle le "vibe coding" — la pratique de decrire ce que vous voulez aux assistants IA (Cursor, GitHub Copilot, ou dans ce cas, Antigravity) et les laisser generer le code.

Il s'avere que cette approche fonctionne *magnifiquement* pour les tests de securite.

Voici pourquoi : Les connaissances en securite sont vastes et specialisees. La plupart des developpeurs (moi y compris) n'ont pas de connaissances encyclopediques de chaque vecteur d'attaque. Mais les assistants IA si. Ils ont ete formes sur les guides OWASP, les articles de recherche en securite, et d'innombrables exemples d'attaques et de defenses.

Donc au lieu d'essayer de me souvenir de chaque payload d'injection SQL possible, j'ai simplement decrit ce que je voulais :

```
"J'ai besoin de tester si quelqu'un peut echapper a ma sandbox Python en utilisant 
getattr() pour acceder a __builtins__ puis appeler exec(). Genere 
un test qui tente ceci et rapporte si cela reussit."
```

Et l'IA m'a fourni :

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

Je n'avais pas besoin deconnaitre la syntaxe exacte de ces techniques de contournement — l'IA a apporte cette connaissance. J'avais juste besoin de savoir *quel aspect* je voulais tester.

## Construire une Suite de Tests de Securite Complete

Au cours de plusieurs sessions, j'ai construit une suite de tests de securite complete organisee en categories qui avaient du sens pour mon application :

```
security-tests/production/
├── recon.py              # Decouverte d'endpoints
├── test_auth.py          # Attaques JWT, contournement de token, politique de mot de passe
├── test_authz.py         # IDOR, escalade de role, controle d'acces
├── test_injection.py     # Injection SQL, XSS, injection de commandes
├── test_code_exec.py     # Evasion de sandbox, contournement Docker, DoS
├── test_api_security.py  # Limitation de debit, headers, CORS
├── test_business_logic.py # Manipulation XP, triche aux scores
└── run_tests.py          # Orchestrateur avec execution phassee
```

Laissez-moi vous presenter quelques-uns des tests plus interessants.

### Manipulation de Token JWT

L'une des attaques classiques contre l'authentification basee sur JWT est l'attaque par algorithme "none". Voici ce que l'IA a genere pour moi :

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

Honnetement, je ne connaissais pas cette attaque avant que l'IA ne genere ce test. Maintenant mon application rejette correctement ces tokens ✓

### Payloads d'Injection SQL

Pour les tests de validation d'entree, l'IA a genere une liste complete de payloads d'injection SQL :

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

### Evasion de Sandbox Docker

Puisque ma plateforme execute le code utilisateur dans des conteneurs Docker, j'avais besoin de tester les vulnerabilites d'evasion de conteneur :

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

## Executer les Tests : Resultats Reels

Laissez-moi vous montrer ce qui se passe quand nous exécutons ceci contre le site production. Voici la sortie reel d'un test que j'ai effectue aujourd'hui :

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

Apres environ 68 secondes de tests automatises, voici le rapport resumant :

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

### Ce que les Tests ont Trouve

La suite de tests genere automatiquement des rapports en JSON et Markdown. Voici ce qu'elle a trouve :

| Severite | Decouverte | Description |
|----------|-----------|-------------|
| Medium | Pas de limitation de debit sur l'inscription | L'endpoint d'inscription permet les requetes rapides |
| Medium | Headers de securite manquants | CSP, HSTS, X-XSS-Protection non definis |
| Medium | Documentation OpenAPI exposee | L'endpoint `/docs` est accessible au public |

Zero vulnerabilites critiques ou de haute severite. La sandbox tient bon — pas d'evasion Docker, pas d'injection SQL, pas de contournement JWT. Mais j'ai du menage a faire sur ces headers de securite.

## Ce que l'IA Fait Bien (et Mal)

Apres cette experience, voici mon评估 honnete :

### L'IA Excelle Dans :

✅ **Generer des modeles d'attaque connus** — OWASP Top 10, techniques de contournement courantes, payloads d'injection. L'IA a vu des milliers d'exemples.

✅ **Structurer les suites de tests** — Organisation correcte, gestion des erreurs, journalisation. Le code standard est solide.

✅ **Documentation** — Chaque test inclut des docstrings expliquant ce qu'il teste et pourquoi.

✅ **Couvrir les cas limites** — L'IA suggère souvent des cas de test auxquels je n'aurais pas pense.

### Ou les Humains Restent Essentiels :

⚠️ **Comprendre VOTRE modele de menace** — Vous devez toujours dire a l'IA ce qui est important a tester.

⚠️ **Interpreter les resultats** — Cette decouverte "Donnees sensibles dans /docs" est-elle reellement un probleme ? (Dans mon cas, c'est une fonctionnalite intentionnelle pour les developpeurs.)

⚠️ **Tests responsables** — N'executez jamais ces tests contre des systemes que vous ne possédez pas ou sans autorisation.

⚠️ **Pensee post-exploitation** — Si une attaque reussit, quel est l'impact reel ? L'IA ne connecte pas toujours ces points.

## Essayez Vous-Meme : Un Guide de Demarrage Rapide

Vous voulez vibe-coder vos propres tests de securite ? Voici comment commencer :

### 1. Definez Votre Surface d'Attaque

Commencez par lister ce qui rend votre application unique :
- "Mon application execute du code soumis par les utilisateurs"
- "J'utilise des tokens JWT avec des claims personnalises"
- "Les utilisateurs peuvent modifier leur profil, y compris les uploads d'avatar"

### 2. Prompt par Categorie

Parcourez les categories de securite systematiquement :

```
"Genere des tests de securite d'authentification pour une application FastAPI 
qui utilise des tokens JWT. Teste pour : l'attaque par algorithme none, la 
manipulation de token, le contournement d'authentification, et l'acceptation de mots de passe faibles."
```

### 3. Iterez et Affinez

Apres la premiere generation, demandez des ameliorations :

```
"Ajoute un test qui tente d'acceder aux donnees d'autres utilisateurs en 
modifiant le user_id dans le payload JWT"
```

### 4. Revoyez et Comprenez

Ne lancez pas les tests aveuglément. Lisez le code. Comprenez pourquoi chaque attaque fonctionne (ou devrait etre bloquée). Vous deviendrez un meilleur developpeur dans le processus.

### 5. Executez Responsablement

Testez toujours d'abord dans un environnement de developpement. N'attaquez jamais les systemes production sans autorisation explicite. Et supprimez ces comptes de test quand vous avez termine.

## Conclusion : La Securite pour Tous

Ce que j'ai appris : Vous n'avez pas besoin d'etre un expert en securite pour ecrire des tests de securite. Vous avez juste besoin de savoir quelles questions poser et d'avoir un assistant IA qui peut fournir les reponses.

La barriere a l'entree pour les tests de securite vient de baisser considerably. Et c'est une bonne chose — car la securite ne devrait pas etre un luxe reserve aux entreprises avec des equipes de pentest dediees. Si vous construisez des logiciels, vous devriez tester sa securite. Et maintenant, avec l'IA comme votre programmeur en binome, vous le pouvez.

La suite complete de tests de securite que j'ai decrite est open source (lien a la fin de ce post). N'hesitez pas a explorer, a l'adapter a vos besoins, et a contribuer a des ameliorations. Et si vous voulez la voir en action, vous pouvez essayer de pirater [Cyber Code Academy](https://play.pygame.ovh) vous-meme.

Serieusement. Donnez le meilleur de vous-meme :P

---

*La suite de tests de securite referencee dans cet article est open source. Si vous souhaitez acceder au code source complet avec tous les 24+ scripts de test, n'hesitez pas a me contacter — je suis heureux de partager avec les developpeurs interesses.*

---

**Posts Associes :**
- [Building Cyber Code Academy: A "Pure Vibe Coding" Experiment](https://blog.mornati.net/building-cyber-code-academy-a-pure-vibe-coding-experiment)
- [Securing Python Code Execution: How We Protected Our Server from Untrusted Code](https://blog.mornati.net/securing-python-code-execution-how-we-protected-our-server-from-untrusted-code)

---

*Des questions sur les tests de securite assistes par IA ? Vous avez trouve une vulnerabilite que j'ai manquée ? Faites-le moi savoir dans les commentaires ou contactez-moi sur Twitter !*
