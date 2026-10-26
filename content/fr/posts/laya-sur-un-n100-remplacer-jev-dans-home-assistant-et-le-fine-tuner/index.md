---
title: 'Laya sur un N100 : remplacer Jev par un modèle local dans Home Assistant, et lui apprendre ma maison'
categories:
- smart-home
tags:
- home-assistant
- smart-home
- automation
- ai
- jev
- laya
- fine-tuning
- distillation
- docker
- self-hosting
date: '2026-10-27T18:00:00.000000+00:00'
draft: false
slug: laya-sur-un-n100-remplacer-jev-dans-home-assistant-et-le-fine-tuner
translationKey: laya-n100-home-assistant
cover: cover.jpg
showHero: true
description: Laya parle l'API de Jev, alors je l'ai mis dans un conteneur Docker sur mon mini PC N100 et j'ai pointé Home Assistant dessus. Ça marche, c'est lent mais assez rapide, et ses réponses de base sont inutilisables pour ma maison. Puis, en expérience locale, je l'ai fine-tuné sur mon MacBook avec deux semaines de vraies requêtes Home Assistant. Comment marche l'entraînement, comment servir le nouveau checkpoint, les chiffres sur des jours mis de côté, et pourquoi tout ça reste une expérience.
summary: Un modèle compatible Jev qui tourne sur un mini PC à 4 cœurs, sans qu'aucune donnée de mes capteurs ne quitte la maison. Tel quel, il disait « oui » à presque tout. Après une heure d'entraînement sur mon MacBook, il est d'accord avec Jev 93 % du temps sur des jours qu'il n'a jamais vus. Assez bon pour le mode shadow, pas pour piloter la maison, et avec une question de conditions d'utilisation que je ne peux pas ignorer.
projects:
- ha-decision-models
---

Depuis un mois, mon Home Assistant pose à **Jev** les questions auxquelles mes règles YAML répondent mal : *faut-il booster la ventilation maintenant ? Faut-il baisser ces volets ? Ce débit d'eau est-il normal ?* J'ai décrit l'installation dans [le premier article](/fr/jev-home-assistant-un-modele-de-decision-pour-mes-automatisations/), puis l'historique et la boucle de retour dans [le deuxième](/fr/jev-home-assistant-historique-retour-et-la-question-du-modele-local/). Jev, c'est le modèle « System One » hébergé de TypeSafe : vous lui envoyez un state JSON et des questions typées, il vous renvoie des probabilités calibrées, pour une fraction de centime par jour.

**Laya**, de Convai Innovations, c'est l'alternative open weights que je suis depuis le [benchmark du routeur](/fr/system-one-router-choisir-le-bon-llm-pour-chaque-prompt/), en passant par [un fine-tuning sur mes étiquettes](/fr/laya-vs-jev-dix-jours-plus-tard-fine-tuning-sur-un-macbook/) et [la vérification de la 0.4.2](/fr/laya-0-4-2-et-vegaml-un-modele-de-decision-a-moteur-physique-sur-un-macbook/). Il parle la même API que Jev. Et il a un argument qu'aucun benchmark ne mesure : s'il tourne à la maison, **aucune donnée de ma maison ne part nulle part**. L'humidité de mes salles de bain, les moments où les volets bougent, la présence de quelqu'un à la maison : c'est exactement le genre de données que je préfère garder sur mon propre réseau.

Dans le deuxième article, j'expliquais pourquoi je n'étais pas passé en local sur mon mini PC N100. Cette fois, j'ai arrêté d'argumenter et je l'ai installé. Cet article couvre :

1.  faire tourner Laya dans Docker sur un N100 et le brancher sur Home Assistant ;
2.  ce qui s'est passé quand j'ai rejoué à travers lui deux semaines de **vraies** requêtes Jev ;
3.  une expérience locale : **fine-tuner Laya sur ces requêtes**, comment ça marche, comment servir le résultat, et les chiffres ;
4.  si ça en valait la peine.

