---
title: 'The Smart Water Heater, 4 Years Later: Solar + Off-Peak Orchestration (v2)'
date: '2026-08-24T09:00:00.000000+00:00'
slug: smart-water-heater-orchestration-solar-off-peak-v2
translationKey: smart-water-heater-orchestration-solar-off-peak-v2
categories:
- Home Assistant
- Smart Home
- DIY
tags:
- home-assistant
- smart-home
- energy
- solar
- automation
- water-heater
description: 'Four years after my first Shelly-based water heater automation, here is what changed: thermostat-based completion detection, solar-first peak-hour heating, and a capped "smart night" cycle.'
summary: 'Two water heaters on a Heures Creuses tariff, 12 panels and no battery - the v2 of my water heater orchestration, with real YAML and real numbers.'
cover: cover.jpg
showHero: true
---

Four years ago I [replaced the dumb night timers on my two water heaters with a Shelly Plus 1 and Home Assistant](/smart-water-heater-with-home-assistant-and-shelly-device/). It was a solid first step: turn the heaters on when the off-peak ("Heures Creuses", HC) window opens, and skip them when we are away. When the solar panels arrived, I described the whole midday-window dance inside the [two-years-of-solar post](/two-years-of-solar-the-real-numbers-and-roi/).

Since then the system has quietly evolved. Not a rewrite, an orchestration. This post is the **v2, four years later**: what I changed, the actual YAML, and the real numbers.

> **Honest rollout note first.** The v2 logic below is in my config and being rolled in. My live instance still runs the v1 flag-based automations - I checked before writing, and I will tell you exactly what is live and what is on the way.

**Disclaimer:** I am not an installer or an electrician. Water heaters and electrical work can be dangerous; these are field notes from my own house, not instructions for yours.

## TL;DR - what changed vs. the 2022 version

| Capability | v1 (2022) | v2 (now) |
|---|---|---|
| End-of-cycle detection | Guessed at 14:09 ("still drawing power?") | Thermostat detection: power to 0 -> cycle complete |
| Peak-hour (HP) behaviour | Always off during HP | Solar-first: resume in HP only if surplus covers the heater |
| Night cycle | Fixed 2 h completion | Smart night with a cap (heating minutes capped) |
| Forcing a full night | Vacation boolean only | `force_cumulus_hc` toggle + `force_cumulus_nigh` automation |
| Notifications | Basic | Cycle finished, HP-solar resume/abort, night reports |

---

## Context: two heaters, one relay, a tariff, solar

- **Two electric water heaters (cumulus)**: one in the cellar (larger tank), one in the garage (smaller). Each is switched by its own **Shelly Plus 1** relay and metered through a **Shelly EM** energy meter, each heater on its own CT channel (`sensor.energy_meter_cumulus_cave_power`, `sensor.energy_meter_cumulus_garage_power`).
- **HC tariff (EDF-ish, northern France)**: a midday window (12:09 to 14:09) and a night window. Electricity is cheaper in HC — that is when the heaters should run.
- **Solar**: 12 panels, 3 APS DS3 micro-inverters, **no battery**. The water heaters are the only elastic load big enough to absorb the surplus.
- **The tension**: the midday HC window (12:00–14:00) is the only time HC and solar overlap. Everything else is scheduling plus watching.

---

## v1 recap (the short version)

The 2022 version was simple and effective:
1. **Schedule** — `automation.cumulus_cave_actives_en_hc` turns the heaters on when the HC window opens (12:09 cave, 13:00 garage, still live today).
2. **Vacation detection** — skip heating when the `input_boolean.vacation` toggle is on.
3. **Night completion** — a fixed 2 h night run if the day window "probably" wasn't enough.

