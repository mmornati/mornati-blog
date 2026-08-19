---
title: 'Corriger la durée de vie de la batterie des caméras Arlo au niveau WiFi'
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
date: '2026-08-19T13:00:00.000000+00:00'
slug: corriger-la-duree-de-vie-de-la-batterie-des-cameras-arlo-au-niveau-wifi
translationKey: arlo-wifi-layer-battery-fix
url: /fr/corriger-la-duree-de-vie-de-la-batterie-des-cameras-arlo-au-niveau-wifi/
aliases:
- /fr/corriger-la-duree-de-vie-de-la-batterie-des-cameras-arlo-au-niveau-wifi.html
categories:
- Maison intelligente
- DIY
- Réseau
- Matériel
description: 'Le correctif WiFi qui manquait : augmenter le délai d''inactivité du WiFi invité et la durée du bail DHCP sur un Netgear Orbi RBR760 pour que les caméras VMC4040P cessent de se ré-associer toutes les 30 minutes et vident leur batterie pendant la nuit.'
cover: cover.jpg
showHero: true
---

Après la fusion des trois posts de cette série, je continuais à surveiller les niveaux de batterie des caméras. Le Post 1 m'avait appris que le matériel WiFi était la deuxième cause la plus probable de consommation. Les Posts 2 et 3 m'avaient montré comment le beacon et la politique d'armement des caméras interagissent. Mais les caméras continuaient à se ré-associer au réseau invité environ toutes les trente minutes, et la batterie continuait à chuter même sur des caméras armées dans des vues sans mouvement. La cause restante ne se trouvait pas du tout dans la couche applicative — elle se trouvait dans la couche WiFi elle-même.

Ce post est le quatrième de la série et boucle la boucle. Il est court, chirurgical, et entièrement consacré au Netgear Orbi RBR760 et à sa pile WiFi invité propriétaire. Deux valeurs, deux fichiers de configuration, un reload — et une régression dont vous devez connaître l'existence avant de lancer le reload.

> Toutes les valeurs de ce post proviennent d'un RBR760 en production sous le firmware V6.3.8.5 (Chaos Calmer, rtm-6.3.8.5+r49254). Les adresses IP réelles, les MACs WiFi, les numéros de série des caméras et la phrase secrète WPA ont été retirés ; le SSID publié est `ARLO_VMB_XXXXXXXXXX` et le LAN publié est `192.168.1.x`.

## TL;DR

Deux modifications, toutes les deux réservées au WiFi invité, toutes les deux persistantes :

1. **Délai d'inactivité du WiFi invité** porté de la valeur par défaut du firmware de `300` secondes au maximum accepté de `65535` secondes (environ 18,2 heures) sur les deux VAPs invitées (`Guest2` sur `ath02` 2,4 GHz et `Guest5` sur `ath21` 5 GHz bas).
2. **Bail DHCP invité** porté de la valeur d'origine de `1800` secondes (30 minutes) à `86400` secondes (24 heures) dans `/etc/rc.d/S99arlo` et dans la configuration live de `dni_guest_udhcpd`.

Après le changement, les caméras dorment toute la nuit au lieu de faire tourner la table d'association WiFi toutes les trente minutes. Le WiFi principal n'est pas touché. Le script est redémarrable — `/etc/rc.d/S99arlo restart` lance une instance propre du démon DHCP.

## La Découverte

À la fin du Post 3, j'avais une stack qui fonctionnait et un dashboard opérationnel. Les caméras étaient joignables, le WiFi était stable, le beacon les maintenait attachées. Alors pourquoi la batterie continuait-elle à chuter ?

J'ai commencé à relever les compteurs d'enregistrement des caméras depuis `arlo-cam-api`. Le schéma était imparable :

> `[beacon] Probing XXXXXXXXXXXX` ... `[register] XXXXXXXXXXXX registered, BAT=42%` ... `[beacon] Probing XXXXXXXXXXXX` ... `[register] XXXXXXXXXXXX registered, BAT=42%`

Les mêmes caméras se ré-enregistraient encore et encore. Pas parce que le beacon échouait — le beacon faisait exactement ce que je lui demandais — mais parce que les caméras *n'étaient pas la même instance* à chaque fois. Elles se ré-associaient à l'AP, obtenaient un nouveau bail DHCP, et se ré-enregistraient de zéro. À peu près toutes les trente minutes.

Pendant que tout cela se déroulait, une caméra était connectée sans interruption depuis plus de trente heures. C'était l'indice. La différence ne venait ni de la caméra, ni du firmware, ni de la couche applicative. Elle venait du réseau WiFi auquel la caméra était attachée.

