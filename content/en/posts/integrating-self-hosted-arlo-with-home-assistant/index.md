---
title: 'Integrating Your Self-Hosted Arlo Stack with Home Assistant: Sensors, Automations and the Lovelace Dashboard'
tags:
- home-assistant
- arlo
- home-automation
- smart-home
- lovelace
- automation
- cameras
- rest
- iot
date: '2026-08-17T12:00:00.000000+00:00'
slug: integrating-self-hosted-arlo-with-home-assistant
translationKey: arlo-home-assistant-integration
categories:
- Smart Home
- DIY
- Home Assistant
description: 'How to wire your self-hosted Arlo basestation emulator (arlo-cam-api + arlo-snapshot + mediamtx) into Home Assistant using REST sensors, template sensors, binary_sensors, automations, input_booleans and a Lovelace Cameras dashboard — all without relying on the deprecated pyaarlo/aarlo integrations.'
cover: cover.jpg
showHero: true
---

This is Post 3 — the final one — of a three-part series on replacing the proprietary Arlo base station with a self-hosted stack. In [Post 1 of this series](/replacing-arlo-base-station-with-a-netgear-orbi-router/) I covered the networking layer: how to make a Netgear Orbi RBR760 impersonate the Arlo base station well enough that the cameras connect, register, and keep streaming. In [Post 2 of this series](/self-hosting-arlo-cam-api-patches-and-improvements/) I covered the server layer: the `arlo-cam-api` Docker stack, the `arlo-snapshot` on-demand sidecar, the on-demand RTSP relay via MediaMTX, and the three upstream pull requests I contributed to fix the bugs I hit on the way.

In this post I cover the *Home Assistant* layer — how the four cameras become first-class entities in HA, how a single `input_select` lets you trade battery life for instant presence, and how the Lovelace dashboard ends up looking almost exactly like the Arlo app, except every line is under your control. The companion repository at [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) holds every config file and patch mentioned here.

Here is the architecture we are sitting on top of by the end of this post. The drawing is the same one from Post 1; the dashed arrow is the new piece — the REST polling that HA runs against `/device/<serial>` on port 5000.

```
                            WAN
                             │
                  ┌──────────▼──────────┐
                  │  Netgear Orbi RBR760│  guest isolation
                  │  172.14.1.1 (Arlo)  │◀──── 4x Arlo VMC4040P (192.168.2.x)
                  │  192.168.1.x (LAN)  │           WiFi guest, isolated
                  └──────────┬──────────┘
                             │ DNAT tcp/4000
                  ┌──────────▼──────────┐
                  │  Server (mini PC)   │
                  │  192.168.1.48       │
                  │                     │
                  │  ┌───────────────┐  │  :5000 REST ───┐ HA polling
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
          │  4 REST sensors│
          │  4 cameras     │
          │  9 automations │
          │  4 button-cards│
          │  Lovelace UI   │
          └────────────────┘
```

> **A note on redaction.** As in Posts 1 and 2, real camera serial numbers, MAC addresses, and the production LAN IP of the server have been replaced with `XXXXXXXXXXXX` and a generic placeholder. The well-known `172.14.1.1` Arlo gateway value is kept because it is part of the wire protocol. The guest subnet `192.168.2.x` (where the cameras live on the Orbi) is left as-is because it is the standard Orbi default and reveals nothing specific.

## Why REST Sensors (and Not `pyaarlo` / `aarlo`)

If you have ever wired Arlo cameras into Home Assistant before, you almost certainly went through `pyaarlo` — the unofficial Python Arlo client — and the `aarlo` Home Assistant integration on top of it. `aarlo` has been the de facto path for years. It exposes battery, signal, motion, sound, doorbell presses, last-capture, recent activity, and a `camera.<name>` entity per camera through one friendly config flow.

I kept `aarlo` installed on this deployment. It is still doing useful work: the four `sensor.aarlo_battery_level_*` entities are the ones whose values trigger the mobile push notifications I've had on my phone for the past three years. During the migration, when I rebooted the server, or the cameras went offline, or I was testing a new PR, those push notifications were the early-warning signal that something was wrong. For now they stay.

But every other entity — every sensor, every camera, every arm/disarm switch, every PIR LED toggle — is 100% REST. Here is the entire `aarlo.yaml` configuration file:

```yaml
version: 1
aarlo:
  backend: sse
```