The weakness was step 3: "probably" is a guess. The old `set_heating_incomplete_flag_cave` / `set_heating_incomplete_flag_garage` automations fired at 14:09 and set the `water_heating_incomplete_*` flag whenever the heater was *still drawing power* at that moment. It says nothing about the tank's real state — a heater can be almost done or barely started, and it behaves the same. This guesswork was acceptable for 4 years, but once solar entered the picture the crude assumption started costing money. So this summer I replaced the guesses with the tank's own thermostat.

---

## New in v2 — 1. Thermostat-based completion detection

The biggest change. Instead of guessing at 14:09, the automations now **watch the power draw** and let the heater's own thermostat declare the end of the cycle: when the tank reaches its target temperature, the power collapses to near zero.

This is `cumulus_cave_thermostat_complete` (the garage twin, `cumulus_garage_thermostat_complete`, is identical except for entity IDs):

```yaml
- id: cumulus_cave_thermostat_complete
  alias: "Cumulus Cave - Detection thermostatique fin de chauffe"
  mode: parallel
  max_exceeded: silent
  triggers:
  - trigger: numeric_state
    entity_id: sensor.energy_meter_cumulus_cave_power
    below: 50
    for: 00:05:00
  - trigger: state
    entity_id: sensor.energy_meter_cumulus_cave_power
    to: 'unavailable'
    for: 00:10:00
  conditions: []
  actions:
  - action: switch.turn_off
    target:
      entity_id: switch.shellyplus1_a8032abcd060_switch_0
  - action: input_boolean.turn_off
    target:
      entity_id: input_boolean.water_heating_incomplete_cave
  - action: input_boolean.turn_off
    target:
      entity_id: input_boolean.water_heating_solar_extend_cave
  - action: notify.notify
    data:
      title: "Chauffe Eau Cave"
      message: "Cycle termine (thermostat). ON cumule aujourd'hui: {{ states('sensor.cumulus_cave_daily_on_time') }}h"
```

What happens on each trigger:

- **`power < 50 W` for 5 minutes** — the thermostat has stopped the heating. The relay is cut, the "incomplete" flag and the "solar extend" flag are cleared, and a notification tells us the cycle actually finished.
- **`power` becomes `unavailable` for 10 minutes** — the meter stopped reporting. A safety valve: end the cycle cleanly instead of waiting forever.

The old heuristic flag automations are now **disabled in the config**, with an explicit note in their alias:

```yaml
- id: set_heating_incomplete_flag_cave
  alias: "Set Heating Incomplete Flag - Cave [DISABLED - replaced by thermostat detection]"
  mode: single
  enabled: false
  triggers:
  - trigger: time
    at: '14:09:00'
  conditions:
  - condition: numeric_state
    entity_id: sensor.energy_meter_cumulus_cave_power
    above: 100
  actions:
  - action: input_boolean.turn_on
    target:
      entity_id: input_boolean.water_heating_incomplete_cave
```

![Energy draw collapsing to 0 W at the end of a heating cycle](/images/smart-water-heater-orchestration-solar-off-peak-v2/01-thermostat-detection.png)

---

## New in v2 — 2. Solar-first HP (peak-price) heating

At 14:09 the midday HC window closes and the tariff switches to **Heures Pleines** (HP) — the expensive rate. Normally the heaters must be off during HP. But when the sun is out and the house isn't consuming much, heating with solar power in HP is cheaper than importing electricity from the grid at night.

So this summer I added a second pair of automations: a **switch** that starts a HP heating run when there's surplus, and a **watch** that stops it as soon as the sun goes down or the house load spikes.

### The switch — `cumulus_cave_hp_solar_switch`

