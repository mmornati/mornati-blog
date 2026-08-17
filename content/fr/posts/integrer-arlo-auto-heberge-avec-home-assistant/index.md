---
title: 'Intégrer votre stack Arlo auto-hébergé avec Home Assistant : Capteurs, automatisations et tableau de bord Lovelace'
tags:
- home-assistant
- arlo
- maison-intelligente
- maison-connectée
- lovelace
- automatisation
- caméras
- rest
- iot
date: '2026-08-17T12:00:00.000000+00:00'
slug: integrer-arlo-auto-heberge-avec-home-assistant
translationKey: arlo-base-station-replacement
url: /fr/integrer-arlo-auto-heberge-avec-home-assistant/
aliases:
- /integrer-arlo-auto-heberge-avec-home-assistant
categories:
- Maison Intelligente
- DIY
- Home Assistant
description: 'Comment connecter votre émulateur de station de base Arlo auto-hébergé (arlo-cam-api + arlo-snapshot + mediamtx) à Home Assistant en utilisant des capteurs REST, des capteurs template, des binary_sensors, des automatisations, des input_booleans et un tableau de bord Lovelace pour caméras — sans dépendre des intégrations dépréciées pyaarlo/aarlo.'
cover: cover.jpg
showHero: true
---

Ceci est l'article 3 — le dernier — d'une série de trois sur le remplacement de la station de base Arlo propriétaire par une stack auto-hébergée. Dans l'[article 1 de cette série](/replacing-arlo-base-station-with-a-netgear-orbi-router/) j'ai couvert la couche réseau : comment faire en sorte qu'un Netgear Orbi RBR760 se fasse passer pour la station de base Arlo suffisamment bien pour que les caméras se connectent, s'enregistrent, et continuent à streamer. Dans l'[article 2 de cette série](/self-hosting-arlo-cam-api-patches-and-improvements/) j'ai couvert la couche serveur : la stack Docker `arlo-cam-api`, le sidecar `arlo-snapshot` à la demande, le relais RTSP à la demande via MediaMTX, et les trois pull requests upstream que j'ai contribué pour corriger les bugs que j'ai rencontrés en chemin.

Dans cet article je couvre la couche *Home Assistant* — comment les quatre caméras deviennent des entités de premier plan dans HA, comment un seul `input_select` permet de troquer l'autonomie de la batterie contre une présence instantanée, et comment le tableau de bord Lovelace finit par ressembler presque exactement à l'app Arlo, sauf que chaque ligne est sous votre contrôle. Le dépôt compagnon sur [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) contient tous les fichiers de configuration et correctifs mentionnés ici.

Voici l'architecture sur laquelle nous nous appuyons à la fin de cet article. Le schéma est le même que dans l'article 1 ; la flèche en pointillés est la nouvelle pièce — le polling REST que HA exécute contre `/device/<serial>` sur le port 5000.

```
                            WAN
                             │
                  ┌──────────▼──────────┐
                  │  Netgear Orbi RBR760│  isolation invité
                  │  172.14.1.1 (Arlo)  │◀──── 4x Arlo VMC4040P (192.168.2.x)
                  │  192.168.1.x (LAN)  │           WiFi invité, isolé
                  └──────────┬──────────┘
                             │ DNAT tcp/4000
                  ┌──────────▼──────────┐
                  │  Serveur (mini PC)  │
                  │  192.168.1.48       │
                  │                     │
                  │  ┌───────────────┐  │  :5000 REST ───┐ polling HA
                  │  │  arlo-cam-api │  │  :8000 snaps ───┤ (5 min)
                  │  │  :4000 / :5000│  │                │
                  │  └───────────────┘  │                │
                  │  ┌───────────────┐  │                │
                  │  │ arlo-snapshot │  │  :8000 ────────┤
                  │  │   (Flask)     │  │                │
                  │  └───────────────┘  │                │
                  │  ┌───────────────┐  │                │
                  │  │   mediamtx    │  │  :8554 RTSP ───┤
                  │  │  à la demande │  │                │
                  │  └───────────────┘  │                │
                  └─────────────────────┘                │
                                                          │
                  ┌───────────────────────────────────────┘
                  │
          ┌───────▼────────┐
          │ Home Assistant │
          │  192.168.1.32  │
          │                │
          │  4 capteurs REST│
          │  4 caméras     │
          │  9 automatisations│
          │  4 button-cards │
          │  UI Lovelace   │
          └────────────────┘
```

> **Une note sur la rédaction.** Comme dans les articles 1 et 2, les vrais numéros de série des caméras, les adresses MAC, et l'IP LAN de production du serveur ont été remplacés par des placeholders `XXXXXXXXXXXX` et un placeholder générique. La valeur bien connue `172.14.1.1` de la passerelle Arlo est conservée car elle fait partie du protocole wire. Le sous-réseau invité `192.168.2.x` (où vivent les caméras sur l'Orbi) est laissé tel quel car c'est la valeur par défaut standard d'Orbi et ne révèle rien de spécifique.

## Pourquoi les capteurs REST (et pas `pyaarlo` / `aarlo`)

Si vous avez déjà câblé des caméras Arlo dans Home Assistant auparavant, vous êtes presque certainement passé par `pyaarlo` — le client Python Arlo non officiel — et l'intégration Home Assistant `aarlo` par-dessus. `aarlo` est le chemin de facto depuis des années. Il expose la batterie, le signal, le mouvement, le son, les appuis de sonnette, la dernière capture, l'activité récente, et une entité `camera.<nom>` par caméra à travers un unique config flow convivial.

J'ai gardé `aarlo` installé sur ce déploiement. Il fait encore un travail utile : les quatre entités `sensor.aarlo_battery_level_*` sont celles dont les valeurs déclenchent les notifications push mobiles que j'ai eues sur mon téléphone pendant les trois dernières années. Pendant la migration, quand je redémarrais le serveur, ou que les caméras passaient hors ligne, ou que je testais une nouvelle PR, ces notifications push étaient le signal d'alerte précoce que quelque chose n'allait pas. Pour l'instant, elles restent.