Three lines. The `backend: sse` is an SSE backend mode that lets `aarlo` keep the existing entities without doing the heavy lifting of maintaining a session — because the cameras are no longer registered with the Arlo cloud at all. The cloud-facing `aarlo` entities still try to run, and they happily report `unavailable` for everything except the four battery sensors we keep around. The four battery sensors come from the camera's own `BatPercent` field, which is exposed on the cloud via a separate cache that Arlo keeps for backwards compatibility; `aarlo` polls that cache and surfaces it.

The `customize.yaml` entry for each one keeps the auto-generated battery-card from creating a duplicate:

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

That's it. Three lines of `aarlo` config and four `customize` entries. Everything else is REST.

The reason for the divorce is simple: `aarlo` was never designed for cameras that don't talk to the Arlo cloud. Its `camera.aarlo_*` entity assumes the standard Arlo cloud stream mechanism, which the local emulator doesn't implement. Its `binary_sensor.aarlo_motion_*` and `binary_sensor.aarlo_sound_*` come from the same cloud feed. Its `switch.aarlo_siren_*` and `switch.aarlo_snapshot_*` are cloud actions. None of those work when the cameras are happily chatting with `arlo-cam-api` on `192.168.1.48:4000` and have never heard of `arlo-api.arlo.com`.

The REST sensor layer is also more flexible. You decide the polling interval per sensor. You decide how to derive binary sensors. You decide which attribute becomes a device-class-battery card and which becomes a glance row. And you get the full 25-field status document from `/device/<serial>` for free, which `aarlo` would never expose.

## The REST Sensor Layer

The whole package is in `packages/arlo_cameras.yaml`. The first block is the four REST sensors — one per camera. Here is the full block for the first camera (`Jardin 1`); the other three are identical except for the serial and the friendly name:

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

Four cameras, four sensors, four copy-paste blocks. The polling interval is `scan_interval: 300` (5 minutes), which is the right frequency for battery — battery percentage does not change measurably inside a 5-minute window on a healthy solar panel. The `value_template` extracts `BatPercent` from the JSON body and converts it to int with a default of `-1` for the case where the camera is offline (the API returns an empty body when the device is unknown to the server, and `int(-1)` makes the resulting state a recognizable sentinel that I can route on in templates — anything negative means "no data", positive means "real value").

The `json_attributes` block is the magic that makes the rest of the integration cheap. Every field returned by `GET /device/<serial>` lands in the sensor's attributes (the full field table is in Post 2 §8). Twenty-five attributes per camera, four cameras, all visible from the Developer Tools → States panel. The `device_class: battery` makes the main state show up as a battery icon in any card that knows how to render it.

The four sensors are named consistently: `Arlo Jardin 1 Status`, `Arlo Jardin 2 Status`, `Arlo Portail Status`, `Arlo Entree Status`. The match between the friendly name and the actual location of the camera (Jardin 1, Jardin 2, Portail, Entrée) is what makes the dashboard readable without a glossary.

> **Why four sensors and not one with a `select` attribute?** Because Home Assistant's `template` platform expects one sensor per attribute. If you put all 25 attributes on one sensor, you have to write 25 helpers that read from it. If you split per camera, you get 4 × 25 attributes that you can re-derive into 4 × 15 friendly template sensors — and the per-camera namespacing keeps the rest of the YAML readable.

## The `template:` Derived Sensors

The raw REST sensor exposes 25 attributes per camera. HA's card UI does not pick those up automatically — you have to materialise each as its own sensor if you want a glance row, a battery icon, or a unit-of-measurement-aware sparkline. The `template:` block in `packages/arlo_cameras.yaml` derives 15 friendly sensors per camera, all read from the corresponding `sensor.arlo_*_status` via `state_attr()`.

Here is the `Jardin 1` block. The other three cameras follow the same pattern with their name and serial:

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

Fifteen sensors per camera. Four cameras. Sixty template sensors total. The `unique_id` is the key — without it, HA complains about "duplicate entity IDs" when you rename or reload the package. The `state_class: measurement` on the temperature, RSSI, and voltage sensors is what makes the long-term statistics engine plot them on the History panel.

The `int(-99)` and `int(-100)` defaults on the temperature and RSSI template sensors are sentinel values for "no data". I picked them deliberately so that on a freshly-rebooted HA, the dashboard shows `-99 °C` rather than `unknown` for a couple of minutes until the first polling cycle hits. The badge icons know what to do with `-99` (red badge) and the eye learns to ignore it.

