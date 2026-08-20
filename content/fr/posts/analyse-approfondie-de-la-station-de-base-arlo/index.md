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
description: 'Une analyse bonus approfondie de la station de base Arlo : mesures réelles de consommation batterie avec caméras armées/désarmées, données de paquets sniffés montrant comment la station de base maintient les caméras en veille, et la limitation de l''intervalle de balise du RBR760 qui empêche la reproduction DIY complète.'
cover: cover.jpg
showHero: true
---

Ceci est un cinquième article non planifié dans la série Arlo — une analyse bonus approfondie des données que j'ai collectées avant et pendant la série de quatre articles. Si vous m'avez suivi jusqu'ici, vous savez que la stack réseau fonctionne pour l'enregistrement et le streaming. Ce que la série n'avait pas anticipé, c'est *à quel point* le comportement WiFi de la station de base affecte l'autonomie de la batterie, et ce que j'ai découvert quand j'ai placé un renifleur de paquets entre les caméras et la vraie station de base Arlo.

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

La station de base Arlo standard fait plusieurs choses qui maintiennent les caméras en veille :

1. **Intervalle de balise :** 31 TU (31 ms) — des balises très rapides pour que les caméras restent étroitement synchronisées.
2. **Délai d'inactivité :** Effectivement infini — les caméras ne sont jamais désassociées. Nous le reproduisons avec `inact=65535` (du Post 4).
3. **Bail DHCP :** Assez long pour que la caméra n'ait jamais à le renouveler pendant la veille profonde. Nous utilisons 86400 secondes (24 heures).
4. **IE fournisseur :** Non reproductible avec les outils standard.

Mais reproduire les paramètres *exacts* de la balise de la station de base sur le RBR760 n'est pas simple. L'architecture Qualcomm QCA full-offload sur ce routeur génère les trames de balise dans le firmware, pas dans `hostapd`. Certains paramètres que `hostapd_cli` prétend accepter sont silencieusement ignorés par le matériel. Voici ce que j'ai découvert quand j'ai placé un renifleur WiFi sur les VAP invitées réelles.

### La Découverte de l'Intervalle de Balise

La vraie station de base Arlo VMB4000 utilise un intervalle de balise de **31 TU** (31 ms). Je l'ai capturé lors d'une session de reniflage de paquets en direct avant que la station de base ne soit décommissionnée. Quand j'ai essayé de le reproduire sur les VAP invitées du RBR760, chaque tentative a échoué :

| Méthode | Commande | Résultat |
|---------|----------|----------|
| `hostapd_cli SET beacon_int 31` | Retourne OK | Balises toujours à ~100 TU — ignoré par le firmware |
| `cfg80211tool ath02 beacon_int` | Commande introuvable | Non supporté sur QCA full-offload |
| `iwpriv ath02 set_beacon` | Commande introuvable | Non supporté |

Le firmware Qualcomm QCA full-offload sur le RBR760 génère les balises indépendamment. `hostapd` envoie la configuration au démarrage, mais ensuite le firmware gère la génération des balises dans le matériel. Changer l'intervalle de balise à l'exécution via `hostapd_cli` retourne un code OK — la couche logicielle l'accepte — mais le firmware ne reçoit jamais la mise à jour. La capture live Nexmon a confirmé les intervalles de balise transmis :

| VAP | BSSID | Intervalle de balise capturé | Défini via hostapd_cli |
|-----|-------|------------------------------|------------------------|
| Guest 2.4 GHz (ath02) | RBR760 | ~102–104 TU | 31 (ignoré) |
| Guest 2.4 GHz (satellite) | 9e:18:65:69:c9:81 | ~100 TU | N/A |
| Main 2.4 GHz (ath01) | 9e:18:65:6c:f6:38 | ~104 TU | Non modifié |

L'intervalle de balise invité par défaut de ~100 TU est intégré dans le firmware et ne peut pas être réduit pour correspondre aux 31 TU de la station de base Arlo. C'est une **limitation matérielle** du chipset Qualcomm QCA full-offload.

### L'Anomalie de la Période DTIM

La période DTIM (Delivery Traffic Indication Map) indique aux stations en veille à quelle fréquence se réveiller pour le trafic broadcast mis en mémoire tampon. DTIM=1 signifie que chaque balise porte un DTIM — les stations se réveillent toutes les ~100 ms. DTIM=3 signifie toutes les trois balises — les stations se réveillent toutes les ~300 ms.

J'ai essayé `cfg80211tool ath02 dtim_period 33` — une valeur élevée qui permettrait aux caméras de dormir pendant 33 intervalles de balise (~3.3 secondes) entre les réveils DTIM. Les résultats étaient mitigés :

