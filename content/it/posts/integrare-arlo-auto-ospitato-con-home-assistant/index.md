---
title: 'Integrare il proprio stack Arlo auto-ospitato con Home Assistant: Sensori, Automazioni e Dashboard Lovelace'
tags:
- home-assistant
- arlo
- domotica
- casa-intelligente
- lovelace
- automazione
- telecamere
- rest
- iot
date: '2026-08-17T12:00:00.000000+00:00'
slug: integrare-arlo-auto-ospitato-con-home-assistant
translationKey: arlo-home-assistant-integration
url: /it/integrare-arlo-auto-ospitato-con-home-assistant/
aliases:
- /integrare-arlo-auto-ospitato-con-home-assistant
categories:
- Casa Intelligente
- DIY
- Home Assistant
description: 'Come collegare il proprio emulatore di stazione base Arlo auto-ospitato (arlo-cam-api + arlo-snapshot + mediamtx) a Home Assistant usando sensori REST, sensori template, binary_sensor, automazioni, input_boolean e una dashboard Lovelace per telecamere — senza dipendere dalle integrazioni deprecate pyaarlo/aarlo.'
cover: cover.jpg
showHero: true
---

Questo è il Post 3 — l'ultimo — di una serie di tre articoli sulla sostituzione della stazione base Arlo proprietaria con uno stack auto-ospitato. Nel [Post 1 di questa serie](/it/sostituire-la-stazione-base-arlo-con-un-router-netgear-orbi/) ho coperto il livello di rete: come fare in modo che un Netgear Orbi RBR760 si spacci sufficientemente bene per la stazione base Arlo da far connettere, registrare, e continuare a streamare le telecamere. Nel [Post 2 di questa serie](/it/auto-ospitare-arlo-cam-api-correzioni-e-miglioramenti/) ho coperto il livello server: lo stack Docker `arlo-cam-api`, il sidecar `arlo-snapshot` on-demand, il relay RTSP on-demand tramite MediaMTX, e le tre pull request upstream che ho contribuito per correggere i bug incontrati strada facendo.

In questo post copro il livello *Home Assistant* — come le quattro telecamere diventano entità di primo piano in HA, come un singolo `input_select` permette di scambiare l'autonomia della batteria con una presenza istantanea, e come la dashboard Lovelace finisce per assomigliare quasi esattamente all'app Arlo, tranne che ogni riga è sotto il vostro controllo. Il repository di accompagnamento su [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) contiene tutti i file di configurazione e patch menzionati qui.

Ecco l'architettura su cui ci appoggiamo alla fine di questo post. Lo schema è lo stesso del Post 1; la freccia tratteggiata è la nuova parte — il polling REST che HA esegue contro `/device/<serial>` sulla porta 5000.

```
                            WAN
                             │
                  ┌──────────▼──────────┐
                  │  Netgear Orbi RBR760│  isolamento guest
                  │  172.14.1.1 (Arlo)  │◀──── 4x Arlo VMC4040P (192.168.2.x)
                  │  192.168.1.x (LAN)  │           WiFi guest, isolata
                  └──────────┬──────────┘
                             │ DNAT tcp/4000
                  ┌──────────▼──────────┐
                  │  Server (mini PC)   │
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
                  │  │  on-demand    │  │                │
                  │  └───────────────┘  │                │
                  └─────────────────────┘                │
                                                          │
                  ┌───────────────────────────────────────┘
                  │
          ┌───────▼────────┐
          │ Home Assistant │
          │  192.168.1.32  │
          │                │
          │  4 sensori REST│
          │  4 telecamere  │
          │  9 automazioni │
          │  4 button-cards│
          │  UI Lovelace   │
          └────────────────┘
```

> **Una nota sulla redazione.** Come nei Post 1 e 2, i veri numeri di serie delle telecamere, gli indirizzi MAC, e l'IP LAN di produzione del server sono stati sostituiti da placeholder `XXXXXXXXXXXX` e un placeholder generico. Il valore ben noto `172.14.1.1` del gateway Arlo è mantenuto perché fa parte del protocollo wire. La sottorete guest `192.168.2.x` (dove vivono le telecamere sull'Orbi) è lasciata così com'è perché è il default standard dell'Orbi e non rivela nulla di specifico.

