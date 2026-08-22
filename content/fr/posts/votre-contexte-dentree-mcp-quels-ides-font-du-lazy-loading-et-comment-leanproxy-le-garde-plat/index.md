---
title: 'Votre contexte d''entrée MCP : quels IDE font du lazy loading et comment LeanProxy le garde plat'
tags:
- ai
- mcp
- model-context-protocol
- claude-code
- cursor
- token-optimization
- leanproxy
- ai-coding-agents
date: '2026-08-23T09:00:00.000000+00:00'
slug: votre-contexte-dentree-mcp-quels-ides-font-du-lazy-loading-et-comment-leanproxy-le-garde-plat
translationKey: mcp-input-context-ides-lazy-loading
url: /fr/votre-contexte-dentree-mcp-quels-ides-font-du-lazy-loading-et-comment-leanproxy-le-garde-plat/
aliases:
- /votre-contexte-dentree-mcp-quels-ides-font-du-lazy-loading-et-comment-leanproxy-le-garde-plat
description: Chaque serveur MCP que vous gardez activé prélève un tribut sur votre contexte d'entrée à chaque requête. Mais tous les IDE ne chargent pas les outils de la même façon. Découvrez qui fait du lazy loading, qui n'en fait pas, et comment LeanProxy maintient votre contexte à taille constante quel que soit le nombre de serveurs configurés et actifs.
---



Chaque fois que je lis des articles sur les serveurs MCP, la conversation porte presque toujours sur les fonctionnalités : *« Connectez ceci, connectez cela, le modèle peut désormais faire X, Y et Z. »*

Ce que personne ne dit, c'est ce qui arrive réellement à votre **contexte d'entrée** au moment où vous activez un serveur.

Chaque outil MCP que vous ajoutez transporte un schema — un nom, une description, un plan JSON de paramètres. Dans la plupart des IDE, ces schemas accompagnent **chaque requête** envoyée au modèle, que l'outil soit utilisé ou non. Ils logent dans une partie de votre entrée que vous ne voyez pas, ils consomment des tokens facturés par votre abonnement pay-per-token, et ils grignotent exactement le même budget que se partagent votre code, votre conversation et vos instructions.

Résultat ? Activez trois serveurs « sport » ou « dev », et une grosse partie de votre fenêtre de contexte ne fait rien d'utile. Le plus intéressant, c'est que **tous les IDE ne se comportent pas de la même façon**. Regardons ce qui se passe réellement en ce moment.

## Si vous ne l'utilisez pas, il paie quand même un loyer

Un tool schema est un petit document JSON : le nom de l'outil, une description lisible, et le schema JSON de ses paramètres. Un serveur MCP comme celui de GitHub en expose des dizaines ; Garmin en expose une centaine.

Quand un IDE fonctionne en mode *eager* — le mode par défaut pour la plupart des outils — la liste complète des outils de chaque serveur activé est injectée dans le system prompt ou dans la requête. Le modèle ne peut pas s'en débarrasser, puisque cela fait partie de l'entrée à chaque tour.

La taille grimpe vite. J'ai déjà décrit cette même « taxe sur les schémas » dans un précédent [post](/the-hidden-tax-on-every-ai-request-how-mcp-servers-are-draining-your-token-budget/) : rien que pour avoir Garmin, GitHub et Intervals.icu à disposition, il faut compter environ 16,000 à 17,000 tokens par requête dans mon environnement.

Mais attendez — je dois nuancer : tous les IDE ne chargent pas les définitions d'outils en eager. Et c'est là que l'histoire devient intéressante.

* * *

## Bilan 2026 : qui fait du lazy loading des outils MCP ?

J'ai passé au crible la documentation actuelle et les *issue trackers* des principaux clients, pour voir comment chacun charge les outils MCP dans le contexte d'entrée. Résultats plus contrastés qu'on ne le croit :

| Client | Stratégie de chargement (août 2026) | Lazy / on-demand | Docs & limites |
|:---|:---|:---|:---|
| **Claude Code** | **Lazy (par défaut)** — « MCP Tool Search » | Oui ; récupère quelques outils à la demande | Nécessite des modèles Claude 4.5+ ; retombe en eager selon la configuration (`docs.claude.com`) |
| **VS Code / Copilot** | Hybride — lazy pour les modèles autorisés | Partiel (tool search pour GPT-5.x, Claude 4.5+) | Plafond dur de 128 tools ; regroupement virtuel à partir de 64 tools (`code.visualstudio.com/docs`) |
| **Cursor** | Eager | Non | Tous les outils activés chargés à chaque requête ; aucun plafond documenté (`docs.cursor.com`) |
| **Windsurf / Devin Desktop (Cascade)** | Eager | Non | Plafond dur de 100 tools (`docs.devin.ai`) |
| **Cline** | Eager | Non | Toutes les définitions d'outils injectées en une fois dans le system prompt (`docs.cline.bot`) |
| **Gemini CLI** | Eager | Non | Registre au démarrage, espaces de noms `mcp_<serveur>_<tool>` (`geminicli.com/docs`) |
| **JetBrains AI Assistant** | Eager (supposé) | Non | Outils « deviennent disponibles », invoqués automatiquement ; aucune recherche documentée |
| **opencode** | Eager | Non | La doc prévient que les serveurs MCP « s'ajoutent au contexte » (`opencode.ai/docs`) |
| **Roo Code (QuillBot)** | Eager | Non | Retrait explicite lié à la « réduction de l'utilisation de tokens » ; archivé en mai 2026 |
| **Continue** | Uniquement agent, non vérifié | — | Probablement eager, aucun impact documenté sur les tokens |
| **Aider** | N/A | — | Pas d'outil client MCP natif |

