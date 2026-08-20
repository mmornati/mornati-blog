---
title: 'Remplacer la station de base Arlo par un routeur Netgear Orbi'
tags:
- netgear
- arlo
- orbi
- rbr760
- station-de-base
- maison-intelligente
- iot
- routeur
- wifi-maillé
- maison-connectée
date: '2026-08-18T10:00:00.000000+00:00'
slug: remplacer-la-station-de-base-arlo-par-un-routeur-netgear-orbi
translationKey: arlo-base-station-replacement
url: /fr/remplacer-la-station-de-base-arlo-par-un-routeur-netgear-orbi/
aliases:
- /remplacer-la-station-de-base-arlo-par-un-routeur-netgear-orbi
categories:
- Maison Intelligente
- DIY
- Réseau
- Matériel
description: 'Comment j''ai remplacé la station de base Arlo propriétaire par un routeur mesh Netgear Orbi RBR760 rooté en telnet, pour que mes caméras utilisent le WiFi mesh existant.'
cover: cover.jpg
showHero: true
---

En 2020, quand j'ai emménagé dans ma maison actuelle, j'ai acheté un système de sécurité Arlo : une station de base unique et trois caméras Pro 4 réparties dans le jardin. La maison est assez grande, et avec une seule station de base, il n'est pas facile de garder toutes les caméras parfaitement opérationnelles. De temps en temps, une caméra au hasard perdait sa connexion, et la plus éloignée semblait vider sa batterie beaucoup plus vite que les autres — elle dépensait trop d'énergie à lutter contre le signal WiFi faible venant de la station du bureau à l'étage. J'ai donc décidé de tester le mesh Netgear Orbi que je possédais déjà, un routeur et deux satellites, pour améliorer la couverture WiFi des caméras. Ça vous rappelle quelque chose ?

Cet article est le premier d'une série de trois dans laquelle je documente ce que j'ai fait. Je n'y couvrirai ici que la **couche réseau** : comment faire en sorte qu'un Netgear Orbi RBR760 (le routeur mesh que je possédais déjà) se fasse passer pour la station de base Arlo suffisamment bien pour que les caméras se connectent, s'enregistrent et streamment — sans le cloud Arlo et sans le mauvais adaptateur WiFi USB que le reste d'internet recommande. Le dépôt compagnon à [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) contient tous les fichiers de configuration mentionnés ici.