Un contrôle rapide sur les VAPs invitées :

```
cfg80211tool ath02 get_inact
inact = 300
```

Trois cents secondes. Cinq minutes. La vraie Arlo base station, en revanche, ne dissocie jamais une caméra en train de dormir — elle les maintient en 802.11 power-save avec la poignée DTIM/PS-Poll et une IE propriétaire dans les trames beacon qui liste les caméras associées. Le matériel côté caméra est conçu pour faire confiance à cette connexion. Quand le délai d'inactivité du gateway expire, l'AP envoie un null-function poll ; la caméra endormie ne répond pas (sa radio est endormie) ; l'AP la dissocie et la dé-authentifie. La caméra se réveille plus tard, ne trouve aucune association, et repasse par le cycle complet register-DHCP-reregister.

La vraie base station Arlo est un point d'accès 2,4 GHz propriétaire qui ne dissocie jamais les caméras en veille. Sa gestion du power-save, ses IE beacon et sa politique de dissociation sont décrites dans les brevets US11722963, US20240147057 et US12413852. Le projet de rétro-ingénierie communautaire `arlo-open-base-station` documente le même comportement dans `WIFI-HARDWARE.md` : les APs USB bon marché perdent les clients toutes les ~30 minutes ; le TP-Link Omada EAP225 permet des sommesils de 2 à 5 heures. La conclusion est la même : le problème vient de la couche WiFi qui lâche les clients en veille, pas du protocole Arlo.

L'analyse de batterie du Post 1 l'avait identifié comme la deuxième cause de consommation. Ce post est le correctif.

## Correctif A — Délai d'Inactivité

Le WiFi invité a deux interfaces, une par bande radio :

- `ath02` sur la radio `wifi0` (2,4 GHz), liée à la section UCI `wireless.Guest2`
- `ath21` sur la radio `wifi2` (5 GHz bas), liée à la section UCI `wireless.Guest5`

Le délai d'inactivité est l'option `inact` sur chaque réseau WiFi invité. La valeur par défaut est `300` secondes. Le firmware accepte une valeur 16 bits, donc le maximum est `65535` secondes (~18,2 heures). L'objectif est de reproduire la politique de fait de la Arlo base station « ne dissocie jamais une caméra en veille ». Une caméra qui quitte vraiment le réseau se dé-authentifie d'elle-même — l'AP cesse simplement d'être la partie qui initie la dissociation.

Appliquez-le via UCI et commitez :

```
uci set wireless.Guest2.inact='65535'
uci set wireless.Guest5.inact='65535'
uci commit wireless
```

C'est persistant au travers des redémarrages. Le script constructeur concerné, `/lib/wifi/qcawificfg80211.sh` (vers la ligne 4069), transmet nativement la valeur `inact` à `cfg80211tool` à chaque redémarrage WiFi, donc aucun patch de script n'est nécessaire.

Appliquez-le aussi à chaud sur les interfaces en cours d'exécution, pour que la modification prenne effet immédiatement sans `wifi reload` :

```
cfg80211tool ath02 inact 65535
cfg80211tool ath21 inact 65535
```

Vérifiez :

```
cfg80211tool ath02 get_inact
inact = 65535
cfg80211tool ath21 get_inact
inact = 65535
uci get wireless.Guest2.inact
65535
uci get wireless.Guest5.inact
65535
```

Il n'y a pas littéralement « jamais » — le champ 16 bits plafonne à ~18,2 heures — mais en pratique une caméra qui se réveille pour une raison quelconque (événement PIR, probe beacon, bouton sync, cycle firmware) se ré-associera bien avant que ce timer n'expire.

## Correctif B — Bail DHCP Invité

Le démon DHCP invité est le `dni_guest_udhcpd` propriétaire (pas `dnsmasq`). La configuration est un heredoc écrit par `/etc/rc.d/S99arlo` dans `/tmp/dni_udhcpd_guest.conf`. Le bail d'origine était de `1800` secondes (30 minutes). Un bail de 30 minutes est raisonnable pour un réseau invité de café, mais beaucoup trop court pour un appareil IoT en sommeil — chaque renouvellement de bail risque une brève dissociation qui, combinée au délai d'inactivité, déclenche le cycle complet de ré-enregistrement.

Le correctif est un seul nombre dans deux fichiers. Dans `/etc/rc.d/S99arlo` (le script init persistant), changez :

```
option lease 1800
```

en :

```
option lease 86400
```

Dans la config live `/tmp/dni_udhcpd_guest.conf`, faites le même changement. Puis redémarrez le démon :