## Laya dans un conteneur sur un N100

Le matériel, c'est un petit boîtier Intel N100 : 4 cœurs, 16 Go de RAM, pas de GPU, et déjà occupé par d'autres conteneurs. Je le gère avec Coolify, mais n'importe quel hôte Docker fait l'affaire. Laya fournit son propre serveur, `laya-serve`, qui expose `POST /v1/systemone` avec la même forme de requête et de réponse que Jev.

Ma première version installait tout au démarrage du conteneur :

```yaml
services:
  laya-api:
    image: python:3.13-slim
    restart: unless-stopped
    command: >
      sh -c "pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu &&
             pip install --no-cache-dir 'laya[serve]' &&
             laya-serve"
    environment:
      - LAYA_HOST=0.0.0.0
      - LAYA_PORT=8000
      - LAYA_SERVER_PRELOAD=multilingual
      - OMP_NUM_THREADS=4
      - PYTHONUNBUFFERED=1
    volumes:
      - laya_model_cache:/root/.cache/huggingface
    ports:
      - "8180:8000"
    healthcheck:
      test: ["CMD", "python3", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 30s
      start_period: 120s

volumes:
  laya_model_cache:
```

Ça marche, et c'est une bonne façon d'essayer Laya en cinq minutes. Quelques remarques si vous la gardez :

*   **Utilisez le wheel PyTorch CPU uniquement.** Celui par défaut tire des bibliothèques CUDA inutilisables sur un N100 et pèse plusieurs gigaoctets de plus.
*   **Gardez le cache Hugging Face dans un volume**, sinon chaque redémarrage retélécharge le checkpoint.
*   **`OMP_NUM_THREADS=4`** correspond aux quatre cœurs du N100. Ajouter des workers ou des réplicas n'aide pas : chaque requête utilise déjà les quatre cœurs.
*   **Figez vos versions.** Ce `command:` réinstalle un `laya[serve]` non figé à chaque redémarrage : un redémarrage peut donc ramener en silence une nouvelle version qui répond différemment, après plusieurs minutes d'installation. Une fois que vous savez que vous voulez le garder, intégrez-le dans une image :

```dockerfile
FROM python:3.13-slim
RUN pip install --no-cache-dir torch==2.14.1 --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir "laya[serve]==0.4.15"
ENV LAYA_HOST=0.0.0.0 LAYA_PORT=8000 OMP_NUM_THREADS=4 PYTHONUNBUFFERED=1
CMD ["laya-serve"]
```

Je précharge le checkpoint **multilingue** : il lit 1 024 tokens, contre 512 pour l'anglais, et mes requêtes sont longues.

### Le brancher sur Home Assistant

L'[intégration HA-Jev](https://github.com/AboveColin/HA-Jev) que j'utilise accepte déjà une adresse personnalisée. Basculer est donc un changement de configuration, pas de code : une deuxième entrée avec l'URL `http://<your-laya-host>:8180`, le modèle `multilingual`, et pas de clé d'API (l'intégration prévient que c'est du HTTP en clair, ce qui est acceptable sur un réseau local). Les scripts qui interrogent Jev prennent un `config_entry`, chaque décision peut donc être pointée vers l'un ou l'autre.

C'était la partie facile. La suite a été moins drôle.

## Premiers résultats : ça marche, lentement, et les réponses sont fausses

### Laya coupe votre requête, et Home Assistant ne le voit pas

Mon premier test était une vraie requête VMC (ventilation), celle où Jev décide s'il faut lancer la bruyante vitesse 2. Laya a répondu 0,9954, « booster », là où Jev avait dit 0,49. Laya avait l'air décidé. Puis j'ai lu le reste de la réponse :

```json
"usage": {"input_tokens": 1024, "state_tokens": 960,
          "state_tokens_dropped": 196, "truncated": true}
```