```yaml
- id: cumulus_cave_hp_solar_switch
  alias: "Cumulus Cave - Bascule HP solaire si incomplet"
  mode: single
  triggers:
  - trigger: time
    at: '14:09:00'
  conditions:
  - condition: state
    entity_id: input_boolean.water_heating_incomplete_cave
    state: 'on'
  - condition: state
    entity_id: input_boolean.vacation
    state: 'off'
  - condition: state
    entity_id: binary_sensor.solar_hi_production
    state: 'on'
  - condition: numeric_state
    entity_id: sensor.evse_10_0_0_120_house_power
    below: 1500
  - condition: template
    value_template: >
      {% set solar = states('sensor.ecu_current_power') | float(0) %}
      {% set house = states('sensor.evse_10_0_0_120_house_power') | float(0) %}
      {{ (solar - house) >= (2900 * 1.1) }}
  actions:
  - action: switch.turn_on
    target:
      entity_id: switch.shellyplus1_a8032abcd060_switch_0
  - action: input_boolean.turn_on
    target:
      entity_id: input_boolean.water_heating_solar_extend_cave
  - action: notify.notify
    data:
      title: "Chauffe Eau Cave"
      message: >-
        Reprise chauffe en HP solaire.
        Surplus: {{ ((states('sensor.ecu_current_power')|float(0) -
        states('sensor.evse_10_0_0_120_house_power')|float(0))) | round(0) }}W
```

The conditions encode the whole strategy:

- **`water_heating_incomplete_cave` is on** — the midday HC window wasn't enough (we only extend if we actually need to).
- **`solar_hi_production` is on and the house draws less than 1500 W** — there is sun, and the rest of the house isn't eating it all.
- **The surplus rule**: `solar − house ≥ 2900 × 1.1`. The cave heater draws about 2.9 kW; the ×1.1 factor is my margin of safety so the house never ends up importing energy at HP price while pretending to use solar. The garage heater, drawing ~1.1 kW, uses `1100 * 1.1`.

When those conditions hold, the heater turns on and the `water_heating_solar_extend_cave` flag is raised to tell the rest of the system "there's a solar HP run in progress".

![Solar production curve with the 14:09 HP run visible](/images/smart-water-heater-orchestration-solar-off-peak-v2/02-solar-surplus.png)

### The watch — `cumulus_cave_hp_solar_watch`

While a HP-solar run is in progress, `cumulus_cave_hp_solar_watch` stands guard and decides between two outcomes: let the cycle finish cleanly, or abort and leave the rest to the night cycle.

```yaml
- id: cumulus_cave_hp_solar_watch
  alias: "Cumulus Cave - Veille solaire HP"
  mode: single
  max_exceeded: silent
  triggers:
  - trigger: state
    entity_id: binary_sensor.solar_hi_production
    from: 'on'
    to: 'off'
  - trigger: numeric_state
    entity_id: sensor.evse_10_0_0_120_house_power
    above: 1500
    for: 00:02:00
  - trigger: numeric_state
    entity_id: sensor.energy_meter_cumulus_cave_power
    below: 50
    for: 00:05:00
  conditions:
  - condition: state
    entity_id: input_boolean.water_heating_solar_extend_cave
    state: 'on'
  actions:
  - choose:
    - conditions:
      - condition: numeric_state
        entity_id: sensor.energy_meter_cumulus_cave_power
        below: 50
      sequence:
      - action: input_boolean.turn_off
        target:
          entity_id: input_boolean.water_heating_solar_extend_cave
      - action: input_boolean.turn_off
        target:
          entity_id: input_boolean.water_heating_incomplete_cave
      - action: switch.turn_off
        target:
          entity_id: switch.shellyplus1_a8032abcd060_switch_0
      - action: notify.notify
        data:
          title: "Chauffe Eau Cave"
          message: "Cycle HP solaire termine (thermostat)."
    sequence:
    - action: switch.turn_off
      target:
        entity_id: switch.shellyplus1_a8032abcd060_switch_0
    - action: input_boolean.turn_off
      target:
        entity_id: input_boolean.water_heating_solar_extend_cave
    - action: notify.notify
      data:
        title: "Chauffe Eau Cave"
        message: "Arret HP solaire (soleil ou maison). Cycle de nuit prevu si incomplet."
```