| VAP | BSSID | Résultat DTIM |
|-----|-------|---------------|
| Guest 2.4 GHz (satellite) | 9e:18:65:69:c9:81 | **DTIM=33 confirmé** |
| Guest 2.4 GHz (RBR760) | 9e:18:65:6c:f6:38 | DTIM=3 (non mis à jour) |
| Main 2.4 GHz (RBR760) | 9e:18:65:6c:f5:1c | DTIM=3 (non mis à jour) |

La modification DTIM a été acceptée sur la VAP invitée du satellite mais pas sur les VAP du routeur lui-même. Une autre manifestation de l'anomalie QCA full-offload.

### Ce Qui Fonctionne Vraiment : `inact=65535` et Bail DHCP

Après toutes les expériences avec l'intervalle de balise et le DTIM, les paramètres qui fonctionnent sont ceux du Post 4 :

```bash
cfg80211tool ath02 inact 65535
cfg80211tool ath21 inact 65535

cfg80211tool ath02 get_inact
# inact = 65535
cfg80211tool ath21 get_inact
# inact = 65535
```

Ces paramètres agissent au niveau du firmware — la radio Qualcomm les accepte car ce sont des paramètres cfg80211 standard (contrairement à `beacon_int` qui est géré dans l'espace de `hostapd`).

Le correctif du bail DHCP invité du Post 4 (`option lease 86400`) est tout aussi essentiel — sans lui, les caméras renouvellent leur DHCP toutes les 30 minutes.

### La Vérification Nocturne : Les Caméras se Déconnectent à 100 TU

La configuration ci-dessus est nécessaire mais pas suffisante. Dans la nuit du 19 au 20 août 2026, j'ai effectué un test complet avec le RBR760 comme seul AP pour les caméras (station de base originale éteinte). Le résultat a été une déconnexion complète :

- **Comptage de stations VAP invitées :** `num_sta[0]=0` sur les deux VAP invitées — zéro caméra associée.
- **Baux DHCP invités :** Zéro bail actif sur le réseau invité.
- **Enregistrements caméra :** Zéro événement d'enregistrement dans les journaux d'`arlo-cam-api` pendant la nuit.
- **Données batterie :** Stables/mises en cache depuis 22h22 — les caméras ont cessé de rapporter.
- **Dernier BSSID connu :** L'API de la caméra rapportait `9E:18:65:6C:F6:38` (une VAP invitée satellite) — les caméras se sont connectées brièvement, puis déconnectées sans se réassocier.

La capture live Nexmon a confirmé la cause : le RBR760 transmet des balises à ~100 TU malgré `hostapd_cli SET beacon_int 31` retournant OK. Les caméras nécessitent un intervalle de balise de 31 TU pour maintenir leur synchronisation en veille profonde avec l'AP. À 100 TU, le décalage de l'intervalle de balise fait perdre la synchronisation aux caméras et abandonner l'association. La valeur de 31 TU n'est pas qu'une préférence de performance — c'est une **exigence matérielle du firmware de la caméra**.

Les données de consommation batterie de la Partie 1 ont été collectées pendant que les caméras étaient connectées à une vraie station de base Arlo VMB4000. La mesure de ~8 jours / 0.52%/h provient de cette configuration. Sur le RBR760 avec des balises par défaut à 100 TU, les caméras ne restent tout simplement pas connectées assez longtemps pour mesurer une consommation en régime permanent.

### État Vérifié Après la Configuration

| Paramètre | Commande | Attendu | Statut |
|-----------|----------|---------|--------|
| Délai d'inactivité | `cfg80211tool ath02 get_inact` | `inact = 65535` | Confirmé |
| Délai d'inactivité (5 GHz guest) | `cfg80211tool ath21 get_inact` | `inact = 65535` | Confirmé |
| Intervalle de balise | Capture live Nexmon | ~100 TU (par défaut) | Confirmé — non modifiable |
| Période DTIM | Trame de balise capturée | 3 (routeur) / 33 (satellite) | Partiellement modifiable |
| Bail DHCP invité | `grep lease /tmp/dni_udhcpd_guest.conf` | `option lease 86400` | Confirmé |
| Association caméras | `num_sta[0]` sur les VAP invitées | Zéro | **Non connectées** |
| Enregistrement caméras | `curl http://192.168.1.48:5000/device` | Aucune caméra enregistrée | **Non enregistrées** |

### Réalité Mesurée

| Configuration | Comportement réel |
|---------------|------------------|
| Vraie station de base Arlo VMB4000 | Caméras connectées. Consommation ~0.52%/h quand armées. |
| WiFi invité RBR760 (inact=65535, bail=86400) | Caméras s'associent brièvement, puis se déconnectent. Aucune connectivité stable. |
| WiFi invité RBR760 (configuration par défaut) | Même comportement — l'intervalle de balise est toujours 100 TU. |

Les correctifs `inact` et bail DHCP du Post 4 sont toujours valides pour tout AP qui *peut* correspondre à l'intervalle de balise de 31 TU, mais sur le RBR760 spécifiquement, la limitation matérielle les rend inefficaces — les caméras ne restent jamais connectées assez longtemps pour en bénéficier.

## Ce Qui Reste

Le seul paramètre non reproductible est l'**intervalle de balise de 31 TU**. Tout le reste — délai d'inactivité, bail DHCP, période DTIM — est configurable ou non pertinent. Le chipset Qualcomm QCA full-offload du RBR760 ne peut pas être contraint à transmettre des balises à 31 TU. L'interface `hostapd_cli` accepte la commande mais le firmware l'ignore. Ce n'est pas un bug logiciel ; c'est une limitation architecturale du matériel.

De plus, l'**IE spécifique au fournisseur** (brevets US 11722963, 20240147057, 12413852) qui transporte les numéros de série des caméras dans la balise n'est toujours pas reproduit. Cet IE indique aux caméras en veille "votre association est toujours valide, restez en veille" — sans lui et sans l'intervalle de balise correspondant, les caméras n'ont aucune raison de faire confiance à l'AP DIY.

## Options pour l'Avenir

Avec la limitation matérielle confirmée, voici les options réalistes :

1. **Utiliser la vraie station de base Arlo pour le WiFi, acheminer Ethernet vers le serveur.** La station de base Arlo gère la couche WiFi (balises 31 TU, IE fournisseur, ne désassocie jamais) tandis que le serveur `arlo-cam-api` gère la couche applicative. Branchez le port Ethernet de la station de base à votre commutateur LAN et votre serveur communique avec les caméras via le pont réseau de la station de base. L'autonomie de la batterie correspond aux spécifications d'origine.

2. **Utiliser des caméras alimentées par USB.** Si vos caméras ont une source d'alimentation constante (câble USB, panneau solaire ou le câble de charge Arlo), la limitation de l'intervalle de balise n'a pas d'importance — la caméra se reconnecte chaque fois qu'elle se réveille et il n'y a pas de batterie à consommer. Le WiFi invité du RBR760 fonctionne parfaitement pour le streaming et l'enregistrement quand la caméra est alimentée.

3. **Accepter la consommation de la batterie avec le WiFi de la station de base d'origine.** Si vous gardez les caméras sur le WiFi de la station de base Arlo mais utilisez `arlo-cam-api` sur un serveur pour la couche applicative (pas d'abonnement cloud), l'autonomie est celle d'origine : 3–6 mois désarmées / ~8 jours armées.

