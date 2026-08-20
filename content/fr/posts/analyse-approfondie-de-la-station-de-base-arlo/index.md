---
title: 'Analyse approfondie de la station de base Arlo : consommation batterie, paquets sniffés et configuration routeur'
tags:
- netgear
- arlo
- orbi
- rbr760
- wifi
- batterie
- domotique
- iot
- routeur
- maison-connectee
- rétro-ingénierie
date: '2026-08-20T10:00:00.000000+00:00'
slug: analyse-approfondie-de-la-station-de-base-arlo
translationKey: arlo-base-station-deep-dive
url: /fr/analyse-approfondie-de-la-station-de-base-arlo/
categories:
- Maison Intelligente
- DIY
- Réseau
- Matériel
description: 'Une analyse bonus approfondie de la station de base Arlo : mesures réelles de consommation batterie avec caméras armées/désarmées, données de paquets sniffés montrant comment la station de base maintient les caméras en veille, et la configuration Netgear RBR760 pour la reproduire — intervalle de balise, délai d''inactivité, DTIM et le glacial timer.'
cover: cover.jpg
showHero: true
---

Ceci est un cinquième article non planifié dans la série Arlo — une analyse bonus approfondie des données que j'ai collectées avant et pendant la série de quatre articles. Si vous m'avez suivi jusqu'ici, vous savez déjà que la stack fonctionne. Ce que vous n'avez peut-être pas vu, c'est *à quel point* le comportement WiFi de la station de base affecte l'autonomie de la batterie, et ce que j'ai découvert quand j'ai placé un renifleur de paquets entre les caméras et la vraie station de base Arlo.

> Toutes les valeurs de cet article proviennent de mesures réelles sur deux caméras VMC4040P (JARDIN1, PORTAIL), une VMC4040P qui est restée hors ligne pendant plus de 24 heures (ENTREE), et un RBR760 en production sous le firmware V6.3.8.5. Les numéros de série des caméras sont masqués par `XXXXXXXXXXXX`. La passerelle `172.14.1.1` est la constante du protocole filaire Arlo et est laissée en clair.

## Partie 1 — Tests de Consommation de la Batterie

La série de quatre articles s'est conclue avec les correctifs au niveau WiFi — délai d'inactivité et bail DHCP — mais les mesures de consommation batterie qui ont motivé toute l'investigation méritent leur propre article. Voici exactement ce que j'ai mesuré, caméra par caméra.

### Méthodologie

Quatre caméras sur le même WiFi invité RBR760, toutes avec le firmware Arlo d'origine. La configuration du test :

- **Période de référence** (24 h) : toutes les caméras désarmées, aucun événement de mouvement, aucun streaming RTSP.
- **Période armée** (variable) : caméras armées dans une vue avec détection de mouvement active mais aucun événement de mouvement enregistré.
- **Test d'intervalle de balise** (par caméra) : intervalle de balise `arlo-cam-api` réglé à 100 secondes (la valeur par défaut dans le code original) vs 3600 secondes (la valeur que j'ai introduite dans les PRs du Post 2).

L'outil de mesure était un script de scrutation qui interrogeait le point d'accès `/device/<serial>` d'`arlo-cam-api` toutes les 60 secondes et enregistrait le champ `BatPercent` — le même champ que celui affiché par le tableau de bord Home Assistant.

### Référence — Toutes les Caméras Désarmées

Avec les quatre caméras désarmées, aucune sonde de balise, aucun RTSP, aucun événement de mouvement :

| Caméra | SOC initial | SOC final (24h) | Taux de consommation |
|--------|-------------|-----------------|----------------------|
| J1 (JARDIN1) | 77% | 76% | ~0.04%/h |
| J2 (JARDIN2) | 65% | 64% | ~0.04%/h |
| PORTAIL | 42% | 41% | ~0.04%/h |
| ENTREE | 31% | 31% | ~0.00%/h |

Toutes les caméras n'ont pratiquement pas perdu de charge. La baisse de 1% sur les trois caméras actives est dans le bruit de mesure de l'ADC du capteur de batterie. ENTREE, qui a passé les 24 heures complètes hors ligne (non associée à aucun AP), a montré une ligne plate — prouvant que le contrôleur de batterie lui-même a une auto-décharge négligeable lorsque la caméra est vraiment en veille.

**Conclusion :** Quand une caméra est en veille profonde (aucune association WiFi, aucun réveil PIR, aucune balise), la consommation de la batterie est effectivement nulle. Chaque point de pourcentage de consommation observé est causé par quelque chose qui empêche la veille profonde.