Mais toute autre entité — chaque capteur, chaque caméra, chaque switch d'armement/désarmement, chaque toggle PIR LED — est 100 % REST. Voici le fichier de configuration `aarlo.yaml` en entier :

```yaml
version: 1
aarlo:
  backend: sse
```

Trois lignes. Le `backend: sse` est un mode backend SSE qui permet à `aarlo` de garder les entités existantes sans faire le gros travail de maintenir une session — parce que les caméras ne sont plus enregistrées auprès du cloud Arlo du tout. Les entités `aarlo` côté cloud essaient toujours de tourner, et elles rapportent joyeusement `unavailable` pour tout sauf les quatre capteurs de batterie que nous conservons. Les quatre capteurs de batterie viennent du champ `BatPercent` de la caméra elle-même, qui est exposé sur le cloud via un cache séparé qu'Arlo garde pour la rétrocompatibilité ; `aarlo` interroge ce cache et le surface.

L'entrée `customize.yaml` pour chacun empêche la carte batterie auto-générée de créer un doublon :

```yaml
sensor.aarlo_battery_level_entree:
  battery_alert_disabled: true
  battery_sensor_creation_disabled: true
sensor.aarlo_battery_level_jardin_1:
  battery_alert_disabled: true
  battery_sensor_creation_disabled: true
sensor.aarlo_battery_level_jardin_2:
  battery_alert_disabled: true
  battery_sensor_creation_disabled: true
sensor.aarlo_battery_level_portail:
  battery_alert_disabled: true
  battery_sensor_creation_disabled: true
```

C'est tout. Trois lignes de config `aarlo` et quatre entrées `customize`. Tout le reste est REST.

La raison de la séparation est simple : `aarlo` n'a jamais été conçu pour des caméras qui ne parlent pas au cloud Arlo. Son entité `camera.aarlo_*` suppose le mécanisme de stream cloud Arlo standard, que l'émulateur local n'implémente pas. Ses `binary_sensor.aarlo_motion_*` et `binary_sensor.aarlo_sound_*` viennent du même flux cloud. Ses `switch.aarlo_siren_*` et `switch.aarlo_snapshot_*` sont des actions cloud. Rien de tout cela ne fonctionne quand les caméras discutent joyeusement avec `arlo-cam-api` sur `192.168.1.48:4000` et n'ont jamais entendu parler de `arlo-api.arlo.com`.

La couche de capteurs REST est aussi plus flexible. Vous décidez de l'intervalle de polling par capteur. Vous décidez comment dériver les binary sensors. Vous décidez quel attribut devient une carte device-class-battery et lequel devient une ligne de glance. Et vous obtenez le document de statut complet des 25 champs de `/device/<serial>` gratuitement, ce que `aarlo` n'exposerait jamais.

## La couche de capteurs REST

Tout le package est dans `packages/arlo_cameras.yaml`. Le premier bloc est constitué des quatre capteurs REST — un par caméra. Voici le bloc complet pour la première caméra (`Jardin 1`) ; les trois autres sont identiques sauf pour le numéro de série et le friendly name :

```yaml
sensor:
  - platform: rest
    name: "Arlo Jardin 1 Status"
    resource: "http://192.168.1.48:5000/device/XXXXXXXXXXXX"
    value_template: "{{ value_json.BatPercent | int(-1) }}"
    unit_of_measurement: "%"
    device_class: battery
    scan_interval: 300
    json_attributes:
      - BatPercent
      - ChargingState
      - SignalStrengthIndicator
      - WifiRSSI
      - Temperature
      - Uptime
      - PIREvents
      - PIRTriggers
      - MotionStreamed
      - UserStreamed
      - Streamed
      - Bat1Volt
      - FailedStreams
      - CameraOnline
      - CameraOffline
      - IRLEDsOn
      - SpotlightEnabled
      - WifiConnectionCount
      - SystemFirmwareVersion
      - HardwareRevision
      - WifiChannel
      - PoweredOn
      - CriticalBatStatus
      - ChargerTech
      - BatTech
```

Quatre caméras, quatre capteurs, quatre blocs copier-coller. L'intervalle de polling est `scan_interval: 300` (5 minutes), ce qui est la bonne fréquence pour la batterie — le pourcentage de batterie ne change pas de manière mesurable dans une fenêtre de 5 minutes sur un panneau solaire en bonne santé. Le `value_template` extrait `BatPercent` du corps JSON et le convertit en int avec un défaut de `-1` pour le cas où la caméra est hors ligne (l'API retourne un corps vide quand le device est inconnu du serveur, et `int(-1)` rend l'état résultant un sentinel reconnaissable sur lequel je peux router dans les templates — tout ce qui est négatif signifie « pas de données », tout ce qui est positif signifie « vraie valeur »).

Le bloc `json_attributes` est la magie qui rend le reste de l'intégration peu coûteux. Chaque champ retourné par `GET /device/<serial>` atterrit dans les attributs du capteur (la table de champs complète est dans l'article 2 §8). 25 attributs par caméra, quatre caméras, tous visibles depuis le panneau Developer Tools → States. Le `device_class: battery` fait que l'état principal s'affiche avec une icône de batterie dans toute carte qui sait la rendre.

Les quatre capteurs sont nommés de manière cohérente : `Arlo Jardin 1 Status`, `Arlo Jardin 2 Status`, `Arlo Portail Status`, `Arlo Entree Status`. La correspondance entre le friendly name et l'emplacement réel de la caméra (Jardin 1, Jardin 2, Portail, Entrée) est ce qui rend le tableau de bord lisible sans glossaire.

> **Pourquoi quatre capteurs et pas un avec un attribut `select` ?** Parce que la plateforme `template` de Home Assistant attend un capteur par attribut. Si vous mettez les 25 attributs sur un capteur, vous devez écrire 25 helpers qui lisent dessus. Si vous divisez par caméra, vous obtenez 4 × 25 attributs que vous pouvez redériver en 4 × 15 capteurs template conviviaux — et le namespacing par caméra garde le reste du YAML lisible.

## Les capteurs `template:` dérivés