> **Mise à jour (20 août 2026).** Après avoir terminé la série, j'ai effectué une comparaison par capture de paquets entre la vraie station de base Arlo et le WiFi invité du RBR760. Les résultats complets sont dans l'[article bonus d'analyse approfondie](/fr/analyse-approfondie-de-la-station-de-base-arlo/). En bref : le chipset Qualcomm QCA full-offload du RBR760 ne peut pas reproduire l'intervalle de balise de 31 TU de la station de base Arlo — une exigence matérielle pour la synchronisation WiFi en veille profonde des caméras. Les caméras *se* connectent et s'enregistrent avec le RBR760 (la configuration réseau de cet article est correcte), mais elles se déconnectent de façon répétée avec l'intervalle par défaut de 100 TU. Pour un fonctionnement sur batterie, conservez la station de base Arlo pour le WiFi et acheminez son Ethernet vers votre serveur.

> **Une note sur la rédaction.** Tout au long de cet article, les mots de passe admin du routeur, les vrais numéros de série des caméras, les adresses MAC, et quelques IPs LAN de production ont été remplacés par des placeholders comme `<votre_mot_de_passe_routeur>`, `XXXXXXXXXXXX`, `XX:XX:XX:XX:XX:XX`, et `192.168.1.x`. La seule « valeur magique » que je laisse délibérément en clair est `172.14.1.1` — cette valeur fait partie du protocole Arlo lui-même et est livrée dans le firmware de chaque caméra. Si vous étiez ingénieur Arlo en 2014, vous la reconnaîtriez au premier coup d'œil.

## Le Problème

Les caméras Arlo se connectent exclusivement au réseau WiFi de la station de base Arlo — elles ne se connectent **pas** à votre WiFi domestique. La station de base crée un réseau 2.4 GHz dédié (SSID du genre `NETGEAR99` ou `ARLO_VMB_XXXXXXXXX`) que les caméras utilisent pour toute communication. C'est voulu : Arlo possède le firmware des deux côtés et la station de base est un simple convertisseur de protocole qui prétend être « le cloud » sur votre réseau local.

Si vous avez une seule station de base Arlo dans un coin de votre maison, les caméras à l'autre bout reçoivent un signal médiocre et perdent la connexion. Votre mesh Orbi (routeur + 2 satellites) couvre toute la maison magnifiquement, mais les caméras ne peuvent pas l'utiliser — elles ne voient jamais que le SSID Arlo, et elles ne parleront jamais qu'à la boîte qui la diffuse.

La réponse du fournisseur à cela est « achetez une seconde station de base ». La réponse open-source est « remplacez à la fois le WiFi et la boîte de protocole par des choses que vous possédez déjà ». La suite de cet article est la réponse open-source, avec toute la plomberie LAN détaillée.

## L'Astuce

Ce n'est pas vraiment un hack — c'est une bizarrerie documentée de la façon dont Arlo a conçu ses caméras pour trouver une station de base. Quand une caméra Arlo boote et rejoint son SSID WiFi connu, elle ne récupère pas de nom DNS et elle ne fait pas d'ARP pour un hôte appelé `basestation`. Elle fait quelque chose de bien plus simple :

> **L'option DHCP 3 lui indique quelle est l'IP de la passerelle, et elle ouvre une connexion TCP brute vers cette IP sur le port 4000.** Pas de DNS, pas de mDNS, pas de négociation de protocole.

Si cette connexion réussit, la caméra suppose que la passerelle *est* la station de base. Une fois que la station de base répond dans le bon format wire, l'enregistrement est terminé et la caméra se met en sommeil en attendant des événements.

La valeur exacte de la passerelle n'a pas d'importance — ce qui compte, c'est *que la valeur que le serveur DHCP distribue soit aussi une IP que la caméra peut atteindre*. Dans une installation Arlo par défaut la station de base est la passerelle de son propre petit sous-réseau (habituellement `192.168.1.1` pour les anciennes boîtes ou des sous-réseaux RFC1918 pour les plus récentes), donc tout fonctionne par hasard. La valeur bien connue `172.14.1.1` est le choix « celui qu'on utilise » d'Arlo ; ma config la reproduit parce que les caméras avaient été initialement appairées à une station qui l'utilisait, et la changer en plein vol provoquerait tout un tas de churn de désinscription/réinscription.

Une fois que vous acceptez cette unique prémisse, le reste n'est que de la plomberie Linux de routeur ordinaire :

1. Diffuser un SSID que les caméras connaissent déjà.
2. Distribuer l'IP de passerelle qu'elles attendent via l'option DHCP 3.
3. Sur le routeur, DNAT cette passerelle IP:4000 vers une petite boîte Linux qui exécute l'émulateur de station de base.
4. Faire en sorte que ça survive à un reboot.

Tout ce qui suit est une de ces quatre étapes plus le débogage inévitable.

> **Sources pour l'astuce.** Le reverse-engineering est le travail de [Meatballs1/arlo-cam-api](https://github.com/Meatballs1/arlo-cam-api) (l'original), [brianschrameck/arlo-cam-api](https://github.com/brianschrameck/arlo-cam-api) (un fork maintenu avec un packaging correct), et [frandallfarmer/arlo-open-base-station](https://github.com/frandallfarmer/arlo-open-base-station) (une station de base DIY complète avec une UI web construite par-dessus le même cœur protocolaire). La méthode d'activation telnet vient de [bkerler/netgear_telnet](https://github.com/bkerler/netgear_telnet). La discussion communautaire qui m'a finalement fait essayer l'option DHCP 3 est sur le subreddit [r/frigate_nvr](https://www.reddit.com/r/frigate_nvr/), et l'article officiel Arlo KB sur le protocole est [ici](https://kb.arlo.com/). Je cite tous ces liens à nouveau ci-dessous au fur et à mesure que la section concernée arrive.

## Ce Que Vous Gardez / Ce Que Vous Perdez

Un système Arlo de 2014 fait beaucoup : enregistrement cloud, zones d'activité, détection personne/animal/véhicule, E911, géofencing, planification, audio bidirectionnel, notifications push, application mobile. Une stack self-hosted 2026 construite sur un routeur générique et un Raspberry Pi garde le sous-ensemble *utile* et jette le reste. La comparaison détaillée vient directement de mes notes de déploiement :

| Fonctionnalité | Cloud Arlo | Cette stack |
|----------------|-----------|-------------|
| Flux RTSP direct | Non (relais via serveurs Arlo) | Oui (port 554 direct) |
| Enregistrement sur mouvement | Oui (clips 5, 10, 30 s) | Oui (durée variable) |
| Stockage local | Non | Oui (sur le serveur) |
| Enregistrement cloud (CVR) | Oui (payant) | Non (remplacé par le NVR de votre choix) |
| Zones d'activité | Oui (payant) | Non (utilisez Frigate ou un NVR externe) |
| IA personne/animal/véhicule | Oui (payant) | Non (utilisez Frigate avec un Coral) |
| Audio bidirectionnel | Oui | Partiel (expérimental, pas dans cet article) |
| Appel d'urgence E911 | Oui | Non |
| Géofencing | Oui | Non (à scripter depuis Home Assistant) |
| Planification arm/disarm | Oui | Oui (cron Home Assistant) |
| Notifications push | Oui (app Arlo) | Oui (Home Assistant Companion + ntfy) |
| Application mobile | Oui | Non (utilisez Home Assistant Companion) |
| Monitoring batterie | Oui | Oui (API REST) |
| Viewer web | Oui | Oui (`arlo-viewer` de open-base-station) |
| HomeKit / HomeKit Secure Video | Oui | Oui (via Scrypted, voir Post 3) |
| Pas d'abonnement | Non | Oui (gratuit pour toujours) |

En d'autres termes : chaque fonctionnalité que vous pouvez répliquer localement est répliquée localement. Celles qui ont besoin d'un cloud — CVR, IA, E911, polish de l'app mobile — sont supprimées, et c'est le but.

La section suivante est celle sur laquelle tout le monde pose des questions avant de commencer.

## Analyse de la Consommation Batterie

Si vous cherchez « Arlo Raspberry Pi base station » sur internet, la première chose que vous lisez est « ne le faites pas, les batteries meurent en quelques jours ». C'est vrai *et* ça n'a presque rien à voir avec le choix du routeur. Il y a deux causes complètement indépendantes de consommation batterie, et les confondre est la raison pour laquelle 90% des messages de forum sur ce sujet finissent par quelqu'un qui achète une caméra PoE.

### Cause 1 — Polling RTSP continu (le vrai tueur)

Les caméras Arlo sur batterie sont conçues pour dormir 99% du temps et ne se réveiller que pour les événements de mouvement. Leur consommation moyenne est en microampères à un seul chiffre, c'est pour ça qu'une cellule 2440 mAh dure 3-6 mois.

Le streaming RTSP continu maintient la radio WiFi, l'encodeur vidéo, le capteur PIR et le CPU principal éveillés 24/7. Le calcul :

- Fonctionnement normal : la caméra dort 2-5 heures, se réveille 5-10 s par événement
- RTSP continu : la batterie se vide en jours/semaines au lieu de mois

Si vous avez besoin d'enregistrement 24/7, les caméras Arlo sur batterie sont le mauvais matériel. Achetez une caméra PoE (Reolink, Dahua, Hikvision, Amcrest) pour ça. Les caméras Arlo sont conçues uniquement pour l'enregistrement événementiel. Mélanger les deux stratégies est la cause n°1 de « j'ai fait fonctionner ça et les batteries sont mortes en 48 heures ».

### Cause 2 — Mauvais hardware WiFi

La seconde cause est indépendante de tout serveur RTSP et c'est celle qui se corrige : le choix du point d'accès WiFi. Spécifiquement, l'approche populaire « utilisez un adaptateur WiFi USB sur votre Raspberry Pi ».

Si vous utilisiez un adaptateur WiFi USB grand public (surtout les chipsets RTL8812AU comme l'Alfa AWUS036ACH) sur le Raspberry Pi, le WiFi lui-même déconnectait les caméras toutes les ~30 minutes. Chaque reconnexion vide significativement la batterie.

| Hardware WiFi | Intervalle d'enregistrement caméra | Impact batterie |
|---------------|-----------------------------------|-----------------|
| WiFi USB (RTL8812AU) | Toutes les 30 minutes | Drain élevé |
| TP-Link Omada EAP225 | Toutes les 2-5 heures | Normal |
| Netgear Orbi RBR760 | **Attendu : 2-5 heures** | **Normal** |

### Pourquoi l'Orbi RBR760 est différent

L'Orbi RBR760 est un système WiFi mesh d'entreprise correct, pas un adaptateur USB grand public. Il :

- Supporte le 802.11ax (WiFi 6) avec une négociation power-save correcte
- A les capacités ShortPreamble, STBC, RIFS et AMPDU correctes
- Gère correctement le power management 802.11 pour les clients sur batterie
- Maintient des connexions WiFi stables pendant le deep sleep de la caméra

L'implémentation WiFi de l'Orbi est équivalente ou meilleure que celle de la station de base Arlo. L'autonomie batterie devrait être comparable à l'installation Arlo d'origine.

### Autonomie batterie attendue

| Modèle caméra | Avec station Arlo | Avec WiFi guest Orbi |
|---------------|-------------------|----------------------|
| Arlo Pro 2 | 3-6 mois | 3-6 mois (attendu) |
| Arlo Pro 3 | 3-6 mois | 3-6 mois (attendu) |
| Arlo Pro 4 | 3-6 mois | 3-6 mois (attendu) |
| Arlo Ultra 2 | 2-4 mois | 2-4 mois (attendu) |

### Comment utiliser les caméras sans vider la batterie

| Approche | Impact batterie | Notes |
|----------|-----------------|------|
| Enregistrement événementiel (arlo-cam-api) | Normal | La caméra se réveille sur mouvement, enregistre, dort |
| Snapshot manuel via API | Faible | Un snapshot à la fois |
| Streaming RTSP (occasionnel) | Moyen | Stream 30-60 s, puis déconnexion |
| Streaming RTSP (continu) | **Très élevé** | Videra la batterie en jours — *ne jamais* faire ça |
| Enregistrement continu Frigate | **Très élevé** | Videra la batterie en jours — *ne jamais* faire ça |
| Frigate + `go2rtc` (on-demand only) | Normal | Utilisez `go2rtc` avec config `on_demand` |

La configuration MediaMTX que j'introduis dans le Post 2 est configurée pour `sourceOnDemand: yes` avec `sourceOnDemandCloseAfter: 1s` — le port RTSP de la caméra n'est ouvert que pour les quelques secondes où Home Assistant rend la carte picture-glance, puis refermé. Cela maintient la consommation moyenne proche de la ligne « normal ».

## Prérequis

Avant de commencer, confirmez ce que vous avez et le firmware que vous exécutez.

### Hardware

| Composant | Requis | Recommandé |
|-----------|--------|------------|
| Netgear Orbi RBR760 | Oui | Firmware V6.3.1.0 – V6.3.8.5 |
| Satellites Orbi (RBS760) | Optionnel | Pour couverture étendue |
| Serveur Linux | Oui | Raspberry Pi 4 (2 Go+) ou mini-PC N100 |
| Stockage USB | Optionnel | Pour les enregistrements (si stockage local) |
| Câble réseau | Oui | Pour connecter le serveur au port LAN Orbi |

### Software

| Software | Usage |
|----------|-------|
| [bkerler/netgear_telnet](https://github.com/bkerler/netgear_telnet) | Active telnet sur RBR760 |
| [Meatballs1/arlo-cam-api](https://github.com/Meatballs1/arlo-cam-api) ou [brianschrameck/arlo-cam-api](https://github.com/brianschrameck/arlo-cam-api) | Émulateur station de base |
| Python 3.7+ | Runtime pour arlo-cam-api |
| ffmpeg | Grabber de snapshots (Post 2) |
| nmap (optionnel) | Tester quels ports sont ouverts |
| Client telnet | Tout ce qui parle RFC 854 |

### Gamme de firmware testée

Tout ce write-up a été développé contre **RBR760 V6.3.8.5 (Chaos Calmer, `rtm-6.3.8.5+r49254`)**. La méthode d'activation telnet fonctionne pour V6.3.1.0 à V6.3.8.5 inclus ; en dehors de cette gamme les chiffrements dans `bkerler/netgear_telnet` auront probablement besoin de patch. **Ne passez pas à V7** — le protocole a changé et je n'ai vu personne récupérer telnet sur V7.

### Informations réseau à collecter

Avant de commencer, notez :

- **SSID station de base Arlo** (ex. `ARLO_VMB_XXXXXXXXX` ou `NETGEAR99`)
- **IP passerelle station de base Arlo** (typiquement `172.14.1.1` ou `192.168.1.1`)
- **Votre IP RBR760** (par défaut : `<router-ip>`)
- **Adresse MAC de votre serveur** (pour lease DHCP statique)
- **Adresse MAC de votre RBR760** (Advanced > Advanced Home > Router Information > MAC Address)

Toutes ces valeurs seront collées à divers endroits dans les prochaines sections.

## Étape 1 — Activer Telnet sur RBR760

C'est la seule étape « hack » et elle est simple. L'Orbi exécute un OpenWrt customisé sous une UI web Netgear, et le firmware *inclut bien* un daemon telnet — mais le daemon n'est pas démarré par défaut, et l'échange de mot de passe que le daemon utilise pour s'authentifier est chiffré avec une clé par routeur que la GUI publique n'expose jamais.

[bkerler/netgear_telnet](https://github.com/bkerler/netgear_telnet) implémente cet échange. Il utilise une attaque known-plaintext contre le flux d'auth du routeur qui a été publiée il y a des années et fonctionne toujours pour le firmware actuel.

### 1.1 Cloner l'outil

```bash
git clone https://github.com/bkerler/netgear_telnet.git
cd netgear_telnet
pip3 install pycryptodome
```

L'outil a besoin de `pycryptodome` parce qu'il implémente l'échange AES par routeur localement plutôt que de demander au routeur de révéler la clé.

### 1.2 Activer telnet

Récupérez la MAC br0 du routeur depuis la GUI : **Advanced > Advanced Home > Router Information > MAC Address**. Puis lancez :

```bash
python3 telnet-enable.py <router-ip> XX:XX:XX:XX:XX:XX admin 'votre_mot_de_passe_routeur'
```

Vous devriez obtenir un message de succès en quelques secondes. Si vous obtenez `auth failed`, vérifiez la MAC et le mot de passe — le mot de passe est le mot de passe admin du routeur, pas la clé WiFi.

### 1.3 Désactiver les mises à jour automatiques (critique !)

Connectez-vous en telnet **maintenant** et désactivez les mises à jour auto du firmware. Une mise à jour effacera l'accès telnet et toutes vos customisations, et vous ne les récupérerez pas sans ré-exécuter l'outil ci-dessus — qui peut ou non fonctionner contre le nouveau firmware.

```bash
telnet <router-ip>
# login: admin / votre_mot_de_passe_routeur

nvram set orbi_auto_upgrade=0
nvram set auto_check_for_upgrade=0
nvram set auto_update=0
nvram commit

# Vérifier
nvram show | grep auto_
# orbi_auto_upgrade=0
# auto_check_for_upgrade=0
# auto_update=0
```

Cela commit à la NVRAM et survit aux reboots. Le même set `nvram` est mentionné dans [gist.github.com/joshkitt](https://gist.github.com/joshkitt/a8dd1b7dcf6d66a2cf58a5ce117a1547) qui est la référence communautaire la plus citée pour cette astuce.

### 1.4 Vérifier l'accès telnet

```bash
telnet <router-ip>
# Vous devriez voir un prompt root shell (#)
```

Le prompt que vous obtenez est **root**, pas `admin`. Le routeur exécute telnetd en root, ce qui explique en partie pourquoi « ne pas exécuter `passwd` » est une règle stricte (voir Dépannage). Si jamais vous exécutez `passwd` sur le RBR760, le mot de passe est réinitialisé à quelque chose que l'outil telnet-enable ne peut pas calculer, et le seul fix est un factory reset via le bouton arrière.

> **Une chose de plus :** telnet ne survit pas à un reboot du routeur. Après chaque cycle d'alimentation vous devez ré-exécuter `telnet-enable.py` avant de pouvoir vous reconnecter en telnet. Le Post 3 vous montrera un job cron `@reboot` sur le serveur qui fait exactement ça.

## Étape 2 — Capturer le SSID et PSK Arlo

Vous devez connaître le SSID *exact* et la WPA-PSK que les caméras utilisent actuellement. La manière la plus propre est de leur demander — les stations de base Arlo parlent WPS, et on peut amener le même protocole WPS à révéler la PSK en prétendant être une autre boîte Arlo.

### Méthode A — Capture WPS sur la station de base Arlo d'origine (recommandée)

Sur une machine Linux avec une carte WiFi (par ex. votre Raspberry Pi) :

```bash
# Construire une config wpa_supplicant qui prétend être un enrollee WPS Arlo
cat > /tmp/wpa.conf << 'EOF'
ctrl_interface=/var/run/wpa_supplicant
ctrl_interface_group=0
update_config=1
device_name=NTGRDEV
manufacturer=broadcom
EOF

# Arrêter NetworkManager pour qu'il ne se batte pas pour la radio
sudo systemctl stop NetworkManager

# Se connecter au SSID de la station de base Arlo avec ce profil enrollee
sudo wpa_supplicant -t -Dwext -i wlan0 -c /tmp/wpa.conf

# Dans un autre terminal :
sudo iwconfig wlan0 essid ARLO_VMB_XXXXXXXXX
sudo wpa_cli -i wlan0 wps_pbc
# Maintenant appuyez sur le bouton Sync de la station de base Arlo
```

Si ça réussit, la WPA-PSK apparaît dans `/tmp/wpa.conf` après quelques secondes. Les lignes `device_name=NTGRDEV` et `manufacturer=broadcom` ne sont pas random — les stations de base Arlo s'identifient comme Netgear (NTGRDEV est le nom d'appareil enrollee WPS Netgear) et elles utilisent WPS Broadcom en interne. Spoofer les deux est ce qui rend la boîte Arlo disposée à nous parler.

### Méthode B — Lire l'étiquette sur la station de base Arlo

Si vous avez un accès physique à la station de base Arlo, le SSID et le mot de passe sont imprimés sur l'étiquette blanche en dessous. Ils ressemblent à :

```
SSID:     ARLO_VMB_XXXXXXXXX
Password: a-bunch-of-random-chars
```

### Méthode C — Noter le SSID depuis l'app Arlo

Si l'app Arlo fonctionne encore, le SSID est dans **Settings > My Devices > [base station] > WiFi Settings**. Le PSK peut être exporté sur certaines versions de firmware mais pas toutes, donc la Méthode A est la seule approche universellement fiable.

### Ce qu'il vous faut à la fin

Notez ces valeurs exactement — sensible à la casse, pas d'espace au début/à la fin :

```bash
ARLO_SSID="ARLO_VMB_XXXXXXXXX"   # <- exact, sensible à la casse
ARLO_PASSWORD="<comme imprimé>"  # <- exact, sensible à la casse
```

Les caméras refuseront de roam si l'une des valeurs diffère de ce qu'elles ont stocké. J'ai appris à mes dépens après une typo sur un caractère qui m'a coûté une heure gaspillée de « pourquoi la caméra voit-elle encore l'ancien SSID dans sa scan list ? ».

## Étape 3 — Configurer le Réseau Guest Orbi

Maintenant le plaisir commence. Nous allons cloner le SSID Arlo sur le WiFi guest de l'Orbi pour que les caméras voient deux réseaux avec le même nom et (nous l'espérons) préfèrent le nôtre.

Le réseau guest de l'Orbi est spécial : il a son propre bridge (`br-guest`), son propre sous-réseau (`192.168.2.0/24` par défaut), son propre serveur DHCP (`dni_guest_udhcpd`, pas dnsmasq), et sa propre zone firewall avec `forward=REJECT`. Toutes ces contraintes existent pour des raisons de sécurité dans le firmware résidentiel, et nous allons les affronter une par une dans les prochaines sections.

### 3.1 Se connecter en telnet au routeur

```bash
telnet <router-ip>
# login: admin / votre_mot_de_passe_routeur
```

Vous devriez être à un shell root. Si vous n'y arrivez pas, revenez à l'Étape 1.

### 3.2 Lire les SSID guest actuels

```bash
uci get wireless.Guest2.ssid
uci get wireless.Guest5.ssid
```

`Guest2` est le VAP guest 2.4 GHz, `Guest5` est le VAP guest 5 GHz. (Note : `Guest5` n'existe pas réellement comme VAP sur le firmware RBR760 — il est référencé dans UCI mais seul le 2.4 GHz est broadcast. Les caméras Arlo sont uniquement 2.4 GHz donc ça va, mais ça explique pourquoi certains posts de forum vous disent de définir les deux clés.)

### 3.3 Les faire correspondre à la station de base Arlo

```bash
uci set wireless.Guest2.ssid='ARLO_VMB_XXXXXXXXX'
uci set wireless.Guest5.ssid='ARLO_VMB_XXXXXXXXX'

# Mettre le même mot de passe que la station de base Arlo
uci set wireless.Guest2.key='votre_mot_de_passe_arlo'
uci set wireless.Guest5.key='votre_mot_de_passe_arlo'

uci commit wireless
wifi
```

Le reload `wifi` à la fin fait monter le nouveau SSID. Vous devriez voir `ath02` réapparaître dans la sortie `iw dev` en quelques secondes.

### 3.4 Vérifier que le réseau guest diffuse

```bash
iw dev ath02 info  # Interface guest 2.4GHz (ath02)
iw dev ath21 info  # Interface guest 5GHz (ath21, peut ne pas exister)
```

Sortie attendue pour `ath02` :

```
Interface ath02
    ifindex 14
    wdev 0x...
    addr XX:XX:XX:XX:XX:XX
    type monitor
    wiphy 1
    channel 1 (2412 MHz), width: 40 MHz
    SSID: ARLO_VMB_XXXXXXXXX
```

Un téléphone ou laptop devrait aussi voir `ARLO_VMB_XXXXXXXXX` dans la liste WiFi maintenant (sans le suffixe « Guest », parce que le SSID est exactement celui d'Arlo).

### 3.5 Trouver le bridge du réseau guest

```bash
brctl show
ip addr show br-guest
```

Sur le RBR760 le bridge guest est `br-guest`, et son IP est `192.168.2.1/24` par défaut. Cette IP est celle que le serveur DHCP guest de l'Orbi distribue — et ce n'est *pas* la valeur que les caméras finiront par utiliser, comme l'explique la section suivante.

## Étape 4 — DHCP et DNAT sur RBR760

Si le reste de cet article était un tutoriel OpenWrt normal, cette section serait un simple `uci set` et un `/etc/init.d/dnsmasq restart`. Ça ne l'est pas. Trois choses rendent le firmware Orbi différent d'un OpenWrt stock, et chacune d'elles peut silencieusement casser l'enregistrement des caméras si vous ne savez pas où regarder.

### 4.1 Le daemon propriétaire `dni_guest_udhcpd` (UCI est ignoré)

Sur un OpenWrt stock, le réseau guest est juste une autre interface avec une section `dhcp` dans `/etc/config/dhcp`. Sur le RBR760 le DHCP guest **n'est pas** servi par `dnsmasq`. Il est servi par un daemon userspace propriétaire Netgear appelé `dni_guest_udhcpd`, et ce daemon lit sa config depuis `/tmp/dni_udhcpd_guest.conf` (pas depuis UCI).

La conséquence pratique est dramatique et c'est la source numéro un de plaintes « j'ai suivi le guide et les caméras ne s'enregistrent pas » sur le subreddit Orbi :

> **Tout ce que vous mettez dans `uci set dhcp.lan.dhcp_option='3,...'` ou `uci set dhcp.guest.dhcp_option='3,...'` est silencieusement ignoré pour le réseau guest.** UCI et `dnsmasq` sont découplés du chemin DHCP guest entièrement.

Le workaround officiel est d'écrire l'option directement dans le fichier de config du daemon propriétaire et de le redémarrer. Je montrerai le script complet en §4.5 — l'extrait pertinent est :

```bash
# La config DHCP guest n'est PAS /etc/config/dhcp — c'est /tmp/dni_udhcpd_guest.conf
# qui est lu par /sbin/dni_guest_udhcpd (un daemon propriétaire Netgear).
# Modifier UCI ici est futile ; vous devez réécrire le fichier de config.

cat /tmp/dni_udhcpd_guest.conf
# Contenu par défaut :
#   interface br-guest
#   start 192.168.2.100
#   end 192.168.2.254
#   option router 192.168.2.1   <-- doit changer en 172.14.1.1
#   option dns 192.168.2.1      <-- doit changer en 1.1.1.1
#   option lease 86400
#   ...
```

> **Une note sur la persistance.** `/tmp/dni_udhcpd_guest.conf` vit en `tmpfs`, donc il est régénéré à chaque boot. L'astuce en §4.5 est de l'écraser depuis un script de démarrage qui s'exécute *après* le script init Netgear qui le régénère. C'est pour ça que notre script s'appelle `S99arlo` (ordre de démarrage 99) et pas `S40arlo` (l'ordre 40 serait en course avec l'init Netgear).

Vous pouvez aussi dire au niveau UCI d'arrêter d'essayer de gérer le DHCP guest :

```bash
uci set dhcp.guest=dhcp
uci set dhcp.guest.ignore='1'
uci commit
```

C'est ceinture et bretelles — UCI ignorait déjà le pool guest, mais ça arrête UCI de logger des warnings à chaque reload de dnsmasq.

### 4.2 L'astuce de la passerelle virtuelle `172.14.1.1/24` (seule l'option DHCP 3 compte)

La caméra Arlo ne se soucie pas réellement de ce que « vaut » l'IP de la passerelle — elle se soucie que l'IP qu'elle a reçue via l'option DHCP 3 soit une IP à laquelle elle peut ouvrir une connexion TCP sur le port 4000. Ça paraît facile, mais sur le firmware Orbi le bridge guest a sa propre IP (`192.168.2.1`) et vous ne pouvez pas simplement la changer : changer l'IP du bridge changerait aussi l'adresse qui apparaît dans la ligne `option router` du serveur DHCP guest (toujours le mauvais daemon, mais la valeur compte quand même), et casserait tous les autres clients guest qui ont déjà appris l'ancienne passerelle via ARP.

L'astuce est d'ajouter une **seconde IP** au bridge guest comme alias, et de dire au serveur DHCP que la seconde IP est la passerelle :

```bash
# 1. Ajouter l'IP passerelle virtuelle au bridge guest
ip addr add 172.14.1.1/24 dev br-guest
```

Puis réécrire la config du daemon pour distribuer l'IP alias au lieu de l'IP du bridge :

```bash
# 2. Réécrire option router en 172.14.1.1
sed -i "s/option router .*/option router 172.14.1.1/" /tmp/dni_udhcpd_guest.conf

# 3. Réécrire option dns vers un vrai DNS public
sed -i "s/option dns .*/option dns 1.1.1.1/" /tmp/dni_udhcpd_guest.conf

# 4. Ajouter un DNS secondaire s'il n'est pas déjà présent
grep -q "1.0.0.1" /tmp/dni_udhcpd_guest.conf || \
    echo "option dns 1.0.0.1" >> /tmp/dni_udhcpd_guest.conf

# 5. Redémarrer le daemon propriétaire
kill -9 $(cat /var/run/dni_guest_udhcpd.pid 2>/dev/null) 2>/dev/null
/sbin/dni_guest_udhcpd /tmp/dni_udhcpd_guest.conf
```

> **Pourquoi l'alias sur le bridge.** Quand une caméra loue une IP au daemon et récupère `option router 172.14.1.1`, la caméra fait un ARP pour `172.14.1.1` sur le bridge guest. Parce que `172.14.1.1/24` est configuré comme alias sur `br-guest`, le bridge répond à l'ARP avec la MAC du routeur lui-même — la trame de la caméra est livrée au routeur, où notre DNAT (prochaine section) l'attrape. La caméra n'a pas besoin (et ne vérifie pas) que `172.14.1.1` soit aussi un hôte réel accessible sur internet. Elle a juste besoin d'une IP qui répond au SYN qu'elle envoie sur le port 4000.

Le résultat est que la trame d'enregistrement de la caméra est livrée à l'Orbi, l'Orbi réécrit la destination vers le serveur, le serveur répond, et la connexion est établie. Du point de vue de la caméra la passerelle est « la station de base » — ce qui est exactement ce qu'elle veut.

### 4.3 La bizarrerie du firewall ODM (`-I FORWARD 1`)

Sur un OpenWrt stock la chaîne `FORWARD` est la seule chose qui gate le trafic inter-zones, et quelques `iptables -A FORWARD -j ACCEPT` suffisent. Le RBR760 a une seconde couche firewall devant : les chaînes propriétaires Netgear ODM (`ODM_FORWARD`, `ODM_FORWARD_TOP`, etc.) sont insérées *au-dessus* de la chaîne `FORWARD` utilisateur au boot, et elles implémentent une isolation stricte guest-vers-LAN (`forward=REJECT`) qui survit même aux changements de règles UCI.

Si vous faites ça — ce qui est la chose naturelle à faire :

```bash
# FAUX : la règle se retrouve en bas de FORWARD, après ODM_FORWARD
iptables -A FORWARD -i br-guest -d 192.168.1.X -j ACCEPT
```

la règle est ajoutée en bas de `FORWARD`, ce qui veut dire que la règle ODM `REJECT` au-dessus s'exécute d'abord et drop la trame. La connexion timeout, la caméra se met en sommeil, et vous passez la prochaine heure à vous demander pourquoi votre test DNAT avec `wget` fonctionne mais que la caméra ne se connecte jamais.

Le fix est d'insérer la règle utilisateur *au-dessus* de la chaîne ODM, à la position 1 de la chaîne FORWARD :

```bash
# CORRECT : inséré en haut, avant que toute chaîne ODM ne s'exécute
iptables -I FORWARD 1 -i br-guest -d 192.168.1.X -j ACCEPT
iptables -I FORWARD 1 -i br-lan -o br-guest -s 192.168.1.X -j ACCEPT
iptables -I FORWARD 1 -i br-lan -o br-guest -d 192.168.2.0/24 -j ACCEPT
```

Vérifiez avec `iptables -L FORWARD -n -v --line-numbers` — les règles utilisateur doivent être aux lignes 1-3. Sur ce firmware, les chaînes ODM peuvent ne pas être référencées du tout dans une chaîne `FORWARD` fraîchement démarrée (elles ne sont câblées qu'après certains événements UCI/guest-zone) ; ce qui compte, c'est que vos règles soient les premiers ACCEPT de la chaîne. Si l'ordre est inversé, la caméra ne s'enregistrera pas.

### 4.4 Ne PAS utiliser SNAT sur le chemin caméra → serveur (boucle hairpin)

C'est la deuxième erreur la plus commune dans les write-ups communautaires. L'instinct vient de tutoriels génériques « caméra derrière un routeur » où l'auteur ajoute à la fois DNAT et SNAT par symétrie. Pour Arlo cet instinct est exactement à l'envers.

Considérez ce qui se passe si vous ajoutez naïvement du SNAT au trafic caméra → serveur :

```bash
# NE PAS FAIRE ÇA
iptables -t nat -A POSTROUTING -s 192.168.2.0/24 -d 192.168.1.X \
    -p tcp --dport 4000 -j SNAT --to-source 172.14.1.1
```

La caméra envoie un SYN depuis `192.168.2.4` vers `172.14.1.1:4000`. Le DNAT réécrit la destination vers le serveur (`192.168.1.X:4000`). La trame atteint `POSTROUTING` et le SNAT réécrit la source en `172.14.1.1` (une IP locale du routeur). Le serveur reçoit un SYN qui *semble* venir de `172.14.1.1:port-aleatoire`. La stack TCP du serveur envoie le SYN-ACK vers `172.14.1.1:port-aleatoire` — qui est l'**IP du routeur lui-même**. Le routeur accepte le SYN-ACK localement comme un paquet destiné à lui-même, ne le route jamais vers l'extérieur, et la connexion reste juste en `SYN_RECV` jusqu'à ce que la caméra abandonne.

Le symptôme est sans ambiguïté :

```bash
cat /proc/net/nf_conntrack | grep 4000
# SYN_RECV src=192.168.2.2 dst=192.168.1.X sport=RAND dport=4000
```

Cette seule ligne est ce que tout le monde qui poursuit « les caméras se connectent au WiFi mais ne s'enregistrent jamais » voit dans la table conntrack. Le fix est :

```bash
# Retirer la mauvaise règle
iptables -t nat -D POSTROUTING -s 192.168.2.0/24 -d 192.168.1.X \
    -p tcp --dport 4000 -j SNAT --to-source 172.14.1.1

# Flush les entrées conntrack périmées
conntrack -D -p tcp --dport 4000
```

> **L'asymétrie :** Il y a *une* direction où le SNAT **est** requis, et c'est le chemin retour : serveur → caméra (par ex. appels REST `arm` et `pirled`). Les caméras Arlo ont un firewall interne qui n'accepte les connexions que depuis l'IP passerelle, donc sans SNAT ces endpoints retournent toujours `{"result": false}`. Le script S99 (section suivante) gère ça — mais le chemin caméra → serveur **ne doit jamais** être SNATté.

### 4.5 Le script complet `S99arlo` (lien + extrait)

Le script de démarrage complet, idempotent, qui gère les bizarreries Netgear est à [`rbr760/S99arlo`](https://github.com/mmornati/arlo-base-station/blob/main/rbr760/S99arlo) dans le dépôt compagnon. Il fait 92 lignes, commentaires inclus. L'extrait ci-dessous est une version simplifiée pour l'illustration ; les trois bits non évidents sont mis en évidence.

```bash
#!/bin/sh /etc/rc.common
START=99   # s'exécute APRÈS tous les scripts init Netgear qui touchent dni_guest_udhcpd

start() {
    GUEST_BR="br-guest"
    SERVER="192.168.1.X"        # l'IP LAN de votre serveur
    GATEWAY="172.14.1.1"        # constante wire-protocol Arlo — NE PAS changer

    # 1. Ajout IP alias idempotent (déjà là ? skip silencieusement)
    ip addr add ${GATEWAY}/24 dev ${GUEST_BR} 2>/dev/null || true

    # 2. Réécrire la config du daemon propriétaire (PAS UCI — voir §4.1)
    sed -i "s/option router .*/option router ${GATEWAY}/" \
        /tmp/dni_udhcpd_guest.conf 2>/dev/null
    sed -i "s/option dns .*/option dns 1.1.1.1/" \
        /tmp/dni_udhcpd_guest.conf 2>/dev/null
    grep -q "1.0.0.1" /tmp/dni_udhcpd_guest.conf \
        || echo "option dns 1.0.0.1" >> /tmp/dni_udhcpd_guest.conf

    # 3. Redémarrer dni_guest_udhcpd (il lira la nouvelle config maintenant)
    if [ -f /var/run/dni_guest_udhcpd.pid ]; then
        kill -9 $(cat /var/run/dni_guest_udhcpd.pid) 2>/dev/null
    fi
    /sbin/dni_guest_udhcpd /tmp/dni_udhcpd_guest.conf

    # 4. DNAT — caméra → serveur (le seul NAT dont on a besoin sur ce chemin)
    iptables -t nat -A PREROUTING -i ${GUEST_BR} -p tcp --dport 4000 \
        -j DNAT --to-destination ${SERVER}:4000
    iptables -t nat -A PREROUTING -i ${GUEST_BR} -p tcp --dport 4100 \
        -j DNAT --to-destination ${SERVER}:4100

    # 5. SNAT — serveur → caméras (pour que les caméras acceptent arm/pirled
    #    depuis l'IP "passerelle").
    #    NOTE : c'est la direction OPPOSÉE à la boucle hairpin ci-dessus.
    #    Sans ça, les caméras renvoient {"result": false} sur /arm et /pirled.
    iptables -t nat -A POSTROUTING -s ${SERVER} -d 192.168.2.0/24 \
        -j SNAT --to-source ${GATEWAY}

    # 6. Règles FORWARD — INSÉRER à la position 1, AVANT les chaînes ODM (§4.3)
    iptables -I FORWARD 1 -i ${GUEST_BR} -d ${SERVER} -j ACCEPT
    iptables -I FORWARD 1 -i br-lan -o ${GUEST_BR} -s ${SERVER} -j ACCEPT
    iptables -I FORWARD 1 -i br-lan -o ${GUEST_BR} -d 192.168.2.0/24 -j ACCEPT
}

stop() {
    :
}
```

Le script va dans `/etc/rc.d/S99arlo` et est invoqué à chaque boot. Pour le rendre exécutable et le lancer une fois :

```bash
chmod +x /etc/rc.d/S99arlo
/etc/rc.d/S99arlo start
```

Un walkthrough ligne par ligne complet vit à [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) ; le fichier script est la source canonique.

### 4.6 Vérifier les règles

```bash
# DNAT doit montrer 2 lignes (une par port)
iptables -t nat -L PREROUTING -n -v | grep -E "4000|4100"

# Règles FORWARD doivent être aux lignes 1-3 (AVANT chaînes ODM)
iptables -L FORWARD -n -v --line-numbers | head -10

# IP virtuelle doit être présente sur br-guest
ip addr show br-guest | grep 172.14

# DHCP guest doit avoir option router = 172.14.1.1
cat /tmp/dni_udhcpd_guest.conf | grep -E "router|dns"

# POSTROUTING doit avoir EXACTEMENT UNE règle SNAT (serveur → caméras)
iptables -t nat -L POSTROUTING -n -v
```

Si les règles FORWARD ne sont pas aux lignes 1-3, relancez avec `iptables -I FORWARD 1 ...` (pas `-A`). Si le SNAT manque ou a `-d ${SERVER}` au lieu de `-d 192.168.2.0/24`, vos appels REST arm/pirled retourneront `false`.

## Étape 5 — Installer arlo-cam-api sur le Serveur

La couche réseau est le centre d'attention de *cet* article. L'installation de `arlo-cam-api` est le centre d'attention du *Post 2* — pour le contexte je vais montrer le minimum qui doit tourner avant que les caméras puissent s'enregistrer.

Les dépendances paquets Debian sur le serveur :

```bash
sudo apt update
sudo apt install -y python3-pip python3-venv git ffmpeg
```

Puis cloner et installer :

```bash
git clone https://github.com/brianschrameck/arlo-cam-api.git
cd arlo-cam-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

`requirements.txt` minimum :

```text
Flask==1.1.4
pycryptodome
requests
```

Puis le lancer :

```bash
python server.py
# * Running on http://0.0.0.0:4000
# * REST API on http://0.0.0.0:5000
```

Pour le faire survivre aux reboots on utilise une unit systemd :

```ini
# /etc/systemd/system/arlo-cam-api.service
[Unit]
Description=Arlo Camera API Server
After=network.target

[Service]
Type=simple
User=arlo
WorkingDirectory=/home/arlo/arlo-cam-api
ExecStart=/home/arlo/arlo-cam-api/venv/bin/python server.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Activer et démarrer :

```bash
sudo systemctl enable arlo-cam-api
sudo systemctl start arlo-cam-api
sudo systemctl status arlo-cam-api
```

Le Post 2 complet couvre : `server.py` patché pour corriger le bug auto-register-on-restart, le handler de mouvement `arlo-snapshot` à deux endpoints, et le layout Docker Compose. Pour cet article l'important est que :

- Le port 4000 est bind et écoute sur l'IP LAN du serveur
- Le serveur peut atteindre le sous-réseau caméra (192.168.2.0/24) via les règles FORWARD de l'Orbi
- Le serveur retourne un ack d'enregistrement Arlo valide à tout SYN sur le port 4000

Si vous voulez tester le bout-en-bout avant de toucher aux caméras, faites ceci depuis le serveur :

```bash
# Confirmer qu'arlo-cam-api tourne
curl http://192.168.1.X:5000/device

# Confirmer que le DNAT est joignable depuis le routeur lui-même
ssh root@<router-ip> 'curl http://192.168.1.X:5000/status'

# Confirmer une requête en forme de caméra depuis un téléphone sur le WiFi guest
# (après qu'au moins une caméra se soit enregistrée)
curl -X POST http://192.168.1.X:5000/device/XXXXXXXXXXXX/arm \
     -H "Content-Type: application/json" \
     -d '{"arm": true}'
```

Si `device` retourne `[]` vous n'êtes pas encore enregistré. Passez à l'Étape 6.

## Étape 6 — Appairer les Caméras

> **Gotcha Orbi critique — WPS ne fonctionne pas sur les VAP guest.**
>
> Le firmware RBR760 est un OpenWrt customisé qui exécute le `hostapd` propriétaire Netgear et le firewall ODM. **WPS Push Button Configuration (PBC) ne fonctionne PAS sur les VAP guest (`ath02`/`ath21`)** — la commande `wps_pbc` renvoie `FAIL`. WPS fonctionne seulement sur les VAP principaux (`ath0`/`ath1`/`ath2`). Cela veut dire que le workflow « appuyez sur WPS sur l'Orbi et sur la caméra » qui marche pour les routeurs normaux va silencieusement no-op ici.

Le workaround est d'utiliser la station de base Arlo d'origine pour l'appairage WPS, puis de l'éteindre et de laisser les caméras se reconnecter au réseau guest Orbi (qui a le *même* SSID et PSK).

### 6.1 Appairer avec la station de base Arlo d'origine (requis)

Pour chaque caméra :

1. **Allumer** votre station de base Arlo d'origine
2. **Factory reset** chaque caméra (maintenir le bouton Sync pendant 10-15 s jusqu'à ce que la LED clignote en orange, puis relâcher). Le clignotement orange signifie que la caméra est en mode appairage.
3. Appuyer sur **Sync sur la station de base** (dans les 2 minutes).
4. La caméra s'apparie, la LED devient bleue brièvement, puis clignote.
5. La caméra s'associe au SSID de la station de base (`ARLO_VMB_XXXXXXXXX`) et PSK.
6. **Éteindre** la station de base d'origine (la débrancher).

### 6.2 Les caméras se reconnectent au réseau guest Orbi

Après que la station de base soit éteinte, les caméras vont :

1. Perdre la connexion dans les 30-60 s.
2. Scanner les réseaux WiFi avec le SSID `ARLO_VMB_XXXXXXXXX`.
3. Trouver le réseau guest Orbi qui diffuse ce SSID (même nom, même PSK).
4. S'associer automatiquement.
5. Obtenir une IP via DHCP de `dni_guest_udhcpd` (par ex. `192.168.2.2`, `192.168.2.3`).
6. Recevoir `option router 172.14.1.1` via l'option DHCP 3.
7. Ouvrir une connexion TCP vers `172.14.1.1:4000`.
8. La règle DNAT réécrit la destination vers `192.168.1.X:4000`.
9. `arlo-cam-api` répond dans le protocole Arlo et l'enregistrement est terminé.

Ce processus prend 1-5 minutes par caméra. Les trois miennes sont revenues en ligne en deux minutes — aucune n'a eu besoin d'une seconde tentative WPS une fois la station de base débranchée.

### 6.3 Vérifier la connexion

Sur le RBR760 :

```bash
# Vérifier le fichier de leases DHCP — les IPs des caméras apparaîtront ici
cat /tmp/dni_udhcpd_guest.leases
# 192.168.2.2 XX:XX:XX:XX:XX:XX XXXXXXXXXXXX *
# 192.168.2.3 XX:XX:XX:XX:XX:XX XXXXXXXXXXXX *
# 192.168.2.4 XX:XX:XX:XX:XX:XX XXXXXXXXXXXX *

# Ou vérifier ARP sur le bridge guest
arp -n -i br-guest
```

Sur le serveur, confirmer qu'arlo-cam-api les a enregistrées :

```bash
curl http://localhost:5000/device | python -m json.tool
```

Sortie attendue :

```json
[
  {
    "friendly_name": "XXXXXXXXXXXX",
    "hostname": "VMC4040P-XXXXX",
    "ip": "192.168.2.2",
    "serial_number": "XXXXXXXXXXXX"
  },
  ...
]
```

Si `device` retourne `[]` après 5 minutes, la cause la plus probable est le bug SNAT-from-camera-direction de §4.4. Vérifiez `conntrack` pour `SYN_RECV` et purgez-les.

## Étape 7 — Rendre Tout Persistant

> **Un gotcha universel.** Les changements UCI (`uci commit`) survivent aux reboots (ils sont stockés dans l'overlay writable). Les changements NVRAM (`nvram commit`) survivent aux reboots. Les scripts `/etc/rc.d/` survivent aux reboots. **Mais telnet, non** — il est effacé à chaque reboot, et vous devez ré-exécuter `telnet-enable.py` pour le récupérer. Il n'y a pas moyen de contourner ça sans ré-imager le routeur.

La checklist de persistance :

| Item | Méthode | Survit au reboot ? |
|------|---------|-------------------|
| Accès telnet | Re-exécuter `telnet-enable.py` | Non |
| SSID guest | UCI commit (`uci commit wireless`) | Oui |
| Override DHCP guest | `/etc/rc.d/S99arlo` (`START=99`) | Oui (idempotent sur tmpfs) |
| IP passerelle virtuelle | `/etc/rc.d/S99arlo` | Oui |
| iptables DNAT/SNAT | `/etc/rc.d/S99arlo` | Oui |
| Mise à jour auto désactivée | NVRAM commit (`nvram commit`) | Oui |
| `arlo-cam-api` côté serveur | service systemd (`arlo-cam-api.service`) | Oui |
| Enregistrements sur disque | Mount persistant | Oui |

### 7.1 Créer un script de ré-activation telnet sur le serveur

```bash
#!/bin/bash
# /home/arlo/re-enable-telnet.sh
# À lancer APRÈS chaque reboot du RBR760.

cd /home/arlo/netgear_telnet
python3 telnet-enable.py <router-ip> XX:XX:XX:XX:XX:XX admin 'votre_mot_de_passe_routeur'
```

Le brancher dans cron :

```bash
crontab -e
# Ajouter cette ligne :
@reboot sleep 30 && /home/arlo/re-enable-telnet.sh >> /tmp/arlo-telnet.log 2>&1
```

Le sleep de 30 secondes est dû au fait que l'Orbi prend un certain temps à monter après un reboot ; le script retentera indéfiniment.

### 7.2 Vérifier le script S99 sur le routeur

Après chaque reboot, une fois que vous êtes reconnecté en telnet :

```bash
ls -la /etc/rc.d/S99arlo
# -rwxr-xr-x 1 root root 1234 Jul 17 10:00 S99arlo

# Vérifier qu'il n'a pas d'erreur de syntaxe
sh -n /etc/rc.d/S99arlo

# Le lancer manuellement pour être sûr
/etc/rc.d/S99arlo start

# Re-vérifier l'état iptables + IP + DHCP résultant
iptables -t nat -L PREROUTING -n -v | grep -E "4000|4100"
ip addr show br-guest | grep 172.14
```

Si les règles manquent après un reboot mais que `S99arlo` est dans `/etc/rc.d/`, alors il est en course avec l'init Netgear. Augmentez le numéro de démarrage (par ex. `S99arlo` → `S98arlo` est la mauvaise direction ; vous le voulez après les scripts Netgear, essayez donc `S99arlo` puis `S991arlo`).

### 7.3 Ce qui est perdu lors d'une mise à jour firmware (tout)

Cela mérite d'être répété : **une mise à jour firmware Netgear efface tout ce que nous avons fait**. Le SSID revient à sa valeur d'origine, le daemon DHCP reset, les chaînes iptables se vident, les commits NVRAM restent (bien) mais la clé SSID guest est réinitialisée au défaut Netgear.

Après toute mise à jour firmware :

1. Ré-activer telnet (peut ne pas fonctionner contre le nouveau firmware).
2. Re-lancer toutes les commandes de l'Étape 3.
3. Re-placer `/etc/rc.d/S99arlo` et `chmod +x`.
4. Re-lancer `/etc/rc.d/S99arlo start`.

Si le nouveau firmware est V7, vous êtes coincé — l'outil telnet-enable n'est pas connu pour fonctionner contre V7 et les posts de forum de 2024 n'ont pas de méthode qui marche. Restez sur V6.3.x.

## Étape 8 — Tweaks Telnet Optionnels

Une fois que vous avez des caméras qui fonctionnent vous voudrez probablement tweaker quelques autres réglages sur le RBR760 que la GUI n'expose pas. La liste complète vit dans mon dépôt compagnon à [arlo-base-station/docs/lessons-learned.md](https://github.com/mmornati/arlo-base-station/blob/main/docs/lessons-learned.md) ; les trois que j'utilise le plus :

### 8.1 Désactiver le DNS hijack

Le RBR760 est hardcodé pour distribuer sa propre IP (<router-ip>) comme DNS via DHCP sur le *LAN principal*. Cela casse le DNS split-horizon et rend Pi-hole impossible. Fixer via le knob UCI non documenté :

```bash
uci get network.globals.dns_hijack_enable
uci set network.globals.dns_hijack_enable='0'
uci commit
```

### 8.2 Forcer de vrais DNS via l'option DHCP 6 (LAN, pas guest)

```bash
uci delete dhcp.@dnsmasq[0].dhcp_option 2>/dev/null
uci add_list dhcp.@dnsmasq[0].dhcp_option='6,1.1.1.1'
uci add_list dhcp.@dnsmasq[0].dhcp_option='6,1.0.0.1'
uci commit
/etc/init.d/dnsmasq restart
cat /tmp/etc/dnsmasq.conf | grep dhcp-option
```

Ceci n'affecte que le LAN principal — le DHCP guest reste `dni_guest_udhcpd` et a son propre traitement dans `S99arlo`.

### 8.3 Ajouter un lease DHCP statique pour le serveur

```bash
uci add dhcp host
uci set dhcp.@host[-1].name='ARLO-SERVER'
uci set dhcp.@host[-1].mac='XX:XX:XX:XX:XX:XX'  # MAC serveur
uci set dhcp.@host[-1].ip='192.168.1.X'
uci commit
/etc/init.d/dnsmasq restart
```

Même si le serveur est sur une connexion filaire et que le lease n'est techniquement pas requis, avoir une IP serveur stable fait que les règles iptables DNAT survivent aux rotations de MAC (par ex. vous remplacez le Pi par un N100).

## Dépannage

La couche réseau a son propre catalogue de sept saveurs de douleur. Le Post 3 collectera tout ça à travers les trois articles de la série ; celles spécifiques au réseau sont ci-dessous.

### 1. Les caméras se connectent au WiFi mais ne s'enregistrent jamais (SYN_RECV)

```bash
cat /proc/net/nf_conntrack | grep 4000
# SYN_RECV src=192.168.2.2 dst=192.168.1.X sport=RAND dport=4000
```

**Cause A — Le SNAT dans la mauvaise direction provoque une boucle hairpin.** Retirez la mauvaise règle :

```bash
iptables -t nat -D POSTROUTING -d 192.168.1.X -p tcp --dport 4000 \
    -j SNAT --to-source 172.14.1.1 2>/dev/null
conntrack -D -p tcp --dport 4000
```

**Cause B — Les règles FORWARD sont en bas de la chaîne, après ODM.** Re-insérez :

```bash
iptables -I FORWARD 1 -i br-guest -d 192.168.1.X -j ACCEPT
iptables -I FORWARD 1 -i br-lan -o br-guest -s 192.168.1.X -j ACCEPT
iptables -I FORWARD 1 -i br-lan -o br-guest -d 192.168.2.0/24 -j ACCEPT
```

### 2. L'appairage WPS échoue sur le VAP guest

`hostapd_cli wps_pbc` sur `ath02` renvoie `FAIL`. C'est voulu sur le firmware RBR760. Utilisez la station de base Arlo d'origine pour l'appairage (Étape 6) puis éteignez-la.

### 3. Le réseau guest a été désactivé dans la GUI

Cela arrive parfois après les mises à jour firmware. Ré-activer :

```bash
uci set wireless.Guest2.disabled='0'
uci set wireless.Guest5.disabled='0'
uci commit wireless
wifi
```

### 4. Règles iptables perdues après reboot

Vérifiez que le script est au bon endroit et exécutable :

```bash
ls -la /etc/rc.d/S99arlo
sh -n /etc/rc.d/S99arlo
# Pas de sortie = OK
```

Si le script s'exécute manuellement mais n'est pas pris au boot, il est en course avec l'init Netgear. Renommez-le avec un numéro de démarrage plus élevé :

```bash
mv /etc/rc.d/S99arlo /etc/rc.d/S991arlo
```

`S991` est un numéro de démarrage plus élevé que les scripts Netgear de la gamme `S99` et s'exécute fiablement en dernier.

### 5. Le DHCP guest ne distribue pas 172.14.1.1 comme passerelle

```bash
cat /tmp/dni_udhcpd_guest.conf | grep -E "router|dns"
```

Si `option router` est encore `192.168.2.1`, le script n'a soit pas tourné soit tourné avant que le daemon régénère la config :

```bash
# Forcer la régénération et le redémarrage
kill -9 $(cat /var/run/dni_guest_udhcpd.pid)
/sbin/dni_guest_udhcpd /tmp/dni_udhcpd_guest.conf
```

Puis relancez `/etc/rc.d/S99arlo start`. Si le daemon régénère immédiatement la config avec `192.168.2.1`, vous devez faire le `sed` à l'intérieur du script `S99` *après* que le daemon régénère — c'est exactement ce que fait l'extrait en §4.5.

### 6. La commande « passwd » sur telnet a désactivé mon accès

N'exécutez pas `passwd` sur le RBR760 — ça verrouille telnet de façon permanente sur V6.3.6.x et au-dessus. Le seul fix est un factory reset via le bouton arrière (trombone pendant 10 s routeur allumé). Vous perdrez toutes les autres configurations que vous avez jamais faites sur le routeur.

### 7. Telnet a cessé de fonctionner mais le routeur tourne

```bash
# Peut-être que votre job cron côté serveur n'a pas encore tourné (après un reboot routeur)
/home/arlo/re-enable-telnet.sh

# Peut-être qu'un firmware Netgear a été auto-poussé (vous avez oublié de désactiver les màj ?)
nvram show | grep auto_
# Si l'un de ces est 1, vous avez été mordu
```

Si `auto_check_for_upgrade` est `1`, remettez-le à `0` et vérifiez sous quelle version vous êtes maintenant :

```bash
nvram get orbi_fw_version
# Si c'est V7 vous êtes coincé
```

C'est le set de debugging à sept patterns. La matrice de dépannage complète (incluant les bizarreries côté device que je liste dans le Post 2) est dans [la section dépannage du dépôt compagnon](https://github.com/mmornati/arlo-base-station/blob/main/docs/troubleshooting.md).

## Et Après ?

Cet article a couvert la partie qui a la pire courbe « si vous ne savez pas, vous ne pouvez pas la googliser » : faire en sorte que le routeur ressemble à une station de base. Les couches restantes sont plus conventionnelles :

- **Post 2** — la stack services sur le serveur. `arlo-cam-api`, le `server.py` patché pour le bug auto-register-on-restart, le handler de mouvement `arlo-snapshot`, MediaMTX comme relais RTSP on-demand, et les trois patches que j'ai envoyés upstream en tant que PR #1 à `brianschrameck/arlo-cam-api`.
- **Post 3** — Intégration Home Assistant via sensors REST, entités Generic Camera (still + stream), le dashboard Lovelace utilisant `camera_view: auto`, Tailscale pour l'accès distant, et Scrypted si vous voulez HomeKit.

> **Une note sur le staging.** Le code et les configs complets sont à [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station). Le PR pour le premier batch de fichiers (incluant `rbr760/S99arlo` de §4.5) est ouvert au moment de l'écriture.

---

*Ceci est l'article 1 sur 3 dans la série Arlo. Le Post 2 couvre la stack services + les PRs upstream. Le Post 3 couvre l'intégration Home Assistant.*

*Continuer la lecture → [Post 2 — Services & PRs upstream](/fr/auto-heberger-arlo-cam-api-correctifs-et-ameliorations/) et [Post 3 — Intégration Home Assistant](/fr/integrer-arlo-auto-heberge-avec-home-assistant/).*