Three triggers, one guard:

- **Sun gone** (`solar_hi_production` on → off) — the surplus ended. Stop the HP run and fall back to the night cycle.
- **House load above 1500 W for 2 minutes** — a spike (oven, kettle, EV). We must not import at HP price to feed the heater.
- **Power below 50 W for 5 minutes** — the thermostat finished the job.

The `water_heating_solar_extend_cave` guard ensures this watch only manages HP-solar runs — it never interferes with a normal HC run or the night cycle.

The `choose` branch: if the low-power trigger fired, the run genuinely completed, so both flags are cleared («Cycle HP solaire terminé (thermostat)»). Otherwise (first two triggers) we cut the relay and clear `solar_extend`, but **keep `incomplete` on** — so the 02:00 smart night cycle knows the tank still needs heat.

![The watch guard aborting a solar HP run when the house spikes](/images/smart-water-heater-orchestration-solar-off-peak-v2/03-watch.jpg)

---

## New in v2 — 3. The "smart night" with a cap

```yaml
- id: cumulus_cave_smart_night
  alias: "Cumulus Cave - Cycle de nuit intelligent"
  mode: single
  triggers:
  - trigger: time
    at: '02:00:00'
  conditions:
  - condition: state
    entity_id: input_boolean.water_heating_incomplete_cave
    state: 'on'
  - condition: state
    entity_id: input_boolean.vacation
    state: 'off'
  - condition: state
    entity_id: input_boolean.water_heating_solar_extend_cave
    state: 'off'
  variables:
    cap_min: "{{ states('sensor.cumulus_cave_typical_heat_min') | int(90) }}"
  actions:
  - action: notify.notify
    data:
      title: "Chauffe Eau Cave"
      message: "Cycle de nuit (max {{ cap_min }}min, thermostat prioritaire)."
  - action: switch.turn_on
    target:
      entity_id: switch.shellyplus1_a8032abcd060_switch_0
  - wait_for_trigger:
    - trigger: numeric_state
      entity_id: sensor.energy_meter_cumulus_cave_power
      below: 50
      for: 00:05:00
    - trigger: state
      entity_id: sensor.energy_meter_cumulus_cave_power
      to: 'unavailable'
    timeout:
      minutes: "{{ cap_min }}"
    continue_on_timeout: true
  - action: switch.turn_off
    target:
      entity_id: switch.shellyplus1_a8032abcd060_switch_0
  - action: input_boolean.turn_off
    target:
      entity_id: input_boolean.water_heating_incomplete_cave
  - action: notify.notify
    data:
      title: "Chauffe Eau Cave"
      message: "Cycle de nuit termine (cap {{ cap_min }}min atteint ou thermostat)."
```

The old night completion ran a fixed 2 hours. The new one **waits** for one of two things: the thermostat finishing (power below 50 W for 5 minutes), or the tank going `unavailable` — whichever happens **first**, bounded by a cap. `cap_min` comes from the template sensor `sensor.cumulus_cave_typical_heat_min` and is set at 90 minutes (garage 60), so I can tune a single `input_number` per heater from the dashboard without touching YAML:

```yaml
# components/input_number.yaml
cumulus_cave_max_night_heat_min:
  name: Cumulus Cave - Max Night Heat (min)
  min: 30
  max: 180
  step: 5
  initial: 90
  unit_of_measurement: "min"
  icon: mdi:timer-sand
  mode: slider

# templates/sensors.yaml
- sensor:
    - unique_id: cumulus_cave_typical_heat_min
      unit_of_measurement: min
      name: "Cumulus Cave Typical Heat Duration"
      icon: mdi:timer-sand
      state: >
        {% set raw = states('input_number.cumulus_cave_max_night_heat_min') | float(90) %}
        {{ [120, [45, raw] | max] | min | round(0) }}
```