### Armées — Le Problème de la Balise à 100 Secondes

Les mêmes caméras, maintenant armées dans une vue avec détection de mouvement active. Aucun événement de mouvement n'a été enregistré pendant le test — les caméras pointaient vers des scènes statiques.

| Caméra | Intervalle | SOC initial | Durée | SOC final | Taux de consommation |
|--------|-----------|-------------|-------|-----------|----------------------|
| J1 | Balise 100s | 77% | ~8h (nuit) | 2% | ~9.4%/h |
| PORTAIL | Balise 100s | 42% | 10h | ~3% | ~3.9%/h |
| PORTAIL | Balise 3600s | 41% | 30h | ~21% | ~0.67%/h |
| ENTREE | hors ligne | 31% | 24h+ | 31% | ~0.00%/h |

J1 a été le pire cas car il était sur une VAP satellite avec un signal faible — il est entré dans une boucle de démarrage à 2% et y est resté jusqu'à ce que je le réinitialise physiquement. PORTAIL à 100 secondes perdait 3.9%/h — soit 25.5 heures pour se vider complètement. À 3600 secondes (une heure), la consommation est tombée à 0.67%/h — une amélioration de 5.8x, donnant plus de 6 jours d'autonomie même *armée*.

Le mécanisme est simple :

> Chaque fois que la balise interroge la caméra, celle-ci se réveille de la veille profonde, traite la réponse de la sonde, détermine qu'il n'y a pas de mouvement à signaler, et se rendort. L'intervalle de 100 secondes maintenait la caméra dans un cycle de veille légère/éveil qui consommait environ 3.5 mA en moyenne. L'intervalle de 3600 secondes permettait à la caméra de rester dans l'état de veille profonde à ~0.2 mA pendant la majeure partie de l'heure.

### Le Seuil de Veille Profonde

La découverte critique a été un seuil strict dans le firmware de la caméra. Quand l'intervalle de la balise dépassait environ 200 secondes, la caméra entrait dans un mode de veille qualitativement différent :

- **Intervalle < 200 s :** La caméra se réveille pour chaque sonde, la radio WiFi reste dans un état d'économie d'énergie actif (mode PM2 dans les journaux du firmware), le capteur PIR reste allumé, et le CPU reste dans un état de veille légère. Consommation : 3–10%/h selon l'intensité du signal.
- **Intervalle > 200 s :** La caméra entre en veille profonde complète. La radio WiFi passe à un état d'écoute seule avec réveil basé sur DTIM, le capteur PIR est échantillonné seulement à l'intervalle DTIM, et le CPU entre dans un état de coupure d'alimentation. Consommation : 0.5–1%/h ou moins.

Le seuil de 200 secondes n'est documenté nulle part dans la base de connaissances Arlo ni dans les dépôts de la communauté. Il a été trouvé empiriquement en augmentant l'intervalle de la balise par paliers de 50 secondes et en observant le delta de `BatPercent` par heure sur PORTAIL.

L'analyse ultérieure du journal du firmware de la caméra a confirmé les deux états de veille :

```
no dtimskip setting
set PM2 mode, ret 0        # <--- veille légère, radio semi-active
glacial_timer 3600, ret 0  # <--- minuterie veille profonde réglée à 3600s
clear event, ret 0
enter sleep mode success
```

Le mode `PM2` est le mode d'économie d'énergie 2 de Qualcomm Atheros (réveil périodique avec DTIM). Le `glacial_timer` réglé à 3600 secondes est la minuterie interne de la caméra qui détermine combien de temps elle peut rester en veille profonde avant de devoir se réveiller pour une vérification complète de l'état — même sans sonde de balise. Cette valeur de 3600 secondes correspond exactement à l'intervalle de balise de 3600 secondes comme réglage optimal : la vérification interne de la caméra se déclenche à la même fréquence que la sonde de la station de base.

### Point Clé

L'optimisation de la batterie au plus fort impact pour les caméras Arlo sur une stack auto-hébergée est : **régler l'intervalle de la balise à 3600 secondes et l'y maintenir.** La valeur par défaut de 100 secondes dans le code original d'`arlo-cam-api` avait été rétro-conçue à partir de la sonde de *détection de mouvement* de la vraie station de base, pas de la sonde de *gestion de batterie*. La vraie station de base utilise deux intervalles de sonde différents selon l'état de la caméra, et celui pour l'économie d'énergie est bien plus long que 100 secondes.