Le checkpoint multilingue lit 1 024 tokens au total, dont 256 sont réservés à la question et à ses options. Mon state VMC fait environ 1 150 tokens, parce que le [deuxième article](/fr/jev-home-assistant-historique-retour-et-la-question-du-modele-local/) a donné une mémoire à Jev : trois heures d'humidité par pièce, les événements récents, chaque pièce comparée à sa propre médiane quotidienne. Laya laisse tout simplement tomber la fin.

Deux expériences ont montré exactement ce qui se perd. J'ai placé un fait décisif (« porte du garage ouverte/fermée ») après 1 500 tokens de remplissage : les deux versions ont renvoyé exactement 0,7307, Laya ne l'a donc jamais vu. Puis, sur la vraie requête, passer `away` et `sleeping` à on, ou changer les seuils à la fin du contexte de la question, renvoyait **exactement** 0,9954 à chaque fois. Laya coupe la **fin du state**, c'est-à-dire là où se trouvaient mes `away`, `sleeping`, les données extérieures et les avertissements sur les capteurs peu fiables. Il plafonne aussi la question à 256 tokens et coupe la fin d'un contexte trop long sans le signaler.

Et l'intégration ne vous le dit jamais : le client lit les réponses et le nombre de tokens, pas le drapeau `truncated`. Dans Home Assistant, une réponse tronquée ressemble à n'importe quelle autre.

### Raccourcir les requêtes : seulement si les réponses de Jev ne changent pas

La solution évidente, c'est une requête plus courte. Une version compacte du state VMC, avec les faits décisifs en premier et un bloc par pièce, est passée de 1 221 à 471 tokens. Mais j'avais ajouté toutes ces données *parce que* Jev en avait besoin pour bien décider, alors je me suis fixé une règle : **un raccourcissement n'entre que si les réponses de Jev ne bougent pas plus que le bruit de Jev lui-même**.

Claude Code a d'abord mesuré ce bruit : la même vraie requête envoyée deux fois à Jev bouge de 0,013 en moyenne pour la VMC et de 0,007 pour les volets. Puis il a retiré un champ à la fois sur 50 situations réelles, et enfin testé les règles combinées sur 200 autres (environ 1 400 appels à Jev, 0,10 $) :

| Changement VMC | Gain | Écart moyen / max de la réponse de Jev | Verdict |
| --- | --- | --- | --- |
| Retirer les entrées vides | 126 o | 0,013 / 0,05 | bruit |
| Liste courte des capteurs peu fiables | 76 o | 0,009 / 0,03 | bruit |
| Retirer les lignes de pompe des événements | 154 o | 0,039 / 0,14 | **Jev s'en sert** |
| Retirer l'humidité absolue et le gain de ventilation | 104 o | 0,041 / 0,18 | **utilisé** |
| Retirer la série sur 3 heures | 741 o | 0,058 / 0,26 | **utilisé** |
| Retirer le texte de contexte | 1 079 o | 0,096 / 0,42 | **utilisé** |

Même ensemble, les règles « sûres » faisaient bouger les réponses VMC deux fois plus que le bruit et inversaient quatre décisions sur 120. Seuls les volets ont passé le test : garder les valeurs des séries sans les résumés min/max économise 15 % des tokens sans aucun changement, et c'est entré dans ma configuration. **La requête VMC reste telle quelle.** Elle ne rentre pas dans Laya, et la faire rentrer rendrait Jev moins bon.

### Est-ce assez rapide ?

Pour dimensionner, j'ai compté deux semaines de vrais appels à Jev : **1 416 appels, 101 par jour, 4,2 par heure** en moyenne. La minute la plus chargée en a compté 4, à :00 et :30, quand les questions programmées tombent en même temps. Sur le N100, sans rien d'autre qui interroge :

| Requête | Temps |
| --- | --- |
| Requête VMC complète (1 024 tokens, tronquée) | **4,9 s** (7,8 s pour le premier appel) |
| Requête VMC compacte (325 tokens) | **1,0 s** |
| 4 requêtes en même temps | 5,3 / 10,2 / 15,1 / **19,9 s** |