Le capteur REST brut expose 25 attributs par caméra. L'UI des cartes de HA ne les reprend pas automatiquement — vous devez matérialiser chacun en son propre capteur si vous voulez une ligne de glance, une icône de batterie, ou une sparkline consciente de l'unité de mesure. Le bloc `template:` dans `packages/arlo_cameras.yaml` dérive 15 capteurs conviviaux par caméra, tous lus depuis le `sensor.arlo_*_status` correspondant via `state_attr()`.

Voici le bloc `Jardin 1`. Les trois autres caméras suivent le même motif avec leur nom et numéro de série :

```yaml
template:
  - sensor:
      - name: "Jardin 1 Temperature"
        unique_id: arlo_j1_temp
        unit_of_measurement: "°C"
        device_class: temperature
        state_class: measurement
        state: "{{ state_attr('sensor.arlo_jardin_1_status', 'Temperature') | int(-99) }}"

      - name: "Jardin 1 Charging"
        unique_id: arlo_j1_charging
        state: "{{ state_attr('sensor.arlo_jardin_1_status', 'ChargingState') | default('Off') }}"

      - name: "Jardin 1 Signal"
        unique_id: arlo_j1_signal
        icon: mdi:wifi
        state: "{{ state_attr('sensor.arlo_jardin_1_status', 'SignalStrengthIndicator') | int(0) }}"

      - name: "Jardin 1 WiFi RSSI"
        unique_id: arlo_j1_rssi
        unit_of_measurement: "dBm"
        state_class: measurement
        icon: mdi:wifi-arrow-up-down
        state: "{{ state_attr('sensor.arlo_jardin_1_status', 'WifiRSSI') | int(-99) }}"

      - name: "Jardin 1 Uptime"
        unique_id: arlo_j1_uptime
        unit_of_measurement: "s"
        icon: mdi:clock-outline
        state: "{{ state_attr('sensor.arlo_jardin_1_status', 'Uptime') | int(0) }}"

      - name: "Jardin 1 PIR Events"
        unique_id: arlo_j1_pir_events
        icon: mdi:motion-sensor
        state: "{{ state_attr('sensor.arlo_jardin_1_status', 'PIREvents') | int(0) }}"

      - name: "Jardin 1 PIR Triggers"
        unique_id: arlo_j1_pir_triggers
        icon: mdi:motion-sensor
        state: "{{ state_attr('sensor.arlo_jardin_1_status', 'PIRTriggers') | int(0) }}"

      - name: "Jardin 1 Motion Streams"
        unique_id: arlo_j1_motion_streamed
        icon: mdi:video
        state: "{{ state_attr('sensor.arlo_jardin_1_status', 'MotionStreamed') | int(0) }}"

      - name: "Jardin 1 User Streams"
        unique_id: arlo_j1_user_streamed
        icon: mdi:video-switch
        state: "{{ state_attr('sensor.arlo_jardin_1_status', 'UserStreamed') | int(0) }}"

      - name: "Jardin 1 Total Streams"
        unique_id: arlo_j1_streamed
        icon: mdi:filmstrip
        state: "{{ state_attr('sensor.arlo_jardin_1_status', 'Streamed') | int(0) }}"

      - name: "Jardin 1 Battery Voltage"
        unique_id: arlo_j1_bat_voltage
        unit_of_measurement: "V"
        device_class: voltage
        state_class: measurement
        icon: mdi:battery
        state: "{{ state_attr('sensor.arlo_jardin_1_status', 'Bat1Volt') | float(0) }}"

      - name: "Jardin 1 Failed Streams"
        unique_id: arlo_j1_failed_streams
        icon: mdi:video-off
        state: "{{ state_attr('sensor.arlo_jardin_1_status', 'FailedStreams') | int(0) }}"

      - name: "Jardin 1 Camera Online"
        unique_id: arlo_j1_online
        unit_of_measurement: "s"
        icon: mdi:camera
        state: "{{ state_attr('sensor.arlo_jardin_1_status', 'CameraOnline') | int(0) }}"

      - name: "Jardin 1 WiFi Channel"
        unique_id: arlo_j1_wifi_channel
        icon: mdi:wifi
        state: "{{ state_attr('sensor.arlo_jardin_1_status', 'WifiChannel') | int(0) }}"

      - name: "Jardin 1 Firmware"
        unique_id: arlo_j1_firmware
        icon: mdi:chip
        state: "{{ state_attr('sensor.arlo_jardin_1_status', 'SystemFirmwareVersion') | default('unknown') }}"
```

Quinze capteurs par caméra. Quatre caméras. Soixante capteurs template au total. Le `unique_id` est la clé — sans lui, HA se plaint de « duplicate entity IDs » quand vous renommez ou rechargez le package. Le `state_class: measurement` sur les capteurs de température, RSSI, et tension est ce qui fait que le moteur de statistiques long-terme les trace sur le panneau History.

Les défauts `int(-99)` et `int(-100)` sur les capteurs template de température et RSSI sont des valeurs sentinelles pour « pas de données ». Je les ai choisis délibérément pour que sur un HA fraîchement redémarré, le tableau de bord affiche `-99 °C` plutôt que `unknown` pendant quelques minutes jusqu'à ce que le premier cycle de polling arrive. Les icônes de badge savent quoi faire avec `-99` (badge rouge) et l'œil apprend à l'ignorer.