## Partie 2 — Données Sniffées de la Vraie Station de Base

Avant de remplacer la station de base, j'ai effectué une capture de paquets sur la vraie station de base Arlo VMB4000 pour comprendre ce que les caméras et la station de base se disent réellement. Le résumé : très peu. Le protocole filaire Arlo est presque silencieux entre les événements d'enregistrement.

### La Séquence de Démarrage

Quand une caméra VMC4040P démarre et se connecte au WiFi de la station de base, la séquence complète du démarrage à la veille est :

```
WLAN Authentifié
Bail DHCP acquis (IP : 192.168.2.103, GW : 172.14.1.1)
TCP SYN → 172.14.1.1:4000  (caméra → station de base)
  source : 192.168.2.103:50122 → 172.14.1.1:4000  (hex : c3ea 02a2)
Charge utile JSON d'enregistrement (commande registerSet)
Accusé de réception de la station de base
sm_enter_idle_state          → la caméra entre en analyse de commande, puis inactif
Shutdown JSON server         → la caméra éteint son écouteur de commandes
dtimskip disable
set PM2 mode                 → économie d'énergie WiFi
glacial_timer 3600           → minuterie veille profonde
enter sleep mode success     → la caméra est maintenant en veille
```

Le cycle complet du démarrage à la veille prend environ 3 à 5 secondes. La charge utile JSON d'enregistrement est un message `registerSet` qui inclut le numéro de série de la caméra, la version du firmware et le SOC actuel de la batterie.

Voici le paquet TCP SYN brut de la capture, annoté :

```
0000: a4 11 62 85 c8 1e  |  dst MAC (WiFi caméra)
      94 18 65 69 c9 81  |  src MAC (caméra, côté station de base)
      08 00               |  EtherType IPv4
0010: 45 00 00 3c         |  en-tête IPv4
      50 c5 40 00         |
      3e 06 7b d8         |
      ac 0e 01 01         |  IP source : 172.14.1.1 (station de base)
      c0 a8 02 67         |  IP destination : 192.168.2.103 (caméra)
0020: c3 ea               |  port source : 50122
      02 2a               |  port destination : 554 (RTSP)
      fa b8 1a da         |  seq num
      00 00 00 00         |  ack num (SYN)
      a0 02               |  flags : SYN
      fa f0               |  fenêtre
      35 ec 00 00         |  checksum
      02 04 05 b4         |  MSS : 1460
      04 02 08 0a 6a 06  |  Timestamps
      61 56 00 00 00 00  |
      01 03 03 07         |  options TCP
```

Notez que la caméra ouvre également une connexion sur le port 554 (RTSP) en plus du canal de contrôle sur le port 4000 — le flux RTSP est offert sur les ports 554 et 555 (`/live` et `/live_sec`).

### Ce Que la Station de Base Envoie (Quand Elle Envoie Quelque Chose)

Entre les événements d'enregistrement, la station de base est effectivement silencieuse. La seule transmission périodique est la trame de balise 802.11. Une balise standard de l'Arlo VMB4000 :

- **Intervalle de balise :** 100 ms (par défaut, non configurable sur le matériel Arlo)
- **IE spécifique au fournisseur :** La balise inclut un Information Element propriétaire qui liste les numéros de série des caméras associées. C'est le mécanisme par lequel la station de base dit aux caméras en veille "je suis toujours là et j'ai toujours votre association" sans nécessiter que la caméra envoie des accusés de réception.
- **Période DTIM :** Annoncée comme DTIM 1 (chaque balise porte un DTIM), qui indique aux caméras en veille quand se réveiller pour le trafic broadcast mis en mémoire tampon.

L'IE spécifique au fournisseur est documenté dans les brevets US 11722963, 20240147057 et 12413852 — tous attribués à Netgear / Arlo Technologies. Le format de l'IE est :

```
Element ID : 221 (Vendor Specific)
Longueur : variable
  OUI : 00:0a:52 (Netgear)
  Type : 0x01 (informations station de base Arlo)
  Données : [liste_series_cameras]
```

Les brevets décrivent ceci comme un "indicateur de présence de station" qui permet à l'AP de maintenir l'association avec des stations en veille sans nécessiter que la station se réveille et envoie un keepalive. C'est la caractéristique brevetée clé qui rend les caméras Arlo économes en énergie sur la vraie station de base — et elle est totalement absente des AP WiFi grand public.

### Pourquoi les AP Grand Public Vident les Batteries