```
/etc/rc.d/S99arlo restart
```

Le script fait un `killall -9 dni_guest_udhcpd` (ou le chemin `stop()`) et démarre une instance fraîche. Vérifiez :

```
ps w | grep dni_guest_udhcpd | grep -v grep
<single pid> /sbin/dni_guest_udhcpd /tmp/dni_udhcpd_guest.conf
```

Le démon DHCP du LAN principal (`dni_udhcpd` qui sert `192.168.1.x`) est un processus séparé et n'est pas touché. Le changement de bail est strictement réservé à l'invité.

> Une note sur le démon DHCP du constructeur : le RBR760 embarque un service DHCP invité natif (`/etc/init.d/guest_dhcpd.init`) qui utilise `procd` pour relancer automatiquement `dni_guest_udhcpd`. Si vous le laissez tourner, vous vous retrouvez avec deux instances du même démon, ce qui est un vrai problème. Le correctif du script S99 du Post 1 (`/etc/rc.d/S99arlo`) gère déjà cela en supprimant l'instance gérée par procd. Si vous appliquez ce correctif sur un routeur neuf, parcourez d'abord l'Étape 5 du Post 1 ; le script S99 qui s'y trouve est le fondement sur lequel ce post s'appuie.

## Vérification

Après avoir appliqué les deux correctifs, l'état live doit correspondre à :

| Contrôle | Commande | Attendu |
|---|---|---|
| Inactivité `ath02` | `cfg80211tool ath02 get_inact` | `inact = 65535` |
| Inactivité `ath21` | `cfg80211tool ath21 get_inact` | `inact = 65535` |
| Valeur UCI `Guest2` | `uci get wireless.Guest2.inact` | `65535` |
| Valeur UCI `Guest5` | `uci get wireless.Guest5.inact` | `65535` |
| Bail DHCP invité | `grep lease /tmp/dni_udhcpd_guest.conf` | `option lease 86400` |
| Process DHCP invité | `ps w | grep dni_guest_udhcpd | grep -v grep` | une ligne, en cours d'exécution |
| WiFi principal | `iwinfo ath01 info` (ou `ath2`) | SSID domestique up, stations attachées |
| Invité 2,4 | `iwinfo ath02 info` | `ARLO_VMB_XXXXXXXXXX` up |
| Invité 5 bas | `iwinfo ath21 info` | `ARLO_VMB_XXXXXXXXXX` up |
| Enregistrement caméra | `curl http://192.168.1.48:5000/refresh` (ou HA) | 4 caméras, pas de churn |

Une caméra qui dort profondément depuis des heures ne répond pas à un ping ICMP — c'est attendu, pas un problème. Le proxy pour « encore associée » est la présence de la caméra dans la liste de stations de `hostapd`, et l'absence de churn d'enregistrement dans le log de `S99arlo`.

## Ce Qui Peut Mal Tourner — La Course wifi2 du Mesh

Le correctif ci-dessus nécessite un `wifi reload` pour pousser le commit UCI dans la pile sans fil en cours d'exécution — sauf si vous positionnez aussi les valeurs à chaud via `cfg80211tool`, ce que nous avons fait. Si vous déclenchez tout de même un `wifi reload`, ou tout cycle `wifi up` / `wifi down`, vous pouvez tomber sur une régression qui met le réseau mesh dans un état planté.

### Symptôme

Après `wifi reload`, `wifi restart`, ou tout autre redémarrage sans fil piloté par UCI :

- L'interface web Orbi affiche les deux satellites comme **déconnectés**.
- `ping 192.168.1.82` et `ping 192.168.1.101` (les IP des satellites) continuent souvent à répondre.
- Le `hostapd` du CPU principal déclare les satellites comme associés sur la radio backhaul.
- `iwconfig ath2` et `iwconfig ath21` peuvent afficher `ESSID:""` (SSID vide) et `Encryption: off`.

Les radios sans fil sont physiquement saines. Le plan de contrôle mesh est simplement aveugle.

### Cause Racine

Le RBR760 fait tourner un démon mesh appelé `hyd` en deux instances :

- `hyd -d -C /tmp/hyd-lan.conf -P 7777 -cfg80211` — démon mesh côté LAN, qui ponte `br-lan` au-dessus des VLANs backhaul (`ath0.4094`, `ath1.4094`).
- `hyd -d -C /tmp/hyd-guest.conf -P 8888 -cfg80211` — démon mesh côté invité.