4. **Accepter l'instabilité de connexion sur le RBR760.** Les caméras se réassocient périodiquement (toutes les ~30 minutes quand elles se réveillent pour le glacial timer), donc le streaming à la demande fonctionne. Le compromis est une latence de ~3–5 minutes pour les événements de mouvement et un rapport de batterie peu fiable.

Pour mon installation de production, j'ai choisi l'option 1 : la station de base Arlo se trouve dans le placard réseau, son Ethernet est connecté au même commutateur que mon mini PC, et `arlo-cam-api` communique avec les caméras via le pont de la station de base. Le RBR760 gère le reste du WiFi de la maison. Cela donne la stack auto-hébergée sans la pénalité sur la batterie.

---

*Ceci est un cinquième article bonus dans la série Arlo. La stack complète :*

- *[Post 1](/fr/remplacer-la-station-de-base-arlo-par-un-routeur-netgear-orbi/) — couche réseau : remplacement passerelle, DHCP, DNAT*
- *[Post 2](/fr/auto-heberger-arlo-cam-api-correctifs-et-ameliorations/) — couche applicative : auto-hébergement arlo-cam-api*
- *[Post 3](/fr/integrer-arlo-auto-heberge-avec-home-assistant/) — couche d'automatisation : intégration Home Assistant*
- *[Post 4](/fr/corriger-la-duree-de-vie-de-la-batterie-des-cameras-arlo-au-niveau-wifi/) — couche WiFi : délai d'inactivité et bail DHCP*
- *Cet article — mesures de consommation batterie, données sniffées de la station de base et limitation de l'intervalle de balise*

*Le dépôt compagnon sur [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) contient tous les fichiers de configuration mentionnés dans la série.*