---
title: 'Soulevant le couvercle de la boîte noire de Copilot : Observabilité pour la génération de code par LLM'
tags:
- ia
- debogage
- observabilite
- llm
- copilot
- open-telemetry
categories: [IA, Développement, Observabilité]
date: '2026-06-15T20:18:59.728000+00:00'
slug: lifting-the-lid-on-copilot-s-black-box-observability-for-llm-code-generation
---
## Introduction : La boîte noire de la génération de code par IA

Lorsque vous demandez à GitHub Copilot d'écrire une fonction, de refactoriser un module ou d'expliquer un morceau de code complexe, la réponse que vous obtenez est la sortie d'un modèle probabiliste. Contrairement à un programme déterministe traditionnel — où la même entrée produit toujours la même sortie — un LLM (Large Language Model) génère chaque token en fonction d'une distribution de probabilité sur son vocabulaire. La même invite peut produire différentes complétions d'une invocation à l'autre, et le raisonnement interne qui a conduit à un choix particulier d'outil ou de séquence d'étapes est opaque.

Cette nature de boîte noire pose un défi fondamental pour les développeurs qui doivent faire confiance, déboguer ou auditer le comportement de Copilot. Comment savoir quels outils le LLM a réellement invoqués ? Comment l'invite a-t-elle été assemblée à partir de votre contexte et de votre question ? L'agent a-t-il suivi la chaîne de pensée prévue, ou a-t-il pris un raccourci qui pourrait mener à un déploiement incorrect ou à un risque de sécurité ?

L'observabilité offre un moyen de soulever le couvercle de cette boîte noire. En capturant la télémétrie structurée — traces, spans et attributs — nous pouvons voir exactement ce que le LLM a fait : quels outils ont été appelés, dans quel ordre, avec quels paramètres, et comment la réponse finale a été construite. Cet article présente deux approches pratiques pour obtenir cette visibilité : les outils de débogage intégrés dans VS Code et un pipeline OpenTelemetry (OTEL) complet. Les deux sont accessibles aux développeurs seniors et peuvent être configurés avec un minimum de frais généraux.

## Comprendre la « réflexion » du LLM vs. l'observabilité

### Ce que « réfléchir » signifie pour un modèle probabiliste