Quand `wifi2` revient après le reload, les VAPs sur `ath2` (principal 5 GHz bas) et `ath21` (invité 5 GHz bas) s'initialisent avec des SSIDs vides si la ré-init de la radio s'est bloquée. Le `hyd` LAN essaie alors de lire le SSID depuis `ath2`, échoue avec :

```
HYDR wlanif ERR: wlanifBSteerControlCmnStoreSSID: invalid ESSID length 0, ifName: ath2
Failed to initialize wlanif/wlb/modules
```

…et sort. Sans le démon mesh LAN, le routeur ne peut pas suivre l'état mesh des satellites, donc l'interface web les affiche comme déconnectés alors même que le lien backhaul est opérationnel.

### Diagnostic

Exécutez ces commandes pour confirmer la régression :

```
iwconfig ath2
# Si ESSID:"" → la course wifi2 s'est déclenchée
iwconfig ath21
# Si ESSID:"" → la course wifi2 touche aussi la VAP invité 5 bas
ps w | grep 'hyd '
# Attendez DEUX processus hyd : 7777 LAN + 8888 invité. S'il n'y en a qu'un seul (ou aucun), c'est la régression.
hostapd_cli -i ath1 -p /var/run/hostapd-wifi1 list_sta
# Doit montrer les satellites comme associés sur le backhaul
ping -c 2 192.168.1.82
ping -c 2 192.168.1.101
# Les deux doivent répondre
```

### Récupération

Le correctif est une ré-init propre de `wifi2` et un redémarrage de `hyd` :

```
wifi down wifi2
wifi up wifi2
# Attendre ~10–30 s que les VAPs reviennent avec leurs SSIDs UCI

# Vérifier que les SSIDs ne sont plus vides
iwconfig ath2 | grep ESSID
iwconfig ath21 | grep ESSID

# Relancer le démon mesh
/etc/init.d/hyd restart

# Vérifier que les deux instances hyd tournent
ps w | grep 'hyd '
```

Ensuite, les satellites réapparaissent dans l'interface web comme connectés en une minute ou deux. Le correctif de batterie est intact — le réglage `inact` sur `Guest2` et `Guest5` est préservé à travers le `wifi up wifi2` parce que UCI est la source de vérité et que `qcawificfg80211.sh` le ré-applique.

### Avertissement d'Interaction

Les modifications du WiFi invité touchent `ath02` (sur `wifi0`) et `ath21` (sur `wifi2`). Le `wifi reload` qui applique un `commit wireless` UCI peut déclencher la course `wifi2` même si la modification elle-même portait sur `wifi0`. Vérifiez toujours après tout changement de configuration sans fil :

```
ps w | grep 'hyd '           # attendez DEUX instances hyd
iwconfig ath2 | grep ESSID   # attendez un vrai SSID
iwconfig ath21 | grep ESSID  # attendez un vrai SSID
```

Si l'un de ces éléments est incorrect, exécutez la séquence de récupération ci-dessus.

## Rollback

Les deux correctifs sont réversibles.

**Délai d'inactivité :**

```
uci delete wireless.Guest2.inact
uci delete wireless.Guest5.inact
uci commit wireless
cfg80211tool ath02 inact 300
cfg80211tool ath21 inact 300
```

**Bail DHCP :**

```
sed -i 's/option lease 86400/option lease 1800/' /etc/rc.d/S99arlo
sed -i 's/option lease 86400/option lease 1800/' /tmp/dni_udhcpd_guest.conf
/etc/rc.d/S99arlo restart
```

**Avertissements :**

- **Ne lancez jamais `passwd` sur un routeur Netgear Orbi.** Cela réécrit `/etc/passwd` d'une manière qui casse l'accès telnet. Si vous devez changer le mot de passe admin, faites-le via l'interface web.
- **Ne positionnez jamais `skip_inactivity_poll=1`.** Cela semble utile, mais cela rend les stations inactives *plus* susceptibles d'être déconnectées, pas moins. Le bon réglage est `inact`.
- **La valeur `inact` est 16 bits.** Il est impossible de fixer littéralement « jamais ». Le maximum est `65535` (~18,2 heures). En pratique, une caméra qui se réveille pour une raison quelconque se ré-associera bien avant que ce timer n'expire.

## Limitations Connues