## Perché i sensori REST (e non `pyaarlo` / `aarlo`)

Se avete mai collegato telecamere Arlo in Home Assistant prima, siete quasi certamente passati per `pyaarlo` — il client Python Arlo non ufficiale — e l'integrazione Home Assistant `aarlo` sopra di esso. `aarlo` è il percorso de facto da anni. Espone batteria, segnale, movimento, suono, pressioni del campanello, ultima cattura, attività recente, e un'entità `camera.<nome>` per telecamera attraverso un unico config flow amichevole.

Ho tenuto `aarlo` installato su questo deployment. Sta ancora facendo un lavoro utile: le quattro entità `sensor.aarlo_battery_level_*` sono quelle i cui valori innescano le notifiche push mobili che ho avuto sul telefono per gli ultimi tre anni. Durante la migrazione, quando riavviavo il server, o le telecamere andavano offline, o stavo testando una nuova PR, quelle notifiche push erano il segnale di early-warning che qualcosa non andava. Per ora restano.

Ma ogni altra entità — ogni sensore, ogni telecamera, ogni switch di arm/disarm, ogni toggle del LED PIR — è 100% REST. Ecco l'intero file di configurazione `aarlo.yaml`:

```yaml
version: 1
aarlo:
  backend: sse
```

Tre righe. Il `backend: sse` è una modalità backend SSE che permette ad `aarlo` di mantenere le entità esistenti senza fare il grosso lavoro di mantenere una sessione — perché le telecamere non sono più registrate con il cloud Arlo affatto. Le entità `aarlo` lato cloud provano ancora a girare, e riportano allegramente `unavailable` per tutto tranne i quattro sensori di batteria che conserviamo. I quattro sensori di batteria vengono dal campo `BatPercent` della telecamera stessa, che è esposto sul cloud tramite una cache separata che Arlo mantiene per la retrocompatibilità; `aarlo` interroga quella cache e la espone.

L'entry in `customize.yaml` per ognuno impedisce alla card batteria auto-generata di creare un duplicato:

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

Tutto qui. Tre righe di config `aarlo` e quattro entry `customize`. Tutto il resto è REST.

La ragione della separazione è semplice: `aarlo` non è mai stato progettato per telecamere che non parlano con il cloud Arlo. La sua entità `camera.aarlo_*` assume il meccanismo di stream cloud Arlo standard, che l'emulatore locale non implementa. I suoi `binary_sensor.aarlo_motion_*` e `binary_sensor.aarlo_sound_*` vengono dallo stesso feed cloud. I suoi `switch.aarlo_siren_*` e `switch.aarlo_snapshot_*` sono azioni cloud. Niente di tutto ciò funziona quando le telecamere stanno chiacchierando allegramente con `arlo-cam-api` su `192.168.1.48:4000` e non hanno mai sentito parlare di `arlo-api.arlo.com`.

Lo strato di sensori REST è anche più flessibile. Voi decidete l'intervallo di polling per sensore. Voi decidete come derivare i binary_sensor. Voi decidete quale attributo diventa una card device-class-battery e quale diventa una riga di glance. E ottenete il documento di stato completo dei 25 campi da `/device/<serial>` gratis, cosa che `aarlo` non esporrebbe mai.

## Lo strato di sensori REST

L'intero package è in `packages/arlo_cameras.yaml`. Il primo blocco sono i quattro sensori REST — uno per telecamera. Ecco il blocco completo per la prima telecamera (`Jardin 1`); le altre tre sono identiche tranne per il seriale e il friendly name:

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

Quattro telecamere, quattro sensori, quattro blocchi copia-incolla. L'intervallo di polling è `scan_interval: 300` (5 minuti), che è la frequenza giusta per la batteria — la percentuale di batteria non cambia in modo misurabile in una finestra di 5 minuti su un pannello solare in salute. Il `value_template` estrae `BatPercent` dal body JSON e lo converte in int con un default di `-1` per il caso in cui la telecamera è offline (l'API ritorna un body vuoto quando il device è sconosciuto al server, e `int(-1)` rende lo stato risultante un sentinel riconoscibile su cui posso instradare nei template — qualunque cosa negativa significa «nessun dato», positiva significa «valore reale»).