The other three cameras are identical. The full block is in the companion repo at [`packages/arlo_cameras.yaml`](https://github.com/mmornati/arlo-base-station/blob/main/home-assistant/packages/arlo_cameras.yaml.example).

## The `binary_sensor:` Layer

Three binary sensors per camera, derived from the same status document. Spotlight state, critical battery flag, and the PIR LED state (which is interesting because it mirrors the `input_boolean.camera_*_led` rather than the camera attribute — the LED is a toggle surface, not a sensor). Here is the `Jardin 1` block:

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

The Spotlight binary is a pure read from the camera's attribute. The Critical Battery binary is the same — `CriticalBatStatus` is a non-zero integer when the camera has flagged the battery as critical, so a `> 0` comparison turns it into a clean boolean. The LED binary is the only one that is *not* a pure read — it mirrors the `input_boolean.camera_jardin_1_led` state. That is the desired UX: the toggle on the dashboard is the source of truth, and the binary sensor just reflects it.

`device_class: light` on the Spotlight and LED binary sensors is what lets them show up as `light` domain tiles if you ever want to add them to a lights card. `device_class: battery` on the Critical Battery sensor makes the History panel colour-code them red and trigger an event log entry.

## The `input_boolean` + `rest_command` + Automation Trinity

This is the symmetric pattern that makes arm/disarm and LED control reliable. The same shape repeats: an `input_boolean` (the user-facing toggle in HA), a `rest_command` (the HTTP POST that lands on the camera), and a single automation that listens to the boolean and fires the POST. Eight `rest_command`s in total — two per camera.

Here are the four `*_arm` commands:

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

The payload is worth pausing on. The `arlo-cam-api` basestation endpoint accepts the Arlo wire-protocol body verbatim, which means the key is `PIRTargetState` (camelCase, exactly as the camera sends it) and the value is `"Armed"` or `"Disarmed"` (capitalised, exactly as the camera expects). The `{{ ... }}` template is a Jinja2 expression that gets rendered with the `arm` argument supplied by the caller. The caller here is the sync automation, which passes `arm: true` or `arm: false` from the `input_boolean` state — `true` becomes `"Armed"`, `false` becomes `"Disarmed"`.

The four `*_led` commands follow the same shape but with a different payload:

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

The `| lower` filter ensures that `true` and `false` get serialised as JSON booleans rather than the strings `"True"` and `"False"`. Without it, the `arlo-cam-api` JSON parser rejects the body with a 400. The `sensitivity: 80` is hard-coded — the API field is 0–100 and 80 is the sweet spot between "PIR triggers on every leaf" and "PIR only triggers on a truck". If you want to expose it as a slider, the `rest_command` payload becomes `'"sensitivity": {{ sensitivity }}'` and the automation passes the value from a `input_number`.

The four input_booleans per camera that drive the automation are in `packages/arlo_cameras.yaml`:

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

The same pattern repeats for `camera_jardin_1_armed`, `camera_jardin_1_led`, `camera_jardin_2_armed`, `camera_jardin_2_led` — eight input_booleans total, two per camera.

The sync automations for the *Portail* and *Entrée* cameras live in `automations.yaml` (the legacy file in this deployment). The *Jardin 1* and *Jardin 2* camera sync automations are in the companion repo at [`home-assistant/automations/arlo_sync.yaml`](https://github.com/mmornati/arlo-base-station/blob/main/home-assistant/automations/arlo_sync.yaml). Here is the *Portail* arm sync as a representative example:

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

The LED sync has the same shape with `led: true` / `false` instead of `arm`. Four automations, eight `rest_command` invocations, eight toggles total. The whole loop from "user clicks the toggle in HA" to "camera's PIR state changes" is about 30 ms on the LAN because nothing has to round-trip through the Arlo cloud.

## The `arlo_wake` Machinery — The Battery-Life Hack

This is the most important piece of the integration, and the one that decides whether the camera fleet lasts two weeks or two months on a single solar charge. The mirror of the Arlo app's UX where every camera is "always there" is exactly what drains the batteries. The reality with custom RTSP is that the camera's RTSP port is closed by default, and waking it up costs 10–14 seconds and a non-trivial amount of battery. You only want to wake it when something is actually happening.

The `arlo_wake` package in `packages/arlo_wake.yaml` solves this with three components: a mode selector, an interval input, and a script that performs the wake-then-snapshot pipeline. Then nine automations route the wake triggers based on the mode.

### The mode selector

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

Three modes:

- **`off`** — no automatic wake. The cameras sleep until one of the manual triggers fires (PIR alert via `arlo-cam-api` webhooks, or a button press). Best for long absences.
- **`periodic`** *(default)* — the `arlo_wake_periodic` automation fires every 15 minutes (`time_pattern: minutes: "/15"`) and runs the full wake-then-snapshot pipeline for all four cameras. This keeps the cameras warm enough that any RTSP connection attempt succeeds within a couple of seconds. The 15-minute interval is a balance: shorter is friendlier to real-time RTSP, longer is friendlier to battery.
- **`on-demand`** — the four `arlo_wake_on_view_<cam>` automations fire when the HA camera entity transitions from `idle` to `streaming`. HA only attempts to transition to `streaming` when the Lovelace card is being viewed, so the wake happens exactly when the user is looking. Best for live dashboards; worst for snap-decision alerts.

The `arlo_wake_interval_minutes` `input_number` lets you push the periodic interval up to 60 minutes (great for vacation) or down to 1 minute (great for demos and live debugging). The nine automations all reference it via `states('input_number.arlo_wake_interval_minutes')` (or, in the periodic case, the implicit 15-min rate).

### The wake REST commands

Four `*_wake_*` commands, one per camera. They POST `{"active": true, "duration": 1800}` to `/device/<serial>/userstreamactive` with an 8-second timeout — long enough that a slow camera wake still succeeds, short enough that an unresponsive camera does not block the script:

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

The `duration: 1800` field is the minutes-to-keep-streaming-open hint. The basestation emulator stores this in memory and the camera's RTSP port stays open for 30 minutes after the last successful wake. After 30 minutes of no clients, the camera goes back to sleep on its own — exactly the on-demand property from MediaMTX in Post 2.

The `*_snapshot_*` commands are the same idea, but for the `arlo-snapshot` sidecar:

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

The 30-second timeout covers the worst case: the camera is fully asleep, the `userstreamactive` POST has to wake it up (10–14 s), the sidecar has to open the RTSP stream (3–5 s), AV has to decode a frame (1–2 s), and the encoder has to write a JPEG (sub-second). 30 s is comfortable.

### The `script.arlo_wake_all` pipeline

The whole pipeline is one script. The structure is *parallel wake → 6-second delay → parallel snapshot*. The 6-second delay is the magic number — it matches `STREAM_WARMUP_SEC=6` in `arlo-snapshot`'s environment (Post 2), and it is the time the camera needs after the wake POST before the RTSP port is actually reachable:

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

The four wake POSTs run in parallel. The 6-second delay is essential — without it, the snapshot POSTs would race the wakes and most of them would time out. The four snapshot POSTs also run in parallel. Total time: 6 s + (max camera wake time) ≈ 16 s. Four cameras, four fresh JPEG snapshots, ready for the Lovelace cards to pick up.

### The nine automations

The periodic wake is the simplest:

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

The `time_pattern: minutes: "/15"` means every 15 minutes (the leading `/` is HA's "every N" syntax). The condition gates the action on the mode being `periodic`. If the mode is `off` or `on-demand`, the automation does nothing.

The four `*_on_view_*` automations fire when the HA camera entity transitions from `idle` to `streaming`. That transition happens when the Lovelace card is being viewed and HA is trying to open the RTSP stream. The gateway to the wake is the same REST command, but the action is the single-camera wake, not the full script:

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

The four `*_on_view_*` automations (one per camera) are identical in shape: they watch `camera.garden_arlo_<cam>`, gate on `on-demand`, and fire the matching `rest_command.arlo_wake_<cam>`.

The four `*_on_pir_*` automations are the always-on piece. They watch the `*_pir_triggers` template sensor — which is the camera's own PIR counter from `/device/<serial>` — and fire whenever the counter increments. The `above: "{{ states('sensor.arlo_jardin_1_pir_triggers') | int(0) }}"` template is the standard "any increment" trigger, and the condition gates on the mode being *not* `off`:

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

The result: in `off` mode, the cameras sleep until you manually trigger something. In `on-demand` mode, they wake when you look at the Lovelace card. In `periodic` mode, they wake on a 15-minute cadence AND on PIR triggers. The mode selector is the single dial that lets you decide how aggressively the cameras stay warm.

The full `arlo_wake.yaml` package is in the companion repo at [`packages/arlo_wake.yaml`](https://github.com/mmornati/arlo-base-station/blob/main/home-assistant/packages/arlo_wake.yaml).

## The Button-Card Templates

The button-card templates in `templates/buttons.yaml` are the manual-wake surface. One button per camera, each with a press-action that does the same wake-then-snapshot pipeline as the script, but for one camera at a time:

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

The four button entities (`button.arlo_wake_jardin_1`, etc.) are surfaced on the Lovelace Cameras panel as the "Arlo Wake" tiles. Tap → wake → 6-second pause → fresh JPEG snapshot. The tile pulses for the duration of the wake, then settles with the new image. The user sees a real-time "wake + grab still" action that costs roughly 16 seconds of wall time and a 30-second RTSP session on the camera.

The button-card template is also the easiest way to surface the wake mechanism outside the dashboard — you can fire it from an automation, a script, an NFC tag, or a Telegram bot. The button entity is just a HA entity like any other.

The full templates file is in the companion repo at [`templates/arlo_buttons.yaml`](https://github.com/mmornati/arlo-base-station/blob/main/home-assistant/templates/arlo_buttons.yaml).

## The Lovelace Cameras Panel

The dashboard is built on the standard picture-entity card, the standard glance card, the standard entities card, and the standard input-select / input-number cards. No custom card is required. The view is named "Cameras" in the sidebar.

The view is arranged as a vertical stack with one row per camera. The top of the view has the global controls (mode selector, interval slider). Each row has, from left to right:

1. A **`picture-entity` card** for the camera. The `camera_view: auto` (default) shows the still image from `arlo-snapshot` by default. Tap or click the card and HA opens the RTSP stream via MediaMTX (`rtsp://192.168.1.48:8554/cam1` for Jardin 1, `cam2` for Jardin 2, `cam3` for Portail, `cam4` for Entrée). Navigate away and the stream tears down automatically. The camera entities are `camera.garden_arlo_jardin_1`, `camera.garden_arlo_jardin_2`, `camera.garden_arlo_portail`, and `camera.garden_arlo_entree` — the `garden_arlo_` prefix is the namespace the `generic` camera integration uses by default.
2. A **glance card** with four entities: battery percentage (`sensor.arlo_<cam>_status` with `device_class: battery`), WiFi RSSI (`sensor.<cam>_wifi_rssi`), temperature (`sensor.<cam>_temperature`), and the charging state (`sensor.<cam>_charging`). The glance card puts a small icon and the value on one row, so all four fit on a single horizontal strip.
3. A **switches row** with two `switch.toggle` mappings — one for the `input_boolean.camera_<cam>_armed` (the shield icon) and one for the `input_boolean.camera_<cam>_led` (the LED icon). The mapping is via the `switch.toggle` template platform; the input_boolean is the source of truth, and the toggle UI is just a window onto it.
4. The **button-card** from the previous section (`button.arlo_wake_<cam>`). The press-action does the wake-then-snapshot pipeline.
5. A **row of badge entities** for the three binary sensors: Spotlight (`binary_sensor.<cam>_spotlight`), Critical Battery (`binary_sensor.<cam>_critical_battery`), PIR LED (`binary_sensor.<cam>_led`). The `device_class: light` and `device_class: battery` from the binary sensors give them the right default icons.

The top of the view has two extra cards:

- **`input_select.arlo_wake_mode`** — the mode selector. Three options: `off`, `periodic`, `on-demand`. Default is `periodic`.
- **`input_number.arlo_wake_interval_minutes`** — the interval slider. Range 1–60, default 15. Affects the periodic wake cadence.

The whole view is about 5 vertical rows of cards on a desktop browser and 4–5 swipes on a phone. The four cameras are laid out left-to-right on a wide screen and stacked vertically on a phone. The cards resize automatically; no media-query configuration is required.

The view is reached via the main HA sidebar — the "Cameras" entry — and the four camera rows are visible at a glance. There is no nested view, no modal, no pop-over. The whole pile is one screen.

## Daily-Use UX

Once the dashboard is built, the user interaction loop is short and predictable:

- **Wake Mode selector at the top of the Cameras panel.** `off` (no auto-wake, cameras sleep until you trigger them), `periodic` (every 15 minutes, the default), `on-demand` (wake only when the Lovelace card is being viewed). On vacation, set it to `off` and rely on the PIR automations. On a normal day, leave it on `periodic`.
- **PIR event triggers an immediate wake + snapshot.** The `arlo_wake_on_pir_<cam>` automations fire whenever the camera's PIR counter increments. Mode is `off` → no wake. Anything else → wake, then 6 s later a fresh JPEG is in the sidecar's in-memory store. The Lovelace card picks up the new image on the next refresh tick.
- **Manual wake via the button-card.** Tap the "Arlo Wake" tile for the camera you want. The button pulses for ~16 seconds. A fresh JPEG appears in the camera card. The same pipeline runs whether you triggered it from the dashboard or from a Telegram bot.
- **Arm/Disarm via the toggle switches.** The `input_boolean.camera_<cam>_armed` toggle on the dashboard. Toggle off → ARM rest command fires with `arm: false` → camera's PIRTargetState goes to `Disarmed`. Toggle on → ARM rest command fires with `arm: true` → camera's PIRTargetState goes to `Armed`. The whole round-trip is ~30 ms.
- **PIR LED toggle.** Same pattern as arm/disarm. The `input_boolean.camera_<cam>_led` toggle, the `camera_<cam>_led_sync` automation, the `rest_command.camera_<cam>_led` POST. The LED on the front of the camera lights up when the toggle is on.

The 15-minute periodic cadence is the workhorse. It keeps the cameras on a predictable wake cycle so the RTSP connection succeeds within ~2 seconds when you tap the camera card. Without it, the first RTSP attempt after a long sleep would take the full 10–14 seconds of camera wake-up time, which feels like a frozen page.

The periodic mode is also the reason the integration works well during demos. If you show the dashboard to someone and they tap a camera, the wake is already in flight from the last periodic tick, so the stream opens in ~2 seconds. The "feels instant" experience of the Arlo app is mostly the periodic wake.

## Limitations and What's Next

A few rough edges remain:

- **No CVR.** Continuous video recording is a cloud-only feature. The local setup gives you on-demand snapshots and on-demand RTSP; it does not give you a 24/7 timeline. For that you would need a separate recorder (e.g. Frigate) and even then, the local emulator lacks the `MotionStreamed` event history that would let you rewind.
- **No AI detection.** The PIR sensor triggers on any motion — leaves, headlights, shadows. The original Arlo cloud has smart alerts (person, vehicle, package, animal) that filter out the noise. Reproducing that locally would require a CV pipeline (Frigate + Coral, or a remote API), which is out of scope for this project.
- **`userstreamactive` does not persist across `arlo-cam-api` restarts.** When the basestation emulator restarts, the in-memory state of which cameras had a user stream active is lost. The cameras recover on their own (they detect the TCP disconnect and re-register), but the first `userstreamactive` call after a restart is slower because the RTSP server has to come up from scratch.
- **No motion-zone configuration via API.** Activity zones are a cloud-only feature on the official Arlo firmware. Configuring them requires the Arlo app, which defeats the purpose of self-hosting. A custom basestation implementation could in principle push zone definitions to the camera, but the protocol is undocumented.
- **No thumbnail proxy for recordings.** Recordings are saved to `/recordings` as raw video segments; there is no API to fetch a thumbnail at `t=10s` for a given recording. For now I just take a fresh snapshot via `arlo-snapshot` when I want a still.
- **`aarlo` legacy battery sensors are still useful but a bit fragile.** They depend on the Arlo cloud keeping a backward-compatible cache of the battery values. If Arlo ever retires that cache, the four `sensor.aarlo_battery_level_*` entities will go to `unavailable` and the mobile push notifications will stop. The new REST sensors in `sensor.arlo_<cam>_status` are the fallback — they expose the same `BatPercent` attribute and are independent of the Arlo cloud.

None of these are blockers. They are nice-to-haves that I will get to when I get to them.

## Series Close

This is the third and final post in the series. From the [networking layer in Post 1](/replacing-arlo-base-station-with-a-netgear-orbi-router/), through the [services and upstream PRs in Post 2](/self-hosting-arlo-cam-api-patches-and-improvements/), to the Home Assistant integration in this post, you now have a full open-source replacement for the proprietary Arlo base station. Every piece runs on your own hardware, every line of configuration is in version control, every upstream contribution is documented, and the only ongoing cost is the electricity to run the mini PC.

The companion repo at [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) holds every file referenced in all three posts, with the production copies, the patches, the docker-compose, and the Home Assistant YAML in one place. Fork it, send PRs, file issues, and tell me what works for you.

Thanks for reading.

## Read the Rest of the Series

- [Post 1 — Networking & Gateway Hack](/replacing-arlo-base-station-with-a-netgear-orbi-router/)
- [Post 2 — Services & upstream PRs](/self-hosting-arlo-cam-api-patches-and-improvements/)
- [Companion repository](https://github.com/mmornati/arlo-base-station)