`laya-serve` traite **une requête à la fois**, une rafale fait donc la queue. Avec 4 en même temps, la dernière réponse prend 20 secondes, dans le timeout de 30 secondes de l'intégration, mais sans beaucoup de marge. Le coût grandit plus vite que la longueur : une requête plus courte est donc la vraie accélération, plus que n'importe quel réglage du CPU. Sur une journée, cela dit, ça représente environ 8 minutes de travail CPU. **Pour une maison, lent, ça va.** J'attendrais volontiers 5 secondes une décision de ventilation si ça veut dire que mes données restent à la maison.

### Le vrai test : deux semaines de vraies requêtes

Jusque-là, je n'avais qu'une seule vraie requête. Mais la journalisation des prompts était activée sur mon compte OpenRouter, toutes les vraies requêtes étaient donc là. Claude Code les a lues dans le navigateur, après que je me suis connecté moi-même : **1 416 requêtes du 11 au 25 octobre, chacune avec le JSON exact envoyé par Home Assistant et la réponse de Jev**. Ces journaux montrent quand les gens sont à la maison : ils sont donc restés sur mon portable, hors de tout dépôt.

Chaque requête est partie vers Laya sans modification. Après 396 d'entre elles, le tableau était clair :

| Question | Laya de base | Jev |
| --- | --- | --- |
| Boost de la VMC | tronquée à chaque fois ; « oui » à 0,994–0,999 à chaque fois | « oui » 18 % du temps |
| Volets | « les baisser » 99 % du temps | une fois |
| Arrosage du jardin | « oui » 100 % du temps | jamais |
| Quelle lumière allumer | même choix que Jev 27 % du temps | |

La troncature n'est pas le problème principal. Avec le state complet visible sur un exemple fait à la main, une douche en cours (90,8 %, +16 points en 15 minutes), une douche il y a une heure, une humidité plate et « tout le monde dort » obtenaient tous entre 0,980 et 0,992. Je lui ai donné les faits sous forme de nombres, de mots (« rising fast, fresh steam ») et d'un simple drapeau `fresh_steam: true` : rien de tout ça n'a fait bouger la réponse dans le bon sens. Sur la VMC, son classement des situations était à peine meilleur que le hasard (AUC de 0,60 par rapport aux décisions de Jev).

Ça correspond à la documentation de Laya lui-même : c'est un encodeur de 322M de paramètres (mmBERT-base) pré-entraîné sur des tâches de décision génériques, ses réponses oui/non peuvent suivre la formulation des options plutôt que le state, et les auteurs disent de le traiter comme une base à spécialiser. Une température ou un seuil ne peuvent rien y faire : ils remettent les scores à l'échelle, mais gardent leur ordre, et ici, c'est l'ordre qui est faux.

Dans sa forme de base, Laya ne peut donc pas remplacer Jev dans ma maison. Ce qui m'amène à la partie que j'avais dit, dans [un article précédent](/fr/laya-vs-jev-dix-jours-plus-tard-fine-tuning-sur-un-macbook/), que je ne ferais pas.

## Une expérience locale : apprendre à Laya à partir de Jev

### D'abord, le sujet qui fâche