Il blocco `json_attributes` è la magia che rende il resto dell'integrazione economico. Ogni campo ritornato da `GET /device/<serial>` atterra negli attributi del sensore (la tabella di campi completa è nel Post 2 §8). 25 attributi per telecamera, quattro telecamere, tutti visibili dal pannello Developer Tools → States. Il `device_class: battery` fa sì che lo stato principale venga mostrato con un'icona di batteria in qualsiasi card che sappia renderla.

I quattro sensori sono nominati in modo coerente: `Arlo Jardin 1 Status`, `Arlo Jardin 2 Status`, `Arlo Portail Status`, `Arlo Entree Status`. La corrispondenza tra il friendly name e la posizione reale della telecamera (Jardin 1, Jardin 2, Portail, Entrée) è ciò che rende la dashboard leggibile senza un glossario.

> **Perché quattro sensori e non uno con un attributo `select`?** Perché la piattaforma `template` di Home Assistant si aspetta un sensore per attributo. Se mettete tutti i 25 attributi su un sensore, dovete scrivere 25 helper che leggono da esso. Se splittate per telecamera, ottenete 4 × 25 attributi che potete ri-derivare in 4 × 15 sensori template amichevoli — e il namespacing per telecamera mantiene il resto dello YAML leggibile.

## I sensori `template:` derivati

Il sensore REST grezzo espone 25 attributi per telecamera. L'UI delle card di HA non li raccoglie automaticamente — dovete materializzare ognuno come suo sensore se volete una riga di glance, un'icona di batteria, o una sparkline consapevole dell'unità di misura. Il blocco `template:` in `packages/arlo_cameras.yaml` deriva 15 sensori amichevoli per telecamera, tutti letti dal corrispondente `sensor.arlo_*_status` tramite `state_attr()`.

Ecco il blocco `Jardin 1`. Le altre tre telecamere seguono lo stesso pattern con il loro nome e seriale:

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

Quindici sensori per telecamera. Quattro telecamere. Sessanta sensori template totali. Il `unique_id` è la chiave — senza di esso, HA si lamenta di "duplicate entity IDs" quando rinominate o ricaricate il package. Il `state_class: measurement` sui sensori di temperatura, RSSI, e tensione è ciò che fa sì che il motore di statistiche a lungo termine le tracci sul pannello History.

I default `int(-99)` e `int(-100)` sui sensori template di temperatura e RSSI sono valori sentinel per "nessun dato". Li ho scelti deliberatamente in modo che su un HA appena riavviato, la dashboard mostri `-99 °C` piuttosto che `unknown` per un paio di minuti fino a quando il primo ciclo di polling arriva. Le icone dei badge sanno cosa fare con `-99` (badge rosso) e l'occhio impara a ignorarlo.

