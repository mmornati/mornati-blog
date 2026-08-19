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

1. **Intervalle de balise :** 100 ms (très rapide, pour que les caméras restent synchronisées avec une faible latence — nous conservons cela).
2. **Délai d'inactivité :** Effectivement infini — les caméras ne sont jamais désassociées. Nous le reproduisons avec `inact=65535` (du Post 4).
3. **Bail DHCP :** Assez long pour que la caméra n'ait jamais à le renouveler pendant la veille profonde. Nous utilisons 86400 secondes (24 heures).
4. **IE fournisseur :** Non reproductible avec les outils standard, mais nous l'approximons en nous assurant que la caméra n'a jamais de raison de douter de son association.

Mais il y a des paramètres supplémentaires du comportement WiFi de la vraie station de base qui ne sont pas couverts dans les Post 1–4. Ce sont les configurations profondes qui font que le RBR760 se comporte *encore plus* comme une station de base Arlo.

### La Configuration S99arlo Complète (Étendue)

Le script `S99arlo` du Post 1 gérait les bases : IP de passerelle, remplacement DHCP, DNAT, SNAT. Pour la configuration d'analyse approfondie optimisée pour la batterie, j'ai ajouté ces lignes à `/etc/rc.d/S99arlo` :

```bash
# ---- Optimisation batterie supplémentaire ajoutée dans le Post 5 ----

# 1. Forcer l'intervalle de balise à 100 TU (102.4 ms) sur les VAP invitées
#    La station de base Arlo utilise ~100 ms. La valeur par défaut RBR760 invité est 300 TU.
hostapd_cli -i ath02 -p /var/run/hostapd-wifi0 beacon_int 100 2>/dev/null
hostapd_cli -i ath21 -p /var/run/hostapd-wifi2 beacon_int 100 2>/dev/null

# 2. Forcer la période DTIM à 1 (chaque balise porte DTIM)
#    Correspond au comportement de la station de base. Défaut RBR760 invité est aussi 1.
hostapd_cli -i ath02 -p /var/run/hostapd-wifi0 dtim_period 1 2>/dev/null
hostapd_cli -i ath21 -p /var/run/hostapd-wifi2 dtim_period 1 2>/dev/null

# 3. Désactiver l'interrogation d'inactivité des stations sur les VAP invitées
#    Sans cela, cfg80211tool interroge les caméras en veille et peut les désassocier.
#    La station de base Arlo n'interroge jamais les caméras en veille.
cfg80211tool ath02 disable_inactivity_poll 1
cfg80211tool ath21 disable_inactivity_poll 1

# 4. Régler le délai d'inactivité au maximum (déjà dans le Post 4, mais renforcé ici)
cfg80211tool ath02 inact 65535
cfg80211tool ath21 inact 65535

# 5. Activer le mode compatible économie d'énergie pour la radio
#    Dit au driver dérivé d'ath9k d'honorer 802.11 PS-Poll et U-APSD
cfg80211tool ath02 ps_on_time_enable 1
cfg80211tool ath21 ps_on_time_enable 1
```