J'avais 1 416 vraies requêtes, chacune avec les probabilités de Jev. Entraîner un modèle à reproduire ces probabilités, c'est de la **distillation** : Jev est le professeur, Laya l'élève. Il y a trois semaines, j'avais abandonné exactement ce plan, parce que le [contrat client](https://typesafe.ai/legal/mca) de TypeSafe (§2.3(b)) dit qu'on ne peut pas utiliser le service ou ses sorties « to perform model distillation » ni pour « train a model to imitate the output of the Services » (autrement dit, ni pour faire de la distillation de modèle, ni pour entraîner un modèle à imiter les sorties du service). Il ne prévoit aucune exception pour un usage personnel ou non commercial.

Je l'ai fait quand même, comme une expérience bornée, et je veux être clair sur ce que ça veut dire :

*   **C'est un test local pour ma propre maison.** Il a tourné sur mon MacBook, sur mes propres requêtes, pour ma propre domotique. Rien n'est parti sur Kaggle ni sur un GPU dans le cloud : les données montrent qui est à la maison et quand.
*   **Rien n'est publié.** Ni le dataset, ni les poids, ni les scripts sous forme de produit. Il n'y a aucun modèle à télécharger depuis cet article, et il n'y en aura pas. Les poids encodent de toute façon les habitudes de mon foyer, ce qui est une deuxième raison de les garder privés.
*   **Le but était d'apprendre jusqu'où Laya peut aller** avec de vraies données de maison, et comment marche son entraînement, pas de construire un remplaçant de Jev pour qui que ce soit.

Je ne prétends pas que ça rende la chose acceptable au regard des conditions de TypeSafe : la clause se moque de l'échelle comme de l'intention. Je vous dis ce que j'ai fait et ce que disent les conditions, pour que vous puissiez juger par vous-mêmes. Et je ne suis clairement pas le seul à être curieux. Sur GitHub, [Mini-Jev](https://github.com/Shauryagulati/mini-jev) distille Jev dans Qwen3-1.7B, compare fine-tuning supervisé, distillation sur étiquettes souples et RL, et invite ses lecteurs à vérifier les conditions de TypeSafe avant de réutiliser les poids. Sur Hugging Face, [jev-distill-corpus-v3](https://huggingface.co/datasets/SargeDev/jev-distill-corpus-v3) publie environ un demi-million de lignes étiquetées par Jev 1.13. Beaucoup d'autres projets « façon Jev » ([Kev](https://github.com/jaredpalmer/kev), [system-one-open](https://github.com/mithalouni/system-one-open), [Von](https://huggingface.co/wfzyx/von)…) s'entraînent plutôt sur des datasets publics ou sur leurs propres étiquettes synthétiques, et c'est la voie propre. J'y reviens à la fin.

### Ce qu'est vraiment Laya, et ce que l'entraînement change

Laya n'est pas un modèle de chat et n'écrit jamais de texte. Pour chaque question, il construit **une seule séquence** :

```text
[CLS] <question type> instructions [SEP] [MASK] option 1 option 2 ... [SEP] state JSON [SEP]
```

Un encodeur lit le tout d'un coup, et une petite tête au-dessus le transforme en probabilités sur les options : `noul: 0.12`, ou une probabilité par choix. Une seule passe avant, aucune étape de raisonnement, c'est pour ça qu'un modèle de 322M répond en environ une seconde sur le CPU d'un mini PC.

Le fine-tuning change les poids, pas le programme. Pour chaque exemple d'entraînement, Laya fait une prédiction, on la compare à la cible, et tous les poids bougent un peu dans sa direction. Faites ça quelques centaines de fois avec un petit learning rate, et le modèle s'adapte à *vos* questions sans oublier le reste. Avec les probabilités de Jev comme cibles, il apprend aussi l'incertitude de Jev : un 0,55 enseigne « limite », pas « oui ».

Laya fournit son propre code d'entraînement, `laya.train`, ce qui valait mieux que de faire de la rétro-ingénierie sur le notebook Kaggle cité dans la model card.

### Étape 1 : construire le dataset

Chaque ligne d'entraînement est une requête plus une cible :

```json
{"state": {...},
 "questions": {"answer": {"type": "noul", "instructions": {...}, "criteria": {...}}},
 "gold": {"answer": {"probabilities": {"false": 0.34, "true": 0.66}}}}
```

Les choix importants ont été :

*   **Découper dans le temps, pas au hasard.** Entraînement sur le 11–21 octobre (1 004 requêtes), test sur le 22–25 octobre (409 requêtes que le modèle ne voit jamais). Un découpage aléatoire mettrait des requêtes VMC consécutives presque identiques des deux côtés, et le score aurait l'air bien meilleur qu'il ne l'est.
*   **Ne jamais rien couper.** Comme Jev n'intervient pas ici, je pouvais utiliser un state compact propre à Laya : les règles de compaction testées plus haut, les faits décisifs en premier et un contexte VMC court. Chaque ligne a été vérifiée avec le `build_sequence` de Laya lui-même : si un seul token du state devait sauter, une règle de repli raccourcit les séries, puis retire les événements les plus anciens un par un. Résultat final : **chaque entrée tient dans 1 024 tokens avec 0 token perdu**, ce que j'ai aussi vérifié auprès du serveur sur le N100.
*   **Les probabilités de Jev comme cibles souples**, converties au format de Laya pour chaque type de question (`noul`, `choice`, `score`).

Les données sont très déséquilibrées : 587 requêtes VMC et 358 de volets dans le jeu d'entraînement, et quelques dizaines pour tout le reste (arrosage, lessive, chauffe-eau, présence).

### Étape 2 : entraîner sur le MacBook

Le script d'entraînement est court, parce que `laya.train` fait le travail :

```python
from laya.train import TrainConfig, finetune

cfg = TrainConfig(
    epochs=6,
    micro_batch=2, grad_accum=8,   # effective batch of 16
    encoder_lr=2.5e-5,
    loss="soft-ce",                # match Jev's probabilities, not just yes/no
    gradient_checkpointing=True,   # 1,024-token inputs in 16 GB
    seed=0,
)
finetune(data="train.jsonl", model_dir="laya/multilingual",
         output_dir="ckpt/jev-ft", config=cfg, device="mps")
```

Trois réglages qui méritent une explication :

*   **6 epochs, batch effectif de 16**, soit environ 340 mises à jour de l'optimiseur. Les valeurs par défaut n'en auraient donné que 60, et le code de Laya lui-même prévient que trop peu de mises à jour peuvent faire s'effondrer le modèle vers une réponse constante, exactement le problème que j'essayais de corriger.
*   **La loss `soft-ce`** au lieu de `rlcd`, celle par défaut : la cross-entropy souple est l'objectif naturel quand la cible est une distribution de probabilités, et les notes de Laya elles-mêmes disent que le terme RL n'apportait aucun gain ici.
*   **Le gradient checkpointing** : sans lui, des séquences de 1 024 tokens ne tiennent pas dans les 16 Go de mémoire du M4. Il n'est pas exposé par la CLI, c'est pour ça que j'ai appelé `finetune()` depuis Python.

L'entraînement a pris **66 minutes** sur le GPU du M4 (MPS), rien n'a quitté le portable, et la loss a cessé de baisser autour de 0,5. C'est normal : quand la cible elle-même est 0,3/0,7, la loss ne peut pas atteindre zéro. Ce sont les jours mis de côté qui disent si ça a marché.

### Étape 3 : les résultats sur des jours qu'il n'a jamais vus

Chaque réponse est transformée en décision au seuil que mon automatisation utilise vraiment, puis comparée à celle de Jev :

| 22–25 octobre, mis de côté | Laya de base | **Laya fine-tuné** | Bruit de Jev lui-même |
| --- | --- | --- | --- |
| **VMC** : même décision que Jev (244 requêtes) | 14 % | **93 %** | |
| VMC : classement par rapport aux décisions de Jev (AUC) | 0,56 | **0,94** | |
| VMC : corrélation de rang avec Jev (Spearman) | −0,02 | **0,84** | |
| VMC : écart moyen avec la probabilité de Jev | 0,71 | 0,087 | 0,013 |
| VMC : boosts (Jev : 34) | 244 | 18 | |
| **Volets** : même décision que Jev (145) | 0 % | 100 % | |
| Volets : écart moyen avec la probabilité de Jev | 0,82 | 0,018 | 0,007 |

De « oui à tout » à 93 % d'accord sur des jours qu'il n'avait jamais vus, en une heure sur un portable. Honnêtement, je ne m'attendais pas à autant.

Maintenant les petites lignes, parce qu'elles comptent plus que le titre :

*   **Il rate la moitié des boosts de Jev.** Sur les 34 décisions de boost de Jev, le Laya fine-tuné est d'accord sur 17, en rate 17 (et en ajoute 1). Chaque raté est proche de la limite : Jev à 0,60–0,67, Laya à 0,30–0,50. Compté par épisode, il rejoint au moins une fois 5 des 6 épisodes de boost de Jev et rate entièrement une douche du samedi soir. Déplacer son seuil n'aide pas : le meilleur décalage, ajusté sur les jours d'entraînement, est de +0,01.
*   **Il a en partie mémorisé les jours d'entraînement.** 98,5 % d'accord sur ceux-là, 92,6 % sur les nouveaux jours. Plus de données, ou moins d'epochs avec un arrêt anticipé, devraient réduire l'écart.
*   **Les volets ne prouvent rien.** C'est l'automne : ni sur les jours d'entraînement ni sur les jours de test, Jev n'a jamais dit « les baisser ». Le modèle a seulement appris « les laisser levés ». Je revérifierai au printemps.
*   **Il a appris ma maison, pas le raisonnement.** Sur six states de test génériques, la paire évidente sur l'humidité va toujours dans le mauvais sens : un saut de 68,8 % à 90,8 % obtient 0,38, une humidité plate 0,44. Posez-lui une nouvelle question demain, et vous retrouvez le modèle de base.
*   **Les questions rares sont trop peu nombreuses pour juger** : chauffe-eau sur le solaire 5/5, arrosage 3/3, lessive 2/2, présence 2/4…

Et un rappel sur le plafond : un élève entraîné sur Jev peut au mieux égaler Jev. Le gain, ce ne sont pas de meilleures décisions ; ce sont les mêmes décisions, en local, gratuitement, avec mes données à la maison.

### Étape 4 : servir le checkpoint fine-tuné

La bonne nouvelle : **c'est le même programme et la même image**. `laya-serve` charge des checkpoints supplémentaires depuis la variable `LAYA_EXTRA_MODELS`, un dossier local ou un dépôt Hugging Face. Le dossier du checkpoint fait environ 650 Mo (`model.safetensors`, `rl_agent_config.json`, `questions.json`, `encoder/`, `tokenizer/` ; l'état de l'optimiseur n'est pas nécessaire).

Je ne toucherais pas au conteneur en service pour un essai. Un deuxième service à côté suffit :

```yaml
services:
  laya-shadow:
    build: .                      # the Dockerfile above
    restart: unless-stopped
    environment:
      LAYA_EXTRA_MODELS: '{"jev-ft": "/models/jev-ft"}'
      LAYA_MODELS: jev-ft
      LAYA_DEFAULT_MODEL: jev-ft
      OMP_NUM_THREADS: "4"
    volumes:
      - ./jev-ft:/models/jev-ft:ro
    ports:
      - "8181:8000"
```

Avec `LAYA_DEFAULT_MODEL`, Home Assistant n'a même pas besoin de nommer le modèle ; sinon, il envoie `"model": "jev-ft"`. Je l'ai vérifié en local : servi de cette façon, le checkpoint donne exactement les réponses de l'évaluation, sans rien perdre. Un dépôt Hugging Face privé avec un `HF_TOKEN` marche aussi, mais un dossier local est plus simple et garde les poids sur votre réseau. Attention à la RAM : le modèle lui-même a besoin d'environ 1,3 Go, et `docker stats` montre mon conteneur Laya actuel à environ 5 Go, cache de pages compris, sur une machine de 16 Go qui fait aussi tourner d'autres choses. La vitesse ne change pas, puisque le modèle a la même taille : environ 1 seconde pour une requête courte, 5 pour une longue.

Il reste un vrai changement côté Home Assistant, et il n'est pas optionnel : **il doit envoyer le state compact sur lequel le modèle a été entraîné**. La requête Jev complète serait de nouveau coupée à 1 024 tokens, et le modèle verrait quelque chose sur quoi il n'a jamais été entraîné.

## Est-ce que ça en valait la peine ?

Comme expérience, oui, clairement. Ce que j'en retiens :

*   **L'installation est la partie facile.** Une API compatible Jev, ça veut dire un conteneur Docker et une URL dans Home Assistant. C'est vraiment agréable.
*   **Vérifiez `truncated` avant toute chose.** Un modèle qui coupe en silence la fin de votre requête aura l'air sûr de lui et se trompera, et Home Assistant ne vous le dira pas.
*   **Un N100 suffit pour une maison**, à environ 100 décisions par jour. La lenteur n'est pas un problème ici ; les rafales, si, et des requêtes plus courtes les règlent mieux que du matériel.
*   **Laya de base n'est pas un moteur de décision pour des states de maison numériques**, et ses auteurs le disent. Fine-tuné, il devient étonnamment bon sur *mes* questions, après une heure d'entraînement sur un portable.
*   **Mesurez par rapport au bruit du professeur, sur des jours mis de côté.** 93 %, ça sonne très bien, jusqu'à ce que vous voyiez que l'écart moyen fait 7 fois le bruit de Jev lui-même et que la moitié des boosts sont ratés.
*   **La maison tourne toujours sur Jev.** Le modèle fine-tuné est assez bon pour être essayé en **mode shadow sur la VMC** : Home Assistant interroge les deux, agit selon Jev, et journalise Laya à côté. Il n'est pas assez bon pour décider.

La leçon la plus importante concerne les données. Cette expérience a prouvé que Laya peut apprendre ma maison à partir d'environ 1 000 exemples. Il n'avait pas besoin de l'apprendre de Jev. Mon [tableau de bord](/fr/jev-home-assistant-historique-retour-et-la-question-du-modele-local/) collecte déjà mes propres réponses « qui avait raison ? », et les vérifications du résultat enregistrent ce qui s'est vraiment passé après chaque décision : la douche qui a bien eu lieu, la pompe qui s'est bien arrêtée. Ces étiquettes sont **les miennes**, elles sont autorisées, et elles pourraient même apprendre à un modèle là où Jev lui-même se trompe. Il faut plus de temps pour en collecter un millier, mais c'est la version de ce modèle que je serais vraiment à l'aise de faire tourner. D'ici là, le checkpoint fine-tuné reste sur mon portable, et la maison reste sur Jev.

Si vous faites tourner Laya, ou n'importe quel modèle compatible Jev, à la maison, j'aimerais vraiment savoir comment vous gérez la fenêtre de contexte et sur quoi vous l'entraînez. Les commentaires sont ouverts.

## Comment il a été construit

Deux sessions Claude Code avec Opus 5.5. La première est partie de mon « remplaçons Jev par Laya », a compris comment l'intégration parle à Jev, a trouvé la troncature, a mesuré le N100, a lu mes journaux de prompts OpenRouter dans le navigateur (je me suis connecté moi-même), les a rejoués à travers Laya, et a testé chaque raccourcissement par rapport au bruit de Jev avant de modifier le moindre template. Quand elle a conclu que seul un fine-tuning pouvait aider, elle l'a proposé comme une session séparée, qui a construit le dataset, entraîné le checkpoint sur mon MacBook, l'a évalué et a vérifié comment le servir. Une troisième session a lu les deux transcriptions et rédigé cet article. Mon rôle a été de décider quoi tester, d'insister pour que les réponses de Jev ne changent pas, et de décider quoi garder, y compris s'il fallait publier ou non la partie sur la distillation.