Il est tentant d'anthropomorphiser les LLM et de parler de « réflexion » ou de « raisonnement ». En réalité, un LLM ne raisonne pas au sens humain du terme ; il génère des séquences de tokens en échantillonnant répétitivement à partir d'une distribution de probabilité conditionnée par l'invite d'entrée et les tokens générés jusqu'à présent. La « réflexion » que nous pouvons observer n'est pas le processus token par token interne (qui reste caché à moins que nous capturions explicitement le texte brut de l'invite et de la réponse), mais plutôt les décisions de haut niveau que le modèle prend concernant les outils à invoquer, dans quel ordre, et comment assembler le contexte.

Par exemple, lorsqu'un utilisateur demande « Déployer en production », le LLM peut décider d'appeler un outil `bash` pour exécuter un script de déploiement, puis appeler un outil `read_bash` pour vérifier la sortie, et enfin invoquer une compétence entreprise qui applique un workflow d'approbation de déploiement. Chacune de ces étapes est une action discrète qui peut être enregistrée dans une trace. L'invite de chaîne de raisonnement qui apparaît parfois dans la réponse (par exemple, « D'abord, je vais vérifier la branche actuelle… ») fait partie du texte généré ; elle n'est pas directement visible comme un span séparé sauf si vous avez activé la capture de contenu et que le LLM l'inclut dans la réponse.

### Ce que l'observabilité révèle (et ce qu'elle ne révèle pas)

**Visible :**

* Quels outils ont été appelés, dans quel ordre, et avec quels paramètres (par exemple, la chaîne de commande passée à `bash`).

* Comment l'invite a été construite à partir de l'entrée de l'utilisateur, du contexte de l'éditeur actuel, et de tous fichiers ou extraits récupérés.

* Invocations d'agents : quel agent a été utilisé (par exemple, `workspace`, `chat`, `custom_agent`) et le type d'opération.

* Informations de temporisation : combien de temps chaque appel d'outil ou étape d'agent a pris.


**Non visible :**

* Le processus interne de génération token par token (sauf si la capture de contenu est activée, ce qui enregistre le texte complet de l'invite et de la réponse).

* Pourquoi le LLM a choisi un outil plutôt qu'un autre — seul le résultat est enregistré. Par exemple, vous pouvez voir que `bash` a été appelé, mais pas qu'il a été sélectionné parce que le LLM « pensait » que c'était l'outil le plus approprié.

* La distribution de probabilité ou les scores de confiance pour chaque token. Ceux-ci ne sont pas exposés dans l'instrumentation Copilot actuelle.

Comprendre ces limites est critique : l'observabilité vous donne un journal détaillé de ce qui s'est passé, mais elle n'explique pas le raisonnement interne du modèle. C'est un outil de diagnostic, pas un dispositif de lecture de pensées.

## Méthode 1 : Les outils de débogage LLM intégrés de VS Code

VS Code fournit une fenêtre de débogage pour les développeurs qui vous permet d'inspecter l'historique de chat et de voir comment le LLM a traité vos invites et votre contexte. Pour y accéder :

1. Ouvrez la palette de commandes (`Ctrl+Shift+P` ou `Cmd+Shift+P`).

2. Exécutez « Développeur : Activer les outils de développement ».

3. Dans le panneau des outils de développement, basculez vers l'onglet « Console » et filtrez les messages de l'extension Copilot.

4. Recherchez les entrées de journal qui montrent l'historique de chat complet, y compris l'invite système, les messages utilisateur et les réponses de l'assistant.

Cette vue montre les interactions finales — ce qui a été envoyé au modèle et ce qui est revenu. Elle est utile pour un débogage rapide lorsque vous voulez voir exactement quel contexte était inclus ou vérifier qu'une instruction particulière a été suivie. Cependant, elle a des limitations significatives :

* Elle ne montre que l'état final, pas la séquence en temps réel des appels d'outils ou des étapes d'agent.

* Il n'y a pas de trace structurée ; vous devez analyser la sortie brute du journal.

* Elle ne capture pas les métriques ou les relations entre spans.

* Elle fonctionne uniquement dans VS Code, pas pour l'application de bureau Copilot ou d'autres éditeurs.

Quand utiliser cette approche : quand vous avez besoin d'une vérification rapide sans dépendance — par exemple, pour confirmer que le LLM voit le contenu correct des fichiers ou pour diagnostiquer pourquoi une invite a été mal interprétée. Pour une analyse plus approfondie, vous avez besoin du pipeline d'observabilité complet.

## Méthode 2 : Observabilité complète avec OpenTelemetry (plongée en profondeur)

### Aperçu de l'architecture

L'architecture recommandée pour capturer la télémétrie Copilot est :

```plaintext
Copilot (VS Code ou application de bureau)
    → Exportateur OTLP (gRPC ou HTTP)
    → Collecteur OpenTelemetry
    → Tableau de bord Aspire (ou autre backend)
```

Copilot, lorsqu'il est configuré pour exporter des données OpenTelemetry, envoie des traces et des spans à un point de terminaison OTLP. Le collecteur OpenTelemetry reçoit ces traces, les traite (lot, filtre, enrichit) et les transmet à un backend de visualisation. Pour le développement local, le tableau de bord Aspire (fait partie de .NET Aspire) fournit une interface simple et autonome qui affiche les traces, les spans et les métriques.

Les variables d'environnement clés contrôlent ce pipeline :

* `COPILOT_OTEL_ENABLED` : défini à `true` pour activer l'exportation OpenTelemetry.

* `OTEL_EXPORTER_OTLP_ENDPOINT` : l'URL du récepteur OTLP (par exemple, `http://localhost:4317` pour gRPC, `http://localhost:4318` pour HTTP).

* `COPILOT_OTEL_CAPTURE_CONTENT` : défini à `true` pour inclure le texte complet de l'invite et de la réponse dans les attributs des spans. **Utilisez avec précaution** — cela peut générer des traces très volumineuses et peut exposer du code sensible.


> **Note :** L'intégration OpenTelemetry de Copilot est actuellement en préversion. Assurez-vous d'utiliser une version compatible de VS Code et de l'extension Copilot. Les fonctionnalités en préversion peuvent changer, avoir un support limité ou nécessiter des versions spécifiques. Pour les derniers détails, consultez la documentation officielle [GitHub Copilot Telemetry (Preview)](https://docs.github.com/en/copilot/using-github-copilot/opentelemetry-telemetry).

### Configuration : VS Code

Dans VS Code, vous configurez OpenTelemetry via le fichier `settings.json`. Ajoutez les clés suivantes sous `github.copilot.chat.otel.*` :

```json
{
  "github.copilot.chat.otel.enabled": true,
  "github.copilot.chat.otel.endpoint": "http://localhost:4317",
  "github.copilot.chat.otel.captureContent": true
}
```

Remplacez le point de terminaison par l'adresse de votre collecteur. Si vous utilisez HTTP au lieu de gRPC, changez le port en `4318` et assurez-vous que le collecteur est configuré en conséquence.

Ces paramètres prennent effet immédiatement ; aucun redémarrage n'est nécessaire. Vous pouvez vérifier que les traces sont envoyées en vérifiant le panneau « Sortie » de VS Code pour le canal Copilot — il enregistrera un message comme « Exportateur OpenTelemetry démarré. »

### Configuration : Application de bureau Copilot (macOS)

L'application de bureau Copilot (pour macOS) n'a pas d'interface utilisateur de paramètres pour OpenTelemetry. Au lieu de cela, vous devez définir des variables d'environnement via un fichier plist LaunchAgent. C'est une approche spécifique à macOS ; les utilisateurs Windows et Linux doivent se référer aux alternatives de plateforme (voir la section Considérations pratiques).

**Création du plist étape par étape :**

1. Créez un fichier plist à `~/Library/LaunchAgents/com.github.copilot.otel.plist` avec le contenu suivant :


```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.github.copilot.otel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/open</string>
        <string>/Applications/GitHub Copilot.app</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>COPILOT_OTEL_ENABLED</key>
        <string>true</string>
        <key>OTEL_EXPORTER_OTLP_ENDPOINT</key>
        <string>http://localhost:4317</string>
        <key>COPILOT_OTEL_CAPTURE_CONTENT</key>
        <string>false</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

2. Chargez le LaunchAgent :

    ```bash
    launchctl load ~/Library/LaunchAgents/com.github.copilot.otel.plist
    ```

    Les variables d'environnement prendront effet au prochain lancement de l'application.

3. Redémarrez l'application de bureau Copilot (quittez et rouvrez).


Pour vérifier que les variables d'environnement sont définies, vous pouvez exécuter `launchctl setenv COPILOT_OTEL_ENABLED true` (temporaire) ou vérifier l'environnement du processus via `ps eww $(pgrep -f "GitHub Copilot")`.

**Note :** Cette méthode ne fonctionne que sur macOS. Pour Windows, définissez des variables d'environnement à l'échelle du système via « Propriétés système → Variables d'environnement » ou utilisez un script de démarrage. Pour Linux, utilisez une override de service systemd ou un wrapper shell qui exporte les variables avant de lancer l'application.

### Configuration locale du collecteur avec Docker

Pour collecter et visualiser les traces localement, vous avez besoin d'un collecteur OpenTelemetry et d'un tableau de bord. La configuration la plus simple utilise Docker Compose avec la distribution Contrib du collecteur OpenTelemetry et le tableau de bord Aspire.

Créez un fichier `docker-compose.yml` :

```yaml
version: '3.8'

services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"   # gRPC
      - "4318:4318"   # HTTP
    depends_on:
      - aspire-dashboard

  aspire-dashboard:
    image: mcr.microsoft.com/dotnet/aspire-dashboard:latest
    ports:
      - "18888:18888"   # UI du tableau de bord
      - "4319:4319"     # Ingestion OTLP (si nécessaire)
    environment:
      - DOTNET_ENVIRONMENT=Development
```

Maintenant, créez le fichier de configuration du collecteur `otel-collector-config.yaml` :

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: "0.0.0.0:4317"
      http:
        endpoint: "0.0.0.0:4318"

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024

connectors:
  spanmetrics:
    dimensions:
      - name: gen_ai.operation.name
        default: unknown
      - name: gen_ai.tool.name
        default: unknown
      - name: github.copilot.tool.parameters.skill_name
        default: unknown

exporters:
  otlp/aspire:
    endpoint: "aspire-dashboard:4319"
    tls:
      insecure: true

  logging:
    loglevel: debug

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/aspire, logging]
    metrics:
      receivers: [spanmetrics]
      exporters: [logging]
```

Dimensions clés pour l'observabilité LLM :

* `gen_ai.operation.name` : identifie le type d'opération LLM (par exemple, `chat`, `completion`, `agent`).

* `gen_ai.tool.name` : le nom de l'outil appelé (par exemple, `bash`, `read_bash`, `mcp_tool`).

* `github.copilot.tool.parameters.skill_name` : pour les compétences entreprise, le nom de la compétence invoquée.

Le connecteur `spanmetrics` génère des métriques à partir des données de trace, vous permettant de suivre la fréquence d'utilisation des outils et les types d'opérations au fil du temps.

### Démarrer et vérifier la configuration

1. Exécutez `docker compose up` dans le répertoire contenant le fichier `docker-compose.yml`.

2. Attendez que le collecteur et le tableau de bord démarre (vérifiez les journaux pour « Everything is ready »).

3. Ouvrez le tableau de bord Aspire à `http://localhost:18888`.

4. Dans VS Code ou l'application de bureau Copilot (avec OTEL activé), commencez un chat ou utilisez les fonctionnalités Copilot. Vous devriez voir les traces apparaître dans le tableau de bord en quelques secondes.

Le tableau de bord affichera une liste de traces. Cliquer sur une trace révèle une vue en cascade des spans, chacune avec ses attributs. Par exemple, une session de chat peut avoir un span racine « chat session » avec des spans enfants pour chaque appel d'outil. Les attributs des spans incluront les paramètres passés à l'outil, la durée, et (si la capture de contenu est activée) le texte complet de l'invite et de la réponse.

![](/images/lifting-the-lid-on-copilot-s-black-box-observability-for-llm-code-generation/00-36dfb6ae-e059-4779-bfb3-bee7cd22f303.png)

## Comprendre les données de trace

### Ce que chaque span représente

Une trace Copilot typique contient la hiérarchie de spans suivante :

* **Span racine** : représente une session de chat ou une seule interaction utilisateur. Les attributs incluent `gen_ai.operation.name` (par exemple, `chat`), `user.id` (si disponible) et `session.id`.

* **Spans enfants** : chaque appel d'outil ou invocation d'agent obtient son propre span. Par exemple :

    * Span `tool.call` avec `gen_ai.tool.name` = `bash` et attributs comme `gen_ai.tool.parameters.command`.

    * Span `tool.call` pour `read_bash` avec le chemin du fichier de sortie.

    * Span `agent.invoke` avec `gen_ai.operation.name` = `agent` et `github.copilot.tool.parameters.skill_name` = `deploy_approval`.

* **Appels d'outils MCP** : si Copilot utilise le Model Context Protocol (MCP), un span avec `gen_ai.tool.name` = `mcp_tool` et attributs supplémentaires comme `mcp.tool.server` et `mcp.tool.name`.


> **Note :** Les noms exacts des attributs (par exemple, `gen_ai.tool.parameters.command`) peuvent varier légèrement selon la version de Copilot et l'instrumentation. Pour le schéma le plus à jour, consultez la documentation officielle [GitHub Copilot Telemetry (Preview)](https://docs.github.com/en/copilot/using-github-copilot/opentelemetry-telemetry).

### Interpréter le flux de « réflexion »

En lisant la séquence de spans dans une trace, vous pouvez reconstruire le chemin de décision du LLM. Considérez cet exemple :

1. L'utilisateur demande : « Déployer en production. »

2. Span racine : session de chat.

3. Span enfant : `tool.call` → `bash` avec la commande `git status`.

4. Span enfant : `tool.call` → `read_bash` avec la sortie « On branch main, clean working tree. »

5. Span enfant : `tool.call` → `bash` avec la commande `./deploy.sh`.

6. Span enfant : `agent.invoke` → compétence entreprise `deploy_approval` avec les paramètres `{environment: "production"}`.

De cette trace, vous pouvez voir que le LLM a d'abord vérifié la branche actuelle, puis a décidé d'exécuter un script de déploiement, et enfin a invoqué une compétence d'approbation. Les attributs des spans vous indiquent les commandes exactes et les paramètres utilisés. Si la capture de contenu est activée, vous pouvez également voir l'invite qui a conduit à chaque appel d'outil et la réponse qui a généré l'étape suivante.

Ce flux n'est pas un enregistrement des « pensées » internes du modèle mais un journal précis des actions qu'il a effectuées. Il est précieux pour déboguer un comportement inattendu, comme quand le LLM appelle un outil que vous n'aviez pas l'intention d'appeler ou saute une étape de validation critique.

### Métriques des traces

Le connecteur `spanmetrics` dans le collecteur produit des métriques à partir des données de trace. Ces métriques peuvent être exportées vers Prometheus, Grafana, ou simplement journalisées. Les métriques courantes incluent :

* **Nombre d'appels d'outils** par `gen_ai.tool.name` : combien de fois chaque outil a été utilisé.

* **Distribution du type d'opération** par `gen_ai.operation.name` : proportion de spans chat vs. agent vs. completion.

* **Fréquence d'invocation des compétences** par `github.copilot.tool.parameters.skill_name` : quelles compétences entreprise sont les plus utilisées.

* **Percentiles de durée** pour les appels d'outils et les sessions de chat.

Ces métriques agrégées vous aident à comprendre les modèles d'utilisation et à identifier les goulots d'étranglement de performance ou l'utilisation inattendue d'outils dans votre équipe.

## Considérations pratiques

### Impact sur les performances

L'activation de l'exportation OpenTelemetry ajoute une surcharge minimale quand la capture de contenu est désactivée — l'exportateur envoie les spans par lots et de manière asynchrone. Cependant, activer `COPILOT_OTEL_CAPTURE_CONTENT` peut générer des traces très volumineuses (les invites et réponses peuvent avoir des milliers de tokens). Cela peut augmenter l'utilisation de la mémoire dans le collecteur et la bande passante réseau.

**Recommandation :** Activez la capture de contenu uniquement pendant les sessions de débogage ciblées, pas en continu. Utilisez le processeur `batch` dans le collecteur pour réduire le nombre de requêtes sortantes. Pour une utilisation en production, envisagez l'échantillonnage des traces (par exemple, conservez 1 % des traces) pour réduire le volume.

### Sécurité et confidentialité

La configuration par défaut du collecteur expose les ports `4317` et `4318` à l'hôte. Dans un environnement de développement local, cela est généralement acceptable, mais si vous exécutez le collecteur sur une machine partagée ou en production, vous devriez :

* Restreindre l'accès réseau (par exemple, liez à `127.0.0.1` au lieu de `0.0.0.0`).

* Ajouter le chiffrement TLS et une clé API pour le récepteur OTLP.

* Utiliser un intergiciel d'authentification dans le collecteur.

La capture de contenu inclut potentiellement du code sensible, des secrets ou des informations propriétaires. Soyez conscient des politiques de rétention des données — envisagez de définir un TTL sur la mémoire du collecteur ou d'utiliser une base de données qui prend en charge la suppression automatique. Ne laissez jamais la capture de contenu activée dans un environnement partagé sans auditer ce qui est enregistré.

### Limitations multiplateformes

* **Configuration VS Code** fonctionne de manière identique sur Windows, macOS et Linux via `settings.json`.

* **Application de bureau Copilot** : l'approche LaunchAgent est exclusive à macOS. Sur Windows, définissez des variables d'environnement via Propriétés système → Variables d'environnement (à l'échelle du système) ou utilisez un script batch qui lance l'application avec `set COPILOT_OTEL_ENABLED=true`. Sur Linux, utilisez une override de service systemd avec des directives `Environment=`, ou un wrapper shell qui exporte les variables avant d'exécuter l'application.

* **Collecteur et tableau de bord** : Docker Compose fonctionne sur toutes les plateformes, mais vous pouvez avoir besoin d'ajuster les paramètres réseau (par exemple, sur Windows, utilisez `host.docker.internal` au lieu de `localhost` pour le point de terminaison OTLP).

## Sujets avancés et alternatives

### Outils de visualisation alternatifs

Le tableau de bord Aspire est pratique pour le développement local, mais vous pouvez le remplacer par n'importe quel backend compatible OpenTelemetry :

* **Jaeger** : un outil classique de traçage distribué avec de puissantes capacités de requête et des graphes de dépendances de services. Utilisez l'exportateur Jaeger dans le collecteur.

* **Zipkin** : similaire à Jaeger, avec une interface plus simple.

* **Grafana Tempo** : un backend de stockage de traces évolutif et rentable qui s'intègre à Grafana pour les tableaux de bord.

compromis : Aspire offre la configuration la plus simple (image Docker unique), tandis que Jaeger et Tempo offrent des fonctionnalités de requête et d'agrégation plus riches, especialmente pour les volumes de traces importants. Pour un contexte d'équipe, envisagez d'utiliser Grafana Tempo avec la stack Grafana pour les métriques, les journaux et les traces unifiés.

### Corrélation des traces avec les sessions de chat

Pour déboguer une interaction utilisateur spécifique, vous devez mapper la trace à la session de chat. L'instrumentation Copilot inclut généralement un `session_id` ou `trace_id` dans les attributs du span racine. Vous pouvez rechercher cet ID dans le tableau de bord ou exporter les traces vers un système d'agrégation de journaux. Si votre collecteur est configuré pour enregistrer les données des spans, vous pouvez rechercher l'ID de session dans la sortie du collecteur.

Pour une corrélation plus approfondie, envisagez d'ajouter un attribut personnalisé (par exemple, `user.id` ou `chat.id`) via l'API Copilot si vous construisez une extension personnalisée.

### Extension aux agents personnalisés et serveurs MCP

Si vous avez construit des agents personnalisés ou des serveurs MCP qui interagissent avec Copilot, vous pouvez les instrumenter avec OpenTelemetry pour obtenir des traces de bout en bout. Par exemple :

* Ajoutez des attributs de span aux gestionnaires d'outils de votre serveur MCP en utilisant le SDK OpenTelemetry pour votre langage (Python, Node.js, Go, etc.).

* Propagez le contexte de trace de l'exportation OTLP de Copilot vers votre serveur via l'en-tête `traceparent` (si vous utilisez HTTP) ou les métadonnées gRPC.

* Assurez-vous que les spans de votre agent personnalisé apparaissent comme des spans enfants sous le span racine de la session de chat Copilot.

Cela vous permet de voir le parcours complet : de la question de l'utilisateur, à travers la sélection d'outils de Copilot, jusqu'à votre logique personnalisée et retour.

## Résumé et recommandations

**Quand utiliser les outils de débogage intégrés de VS Code :**

* Débogage rapide et ponctuel d'une seule interaction de chat.

* Aucune dépendance externe — fonctionne out of the box.

* Limité à voir l'invite/réponse finale, pas les séquences d'appels d'outils.


**Quand utiliser la configuration OTEL complète :**

* Vous devez comprendre la séquence des appels d'outils et des invocations d'agents.

* Vous voulez agréger des métriques sur plusieurs sessions ou utilisateurs.

* Vous déboguez des interactions complexes impliquant des compétences entreprise ou des outils MCP.

* Vous construisez des agents personnalisés et avez besoin d'une corrélation de traces de bout en bout.


**Guide de démarrage rapide pour les utilisateurs VS Code :**

1. Ajoutez les trois paramètres `github.copilot.chat.otel.*` à votre `settings.json`.

2. Exécutez la configuration Docker Compose de la section Configuration locale du collecteur.

3. Commencez à utiliser Copilot — les traces apparaissent dans le tableau de bord Aspire à `http://localhost:18888`.


**Configuration complète pour les équipes :**

* Déployez le collecteur OpenTelemetry comme un service partagé (par exemple, dans un cluster Kubernetes ou sur une VM).

* Utilisez un backend évolutif comme Grafana Tempo ou Jaeger.

* Activez la capture de contenu uniquement sur demande, et implémentez des politiques de rétention.

* Instrumentez les agents personnalisés et les serveurs MCP pour une observabilité unifiée.


**Prochaines étapes :**

* Expérimentez avec la capture de contenu pour voir l'invite/réponse complète dans les traces.

* Construisez des tableaux de bord de métriques dans Grafana en utilisant les dimensions spanmetrics.

* Étendez la configuration pour couvrir vos propres outils et agents.


En soulevant le couvercle de la boîte noire de Copilot, vous gagnez la confiance nécessaire pour faire confiance à ses sorties, diagnostiquer les échecs et optimiser votre workflow de développement assisté par IA.

## Sources

* [Documentation OpenTelemetry](https://opentelemetry.io/docs/) — utilisée pour la configuration du collecteur et les détails du protocole OTLP.

* [GitHub Copilot Telemetry (Preview)](https://docs.github.com/en/copilot/using-github-copilot/opentelemetry-telemetry) — documentation officielle pour l'exportation OpenTelemetry de Copilot (variables d'environnement et paramètres).

* [.NET Aspire Dashboard](https://learn.microsoft.com/en-us/dotnet/aspire/fundamentals/dashboard) — utilisé pour la visualisation locale des traces.

* [OpenTelemetry Collector Contrib](https://github.com/open-telemetry/opentelemetry-collector-contrib) — référence pour le connecteur spanmetrics et le processeur batch.

* [VS Code Developer Tools](https://code.visualstudio.com/docs/editor/developer-tools) — utilisés pour accéder à la console de débogage.