Le script complet avec toutes les modifications des quatre articles se trouve dans le dépôt compagnon à [`rbr760/S99arlo`](https://github.com/mmornati/arlo-base-station/blob/main/rbr760/S99arlo) — les suppléments d'optimisation batterie sont dans le bloc `arlo_beacon_fix`.

### Régler l'Intervalle de Balise dans UCI

La commande `hostapd_cli beacon_int` change la valeur au moment de l'exécution, mais elle ne survit pas à un `wifi reload` ou à un redémarrage. Pour la persistance, la régler dans UCI :

```bash
uci set wireless.Guest2.beacon_int='100'
uci set wireless.Guest5.beacon_int='100'
uci commit wireless
```

Ceci indique au script d'init `qcawificfg80211.sh` de passer `beacon_int=100` au pilote à chaque redémarrage WiFi. Sans cette paire UCI, un `wifi reload` réinitialise l'intervalle de balise invité à la valeur par défaut RBR760 de 300 TU (307.2 ms).

Vérifier après un redémarrage :

```bash
cfg80211tool ath02 get_beacon
cfg80211tool ath21 get_beacon
# Attendu : beacon = 100
```

### Le Paramètre `disable_inactivity_poll`

C'est le paramètre le plus important qui *n'est* pas présent dans aucun des articles précédents. Voici ce qu'il fait :

- `cfg80211tool ath02 inact 65535` dit au pilote : "ne désassocie pas une station inactive depuis 65535 secondes" — mais le pilote *envoie toujours* des Null-Function Poll (NFP) périodiques pour vérifier si la station est vivante.
- `cfg80211tool ath02 disable_inactivity_poll 1` dit au pilote : "en plus, n'envoie pas non plus les Null-Function Poll."

La différence est importante car un Null-Function Poll est une trame dirigée que la caméra en veille doit recevoir et (optionnellement) à laquelle répondre. Sur le chipset Qualcomm Atheros du RBR760, l'envoi d'un NFP à une station en veille réveille la radio de la station pendant au moins un intervalle DTIM — ce qui consomme la batterie. La station de base Arlo n'envoie jamais de NFP aux caméras en veille. `disable_inactivity_poll` reproduit ce comportement.

Pour vérifier qu'il fonctionne :

```bash
cfg80211tool ath02 get_disable_inactivity_poll
# Attendu : disable_inactivity_poll = 1
```

### Matrice de Vérification Complète

Après avoir appliqué toutes les configurations d'optimisation de la batterie, l'état en direct devrait correspondre :

| Paramètre | Commande | Attendu | Source |
|-----------|---------|---------|--------|
| Intervalle de balise invité | `cfg80211tool ath02 get_beacon` | `beacon = 100` | Cet article |
| Intervalle de balise invité (5 GHz) | `cfg80211tool ath21 get_beacon` | `beacon = 100` | Cet article |
| Délai d'inactivité | `cfg80211tool ath02 get_inact` | `inact = 65535` | Post 4 |
| Interrogation d'inactivité désactivée | `cfg80211tool ath02 get_disable_inactivity_poll` | `disable_inactivity_poll = 1` | Cet article |
| Économie d'énergie activée | `cfg80211tool ath02 get_ps_on_time_enable` | `ps_on_time_enable = 1` | Cet article |
| Période DTIM | `hostapd_cli -i ath02 -p /var/run/hostapd-wifi0 get dtim_period` | `DTIM period: 1` | Cet article |
| Bail DHCP invité | `grep lease /tmp/dni_udhcpd_guest.conf` | `option lease 86400` | Post 4 |
| Enregistrement caméra | `curl http://192.168.1.48:5000/device` | Toutes les caméras, pas de churn | Post 1 |

## Amélioration Mesurée

Avec la configuration complète de la Partie 3 (beacon interval = 100, inact = 65535, disable_inactivity_poll = 1, DHCP lease = 86400), j'ai répété le test de consommation de batterie en mode armé sur PORTAIL :

| Configuration | Taux de consommation | Autonomie estimée (2440 mAh, 4.5 V) |
|--------------|---------------------|--------------------------------------|
| WiFi invité par défaut (inact=300, lease=1800, poll=0) | ~3.9%/h | ~25.5 heures |
| Correctif Post 4 uniquement (inact=65535, lease=86400) | ~0.67%/h | ~6.2 jours |
| Configuration analyse complète (+beacon=100, +poll=0) | ~0.52%/h | ~8.0 jours |

Les ~8 jours d'autonomie de la batterie en étant *armée et sur un satellite maillé* sont considérablement meilleurs que les ~25 heures qui ont motivé l'investigation. Pour une caméra désarmée (pas de sonde de balise), l'autonomie attendue reste les 3–6 mois d'origine.

## Ce Qui Reste

L'IE du fournisseur dans les trames de balise de la station de base Arlo n'est toujours pas reproduit. Le `hostapd` du RBR760 supporte l'ajout d'IE spécifiques au fournisseur via `hostapd_cli set vendor_elements`, mais le format est binaire et l'IE Arlo inclut des numéros de série cryptés dont je n'ai pas complètement rétro-conçu le format. La combinaison de `disable_inactivity_poll` + `inact` long approxime le comportement assez bien pour que les mesures de batterie soient à moins de 20% des performances de la station de base originale, mais la garantie de "ne jamais désassocier même si la caméra est hors ligne pendant plus de 18 heures" de l'IE breveté n'est pas égalée.

Si vous avez besoin de cette garantie, la recommandation de la communauté reste : utilisez une vraie station de base Arlo pour la couche WiFi et acheminez son Ethernet dans votre stack auto-hébergée. Pour tous les autres, la configuration de cet article vous amène à une distance mesurable de l'autonomie d'origine.

---

*Ceci est un cinquième article bonus dans la série Arlo. La stack complète :*

- *[Post 1](/fr/remplacer-la-station-de-base-arlo-par-un-routeur-netgear-orbi/) — couche réseau : remplacement passerelle, DHCP, DNAT*
- *[Post 2](/fr/auto-heberger-arlo-cam-api-correctifs-et-ameliorations/) — couche applicative : auto-hébergement arlo-cam-api*
- *[Post 3](/fr/integrer-arlo-auto-heberge-avec-home-assistant/) — couche d'automatisation : intégration Home Assistant*
- *[Post 4](/fr/corriger-la-duree-de-vie-de-la-batterie-des-cameras-arlo-au-niveau-wifi/) — couche WiFi : délai d'inactivité et bail DHCP*
- *Cet article — mesures de consommation batterie, données sniffées de la station de base et configuration routeur étendue*

*Le dépôt compagnon sur [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) contient tous les fichiers de configuration mentionnés dans la série.*