En résumé : **seul Claude Code fait du lazy loading par défaut**, VS Code / Copilot ne le fait que partiellement selon le modèle, et **tous les autres restent en eager** : les tool schemas atteignent donc le modèle à chaque tour.

## Claude Code : le lazy par défaut

Claude Code fait figure d'exception. Depuis le lancement de MCP Tool Search, les outils ne sont plus tous injectés en eager. Le client envoie plutôt un résumé de l'outil disponible, et un outil de recherche dédié — `ToolSearch` — récupère les schemas les plus pertinents à la demande : en pratique, il en extrait jusqu'à **quelques outils par requête**, selon ce que la tâche demande. Les outils récupérés au cours d'un tour restent disponibles pour les tours suivants. Dans la doc de Claude, `ENABLE_TOOL_SEARCH` peut être `true`, `auto:5` (aller chercher jusqu'à 5 outils) ou `false` ; et **`false` revient à l'ancien comportement : toutes les définitions d'outils partent dans le contexte à chaque tour**.

Le hic : ce mode « lazy par défaut » exige un modèle Claude récent (Sonnet 4.5+ / Haiku 4.5+ / Opus 4.5+). Si vous routez via `ANTHROPIC_BASE_URL` vers une passerelle ou tout fournisseur tiers non-first-party, Claude Code retombe sur du chargement eager. Même chose avec Microsoft Foundry sur Azure ou Google Cloud Agent Platform : tout part dans le contexte.

La moins connue des deux, c'est le **cache de découverte MCP** (`MCP_DISCOVERY_CACHE`) : Claude Code met désormais en cache les serveurs distants HTTP/SSE. Un serveur affiché `cached 2h ago · connects on first use · 5 tools` ne démarre même pas si le cache est frais — il ne se connecte pas au serveur tant que vous n'utilisez pas réellement le premier outil. Ça, c'est du vrai lazy loading côté serveur, pas seulement côté schema.

## Cursor, Windsurf, Cline, Copilot, JetBrains, opencode — le camp du eager

Tous les autres clients que j'ai vérifiés traitent encore tous vos outils MCP activés comme toujours allumés. Soyons précis, car le comportement exact a son importance :

- **Cursor** — la doc dit que Cursor utilise automatiquement les outils MCP listés sous Available Tools quand c'est pertinent. Ce compartiment « Available Tools » fait partie de la ventilation du contexte que Cursor affiche désormais, et il y figure dès le premier message.
- **Windsurf (Devin Desktop)** — Cascade reçoit tous les outils activés des serveurs MCP connectés, sans aucun chargement à la demande. Il y a un plafond dur documenté : « Cascade has a limit of **100 tools** at its disposal ». Au-delà, vous devez choisir quels outils exclure.
- **Cline** — injecte en une seule fois les définitions de tous les outils disponibles dans le system prompt. Une discussion ouverte demandait un « defer loading » / une tool search ; elle n'a pas été livrée.
- **VS Code / Copilot** — l'agent local et l'hôte d'agent de Copilot chargent par défaut tous les outils sélectionnés dans la requête. Pour une petite liste blanche de modèles, la recherche d'outils côté client prend le relais ; pour tous les autres, c'est de l'eager intégral. Et il y a une limite dure : **128 tools par requête de message**.
- **JetBrains AI Assistant** — les outils « deviennent disponibles » et sont invoqués automatiquement, ou via le sélecteur d'outils ; aucun lazy loading documenté.
- **opencode** — je l'ai retrouvé noir sur blanc dans la doc d'opencode : ["Quand vous utilisez un serveur MCP, il s'ajoute au contexte. Ça peut vite faire du volume... Les serveurs MCP s'ajoutent au contexte, alors soyez prudent sur ceux que vous activez."](https://opencode.ai/docs/mcp-servers/) — c'est littéralement pour cela qu'ils recommandent de désactiver les serveurs.

Donc, dans la plupart des IDE, ajouter un serveur — même un que vous utilisez rarement — **augmente directement la taille de votre contexte** : vous perdez de la place pour votre code, vos fichiers, vos instructions et votre conversation.

## Le coût réel : les chiffres ne sont pas symboliques

J'ai mesuré la taille du « tool namespace » de mon propre environnement avec LeanProxy et l'estimateur canonique `pkg/reporter.Estimator` (1 token ≈ 4 caractères, enveloppe JSON-RPC incluse). Liste d'outils MCP native, sans aucune remise de cache, comparée au routeur LeanProxy : 3 tools, ~158 tokens.

| Configuration | MCP natif (brut) | LeanProxy (routeur) | Gains |
|:---|:---|:---|:---|
| 1 serveur — Intervals.icu (10 tools) | 1,129 tokens | 158 tokens | **86,0%** |
| 1 serveur — GitHub (41 tools) | 4,570 tokens | 158 tokens | **96,5%** |
| 1 serveur — Garmin (100 tools) | 11,130 tokens | 158 tokens | **98,6%** |
| 3 serveurs — 151 tools | 16,830 tokens | 158 tokens | **99,1%** |

Replays de session au taux réaliste de lecture du cache de 0,25× (les cache hits ne sont PAS gratuits) :

| Scénario réel | MCP natif | LeanProxy | Gains |
| --- | --- | --- | --- |
| Sport du matin (2 serveurs, 4 prompts) | ~12,260 | ~740 | **94,0%** |
| Workflow de dev (2 serveurs, 5 prompts) | ~7,120 | ~925 | **87,0%** |
| Journée complète (3 serveurs, 7 prompts) | ~29,450 | ~1,295 | **95,6%** |

La méthodologie complète et les tableaux figurent dans le [benchmark de LeanProxy](https://github.com/mmornati/leanproxy-mcp/blob/main/docs/benchmark-results.md) (dossier `docs/` du dépôt).

* * *

## Comment LeanProxy garde la taille de votre contexte constante

La façon dont LeanProxy résout ce problème est conceptuellement ridicule — et c'est exactement pour ça que ça marche.

**LeanProxy se présente à votre IDE comme un serveur MCP unique.** Pas quatre, pas douze : **un seul**, avec exactement **trois tools** — `list_servers`, `list_tools`, `invoke_tool` — soit environ **158 tokens**.

Ces trois outils sont tout ce que le client voit, tout ce que le contexte consomme. Le jour où le modèle a réellement besoin de l'API GitHub, il appelle `invoke_tool("github", ...)` ; LeanProxy charge alors le serveur, le schema en JIT, et route la requête. Les stubs d'outils sont résolus à la première utilisation (~26 tokens/stub), puis mis en cache.

La taille du contexte est donc **fixe** — identique, quel que soit le nombre de serveurs MCP que vous gardez configurés derrière LeanProxy. Ajoutez Garmin, Intervals.icu, HASS pour Home Assistant, Stitch, GitHub : le contexte reste à trois tools. Trois. L'IDE ne voit jamais les « 100 autres » tools.

Même pour les IDE qui font du lazy loading (Claude Code et sa tool search), cela compte : le client n'a jamais qu'une poignée de tools sous la main, donc la découverte est plus rapide, la synthèse est minuscule, chaque cache hit évite une rotation de schemas, et — même si vous désactivez un jour la tool search pour repasser en eager — vous ne payez que 158 tokens au lieu de 16,000.

## Celui qu'on peut garder, et celui qui paie

Voilà le point clé : **vous pouvez garder TOUS vos serveurs MCP configurés et marqués actifs** — GitHub pour le code, Garmin et Intervals.icu pour le sport, celui de Home Assistant pour la domotique — et le contexte d'entrée reste exactement le même. L'IDE ne fait simplement plus exploser son budget tokens en schemas.

Plus de jonglage. Fini les allers-retours *« lequel des 4 serveurs me faut-il pour cette session ? »* que l'on oublie et que l'on paie ensuite toute la journée. LeanProxy s'en occupe en arrière-plan, et l'explosion d'outils devient invisible.

Si cela vous parle, le projet est sur GitHub : [mmornati/leanproxy-mcp](https://github.com/mmornati/leanproxy-mcp). Et avant de le brancher, vous pouvez avoir un aperçu des gains sans toucher à vos requêtes en production :

```
# preview how many tokens LeanProxy would save you
leanproxy-mcp report --dry-run
```

* * *

**La vérité inconfortable** : dans la plupart des IDE actuels, les intégrations MCP vous facturent, à chaque tour, des outils que vous n'appelez jamais — le lazy loading reste l'exception, pas la règle. C'est pourquoi garder un proxy comme LeanProxy devant vos serveurs MCP est la seule façon de les conserver tous configurés et actifs sans voir votre contexte d'entrée grossir à chaque serveur ajouté.

Keep the capability, lose the tax.