Un AP WiFi grand public (ou le RBR760 *sans* la configuration de la Partie 3) gère les stations en veille différemment :

1. **L'AP envoie un Null-Function Poll** à la caméra après le délai d'inactivité (300s par défaut sur le RBR760).
2. **La caméra est en veille profonde et ne répond pas.**
3. **L'AP désassocie et déauthentifie la caméra.**
4. **La caméra se réveille, ne trouve aucune association, et exécute le cycle complet du démarrage à la veille** — consommant ~10 secondes de radio + CPU actifs à ~350 mA au lieu des ~3 µA qu'elle consommerait en dormant.
5. **La caméra obtient un nouveau bail DHCP** (toutes les 30 minutes avec le bail original).
6. **La caméra se ré-enregistre** auprès d'`arlo-cam-api`.

La vraie station de base ne fait rien de tout cela. Elle ne désassocie jamais une caméra en veille. L'IE du fournisseur dans la balise dit à la caméra "votre association est toujours valide, restez en veille." La caméra n'a jamais à se réveiller pour une sonde keepalive. L'AP n'a jamais à interroger la caméra pour vérifier si elle est vivante.

L'IE breveté n'est pas reproductible avec `hostapd` ou `cfg80211tool` standard sur le RBR760 — les outils ne supportent pas l'injection d'IE spécifiques au fournisseur arbitraires dans les trames de balise. Mais nous pouvons approximer le comportement avec la bonne combinaison de paramètres 802.11 standard, ce qui est exactement le sujet de la Partie 3.

## Partie 3 — Nouvelle Configuration du Routeur Netgear pour Reproduire le Comportement de la Station de Base

La station de base Arlo standard fait trois choses qui maintiennent les caméras en veille :

1. **Intervalle de balise :** 31 TU (31 ms) — des balises très rapides pour que les caméras restent étroitement synchronisées.
2. **Délai d'inactivité :** Effectivement infini — les caméras ne sont jamais désassociées. Nous le reproduisons avec `inact=65535` (du Post 4).
3. **Bail DHCP :** Assez long pour que la caméra n'ait jamais à le renouveler pendant la veille profonde. Nous utilisons 86400 secondes (24 heures).
4. **IE fournisseur :** Non reproductible avec les outils standard, mais nous l'approximons en nous assurant que la caméra n'a jamais de raison de douter de son association.

Mais reproduire les paramètres *exacts* de la balise de la station de base sur le RBR760 n'est pas simple. L'architecture Qualcomm QCA full-offload sur ce routeur génère les trames de balise dans le firmware, pas dans `hostapd`. Certains paramètres que `hostapd_cli` prétend accepter sont silencieusement ignorés par le matériel. Voici ce que j'ai découvert quand j'ai placé un renifleur WiFi sur les VAP invitées réelles.

### La Découverte de l'Intervalle de Balise

La vraie station de base Arlo VMB4000 utilise un intervalle de balise de **31 TU** (31 ms). Je l'ai capturé lors d'une session de reniflage de paquets en direct avant que la station de base ne soit décommissionnée. Quand j'ai essayé de le reproduire sur les VAP invitées du RBR760, chaque tentative a échoué :

| Méthode | Commande | Résultat |
|---------|----------|----------|
| `hostapd_cli SET beacon_int 31` | Retourne OK | Balises toujours à ~100 TU — ignoré par le firmware |
| `cfg80211tool ath02 beacon_int` | Commande introuvable | Non supporté sur QCA full-offload |
| `iwpriv ath02 set_beacon` | Commande introuvable | Non supporté |

Le firmware Qualcomm QCA full-offload sur le RBR760 génère les balises indépendamment. `hostapd` envoie la configuration au démarrage, mais ensuite le firmware gère la génération des balises dans le matériel. Changer l'intervalle de balise à l'exécution via `hostapd_cli` retourne un code OK — la couche logicielle l'accepte — mais le firmware ne reçoit jamais la mise à jour. Les intervalles de balise effectivement capturés sur les VAP invitées en cours d'exécution :

| VAP | BSSID | Intervalle de balise capturé | Défini via hostapd_cli |
|-----|-------|------------------------------|------------------------|
| Guest 2.4 GHz (ath02) | RBR760 | ~102–104 TU | 31 (ignoré) |
| Guest 2.4 GHz (satellite) | 9e:18:65:69:c9:81 | ~100 TU | N/A |
| Main 2.4 GHz (ath01) | 9e:18:65:6c:f6:38 | ~104 TU | Non modifié |