That completes the flow. If a night is ever interrupted or guests need more hot water than the cap allows, there is still a manual override: the `force_cumulus_hc` toggle on the dashboard. When it is on, `force_cumulus_nigh` runs at 01:24 and turns on both heaters without any cap:

```yaml
- id: force_cumulus_nigh
  alias: Forcer Cumulus la nuit
  mode: parallel
  triggers:
  - trigger: time
    at: 01:24:00
  conditions:
  - condition: and
    conditions:
    - condition: state
      entity_id: input_boolean.vacation
      state: 'off'
    - condition: state
      entity_id: input_boolean.force_cumulus_hc
      state: 'on'
  actions:
  - action: switch.turn_on
    entity_id: switch.shellyplus1_7c87ce637064_switch_0
  - action: switch.turn_on
    entity_id: switch.shellyplus1_a8032abcd060_switch_0
```

---

## Real numbers (from my live instance)

Rather than showing a marketing-style waterfall, here are actual values from this summer:

| Metric | Cave | Garage |
|---|---|---|
| ON time last 7 days (mean) | 1.28 h/day | 0.59 h/day |
| ON time last 7 days (median) | 1.15 h | 0.58 h |
| Daily energy that day | 5.93 kWh | 2.33 kWh |
| Total energy since install | 1181.74 kWh | 447.72 kWh |
| `typical_heat_min` (input) | 90 min | 60 min |

The 7-day maxes were cave 4.0 h and garage 3.15 h — the days both morning requirements and the guard-heavy evening ran long.

I pulled these figures from the statistics API in the evening, when the panels were already off (`solar_hi_production` off, `ecu_current_power` 0 W) — so the "that day" values describe the complete day, not a work-in-progress.

---

## What did not change

- **The original Shelly Plus 1 relay + Shelly EM metering** from the [2022 post](/smart-water-heater-with-home-assistant-and-shelly-device/) — still the physical base.
- The **vacation toggle** and the **HC-window schedule** — still the front-door of the house.
- **The garage is a twin of the cave**: every automation described here exists in a `cumulus_garage_*` version (`cumulus_garage_thermostat_complete`, `cumulus_garage_hp_solar_switch`, `cumulus_garage_hp_solar_watch`, `cumulus_garage_smart_night`) with its own entity IDs, thresholds (garage uses `1100 * 1.1`) and a 60-minute night cap.
- **The boiler configs themselves** (temperature setpoint, ECO mode on the tank) — untouched; the automation layer only switches the relay.

---

## Honest rollout note, repeated

As flagged at the top: all v2 automations in this post are **in my config and being rolled out**. I verified via the API before writing that my live instance still runs the v1 machinery — `automation.cumulus_cave_actives_en_hc` (last triggered today at 12:09), `automation.comulus_desactives_en_hp` (14:09), `automation.cumulus_garage_actives_en_hc` (13:00), plus the old `set_heating_incomplete_flag_cave` still firing. The disabled `enabled: false` entries above describe the config state in the repo; the live switch-over happens once the v2 pairs prove themselves across a few sunny and cloudy days. Config first, live second — that's the rollout of a real home.

---

## Disclaimers

- **This is France-specific (Heures Creuses / Heures Pleines)**. A tariff with a single midday + night window doesn't exist everywhere; the 1.1x margin and 1500 W are my constants, not yours.
- **I am not an electrician.** Water-heater wiring (30 mA RCD, oversized cable, earthing) is done by a certified installer; I describe Home Assistant logic, not wiring.
- **No battery yet.** If a battery existed, the calculus would differ.
- **The EV charger is a separate project** (the `house_power` sensor is the V2C EVSE's house-side meter, not the car's own consumption).
- **A big heater is a key elastic load** — treat the water heater as a top consumer.

If I were to build this again from zero, the pair I'd keep the same is: thermostat-completion + the watchdog's 「abort vs finish」 logic. They are what turned an oscillating guess into a dependable marginal-load system.