Les trois autres caméras sont identiques. Le bloc complet est dans le dépôt compagnon à [`packages/arlo_cameras.yaml`](https://github.com/mmornati/arlo-base-station/blob/main/home-assistant/packages/arlo_cameras.yaml.example).

## La couche `binary_sensor:`

Trois binary sensors par caméra, dérivés du même document de statut. L'état du spotlight, le flag de batterie critique, et l'état de la LED PIR (qui est intéressant parce qu'il reflète le `input_boolean.camera_*_led` plutôt que l'attribut de la caméra — la LED est une surface de toggle, pas un capteur). Voici le bloc `Jardin 1` :

```yaml
  - binary_sensor:
      - name: "Jardin 1 Spotlight"
        unique_id: arlo_j1_spotlight
        device_class: light
        state: "{{ state_attr('sensor.arlo_jardin_1_status', 'SpotlightEnabled') == true }}"
      - name: "Jardin 1 Critical Battery"
        unique_id: arlo_j1_critical_bat
        device_class: battery
        state: "{{ state_attr('sensor.arlo_jardin_1_status', 'CriticalBatStatus') | int(0) > 0 }}"
      - name: "Jardin 1 LED"
        unique_id: arlo_j1_led
        device_class: light
        state: "{{ is_state('input_boolean.camera_jardin_1_led', 'on') }}"
```

Le binaire Spotlight est une lecture pure de l'attribut de la caméra. Le binaire Critical Battery est la même chose — `CriticalBatStatus` est un entier non nul quand la caméra a flaggé la batterie comme critique, donc une comparaison `> 0` le transforme en booléen propre. Le binaire LED est le seul qui n'est *pas* une lecture pure — il reflète l'état de `input_boolean.camera_jardin_1_led`. C'est l'UX souhaitée : le toggle sur le tableau de bord est la source de vérité, et le binary sensor la reflète simplement.

`device_class: light` sur les binary sensors Spotlight et LED est ce qui leur permet d'apparaître comme tuiles du domaine `light` si jamais vous voulez les ajouter à une carte lights. `device_class: battery` sur le binary sensor Critical Battery fait que le panneau History les colorie en rouge et déclenche une entrée d'event log.

## La trinité `input_boolean` + `rest_command` + automatisation

C'est le motif symétrique qui rend l'armement/désarmement et le contrôle de la LED fiables. La même forme se répète : un `input_boolean` (le toggle visible par l'utilisateur dans HA), un `rest_command` (le POST HTTP qui atterrit sur la caméra), et une seule automatisation qui écoute le booléen et déclenche le POST. Huit `rest_command`s au total — deux par caméra.

Voici les quatre commandes `*_arm` :

```yaml
rest_command:
  camera_jardin_1_arm:
    url: "http://192.168.1.48:5000/device/XXXXXXXXXXXX/arm"
    method: POST
    content_type: "application/json"
    payload: '{"PIRTargetState": "{{ "Armed" if arm else "Disarmed" }}"}'
  camera_jardin_2_arm:
    url: "http://192.168.1.48:5000/device/XXXXXXXXXXXX/arm"
    method: POST
    content_type: "application/json"
    payload: '{"PIRTargetState": "{{ "Armed" if arm else "Disarmed" }}"}'
  camera_portail_arm:
    url: "http://192.168.1.48:5000/device/XXXXXXXXXXXX/arm"
    method: POST
    content_type: "application/json"
    payload: '{"PIRTargetState": "{{ "Armed" if arm else "Disarmed" }}"}'
  camera_entree_arm:
    url: "http://192.168.1.48:5000/device/XXXXXXXXXXXX/arm"
    method: POST
    content_type: "application/json"
    payload: '{"PIRTargetState": "{{ "Armed" if arm else "Disarmed" }}"}'
```

Le payload mérite qu'on s'y arrête. L'endpoint de la station de base `arlo-cam-api` accepte le corps du protocole wire Arlo verbatim, ce qui signifie que la clé est `PIRTargetState` (camelCase, exactement comme la caméra l'envoie) et la valeur est `"Armed"` ou `"Disarmed"` (capitalisé, exactement comme la caméra l'attend). Le template `{{ ... }}` est une expression Jinja2 qui est rendue avec l'argument `arm` fourni par l'appelant. L'appelant ici est l'automatisation de sync, qui passe `arm: true` ou `arm: false` depuis l'état de l'`input_boolean` — `true` devient `"Armed"`, `false` devient `"Disarmed"`.

Les quatre commandes `*_led` suivent la même forme mais avec un payload différent :

```yaml
  camera_jardin_1_led:
    url: "http://192.168.1.48:5000/device/XXXXXXXXXXXX/pirled"
    method: POST
    content_type: "application/json"
    payload: '{"enabled": {{ led | lower }}, "sensitivity": 80}'
  camera_jardin_2_led:
    url: "http://192.168.1.48:5000/device/XXXXXXXXXXXX/pirled"
    method: POST
    content_type: "application/json"
    payload: '{"enabled": {{ led | lower }}, "sensitivity": 80}'
  camera_portail_led:
    url: "http://192.168.1.48:5000/device/XXXXXXXXXXXX/pirled"
    method: POST
    content_type: "application/json"
    payload: '{"enabled": {{ led | lower }}, "sensitivity": 80}'
  camera_entree_led:
    url: "http://192.168.1.48:5000/device/XXXXXXXXXXXX/pirled"
    method: POST
    content_type: "application/json"
    payload: '{"enabled": {{ led | lower }}, "sensitivity": 80}'
```

Le filtre `| lower` garantit que `true` et `false` sont sérialisés comme des booléens JSON plutôt que les chaînes `"True"` et `"False"`. Sans lui, le parser JSON de `arlo-cam-api` rejette le corps avec un 400. Le `sensitivity: 80` est codé en dur — le champ de l'API est 0–100 et 80 est le sweet spot entre « le PIR se déclenche sur chaque feuille » et « le PIR ne se déclenche que sur un camion ». Si vous voulez l'exposer comme slider, le payload du `rest_command` devient `'"sensitivity": {{ sensitivity }}'` et l'automatisation passe la valeur depuis un `input_number`.

Les quatre input_booleans par caméra qui pilotent l'automatisation sont dans `packages/arlo_cameras.yaml` :

```yaml
input_boolean:
  camera_portail_armed:
    name: "Camera Portail Armed"
    icon: mdi:shield-lock
  camera_portail_led:
    name: "Camera Portail PIR LED"
    icon: mdi:led-on
  camera_entree_armed:
    name: "Camera Entree Armed"
    icon: mdi:shield-lock
  camera_entree_led:
    name: "Camera Entree PIR LED"
    icon: mdi:led-on
```

Le même motif se répète pour `camera_jardin_1_armed`, `camera_jardin_1_led`, `camera_jardin_2_armed`, `camera_jardin_2_led` — huit input_booleans au total, deux par caméra.

Les automatisations de sync pour les caméras *Portail* et *Entrée* vivent dans `automations.yaml` (le fichier legacy dans ce déploiement). Les automatisations de sync des caméras *Jardin 1* et *Jardin 2* sont dans le dépôt compagnon à [`home-assistant/automations/arlo_sync.yaml`](https://github.com/mmornati/arlo-base-station/blob/main/home-assistant/automations/arlo_sync.yaml). Voici la sync arm du *Portail* comme exemple représentatif :

```yaml
- id: camera_portail_arm_disarm_sync
  alias: "Camera Portail Arm/Disarm Sync"
  triggers:
    - trigger: state
      entity_id: input_boolean.camera_portail_armed
  actions:
    - choose:
        - conditions:
            - condition: state
              entity_id: input_boolean.camera_portail_armed
              state: 'on'
          sequence:
            - action: rest_command.camera_portail_arm
              data:
                arm: true
      default:
        - action: rest_command.camera_portail_arm
          data:
            arm: false
  mode: single
```

La sync LED a la même forme avec `led: true` / `false` au lieu de `arm`. Quatre automatisations, huit invocations de `rest_command`, huit toggles au total. Toute la boucle de « l'utilisateur clique sur le toggle dans HA » à « l'état PIR de la caméra change » prend environ 30 ms sur le LAN parce que rien n'a besoin d'aller-retour par le cloud Arlo.

## La machinerie `arlo_wake` — Le hack d'autonomie de batterie

C'est la pièce la plus importante de l'intégration, et celle qui décide si le parc de caméras tient deux semaines ou deux mois sur une seule charge solaire. Le miroir de l'UX de l'app Arlo où chaque caméra est « toujours là » est exactement ce qui vide les batteries. La réalité avec du RTSP custom est que le port RTSP de la caméra est fermé par défaut, et la réveiller coûte 10–14 secondes et une quantité non négligeable de batterie. Vous voulez seulement la réveiller quand quelque chose se passe réellement.

Le package `arlo_wake` dans `packages/arlo_wake.yaml` résout cela avec trois composants : un sélecteur de mode, un input d'intervalle, et un script qui exécute le pipeline wake-then-snapshot. Puis neuf automatisations routent les déclencheurs de wake en fonction du mode.

### Le sélecteur de mode

```yaml
input_select:
  arlo_wake_mode:
    name: "Arlo Wake Mode"
    icon: mdi:camera-control
    options:
      - "off"
      - "periodic"
      - "on-demand"
    initial: "periodic"

input_number:
  arlo_wake_interval_minutes:
    name: "Arlo Wake Interval (min)"
    icon: mdi:timer-outline
    min: 1
    max: 60
    step: 1
    initial: 15
```

Trois modes :

- **`off`** — pas de wake automatique. Les caméras dorment jusqu'à ce qu'un des déclencheurs manuels se déclenche (alerte PIR via webhooks `arlo-cam-api`, ou pression de bouton). Idéal pour les absences longues.
- **`periodic`** *(par défaut)* — l'automatisation `arlo_wake_periodic` se déclenche toutes les 15 minutes (`time_pattern: minutes: "/15"`) et exécute le pipeline wake-then-snapshot complet pour les quatre caméras. Cela garde les caméras assez chaudes pour que toute tentative de connexion RTSP réussisse en quelques secondes. L'intervalle de 15 minutes est un équilibre : plus court est plus convivial pour du RTSP temps réel, plus long est plus convivial pour la batterie.
- **`on-demand`** — les quatre automatisations `arlo_wake_on_view_<cam>` se déclenchent quand l'entité caméra HA transite de `idle` à `streaming`. HA ne tente la transition vers `streaming` que quand la carte Lovelace est en cours de visualisation, donc le wake se passe exactement quand l'utilisateur regarde. Idéal pour les dashboards live ; mauvais pour les alertes à la décision rapide.

L'`input_number arlo_wake_interval_minutes` vous permet de pousser l'intervalle périodique jusqu'à 60 minutes (génial pour les vacances) ou de descendre à 1 minute (génial pour les démos et le debug live). Les neuf automatisations y font toutes référence via `states('input_number.arlo_wake_interval_minutes')` (ou, dans le cas périodique, le rythme implicite de 15 min).

### Les commandes REST de wake

Quatre commandes `*_wake_*`, une par caméra. Elles POSTent `{"active": true, "duration": 1800}` à `/device/<serial>/userstreamactive` avec un timeout de 8 secondes — assez long pour qu'un wake de caméra lent réussisse quand même, assez court pour qu'une caméra qui ne répond pas ne bloque pas le script :

```yaml
rest_command:
  arlo_wake_jardin_1:
    url: "http://192.168.1.48:5000/device/XXXXXXXXXXXX/userstreamactive"
    method: POST
    content_type: "application/json"
    payload: '{"active": true, "duration": 1800}'
    timeout: 8
  arlo_wake_jardin_2:
    url: "http://192.168.1.48:5000/device/XXXXXXXXXXXX/userstreamactive"
    method: POST
    content_type: "application/json"
    payload: '{"active": true, "duration": 1800}'
    timeout: 8
  arlo_wake_portail:
    url: "http://192.168.1.48:5000/device/XXXXXXXXXXXX/userstreamactive"
    method: POST
    content_type: "application/json"
    payload: '{"active": true, "duration": 1800}'
    timeout: 8
  arlo_wake_entree:
    url: "http://192.168.1.48:5000/device/XXXXXXXXXXXX/userstreamactive"
    method: POST
    content_type: "application/json"
    payload: '{"active": true, "duration": 1800}'
    timeout: 8
```

Le champ `duration: 1800` est l'indice de minutes-pour-garder-le-streaming-ouvert. L'émulateur de station de base stocke cela en mémoire et le port RTSP de la caméra reste ouvert pendant 30 minutes après le dernier wake réussi. Après 30 minutes sans clients, la caméra se rendort d'elle-même — exactement la propriété à la demande de MediaMTX de l'article 2.

Les commandes `*_snapshot_*` sont la même idée, mais pour le sidecar `arlo-snapshot` :

```yaml
  arlo_snapshot_jardin_1:
    url: "http://192.168.1.48:8000/snapshot/XXXXXXXXXXXX"
    method: POST
    timeout: 30
  arlo_snapshot_jardin_2:
    url: "http://192.168.1.48:8000/snapshot/XXXXXXXXXXXX"
    method: POST
    timeout: 30
  arlo_snapshot_portail:
    url: "http://192.168.1.48:8000/snapshot/XXXXXXXXXXXX"
    method: POST
    timeout: 30
  arlo_snapshot_entree:
    url: "http://192.168.1.48:8000/snapshot/XXXXXXXXXXXX"
    method: POST
    timeout: 30
```

Le timeout de 30 secondes couvre le pire cas : la caméra est complètement endormie, le POST `userstreamactive` doit la réveiller (10–14 s), le sidecar doit ouvrir le flux RTSP (3–5 s), AV doit décoder une frame (1–2 s), et l'encodeur doit écrire un JPEG (sub-seconde). 30 s est confortable.

### Le pipeline `script.arlo_wake_all`

Tout le pipeline est un script. La structure est *wake parallèle → délai de 6 secondes → snapshot parallèle*. Le délai de 6 secondes est le nombre magique — il correspond à `STREAM_WARMUP_SEC=6` dans l'environnement de `arlo-snapshot` (article 2), et c'est le temps dont la caméra a besoin après le POST de wake avant que le port RTSP soit réellement accessible :

```yaml
script:
  arlo_wake_all:
    alias: "Arlo Wake All Cameras"
    icon: mdi:camera-array
    sequence:
      - parallel:
          - action: rest_command.arlo_wake_jardin_1
          - action: rest_command.arlo_wake_jardin_2
          - action: rest_command.arlo_wake_portail
          - action: rest_command.arlo_wake_entree
      - delay: "00:00:06"
      - parallel:
          - action: rest_command.arlo_snapshot_jardin_1
          - action: rest_command.arlo_snapshot_jardin_2
          - action: rest_command.arlo_snapshot_portail
          - action: rest_command.arlo_snapshot_entree
```

Les quatre POSTs de wake tournent en parallèle. Le délai de 6 secondes est essentiel — sans lui, les POSTs de snapshot entreraient en course avec les wakes et la plupart timeouteraient. Les quatre POSTs de snapshot tournent aussi en parallèle. Temps total : 6 s + (temps de wake de la caméra la plus lente) ≈ 16 s. Quatre caméras, quatre snapshots JPEG frais, prêts à être récupérés par les cartes Lovelace.

### Les neuf automatisations

Le wake périodique est le plus simple :

```yaml
automation:
  - id: arlo_wake_periodic
    alias: "Arlo Wake Periodic"
    description: "Periodically wakes all Arlo cameras to keep them reachable for RTSP"
    mode: single
    trigger:
      - platform: time_pattern
        minutes: "/15"
    condition:
      - condition: state
        entity_id: input_select.arlo_wake_mode
        state: "periodic"
    action:
      - action: script.arlo_wake_all
```

Le `time_pattern: minutes: "/15"` signifie toutes les 15 minutes (le `/` initial est la syntaxe HA « every N »). La condition gate l'action sur le mode qui est `periodic`. Si le mode est `off` ou `on-demand`, l'automatisation ne fait rien.

Les quatre automatisations `*_on_view_*` se déclenchent quand l'entité caméra HA transite de `idle` à `streaming`. Cette transition se passe quand la carte Lovelace est en cours de visualisation et que HA essaie d'ouvrir le flux RTSP. La gateway vers le wake est la même commande REST, mais l'action est le wake d'une seule caméra, pas le script complet :

```yaml
  - id: arlo_wake_on_view_jardin_1
    alias: "Arlo Wake on View - Jardin 1"
    mode: single
    trigger:
      - platform: state
        entity_id: camera.garden_arlo_jardin_1
        from: "idle"
        to: "streaming"
    condition:
      - condition: state
        entity_id: input_select.arlo_wake_mode
        state: "on-demand"
    action:
      - action: rest_command.arlo_wake_jardin_1
```

Les quatre automatisations `*_on_view_*` (une par caméra) sont identiques en forme : elles surveillent `camera.garden_arlo_<cam>`, gatent sur `on-demand`, et déclenchent le `rest_command.arlo_wake_<cam>` correspondant.

Les quatre automatisations `*_on_pir_*` sont la pièce toujours active. Elles surveillent le capteur template `*_pir_triggers` — qui est le compteur PIR de la caméra elle-même depuis `/device/<serial>` — et se déclenchent à chaque fois que le compteur s'incrémente. Le template `above: "{{ states('sensor.arlo_jardin_1_pir_triggers') | int(0) }}"` est le déclencheur « tout incrément » standard, et la condition gate sur le mode étant *non* `off` :

```yaml
  - id: arlo_wake_on_pir_jardin_1
    alias: "Arlo Wake on PIR - Jardin 1"
    mode: single
    trigger:
      - platform: numeric_state
        entity_id: sensor.arlo_jardin_1_pir_triggers
        above: "{{ states('sensor.arlo_jardin_1_pir_triggers') | int(0) }}"
    condition:
      - condition: not
        conditions:
          - condition: state
            entity_id: input_select.arlo_wake_mode
            state: "off"
    action:
      - action: rest_command.arlo_wake_jardin_1
```

Le résultat : en mode `off`, les caméras dorment jusqu'à ce que vous déclenchiez quelque chose manuellement. En mode `on-demand`, elles se réveillent quand vous regardez la carte Lovelace. En mode `periodic`, elles se réveillent selon une cadence de 15 minutes ET sur les déclencheurs PIR. Le sélecteur de mode est le seul cadran qui décide à quel point les caméras restent chaudes de manière agressive.

Le package `arlo_wake.yaml` complet est dans le dépôt compagnon à [`packages/arlo_wake.yaml`](https://github.com/mmornati/arlo-base-station/blob/main/home-assistant/packages/arlo_wake.yaml).

## Les templates Button-Card

Les templates button-card dans `templates/buttons.yaml` sont la surface de wake manuel. Un bouton par caméra, chacun avec une press-action qui fait le même pipeline wake-then-snapshot que le script, mais pour une caméra à la fois :

```yaml
- button:
    - name: "Arlo Wake Jardin 1"
      unique_id: arlo_wake_btn_jardin_1
      icon: mdi:camera-wireless
      press:
        - action: rest_command.arlo_wake_jardin_1
        - delay: "00:00:06"
        - action: rest_command.arlo_snapshot_jardin_1
    - name: "Arlo Wake Jardin 2"
      unique_id: arlo_wake_btn_jardin_2
      icon: mdi:camera-wireless
      press:
        - action: rest_command.arlo_wake_jardin_2
        - delay: "00:00:06"
        - action: rest_command.arlo_snapshot_jardin_2
    - name: "Arlo Wake Portail"
      unique_id: arlo_wake_btn_portail
      icon: mdi:camera-wireless
      press:
        - action: rest_command.arlo_wake_portail
        - delay: "00:00:06"
        - action: rest_command.arlo_snapshot_portail
    - name: "Arlo Wake Entree"
      unique_id: arlo_wake_btn_entree
      icon: mdi:camera-wireless
      press:
        - action: rest_command.arlo_wake_entree
        - delay: "00:00:06"
        - action: rest_command.arlo_snapshot_entree
```

Les quatre entités bouton (`button.arlo_wake_jardin_1`, etc.) sont surfaceées sur le panneau Cameras Lovelace comme les tuiles « Arlo Wake ». Tap → wake → pause de 6 secondes → snapshot JPEG frais. La tuile pulse pendant la durée du wake, puis se stabilise avec la nouvelle image. L'utilisateur voit une action « wake + grab still » en temps réel qui coûte environ 16 secondes de temps mural et une session RTSP de 30 secondes sur la caméra.

Le template button-card est aussi la manière la plus simple de surfacer le mécanisme de wake en dehors du tableau de bord — vous pouvez le déclencher depuis une automatisation, un script, un tag NFC, ou un bot Telegram. L'entité bouton est juste une entité HA comme n'importe quelle autre.

Le fichier templates complet est dans le dépôt compagnon à [`templates/arlo_buttons.yaml`](https://github.com/mmornati/arlo-base-station/blob/main/home-assistant/templates/arlo_buttons.yaml).

## Le panneau Cameras Lovelace

Le tableau de bord est construit sur la carte picture-entity standard, la carte glance standard, la carte entities standard, et les cartes input-select / input-number standards. Aucune carte custom n'est requise. La vue est nommée « Cameras » dans la barre latérale.

La vue est arrangée en stack vertical avec une ligne par caméra. Le haut de la vue contient les contrôles globaux (sélecteur de mode, slider d'intervalle). Chaque ligne a, de gauche à droite :

1. Une carte **`picture-entity`** pour la caméra. Le `camera_view: auto` (par défaut) affiche l'image fixe depuis `arlo-snapshot` par défaut. Tap ou clic sur la carte et HA ouvre le flux RTSP via MediaMTX (`rtsp://192.168.1.48:8554/cam1` pour Jardin 1, `cam2` pour Jardin 2, `cam3` pour Portail, `cam4` pour Entrée). Naviguez ailleurs et le stream se démonte automatiquement. Les entités caméra sont `camera.garden_arlo_jardin_1`, `camera.garden_arlo_jardin_2`, `camera.garden_arlo_portail`, et `camera.garden_arlo_entree` — le préfixe `garden_arlo_` est le namespace que l'intégration `generic` utilise par défaut.
2. Une **carte glance** avec quatre entités : pourcentage de batterie (`sensor.arlo_<cam>_status` avec `device_class: battery`), WiFi RSSI (`sensor.<cam>_wifi_rssi`), température (`sensor.<cam>_temperature`), et l'état de charge (`sensor.<cam>_charging`). La carte glance place une petite icône et la valeur sur une ligne, donc les quatre tiennent sur une seule bande horizontale.
3. Une **rangée de switches** avec deux mappings `switch.toggle` — un pour `input_boolean.camera_<cam>_armed` (l'icône bouclier) et un pour `input_boolean.camera_<cam>_led` (l'icône LED). Le mapping se fait via la plateforme template `switch.toggle` ; l'input_boolean est la source de vérité, et l'UI du toggle est juste une fenêtre dessus.
4. La **button-card** de la section précédente (`button.arlo_wake_<cam>`). La press-action fait le pipeline wake-then-snapshot.
5. Une **rangée d'entités badge** pour les trois binary sensors : Spotlight (`binary_sensor.<cam>_spotlight`), Critical Battery (`binary_sensor.<cam>_critical_battery`), PIR LED (`binary_sensor.<cam>_led`). Les `device_class: light` et `device_class: battery` des binary sensors leur donnent les bonnes icônes par défaut.

Le haut de la vue a deux cartes supplémentaires :

- **`input_select.arlo_wake_mode`** — le sélecteur de mode. Trois options : `off`, `periodic`, `on-demand`. Le défaut est `periodic`.
- **`input_number.arlo_wake_interval_minutes`** — le slider d'intervalle. Range 1–60, défaut 15. Affecte la cadence de wake périodique.

Toute la vue fait environ 5 lignes verticales de cartes sur un navigateur desktop et 4–5 swipes sur un téléphone. Les quatre caméras sont disposées gauche-à-droite sur un écran large et empilées verticalement sur un téléphone. Les cartes se redimensionnent automatiquement ; aucune configuration de media-query n'est requise.

La vue est accessible via la barre latérale HA principale — l'entrée « Cameras » — et les quatre rangées de caméra sont visibles d'un coup d'œil. Il n'y a pas de vue imbriquée, pas de modal, pas de pop-over. Tout le tas est sur un seul écran.

## UX d'usage quotidien

Une fois le tableau de bord construit, la boucle d'interaction utilisateur est courte et prévisible :

- **Sélecteur de Wake Mode en haut du panneau Cameras.** `off` (pas d'auto-wake, les caméras dorment jusqu'à ce que vous les déclenchiez), `periodic` (toutes les 15 minutes, le défaut), `on-demand` (wake seulement quand la carte Lovelace est en cours de visualisation). En vacances, passez sur `off` et reposez-vous sur les automatisations PIR. Un jour normal, laissez sur `periodic`.
- **Un événement PIR déclenche un wake + snapshot immédiat.** Les automatisations `arlo_wake_on_pir_<cam>` se déclenchent à chaque fois que le compteur PIR de la caméra s'incrémente. Mode `off` → pas de wake. Tout autre mode → wake, puis 6 s plus tard un JPEG frais est dans le store en mémoire du sidecar. La carte Lovelace reprend la nouvelle image au prochain tick de refresh.
- **Wake manuel via la button-card.** Tap sur la tuile « Arlo Wake » pour la caméra que vous voulez. Le bouton pulse pendant ~16 secondes. Un JPEG frais apparaît dans la carte caméra. Le même pipeline tourne que vous l'ayez déclenché depuis le tableau de bord ou depuis un bot Telegram.
- **Armement/Désarmement via les switches toggle.** Le toggle `input_boolean.camera_<cam>_armed` sur le tableau de bord. Toggle off → la commande REST ARM se déclenche avec `arm: false` → le PIRTargetState de la caméra passe à `Disarmed`. Toggle on → la commande REST ARM se déclenche avec `arm: true` → le PIRTargetState de la caméra passe à `Armed`. Tout le round-trip prend ~30 ms.
- **Toggle PIR LED.** Même motif que armement/désarmement. Le toggle `input_boolean.camera_<cam>_led`, l'automatisation `camera_<cam>_led_sync`, le POST `rest_command.camera_<cam>_led`. La LED sur le devant de la caméra s'allume quand le toggle est on.

La cadence périodique de 15 minutes est le cheval de bataille. Elle garde les caméras sur un cycle de wake prévisible pour que la connexion RTSP réussisse en ~2 secondes quand vous tappez sur la carte caméra. Sans elle, la première tentative RTSP après un long sommeil prendrait les 10–14 secondes complets du wake de caméra, ce qui ressemble à une page figée.

Le mode périodique est aussi la raison pour laquelle l'intégration fonctionne bien pendant les démos. Si vous montrez le tableau de bord à quelqu'un et qu'il tap sur une caméra, le wake est déjà en cours depuis le dernier tick périodique, donc le stream s'ouvre en ~2 secondes. L'expérience « feels instant » de l'app Arlo est principalement le wake périodique.

## Limitations et ce qui vient ensuite

Quelques rough edges restent :

- **Pas de CVR.** L'enregistrement vidéo continu est une feature cloud-only. Le setup local vous donne des snapshots à la demande et du RTSP à la demande ; il ne vous donne pas de timeline 24/7. Pour cela il vous faudrait un enregistreur séparé (par ex. Frigate) et même là, l'émulateur local manque l'historique d'événements `MotionStreamed` qui vous permettrait de rembobiner.
- **Pas de détection AI.** Le capteur PIR se déclenche sur tout mouvement — feuilles, phares, ombres. Le cloud Arlo original a des alertes intelligentes (personne, véhicule, colis, animal) qui filtrent le bruit. Reproduire cela localement nécessiterait un pipeline CV (Frigate + Coral, ou une API distante), ce qui est hors scope pour ce projet.
- **`userstreamactive` ne persiste pas à travers les redémarrages de `arlo-cam-api`.** Quand l'émulateur de station de base redémarre, l'état en mémoire de quelles caméras avaient un user stream actif est perdu. Les caméras récupèrent d'elles-mêmes (elles détectent la déconnexion TCP et se ré-enregistrent), mais le premier appel `userstreamactive` après un redémarrage est plus lent parce que le serveur RTSP doit démarrer à froid.
- **Pas de configuration de zone de mouvement via API.** Les zones d'activité sont une feature cloud-only sur le firmware Arlo officiel. Les configurer nécessite l'app Arlo, ce qui va à l'encontre du but de l'auto-hébergement. Une implémentation de station de base custom pourrait en principe pousser des définitions de zone vers la caméra, mais le protocole n'est pas documenté.
- **Pas de proxy de thumbnail pour les recordings.** Les recordings sont sauvegardés dans `/recordings` comme segments vidéo bruts ; il n'y a pas d'API pour récupérer un thumbnail à `t=10s` pour un recording donné. Pour l'instant je prends juste un snapshot frais via `arlo-snapshot` quand je veux un still.
- **Les capteurs de batterie legacy `aarlo` sont toujours utiles mais un peu fragiles.** Ils dépendent du cache rétro-compatible des valeurs de batterie qu'Arlo garde côté cloud. Si Arlo retire ce cache un jour, les quatre entités `sensor.aarlo_battery_level_*` passeront à `unavailable` et les notifications push mobiles s'arrêteront. Les nouveaux capteurs REST dans `sensor.arlo_<cam>_status` sont le fallback — ils exposent le même attribut `BatPercent` et sont indépendants du cloud Arlo.

Aucune de ces limitations n'est un blocker. Ce sont des nice-to-haves que je traiterai quand je les traiterai.

## Conclusion de la série

Ceci est le troisième et dernier article de la série. De la [couche réseau dans l'article 1](/replacing-arlo-base-station-with-a-netgear-orbi-router/), à travers les [services et les PRs upstream de l'article 2](/self-hosting-arlo-cam-api-patches-and-improvements/), jusqu'à l'intégration Home Assistant dans cet article, vous avez maintenant un remplacement open-source complet pour la station de base Arlo propriétaire. Chaque pièce tourne sur votre propre matériel, chaque ligne de configuration est en contrôle de version, chaque contribution upstream est documentée, et le seul coût récurrent est l'électricité pour faire tourner le mini PC.

Le dépôt compagnon sur [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) contient chaque fichier référencé dans les trois articles, avec les copies de production, les correctifs, le docker-compose, et le YAML Home Assistant en un seul endroit. Forkez-le, envoyez des PRs, ouvrez des issues, et dites-moi ce qui marche pour vous.

Merci d'avoir lu.

## Lire le reste de la série

- [Article 1 — Networking & Gateway Hack](/replacing-arlo-base-station-with-a-netgear-orbi-router/)
- [Article 2 — Services & upstream PRs](/self-hosting-arlo-cam-api-patches-and-improvements/)
- [Dépôt compagnon](https://github.com/mmornati/arlo-base-station)