Le altre tre telecamere sono identiche. Il blocco completo è nel repository di accompagnamento a [`packages/arlo_cameras.yaml`](https://github.com/mmornati/arlo-base-station/blob/main/home-assistant/packages/arlo_cameras.yaml.example).

## Lo strato `binary_sensor:`

Tre binary_sensor per telecamera, derivati dallo stesso documento di stato. Stato dello spotlight, flag di batteria critica, e stato del LED PIR (che è interessante perché rispecchia l'`input_boolean.camera_*_led` piuttosto che l'attributo della telecamera — il LED è una superficie di toggle, non un sensore). Ecco il blocco `Jardin 1`:

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

Il binario Spotlight è una lettura pura dall'attributo della telecamera. Il binario Critical Battery è la stessa cosa — `CriticalBatStatus` è un intero non-zero quando la telecamera ha flaggato la batteria come critica, quindi un confronto `> 0` lo trasforma in un booleano pulito. Il binario LED è l'unico che *non* è una lettura pura — rispecchia lo stato di `input_boolean.camera_jardin_1_led`. Questa è la UX desiderata: il toggle sulla dashboard è la source of truth, e il binary_sensor lo rispecchia semplicemente.

`device_class: light` sui binary_sensor Spotlight e LED è ciò che permette loro di apparire come tile del dominio `light` se mai voleste aggiungerli a una card lights. `device_class: battery` sul binary_sensor Critical Battery fa sì che il pannello History li colori di rosso e inneschi una entry di event log.

## La trinità `input_boolean` + `rest_command` + automazione

Questo è il pattern simmetrico che rende il controllo di arm/disarm e LED affidabile. La stessa forma si ripete: un `input_boolean` (il toggle visibile all'utente in HA), un `rest_command` (il POST HTTP che atterra sulla telecamera), e una singola automazione che ascolta il booleano e spara il POST. Otto `rest_command` totali — due per telecamera.

Ecco i quattro comandi `*_arm`:

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

Il payload merita una pausa. L'endpoint della stazione base `arlo-cam-api` accetta il body del protocollo wire Arlo verbatim, il che significa che la chiave è `PIRTargetState` (camelCase, esattamente come la telecamera lo invia) e il valore è `"Armed"` o `"Disarmed"` (capitalizzato, esattamente come la telecamera si aspetta). Il template `{{ ... }}` è un'espressione Jinja2 che viene renderizzata con l'argomento `arm` fornito dal chiamante. Il chiamante qui è l'automazione di sync, che passa `arm: true` o `arm: false` dallo stato dell'`input_boolean` — `true` diventa `"Armed"`, `false` diventa `"Disarmed"`.

I quattro comandi `*_led` seguono la stessa forma ma con un payload diverso:

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

Il filtro `| lower` garantisce che `true` e `false` vengano serializzati come booleani JSON anziché le stringhe `"True"` e `"False"`. Senza di esso, il parser JSON di `arlo-cam-api` rifiuta il body con un 400. Il `sensitivity: 80` è hardcoded — il campo dell'API è 0–100 e 80 è il sweet spot tra "il PIR scatta su ogni foglia" e "il PIR scatta solo su un camion". Se volete esporlo come slider, il payload del `rest_command` diventa `'"sensitivity": {{ sensitivity }}'` e l'automazione passa il valore da un `input_number`.

I quattro input_boolean per telecamera che pilotano l'automazione sono in `packages/arlo_cameras.yaml`:

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

Lo stesso pattern si ripete per `camera_jardin_1_armed`, `camera_jardin_1_led`, `camera_jardin_2_armed`, `camera_jardin_2_led` — otto input_boolean totali, due per telecamera.

Le automazioni di sync per le telecamere *Portail* e *Entrée* vivono in `automations.yaml` (il file legacy in questo deployment). Le automazioni di sync delle telecamere *Jardin 1* e *Jardin 2* sono nel repository di accompagnamento a [`home-assistant/automations/arlo_sync.yaml`](https://github.com/mmornati/arlo-base-station/blob/main/home-assistant/automations/arlo_sync.yaml). Ecco la sync arm del *Portail* come esempio rappresentativo:

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

La sync LED ha la stessa forma con `led: true` / `false` invece di `arm`. Quattro automazioni, otto invocazioni di `rest_command`, otto toggle totali. L'intero loop da "l'utente clicca il toggle in HA" a "lo stato PIR della telecamera cambia" richiede circa 30 ms sulla LAN perché nulla deve fare un round-trip attraverso il cloud Arlo.

## La macchina `arlo_wake` — Il trucco per l'autonomia della batteria

Questo è il pezzo più importante dell'integrazione, e quello che decide se il parco telecamere dura due settimane o due mesi con una singola carica solare. Lo specchio della UX dell'app Arlo dove ogni telecamera è "sempre lì" è esattamente ciò che scarica le batterie. La realtà con RTSP custom è che la porta RTSP della telecamera è chiusa di default, e svegliarla costa 10–14 secondi e una quantità non trascurabile di batteria. Volete svegliarla solo quando sta realmente succedendo qualcosa.

Il package `arlo_wake` in `packages/arlo_wake.yaml` risolve questo con tre componenti: un selettore di modalità, un input di intervallo, e uno script che esegue la pipeline wake-then-snapshot. Poi nove automazioni instradano i trigger di wake in base alla modalità.

### Il selettore di modalità

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

Tre modalità:

- **`off`** — nessun wake automatico. Le telecamere dormono finché uno dei trigger manuali non parte (allarme PIR tramite webhook `arlo-cam-api`, o pressione di un pulsante). Ideale per assenze lunghe.
- **`periodic`** *(default)* — l'automazione `arlo_wake_periodic` scatta ogni 15 minuti (`time_pattern: minutes: "/15"`) ed esegue la pipeline wake-then-snapshot completa per le quattro telecamere. Tiene le telecamere abbastanza calde che qualsiasi tentativo di connessione RTSP riesce in pochi secondi. L'intervallo di 15 minuti è un compromesso: più corto è più amichevole per RTSP in tempo reale, più lungo è più amichevole per la batteria.
- **`on-demand`** — le quattro automazioni `arlo_wake_on_view_<cam>` scattano quando l'entità telecamera HA transita da `idle` a `streaming`. HA tenta la transizione a `streaming` solo quando la card Lovelace è in fase di visualizzazione, quindi il wake avviene esattamente quando l'utente sta guardando. Ideale per dashboard live; pessimo per allarmi a decisione rapida.

L'`input_number arlo_wake_interval_minutes` vi permette di spingere l'intervallo periodico fino a 60 minuti (ottimo per le vacanze) o di scendere a 1 minuto (ottimo per demo e debug live). Le nove automazioni vi fanno tutte riferimento tramite `states('input_number.arlo_wake_interval_minutes')` (o, nel caso periodico, il ritmo implicito di 15 min).

### I comandi REST di wake

Quattro comandi `*_wake_*`, uno per telecamera. Fanno POST di `{"active": true, "duration": 1800}` a `/device/<serial>/userstreamactive` con un timeout di 8 secondi — abbastanza lungo perché un wake lento della telecamera riesca comunque, abbastanza corto che una telecamera che non risponde non blocchi lo script:

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

Il campo `duration: 1800` è il suggerimento di minuti-per-tenere-lo-streaming-aperto. L'emulatore della stazione base lo memorizza in memoria e la porta RTSP della telecamera resta aperta per 30 minuti dopo l'ultimo wake andato a buon fine. Dopo 30 minuti senza client, la telecamera si riaddormenta da sola — esattamente la proprietà on-demand di MediaMTX del Post 2.

I comandi `*_snapshot_*` sono la stessa idea, ma per il sidecar `arlo-snapshot`:

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

Il timeout di 30 secondi copre il caso peggiore: la telecamera è completamente addormentata, il POST `userstreamactive` deve svegliarla (10–14 s), il sidecar deve aprire il flusso RTSP (3–5 s), AV deve decodificare un frame (1–2 s), e l'encoder deve scrivere un JPEG (sub-secondo). 30 s è comodo.

### La pipeline `script.arlo_wake_all`

L'intera pipeline è uno script. La struttura è *wake parallelo → delay di 6 secondi → snapshot parallelo*. Il delay di 6 secondi è il numero magico — corrisponde a `STREAM_WARMUP_SEC=6` nell'ambiente di `arlo-snapshot` (Post 2), ed è il tempo di cui la telecamera ha bisogno dopo il POST di wake prima che la porta RTSP sia effettivamente raggiungibile:

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

I quattro POST di wake girano in parallelo. Il delay di 6 secondi è essenziale — senza di esso, i POST di snapshot correrebbero in gara con i wake e la maggior parte andrebbe in timeout. Anche i quattro POST di snapshot girano in parallelo. Tempo totale: 6 s + (tempo di wake della telecamera più lenta) ≈ 16 s. Quattro telecamere, quattro snapshot JPEG freschi, pronti perché le card Lovelace li raccolgano.

### Le nove automazioni

Il wake periodico è il più semplice:

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

Il `time_pattern: minutes: "/15"` significa ogni 15 minuti (lo `/` iniziale è la sintassi HA "every N"). La condizione fa il gate dell'azione sulla modalità che è `periodic`. Se la modalità è `off` o `on-demand`, l'automazione non fa nulla.

Le quattro automazioni `*_on_view_*` scattano quando l'entità telecamera HA transita da `idle` a `streaming`. Questa transizione avviene quando la card Lovelace è in fase di visualizzazione e HA sta cercando di aprire il flusso RTSP. Il gateway verso il wake è lo stesso comando REST, ma l'azione è il wake di una sola telecamera, non lo script completo:

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

Le quattro automazioni `*_on_view_*` (una per telecamera) sono identiche nella forma: osservano `camera.garden_arlo_<cam>`, fanno il gate su `on-demand`, e scattano il corrispondente `rest_command.arlo_wake_<cam>`.

Le quattro automazioni `*_on_pir_*` sono il pezzo sempre attivo. Osservano il sensore template `*_pir_triggers` — che è il contatore PIR della telecamera stessa da `/device/<serial>` — e scattano ogni volta che il contatore si incrementa. Il template `above: "{{ states('sensor.arlo_jardin_1_pir_triggers') | int(0) }}"` è il trigger "qualsiasi incremento" standard, e la condizione fa il gate sulla modalità che è *non* `off`:

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

Il risultato: in modalità `off`, le telecamere dormono finché non si triggera qualcosa manualmente. In modalità `on-demand`, si svegliano quando guardate la card Lovelace. In modalità `periodic`, si svegliano su una cadenza di 15 minuti E sui trigger PIR. Il selettore di modalità è l'unico selettore che decide quanto aggressivamente le telecamere restano calde.

Il package `arlo_wake.yaml` completo è nel repository di accompagnamento a [`packages/arlo_wake.yaml`](https://github.com/mmornati/arlo-base-station/blob/main/home-assistant/packages/arlo_wake.yaml).

## I template Button-Card

I template button-card in `templates/buttons.yaml` sono la superficie di wake manuale. Un pulsante per telecamera, ognuno con una press-action che fa la stessa pipeline wake-then-snapshot dello script, ma per una telecamera alla volta:

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

Le quattro entità button (`button.arlo_wake_jardin_1`, ecc.) sono messe in superficie sul pannello Cameras Lovelace come tile "Arlo Wake". Tap → wake → pausa di 6 secondi → snapshot JPEG fresco. La tile pulsa per la durata del wake, poi si stabilizza con la nuova immagine. L'utente vede un'azione "wake + grab still" in tempo reale che costa circa 16 secondi di tempo a muro e una sessione RTSP di 30 secondi sulla telecamera.

Il template button-card è anche il modo più semplice di mettere in superficie il meccanismo di wake al di fuori della dashboard — potete triggerarlo da un'automazione, uno script, un tag NFC, o un bot Telegram. L'entità button è solo un'entità HA come qualsiasi altra.

Il file templates completo è nel repository di accompagnamento a [`templates/arlo_buttons.yaml`](https://github.com/mmornati/arlo-base-station/blob/main/home-assistant/templates/arlo_buttons.yaml).

## Il pannello Cameras Lovelace

La dashboard è costruita sulla card picture-entity standard, la card glance standard, la card entities standard, e le card input-select / input-number standard. Nessuna card custom è richiesta. La vista è chiamata "Cameras" nella barra laterale.

La vista è disposta come uno stack verticale con una riga per telecamera. La cima della vista ha i controlli globali (selettore di modalità, slider di intervallo). Ogni riga ha, da sinistra a destra:

1. Una **card `picture-entity`** per la telecamera. Il `camera_view: auto` (default) mostra l'immagine fissa da `arlo-snapshot` di default. Tap o clic sulla card e HA apre il flusso RTSP tramite MediaMTX (`rtsp://192.168.1.48:8554/cam1` per Jardin 1, `cam2` per Jardin 2, `cam3` per Portail, `cam4` per Entrée). Navigate via e lo stream si chiude automaticamente. Le entità telecamera sono `camera.garden_arlo_jardin_1`, `camera.garden_arlo_jardin_2`, `camera.garden_arlo_portail`, e `camera.garden_arlo_entree` — il prefisso `garden_arlo_` è il namespace che l'integrazione `generic` usa di default.
2. Una **card glance** con quattro entità: percentuale di batteria (`sensor.arlo_<cam>_status` con `device_class: battery`), WiFi RSSI (`sensor.<cam>_wifi_rssi`), temperatura (`sensor.<cam>_temperature`), e stato di carica (`sensor.<cam>_charging`). La card glance mette una piccola icona e il valore su una riga, quindi tutti e quattro entrano in una singola striscia orizzontale.
3. Una **riga di switch** con due mapping `switch.toggle` — uno per `input_boolean.camera_<cam>_armed` (l'icona scudo) e uno per `input_boolean.camera_<cam>_led` (l'icona LED). Il mapping avviene tramite la piattaforma template `switch.toggle`; l'input_boolean è la source of truth, e la UI del toggle è solo una finestra su di essa.
4. La **button-card** della sezione precedente (`button.arlo_wake_<cam>`). La press-action fa la pipeline wake-then-snapshot.
5. Una **riga di entità badge** per i tre binary_sensor: Spotlight (`binary_sensor.<cam>_spotlight`), Critical Battery (`binary_sensor.<cam>_critical_battery`), PIR LED (`binary_sensor.<cam>_led`). I `device_class: light` e `device_class: battery` dei binary_sensor danno loro le icone di default corrette.

La cima della vista ha due card extra:

- **`input_select.arlo_wake_mode`** — il selettore di modalità. Tre opzioni: `off`, `periodic`, `on-demand`. Il default è `periodic`.
- **`input_number.arlo_wake_interval_minutes`** — lo slider di intervallo. Range 1–60, default 15. Influenza la cadenza di wake periodico.

L'intera vista è circa 5 righe verticali di card su un browser desktop e 4–5 swipe su un telefono. Le quattro telecamere sono disposte da sinistra a destra su uno schermo largo e impilate verticalmente su un telefono. Le card si ridimensionano automaticamente; nessuna configurazione di media-query è richiesta.

La vista è raggiungibile tramite la barra laterale HA principale — l'entry "Cameras" — e le quattro righe di telecamera sono visibili a colpo d'occhio. Non c'è una vista nidificata, nessun modal, nessun pop-over. L'intero blocco è su un solo schermo.

## UX d'uso quotidiano

Una volta che la dashboard è costruita, il loop di interazione utente è corto e prevedibile:

- **Selettore Wake Mode in cima al pannello Cameras.** `off` (nessun auto-wake, le telecamere dormono finché non le triggerate), `periodic` (ogni 15 minuti, il default), `on-demand` (wake solo quando la card Lovelace è in fase di visualizzazione). In vacanza, passate a `off` e affidatevi alle automazioni PIR. In un giorno normale, lasciate su `periodic`.
- **Un evento PIR innesca un wake + snapshot immediato.** Le automazioni `arlo_wake_on_pir_<cam>` scattano ogni volta che il contatore PIR della telecamera si incrementa. Modalità `off` → nessun wake. Qualsiasi altra modalità → wake, poi 6 s dopo un JPEG fresco è nello store in memoria del sidecar. La card Lovelace raccoglie la nuova immagine al prossimo tick di refresh.
- **Wake manuale tramite la button-card.** Tap sulla tile "Arlo Wake" per la telecamera che volete. Il pulsante pulsa per ~16 secondi. Un JPEG fresco appare nella card della telecamera. La stessa pipeline gira sia che l'abbiate triggerata dalla dashboard o da un bot Telegram.
- **Arm/Disarm tramite gli switch toggle.** Il toggle `input_boolean.camera_<cam>_armed` sulla dashboard. Toggle off → il comando REST ARM parte con `arm: false` → il PIRTargetState della telecamera passa a `Disarmed`. Toggle on → il comando REST ARM parte con `arm: true` → il PIRTargetState della telecamera passa a `Armed`. L'intero round-trip richiede ~30 ms.
- **Toggle LED PIR.** Stesso pattern di arm/disarm. Il toggle `input_boolean.camera_<cam>_led`, l'automazione `camera_<cam>_led_sync`, il POST `rest_command.camera_<cam>_led`. Il LED sulla parte frontale della telecamera si accende quando il toggle è on.

La cadenza periodica di 15 minuti è il cavallo di battaglia. Tiene le telecamere su un ciclo di wake prevedibile così che la connessione RTSP riesca in ~2 secondi quando tappate sulla card della telecamera. Senza di essa, il primo tentativo RTSP dopo un lungo sonno richiederebbe i 10–14 secondi completi del wake della telecamera, che sembra una pagina congelata.

La modalità periodica è anche la ragione per cui l'integrazione funziona bene durante le demo. Se mostrate la dashboard a qualcuno e lui tappa su una telecamera, il wake è già in volo dall'ultimo tick periodico, quindi lo stream si apre in ~2 secondi. L'esperienza "feels instant" dell'app Arlo è principalmente il wake periodico.

## Limitazioni e cosa viene dopo

Restano alcuni rough edge:

- **Nessun CVR.** La registrazione video continua è una feature cloud-only. Il setup locale vi dà snapshot on-demand e RTSP on-demand; non vi dà una timeline 24/7. Per quello vi servirebbe un registratore separato (es. Frigate) e anche allora, l'emulatore locale manca lo storico eventi `MotionStreamed` che vi permetterebbe di riavvolgere.
- **Nessuna rilevazione AI.** Il sensore PIR scatta su qualsiasi movimento — foglie, fari, ombre. Il cloud Arlo originale ha allarmi intelligenti (persona, veicolo, pacco, animale) che filtrano il rumore. Riprodurlo localmente richiederebbe una pipeline CV (Frigate + Coral, o una API remota), che è fuori scope per questo progetto.
- **`userstreamactive` non persiste attraverso i restart di `arlo-cam-api`.** Quando l'emulatore della stazione base riparte, lo stato in memoria di quali telecamere avevano un user stream attivo è perso. Le telecamere recuperano da sole (rilevano la disconnessione TCP e si ri-registrano), ma la prima chiamata `userstreamactive` dopo un restart è più lenta perché il server RTSP deve avviarsi a freddo.
- **Nessuna configurazione di zona di movimento via API.** Le zone di attività sono una feature cloud-only sul firmware Arlo ufficiale. Configurarle richiede l'app Arlo, il che vanifica lo scopo dell'auto-hosting. Un'implementazione di stazione base custom potrebbe in linea di principio spingere definizioni di zona verso la telecamera, ma il protocollo non è documentato.
- **Nessun proxy di thumbnail per le registrazioni.** Le registrazioni sono salvate in `/recordings` come segmenti video grezzi; non c'è API per recuperare un thumbnail a `t=10s` per una data registrazione. Per ora prendo semplicemente uno snapshot fresco tramite `arlo-snapshot` quando voglio uno still.
- **I sensori di batteria legacy `aarlo` sono ancora utili ma un po' fragili.** Dipendono dalla cache retrocompatibile dei valori di batteria che Arlo mantiene lato cloud. Se Arlo dovesse ritirare quella cache, le quattro entità `sensor.aarlo_battery_level_*` andranno a `unavailable` e le notifiche push mobili si fermeranno. I nuovi sensori REST in `sensor.arlo_<cam>_status` sono il fallback — espongono lo stesso attributo `BatPercent` e sono indipendenti dal cloud Arlo.

Nessuna di queste è un blocker. Sono nice-to-have a cui arriverò quando ci arrivo.

## Chiusura della serie

Questo è il terzo e ultimo articolo della serie. Dal [livello di rete nel Post 1](/it/sostituire-la-stazione-base-arlo-con-un-router-netgear-orbi/), attraverso i [servizi e le PR upstream nel Post 2](/it/auto-ospitare-arlo-cam-api-correzioni-e-miglioramenti/), fino all'integrazione Home Assistant in questo post, avete ora una sostituzione open-source completa per la stazione base Arlo proprietaria. Ogni pezzo gira sul vostro hardware, ogni riga di configurazione è in version control, ogni contributo upstream è documentato, e l'unico costo ricorrente è l'elettricità per far girare il mini PC.

Il repository di accompagnamento su [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) contiene ogni file referenziato nei tre post, con le copie di produzione, le patch, il docker-compose, e lo YAML Home Assistant in un unico posto. Forkatelo, inviate PR, aprite issue, e ditemi cosa funziona per voi.

Grazie per aver letto.

## Leggi il resto della serie

- [Post 1 — Networking & Gateway Hack](/it/sostituire-la-stazione-base-arlo-con-un-router-netgear-orbi/)
- [Post 2 — Services & upstream PRs](/it/auto-ospitare-arlo-cam-api-correzioni-e-miglioramenti/)
- [Repository di accompagnamento](https://github.com/mmornati/arlo-base-station)