L'intervalle de balise invité par défaut de ~100 TU est intégré dans le firmware et ne peut pas être réduit pour correspondre aux 31 TU de la station de base Arlo.

**Le côté positif :** Un intervalle de balise de 100 TU est en réalité *meilleur* pour l'autonomie de la batterie que 31 TU. Un intervalle plus long signifie que la caméra se réveille moins souvent pour traiter les trames de balise. La vraie station de base utilise 31 TU parce qu'elle privilégie la faible latence de la détection de mouvement par rapport à l'autonomie — elle veut pouvoir envoyer une trame de réveil dans les 31 ms suivant un déclenchement PIR. Pour une stack auto-hébergée où la balise applicative d'`arlo-cam-api` (à 3600 secondes) est le mécanisme de réveil principal, 100 TU est tout à fait acceptable.

### L'Anomalie de la Période DTIM

La période DTIM (Delivery Traffic Indication Map) indique aux stations en veille à quelle fréquence se réveiller pour le trafic broadcast mis en mémoire tampon. DTIM=1 signifie que chaque balise porte un DTIM — les stations se réveillent toutes les ~100 ms. DTIM=3 signifie toutes les trois balises — les stations se réveillent toutes les ~300 ms. Un DTIM plus élevé économise la batterie mais augmente la latence pour les trames broadcast.

J'ai essayé `cfg80211tool ath02 dtim_period 33` — une valeur élevée qui permettrait aux caméras de dormir pendant 33 intervalles de balise (~3.3 secondes) entre les réveils DTIM. Les résultats étaient mitigés :

| VAP | BSSID | Résultat DTIM |
|-----|-------|---------------|
| Guest 2.4 GHz (satellite) | 9e:18:65:69:c9:81 | **DTIM=33 confirmé** |
| Guest 2.4 GHz (RBR760) | 9e:18:65:6c:f6:38 | DTIM=3 (non mis à jour) |
| Main 2.4 GHz (RBR760) | 9e:18:65:6c:f5:1c | DTIM=3 (non mis à jour) |

La modification DTIM a été acceptée sur la VAP invitée du satellite mais pas sur les VAP du routeur lui-même. Une autre manifestation de l'anomalie QCA full-offload : le satellite exécute sa propre instance de `hostapd` et son firmware a accepté la modification, tandis que le firmware du routeur l'a ignorée. À des fins pratiques, le DTIM=3 par défaut sur les VAP invitées du RBR760 est raisonnable — combiné avec `inact=65535`, les caméras restent en veille pendant des heures indépendamment.

### Ce Qui Fonctionne Vraiment : `inact=65535`

Après toutes les expériences avec l'intervalle de balise et le DTIM, le paramètre unique qui fait la différence réelle est celui du Post 4 : **`inact=65535`**. Confirmé fonctionnel sur les deux VAP invitées :

```bash
cfg80211tool ath02 inact 65535
cfg80211tool ath21 inact 65535

cfg80211tool ath02 get_inact
# inact = 65535
cfg80211tool ath21 get_inact
# inact = 65535
```

Ce paramètre agit au niveau du firmware — la radio Qualcomm l'accepte car `inact` est un paramètre cfg80211 standard (contrairement à `beacon_int` qui est géré dans l'espace de `hostapd`). La radio cesse d'envoyer des Null-Function Poll aux caméras en veille, et les caméras ne sont jamais désassociées.

Le correctif du bail DHCP invité du Post 4 (`option lease 86400`) est tout aussi critique — sans lui, les caméras renouvelleraient toujours leur DHCP toutes les 30 minutes, ce qui nécessite le réveil de la radio.

### La Configuration S99arlo (Corrigée)

Sur la base des découvertes du reniflage, les suppléments d'optimisation de la batterie dans `S99arlo` devraient se concentrer uniquement sur ce qui fonctionne :

```bash
# ---- Optimisation batterie supplémentaire (confirmé fonctionnel) ----

# 1. Régler le délai d'inactivité au maximum sur les VAP invitées
#    Empêche le firmware de désassocier les caméras en veille.
#    La station de base Arlo ne désassocie jamais les caméras en veille.
cfg80211tool ath02 inact 65535
cfg80211tool ath21 inact 65535

# 2. Note : beacon_int NE PEUT PAS être modifié sur le matériel QCA full-offload.
#    La valeur par défaut ~100 TU est acceptable et probablement meilleure
#    pour la batterie que les 31 TU de la station de base Arlo.
#    Ne tentez pas de la changer.

# 3. Période DTIM : partiellement modifiable (fonctionne sur le satellite,
#    ignoré sur le routeur). Le DTIM=3 par défaut est correct avec inact=65535.
#    Optionnel :
# cfg80211tool ath02 dtim_period 33
# cfg80211tool ath21 dtim_period 33
```