**Les VAPs invitées des satellites ne sont pas vérifiables directement.** Les satellites RBS760 (à `192.168.1.82`, `192.168.1.101`, et d'autres) n'exposent pas de service telnet sur TCP/23. Le réglage UCI vit sur le routeur ; les satellites reçoivent la configuration via la sync de config Orbi (`common_update_uci` / `wsplcd`) au-dessus du VLAN backhaul invité `4094`. Si les caméras satellites (JARDIN1, JARDIN2, PORTAIL dans ce déploiement) continuent à se vider après le correctif sur le routeur principal, la cause la plus probable est que les VAPs invitées des satellites n'ont pas récupéré le réglage `inact`. Vérifiez ceci dans l'interface web Orbi, en rapprochant physiquement les caméras du routeur principal, ou en remplaçant le satellite par un AP dédié (la recommandation communautaire est un TP-Link Omada EAP225).

**`arlo-cam-api` est la source de vérité de l'inventaire des caméras.** L'endpoint `/device` renvoie le mapping live serial→IP. Le dictionnaire `known_devices` du routeur est alimenté par ces enregistrements.

**`inact` ne remplace pas `BeaconIntervalSeconds`.** Les deux réglages sont indépendants. `inact` contrôle le timer de dissociation côté AP ; `BeaconIntervalSeconds` (dans `arlo-cam-api`) contrôle le keepalive applicatif. Les deux sont nécessaires pour une flotte respectueuse de la batterie ; aucun ne remplace l'autre. Voir les Posts 2 et 3 pour le côté applicatif.

## Plan de Monitoring

Après le correctif, le proxy pour « tout fonctionne » est l'absence de churn de ré-enregistrement. Surveillez :

- **Intervalles d'enregistrement des caméras.** Le log de `S99arlo` doit montrer un unique événement `[register]` par caméra à la première connexion, puis rien pendant des heures. Si vous voyez le même `XXXXXXXXXXXX` se ré-enregistrer toutes les 30 minutes, la régression est de retour.
- **% de batterie sur plusieurs jours.** Une caméra qui perdait ~3 %/h avant le correctif doit maintenant conserver sa charge pendant des jours. La caméra JARDIN1 dans le déploiement derrière ce post est passée de 42 % → 1 % en une nuit à une ligne plate sur les 48 heures suivantes.
- **`inact` après un reboot.** Après `reboot`, vérifiez que `cfg80211tool ath02 get_inact` renvoie `65535`. Le réglage est dans UCI, donc il devrait persister, mais le vérifier est peu coûteux.
- **`inact` après un `wifi reload`.** Comme ci-dessus — le script `qcawificfg80211.sh` le ré-applique, mais une régression est plus facile à détecter qu'à corriger.
- **Caméras satellites.** Si JARDIN1, JARDIN2 ou PORTAIL continuent à se vider, la VAP invitée du satellite n'a peut-être pas reçu la nouvelle valeur `inact`. Vérifiez dans l'interface web Orbi, sous Attached Devices, les paramètres AP de la VAP invitée du satellite.

### Protégez Votre Configuration : Désactivez les Mises à Jour Automatiques

Une mise à jour du firmware Netgear Orbi efface le service telnet et toutes les personnalisations que vous avez faites. La méthode recommandée par la communauté pour protéger votre configuration est de désactiver l'auto-updater :

```
nvram set orbi_auto_upgrade=0
nvram set auto_check_for_upgrade=0
nvram set auto_update=0
nvram commit
```

C'est la modification la plus pertinente à faire pour protéger le travail de cette série. Si vous ne le faites pas, un push firmware de Netgear à 3 h du matin transformera silencieusement votre RBR760 en routeur grand public stock et vous devrez recommencer toute la danse de l'activation telnet depuis le début.

## Ce Qui Suit

Ce post boucle la série en quatre parties. La stack complète est maintenant :

- **Post 1** — couche réseau : remplacement du gateway, DHCP, DNAT, S99arlo, telnet.
- **Post 2** — couche applicative : auto-hébergement d'arlo-cam-api, les trois PRs upstream, les patches de production.
- **Post 3** — couche automatisation : intégration Home Assistant, capteurs REST, la machinerie de wake, les valeurs mesurées de consommation.
- **Post 4** (ce post) — couche WiFi : délai d'inactivité et bail DHCP.

Pour le côté réseau, voir le [Post 1 de cette série](/fr/remplacer-la-station-de-base-arlo-par-un-routeur-netgear-orbi/). La couche applicative est couverte dans le [Post 2](/fr/auto-heberger-arlo-cam-api-correctifs-et-ameliorations/) (arlo-cam-api, les trois PR upstream). Le côté automatisation est couvert dans le [Post 3](/fr/integrer-arlo-auto-heberge-avec-home-assistant/) (intégration Home Assistant, capteurs REST, machinerie de wake).

Le dépôt compagnon à [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) contient tous les fichiers de configuration mentionnés dans la série.
