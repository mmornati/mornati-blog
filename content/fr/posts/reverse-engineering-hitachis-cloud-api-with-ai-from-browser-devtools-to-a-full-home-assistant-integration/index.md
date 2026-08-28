---
title: 'Reverse-Engineering de l''API Cloud Hitachi avec l''IA : Des DevTools du navigateur à une intégration Home Assistant complète'
categories:
- smart-home
- ai-coding-agents
tags:
- ai
- python
- reverse-engineering
- home-assistant
- hitachi
date: '2026-02-25T12:30:56+00:00'
slug: reverse-engineering-hitachis-cloud-api-with-ai-from-browser-devtools-to-a-full-home-assistant-integration
---




# Reverse-Engineering de l'API Cloud Hitachi avec l'IA : Des DevTools du navigateur à une intégration Home Assistant complète

Quand Hitachi a remplacé son ancien système Hi-Kumo par le [module ATW-IOT-01](https://device.report/manual/12211094), il a cassé chaque intégration Home Assistant existante pour leurs pompes à chaleur. Le nouveau système route tout à travers un service cloud appelé [CSNet Manager](https://www.csnetmanager.com) — et il n'y a pas d'API publique, pas de documentation, pas de SDK. Juste une web app.

J'ai décidé de reverse-engineer et de construire une [intégration Home Assistant complète](https://github.com/mmornati/home-assistant-csnet-home) from scratch. Pas en passant des semaines à lire manuellement du JavaScript et cartographier les appels HTTP, mais en utilisant l'IA comme outil principal. Voici comment j'ai fait — et comment vous pouvez appliquer la même approche à n'importe quel service web non documenté.

---

## Étape 1 : Inspecter l'application Web

La première chose que j'ai faite était d'ouvrir le site CSNet Manager et de lancer les DevTools du navigateur. L'**onglet Réseau** est votre meilleur ami quand vous faites du reverse-engineering sur n'importe quelle application web.

![CSNet Manager Login Page](csnet_login_page.png)

Après connexion, le dashboard montre une interface propre avec vos zones de chauffage — dans mon cas, deux zones ("Bibliothèque" et "Salon") avec leurs températures cibles et actuelles :

![CSNet Manager Dashboard](csnet_dashboard.png)

Mais le vrai trésor est dans ce qui se passe en coulisses. En filtrant par requêtes XHR/Fetch dans l'onglet Réseau, j'ai rapidement trouvé que l'app web appelle plusieurs endpoints REST, tous retournant du JSON :

| Endpoint | Objectif |
|---|---|
| `/login` | Authentification avec token XSRF |
| `/data/elements` | **Le principal** — températures, modes, alarmes, pour toutes les zones |
| `/data/installationdevices` | Détails appareil, état du chauffage, paramètres, limites de température |
| `/data/installationalarms` | Données d'alarme actives et historiques |
| `/data/indoor/heat_setting` | Endpoint POST pour changer les paramètres (température, mode, etc.) |
| `/data/rooms` | Configuration des pièces |
| `/data/installations` | Métadonnées d'installation |
| `/data/user` | Données du profil utilisateur |

En naviguant directement vers `/data/elements`, je pouvais voir la réponse JSON brute :

![Raw JSON API Response](csnet_api_json_response.png)

> **💡 Astuce :** Si vous faites du reverse-engineering sur un service web, commencez par l'onglet Réseau. Si l'API retourne du JSON (et pas un format binaire propriétaire), vous avez de la chance — le travail de backporting sera beaucoup plus simple.

C'était la première "bonne nouvelle" : l'API est simple — des appels HTTP straightforward avec des réponses JSON. Pas de WebSockets, pas de GraphQL, pas de protocole binaire obfusqué. Juste du bon vieux REST.

---

## Étape 2 : Comprendre les données — La partie difficile

Voici un exemple de ce à quoi ressemble la réponse `/data/elements` (expurgée) :

```json
{
  "status": "success",
  "data": {
    "name": "Maison de Marco",
    "weatherTemperature": 11,
    "elements": [
      {
        "deviceName": "Hitachi PAC",
        "parentName": "Salon",
        "elementType": 1,
        "mode": 1,
        "realMode": 1,
        "onOff": 1,
        "operationStatus": 5,
        "settingTemperature": 18.5,
        "currentTemperature": 23.0,
        "ecocomfort": 1,
        "alarmCode": 0,
        "c1Demand": false,
        "c2Demand": true,
        "silentMode": -1,
        "fanSpeed": -1,
        "doingBoost": false,
        "yutaki": true
      }
    ]
  }
}
```

Les noms de champs sont quelque peu descriptifs, mais que signifient les **valeurs** ? Qu'est-ce que `elementType: 1` vs `elementType: 5` ? C'est quoi `operationStatus: 5` ? À quoi correspond `ecocomfort: 1` ?

Et voici le vrai défi : **Je n'ai qu'un seul appareil avec une configuration spécifique** — deux circuits d'air, pas de chauffe-eau, pas de piscine, pas de ventilo-convecteurs. Pour rendre cette intégration utile pour tout le monde, je devais supporter des configurations que je n'ai pas. Comment comprendre des données que vous n'avez jamais vues ?

---

## Étape 3 : Lire le code source JavaScript — Bingo

La réponse était là, sous mes yeux, dans l'onglet Sources du navigateur. Les fichiers JavaScript alimentant l'app web CSNet Manager contiennent **toute la logique** pour interpréter les données de l'API. Etfortunately, ils ne sont pas heavily obfusqués.

Dans un fichier comme `csnet.js`, j'ai trouvé exactement ce dont j'avais besoin :

**Codes d'état d'opération :**
```javascript
// Du code source JavaScript du CSNet Manager
var OPST_OFF = 0;
var OPST_COOL_D_OFF = 1;
var OPST_COOL_T_OFF = 2;
var OPST_COOL_T_ON = 3;
var OPST_HEAT_D_OFF = 4;
var OPST_HEAT_T_OFF = 5;  // ← Mon "Salon" a cette valeur !
var OPST_HEAT_T_ON = 6;
var OPST_DHW_OFF = 7;
var OPST_DHW_ON = 8;
var OPST_SWP_OFF = 9;
var OPST_SWP_ON = 10;
var OPST_ALARM = 11;
```

**Validation des limites de température :**
```javascript
function validateValue(v, def) {
    if (v != null && v != undefined && v != 0 && v != -1)
        return v;
    return def;
}
```

**Mapping des types d'éléments :**
- `elementType 1` = Circuit d'air C1 (pompe à chaleur standard, plage 8-35°C)
- `elementType 2` = Circuit d'air C2
- `elementType 3` = DHW (Eau Chaude Sanitaire)
- `elementType 4` = SWP (Piscine)
- `elementType 5` = Circuit d'eau C1 (Yutaki/Hydro, plage 20-80°C)
- `elementType 6` = Circuit d'eau C2

**Cartes d'origine d'alarme**, **constantes de vitesse de ventilateur**, **types OTC (Outdoor Temperature Compensation)** — tout était là, clairement écrit en JavaScript, attendant d'être traduit en Python.

> **💡 Idée clé :** Quand un service web n'a pas de documentation API, le code source JavaScript *est* la documentation. Le navigateur a besoin de comprendre les données pour les afficher, donc le code est effectivement une implémentation de référence.

---

## Étape 4 : Faire intervenir l'IA

Maintenant venait la partie amusante. Au lieu de lire manuellement des milliers de lignes de JavaScript et de cartographier chaque constante, chaque condition, chaque cas limite en Python — j'ai tout donné à une IA.

### L'architecte : Claude Opus

J'ai utilisé **Claude Opus** (disponible dans des outils comme Antigravity et GitHub Copilot) comme mon **architecte**. Voici ce que je lui ai demandé de faire :

1. **Analyser les fichiers source JavaScript** — comprendre le modèle de données, les constantes, la logique métier
2. **Croiser avec les réponses JSON de l'API** — mapper chaque champ à sa signification
3. **Concevoir l'architecture de l'intégration Home Assistant** — entités, capteurs, coordinateurs, config flows
4. **Créer des issues GitHub détaillées** — chacune étant une user story avec des critères d'acceptation, des notes techniques et des détails d'implémentation

L'IA a produit une décomposition structurée organisée en jalons :

| Jalon | Focus | Exemples d'issues |
|---|---|---|
| **Phase 1** | Fonctionnalités HVAC core | Entités climate, contrôle de température, commutation de mode, limites de température dynamiques |
| **Phase 2** | Capteurs & Monitoring | Capteurs de température, monitoring d'alarme, état de l'appareil, état d'opération |
| **Phase 3** | Fonctionnalités avancées | Mode silencieux, contrôle de vitesse de ventilateur, monitoring OTC, chauffe-eau, piscine |

Chaque issue ressemblait à quelque chose comme :

> **[Enhancement] Ajouter le support du mode silencieux/quiet** (#64)
>
> **Quoi :** Ajouter le contrôle du mode silencieux basé sur le champ `silentMode` de l'API elements
>
> **Notes techniques :** Le JavaScript utilise `silentMode: 0` pour off et `silentMode: 1` pour on. La valeur `-1` signifie que la fonctionnalité n'est pas disponible pour cet appareil.
>
> **Critères d'acceptation :**
> - Entité Switch qui toggle le mode silencieux
> - L'entité est créée seulement quand silentMode ≠ -1
> - Le toggle envoie un POST vers `/data/indoor/heat_setting` avec le paramètre `silentMode`

Vous pouvez voir toutes ces issues sur la [page des issues GitHub](https://github.com/mmornati/home-assistant-csnet-home/issues?q=is%3Aissue+state%3Aclosed).

---

## Étape 5 : Le workflow de développement piloté par l'IA

Avec l'architecture définie et les issues créées, je suis entré dans la **phase d'implémentation**. Voici le workflow que j'ai utilisé consistent throughout the project :

### Le modèle Architecte + Codeur

```
┌──────────────────────────────────────────────────────────┐
│  Claude Opus (Architect)                                 │
│  • Analyse les fichiers source JS + réponses JSON        │
│  • Conception de l'architecture                          │
│  • Crée des issues GitHub détaillées avec critères d'acceptation│
└──────────────────────┬───────────────────────────────────┘
                       │ Issues détaillées
                       ▼
┌──────────────────────────────────────────────────────────┐
│  Claude Sonnet / Copilot (Développeur)                   │
│  • Implémente chaque issue comme une PR                 │
│  • Écrit les tests unitaires                            │
│  • Suit les décisions d'architecture d'en haut          │
└──────────────────────┬───────────────────────────────────┘
                       │ Pull Request
                       ▼
┌──────────────────────────────────────────────────────────┐
│  Moi (Code Review + Tests)                              │
│  • Review chaque PR                                     │
│  • Teste sur vrai matériel Hitachi                      │
│  • Valide contre l'app web CSNet Manager                │
│  • Merge ou demande des changements                     │
└──────────────────────────────────────────────────────────┘
```

**Pourquoi deux modèles ?** Utiliser un modèle très capable (Claude Opus) pour l'architecture et un modèle plus rapide/moins cher (Claude Sonnet, GitHub Copilot) pour l'implémentation garde les coûts razonables tout en maintenant la qualité. Le modèle architecte produit des spécifications assez détaillées pour qu'un modèle moins puissant puisse les implémenter avec précision.

Pour chaque issue :
1. L'IA de codage crée une feature branch
2. Elle implémente le code en suivant les spécifications de l'issue
3. Elle écrit les tests unitaires
4. Elle crée une PR avec une description de tous les changements
5. Je review le code, teste sur ma vraie pompe à chaleur Hitachi, et merge

Vous pouvez voir l'historique complet de ce processus dans les [pull requests](https://github.com/mmornati/home-assistant-csnet-home/pulls?q=is%3Apr+is%3Aclosed) — chaque PR est une feature ou un bug fix unique, avec une description claire de ce qui a été implémenté et pourquoi.

---

## Étape 6 : Raffinement guidé par la communauté — L'arme secrète

Voici où le projet a vraiment pris vie. Construire l'intégration initiale était une chose — la faire fonctionner pour **tout le monde** était une autre.

Vous souvenez-vous de mon défi précédent ? Je n'ai qu'une configuration d'appareil (deux circuits d'air, pas de chauffe-eau, pas de piscine). Comment supporter du matériel que vous ne possédez pas ?

**La réponse : la communauté.**

En quelques semaines après la sortie de la première version sur [HACS](https://hacs.xyz/), 4-5 utilisateurs avec différentes configurations Hitachi ont commencé à tester régulièrement et remonter du feedback. Chaque nouveau testeur était comme trouver une pièce de puzzle que je ne pouvais pas acheter :

- 🔥 **Un utilisateur avait un chauffe-eau DHW (Eau Chaude Sanitaire)** → Nous avons découvert `elementType: 3` et le champ `settingTempDHW`, puis construit l'entité chauffe-eau
- 🏊 **Un autre avait un chauffage de piscine** → Nous avons trouvé `elementType: 4` avec sa plage de température 24-33°C
- 🌡️ **Un utilisateur avec un Yutaki S2 + Yutampo waterboiler** ([#52](https://github.com/mmornati/home-assistant-csnet-home/issues/52)) → Confirmé que l'intégration fonctionne avec les circuits d'eau (`elementType: 5` et `6`)
- 💨 **Quelqu'un avec des ventilo-convecteurs** a rapporté un mapping de vitesse différent ([#127](https://github.com/mmornati/home-assistant-csnet-home/issues/127)) → Nous avons ajouté les modèles de vitesse de ventilateur legacy vs standard
- 📊 **Les utilisateurs ont demandé plus de capteurs** — stats du compresseur, températures extérieures, vitesses de pompe → Nous avons exposé plus de données depuis l'endpoint `installationdevices`

Chaque fois que quelqu'un reportait "J'ai cette configuration et voici mon JSON d'elements", je savais que nous pouvions étendre le support. La réponse JSON de `/data/elements` est devenue notre **langage commun de debugging** — n'importe quel utilisateur pouvait la capturer depuis son navigateur et la partager (en redactant les données privées) pour aider à identifier les champs non cartographiés.

> **Le vrai "moment ah-ha" :** Chaque fois que quelqu'un disait "J'ai cette configuration spécifique et je peux tester", ça ressemblait à débloquer un nouveau niveau. Nous n'aurions jamais pu tester le support de piscine ou de ventilo-convecteurs sans ces volontaires.

Les testeurs communautaires ont aussi aidé à attraper des bugs subtils : mauvaises lectures de température ([#137](https://github.com/mmornati/home-assistant-csnet-home/issues/137)), mapping d'état d'opération incorrect ([#122](https://github.com/mmornati/home-assistant-csnet-home/issues/122)), problèmes de gestion des identifiants ([#153](https://github.com/mmornati/home-assistant-csnet-home/issues/153)).

---

## Le résultat

Aujourd'hui, l'[intégration Hitachi CSNet Home](https://github.com/mmornati/home-assistant-csnet-home) est un composant personnalisé Home Assistant complet avec :

- **Entités Climate** par zone avec modes HVAC (chauffage/refroidissement/off), presets (confort/éco), et contrôle de température cible
- **Entité chauffe-eau** avec modes eco/performance
- **40+ capteurs** pour températures, état d'opération, monitoring d'alarme, stats du compresseur, et plus
- **Fonctionnalités avancées** : mode silencieux, contrôle de vitesse de ventilateur, monitoring OTC (Outdoor Temperature Compensation)
- **Système d'alarme** avec notifications persistantes et suivi historique des alarmes
- **Support multi-zones** pour circuits d'air/eau C1/C2

Des chiffres qui racontent l'histoire :

| Métrique | Valeur |
|---|---|
| Issues fermées | 166+ |
| Releases | 29 |
| Contributeurs | 11 |
| Codebase Python | ~5 000 lignes (intégration + tests) |
| CI/CD | 32+ combinaisons de tests à travers 7+ versions HA |
| HACS | ✅ Disponible |

---

## IA vs Manuel : Le facteur temps

Soyons honnêtes sur ce que l'IA a fait et n'a pas fait dans ce projet.

### Ce que l'IA a excellé à faire :
- **Traduction de code (JS → Python) :** L'IA pouvait lire le code source JavaScript, comprendre la logique, et produire du Python équivalent en minutes — le travail qui prendrait des heures manuellement
- **Reconnaissance de patterns :** Mapper des noms de champs cryptiques à des constantes significatives à travers des milliers de lignes de JS
- **Génération de boilerplate :** Structure d'intégration Home Assistant, config flows, entity platforms — tout le squelette qui prend du temps à écrire mais suit des patterns clairs
- **Décomposition en issues :** Décomposer un projet complexe en user stories bien structurées et implémentables

### Ce que l'IA ne pouvait pas faire :
- **Tester avec du vrai matériel.** Seulement les vrais appareils connectés au cloud CSNet peuvent valider que l'intégration fonctionne
- **Comprendre les cas limites depuis un seul point de données.** L'IA pouvait mapper `elementType: 1` à "circuit d'air", mais elle ne pouvait pas savoir que `elementType: 5` encode la température différemment (multipliée par 10) sans voir la logique JS
- **Remplacer l'interaction communautaire.** Comprendre que certains utilisateurs ont des ventilo-convecteurs legacy avec un mapping de vitesse différent nécessitait une conversation humaine et du debugging

### La comparaison de temps :
- **Avec IA :** Intégration core en **2-3 jours**. Avec fonctionnalités complètes et raffinement communautaire en **quelques semaines**
- **Sans IA (estimé) :** L'intégration core prendrait **2-3 semaines** de lecture de JavaScript, compréhension des protocoles, écriture de Python manuellement. Avec toutes les fonctionnalités ? **Des mois.**

L'IA n'a pas économisé 80% de la *pensée* — elle a économisé 80% de la * frappe et traduction*. Le travail humain est resté essentiel : prendre des décisions architecturales, reviewer le code, tester sur vrai matériel, et travailler avec la communauté.

---

## Votre tour : Une recette pour reverse-engineering n'importe quel service web

Si vous voulez appliquer cette approche à un autre service web non documenté, voici le pas-à-pas :

### 1. 🔍 Inspecter le trafic réseau
- Ouvrir DevTools → onglet Réseau
- Interagir avec l'app web et identifier les appels API
- Chercher des réponses JSON — c'est votre meilleur scénario

### 2. 📖 Lire le code source JavaScript
- Vérifier l'onglet Sources pour du JS non minifié
- Utiliser `prettier` ou votre IDE pour formater le code minifié
- Chercher des constantes, enums, fonctions de mapping

### 3. 🤖 Tout donner à une IA
- Donner à l'IA : code source JavaScript + exemples de réponses JSON + contexte sur ce que fait l'app web
- Lui demander : mapper chaque champ, identifier le modèle de données, créer une spécification technique
- Utiliser un modèle capable (Claude Opus, GPT-4) pour cette analyse architecturale

### 4. 📋 Créer des issues structurées
- Demander à l'IA de produire des issues GitHub détaillées depuis la spec
- Chaque issue = une feature, avec critères d'acceptation et notes techniques
- Organiser en jalons (features core d'abord, puis les enhancements)

### 5. 💻 Implémenter avec assistance IA
- Utiliser une IA de codage (Claude Sonnet, Copilot) pour implémenter chaque issue
- Garder les PRs focus et petites
- **Toujours reviewer le code vous-même** — l'IA fait des erreurs subtiles

### 6. 👥 Sortir tôt, obtenir du feedback communautaire
- Ne pas attendre la perfection
- Les utilisateurs avec différentes configurations trouveront des choses que vous n'auriez jamais pu
- Rendre facile pour eux de partager des données (réponses JSON, logs de debug)

---

## Réflexions finales

Ce que j'ai construit ici avec l'IA aurait pu être fait manuellement sans problème. Le processus d'inspection des appels réseau, de lecture du JavaScript, de compréhension des formats de données — c'est tout du reverse-engineering standard. Les développeurs le font depuis des décennies.

Mais le délai est complètement différent. Ce qui a pris des jours avec l'IA aurait pris des semaines sans. L'IA a géré le travail de traduction fastidieux — lire des milliers de lignes de JavaScript, mapper des constantes, générer du boilerplate — pendant que je me concentrais sur ce que les humains font de mieux : architecture, testing, et collaboration communautaire.

La vraie magie n'était pas juste l'IA. C'était la combinaison du développement accéléré par l'IA et une communauté de 4-5 utilisateurs dédiés, chacun avec une configuration Hitachi unique, qui ont donné du feedback régulier, testé des fonctionnalités dont ils avaient besoin, et ont aidé l'intégration à passer d'une preuve de concept à quelque chose qui fonctionne véritablement pour tout le monde.

---

**Liens :**
- 📦 **Dépôt :** [github.com/mmornati/home-assistant-csnet-home](https://github.com/mmornati/home-assistant-csnet-home)
- 📚 **Documentation :** [mmornati.github.io/home-assistant-csnet-home](https://mmornati.github.io/home-assistant-csnet-home)
- 💬 **Discussions :** [GitHub Discussions](https://github.com/mmornati/home-assistant-csnet-home/discussions)
- 🛒 **HACS :** Recherchez "csnet home" ou "Hitachi"

*Vous avez reverse-engineered un service web avec l'IA ? Trouvé un appareil IoT cloud-only qui avait besoin d'une intégration locale ? J'adorerais entendre votre expérience — laissez un commentaire ou ouvrez une discussion sur le repo !*