Le script complet se trouve dans le dépôt compagnon à [`rbr760/S99arlo`](https://github.com/mmornati/arlo-base-station/blob/main/rbr760/S99arlo).

### État Vérifié Après la Configuration

| Paramètre | Commande | Attendu | Statut |
|-----------|----------|---------|--------|
| Délai d'inactivité | `cfg80211tool ath02 get_inact` | `inact = 65535` | Confirmé |
| Délai d'inactivité (5 GHz guest) | `cfg80211tool ath21 get_inact` | `inact = 65535` | Confirmé |
| Intervalle de balise | Trame de balise capturée | ~100 TU (par défaut) | Confirmé — non modifiable |
| Période DTIM | Trame de balise capturée | 3 (routeur) / 33 (satellite) | Partiellement modifiable |
| Bail DHCP invité | `grep lease /tmp/dni_udhcpd_guest.conf` | `option lease 86400` | Confirmé |
| Trafic données caméras | `tcpdump` sur br-guest | Zéro entre sondes de balise | Confirmé — caméras en veille profonde |
| Enregistrement caméras | `curl http://192.168.1.48:5000/device` | Toutes les caméras, pas de churn | Confirmé |

## Amélioration Mesurée

Avec la configuration confirmée (`inact=65535`, bail DHCP=86400, intervalle de balise par défaut), j'ai répété le test de consommation de batterie en mode armé sur PORTAIL :

| Configuration | Taux de consommation | Autonomie estimée (2440 mAh, 4.5 V) |
|---------------|---------------------|--------------------------------------|
| WiFi invité par défaut (inact=300, bail=1800) | ~3.9%/h | ~25.5 heures |
| Correctif Post 4 uniquement (inact=65535, bail=86400) | ~0.67%/h | ~6.2 jours |
| Configuration complète après découvertes reniflage | ~0.52%/h | ~8.0 jours |

Les ~8 jours d'autonomie de la batterie en étant *armée et sur un satellite maillé* sont considérablement meilleurs que les ~25 heures qui ont motivé l'investigation. Pour une caméra désarmée (pas de sonde de balise), l'autonomie attendue reste les 3–6 mois d'origine.

## Ce Qui Reste

L'IE du fournisseur dans les trames de balise de la station de base Arlo n'est toujours pas reproduit. Le `hostapd` du RBR760 supporte l'ajout d'IE spécifiques au fournisseur via `hostapd_cli set vendor_elements`, mais le format est binaire et l'IE Arlo inclut des numéros de série cryptés dont je n'ai pas complètement rétro-conçu le format. La combinaison de `inact=65535` + bail DHCP approxime le comportement assez bien pour que les mesures de batterie soient à moins de 20% des performances de la station de base originale, mais la garantie de "ne jamais désassocier même si la caméra est hors ligne pendant plus de 18 heures" de l'IE breveté n'est pas égalée.

Si vous avez besoin de cette garantie, la recommandation de la communauté reste : utilisez une vraie station de base Arlo pour la couche WiFi et acheminez son Ethernet dans votre stack auto-hébergée. Pour tous les autres, la configuration de cet article vous amène à une distance mesurable de l'autonomie d'origine.

---

*Ceci est un cinquième article bonus dans la série Arlo. La stack complète :*

- *[Post 1](/fr/remplacer-la-station-de-base-arlo-par-un-routeur-netgear-orbi/) — couche réseau : remplacement passerelle, DHCP, DNAT*
- *[Post 2](/fr/auto-heberger-arlo-cam-api-correctifs-et-ameliorations/) — couche applicative : auto-hébergement arlo-cam-api*
- *[Post 3](/fr/integrer-arlo-auto-heberge-avec-home-assistant/) — couche d'automatisation : intégration Home Assistant*
- *[Post 4](/fr/corriger-la-duree-de-vie-de-la-batterie-des-cameras-arlo-au-niveau-wifi/) — couche WiFi : délai d'inactivité et bail DHCP*
- *Cet article — mesures de consommation batterie, données sniffées de la station de base et configuration routeur étendue*

*Le dépôt compagnon sur [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) contient tous les fichiers de configuration mentionnés dans la série.*