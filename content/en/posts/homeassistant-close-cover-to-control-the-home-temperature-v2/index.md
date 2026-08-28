---
title: 'Home Assistant: Smart Cover Control Based on Temperature - 3 Years Later'
categories:
- smart-home
tags:
- automation
- weather
- home-assistant
- cover
- smart-home
date: '2026-08-16T09:00:00.000000+00:00'
slug: homeassistant-close-cover-to-control-the-home-temperature-v2
description: How I evolved my original temperature-based cover automation into a multi-zone system with averaged sensors and automatic reopening logic.
cover: cover.jpg
---

Three years ago, I published a [simple automation](/homeassistant-close-cover-to-control-the-home-temperature/) to close my covers based on temperature readings. It worked well, but after 3+ years of usage, I've significantly improved the system. Let me show you what changed and why.

## What's New?

The original version had a single automation controlling 5 covers in the afternoon. The new system:

- **3 zones** instead of 1 (ground floor, office, first floor)
- **Averaged temperature sensors** instead of single sensor readings
- **Automatic reopening** in the evening
- **Optimized execution** (10 minutes instead of 5)
- **6 automations** total (3 close + 3 open)

## The Temperature Sensors

The key improvement is using averaged sensors instead of relying on single temperature readings. I use Home Assistant's `min_max` platform with the `mean` type:

```yaml
# components/sensors.yaml
- platform: min_max
  name: average_temperature_external
  type: mean
  round_digits: 1
  entity_ids:
    - sensor.motion_externe_patio_temperature
    - sensor.motion_externe_salon_temperature
    - sensor.motion_externe_chambre_temperature
    - sensor.motion_externe_entree_temperature_2
    - sensor.motion_externe_bureau_temperature_2
    - sensor.netatmo_external_temperature

- platform: min_max
  name: average_temperature_ground_floor
  type: mean
  round_digits: 1
  entity_ids:
    - sensor.temperature_sensor_salon_temperature_2
    - sensor.temperature_sensor_salle_manger_temperature_2
    - sensor.temperature_sensor_cuisine_temperature_2
    - sensor.temperature_sensor_bureau_temperature_2
    - sensor.netatmo_weather_station_temperature
    - sensor.temperature_sensor_salle_bain_parents_temperature_2

- platform: min_max
  name: average_temperature_first_floor
  type: mean
  round_digits: 1
  entity_ids:
    - sensor.temperature_sensor_chambre_gaia_temperature_2
    - sensor.temperature_sensor_chambre_bastien_temperature_2
    - sensor.temperature_sensor_bibliotheque_temperature_2
    - sensor.temperature_sensor_salle_bain_etage_temperature_2
```

This approach is more robust because:
- Single sensor failures don't break the automation
- Temperature variations across rooms are averaged out
- More accurate representation of actual conditions

## Zone 1: Ground Floor Covers

### Closing Automation

```yaml
- id: cover_closes_weather
  alias: Close cover based on afternoon temperature
  triggers:
  - trigger: time_pattern
    minutes: /10
  conditions:
  - condition: time
    alias: Time 12~18
    after: '12:00:00'
    before: '18:00:00'
  - condition: or
    conditions:
    - condition: template
      value_template: '{{ states.automation.close_cover_based_on_afternoon_temperature.attributes.last_triggered == none }}'
    - condition: template
      value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.close_cover_based_on_afternoon_temperature'', ''last_triggered'')) |int(0)) > 28800 }}'
  - condition: template
    value_template: '{{ states.sensor.average_temperature_external.state|float > states.sensor.average_temperature_ground_floor.state|float + 2 }}'
  - condition: numeric_state
    entity_id: sensor.temperature_sensor_salon_temperature_2
    above: 20
  actions:
  - action: cover.set_cover_position
    data:
      entity_id:
      - cover.salon_n1
      - cover.salon_n2
      - cover.salon_n3
      - cover.salon_n4
      - cover.chambre_jardin
      position: 40
  description: ''
```

**Key points:**
- Runs every 10 minutes (was 5)
- Time window: 12:00-18:00 (was 12:30-18:00)
- External temperature must be 2°C warmer than internal
- Internal temperature must be above 20°C
- Covers close to 40% position (not fully closed)

### Opening Automation

```yaml
- id: open_cover_when_weather_closed
  alias: Open cover when automatically closed
  triggers:
  - trigger: time_pattern
    minutes: /10
  conditions:
  - condition: time
    alias: Time 19h00~20
    after: '19:00:00'
    before: '20:00:00'
  - condition: or
    conditions:
    - condition: template
      value_template: '{{ states.automation.open_cover_when_automatically_closed.attributes.last_triggered == none }}'
    - condition: template
      value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.open_cover_when_automatically_closed'', ''last_triggered'')) |int(0)) > 28800 }}'
  - condition: template
    value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.close_cover_based_on_afternoon_temperature'', ''last_triggered'')) |int(0)) < 28800 }}'
  actions:
  - action: cover.open_cover
    data:
      entity_id:
      - cover.salon_n1
      - cover.salon_n2
      - cover.salon_n3
      - cover.salon_n4
      - cover.chambre_jardin
  description: ''
```

This automation reopens the covers in the evening (19:00-20:00) if they were closed by the temperature automation during the day.

## Zone 2: Office Covers

### Closing Automation

```yaml
- id: cover_bureau_closes_weather
  alias: Close Bureau Cover based on temperature
  description: ''
  triggers:
  - trigger: time_pattern
    minutes: /10
  conditions:
  - condition: time
    alias: Time 8~13
    after: 08:00:00
    before: '13:00:00'
  - condition: or
    conditions:
    - condition: template
      value_template: '{{ states.automation.close_bureau_cover_based_on_temperature.attributes.last_triggered == none }}'
    - condition: template
      value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.close_bureau_cover_based_on_temperature'', ''last_triggered'')) |int(0)) > 28800 }}'
  - condition: template
    value_template: '{{ (states.sensor.motion_externe_entree_temperature_2.state|float + states.sensor.motion_externe_bureau_temperature_2.state|float)/2 > states.sensor.temperature_sensor_bureau_temperature_2.state|float }}'
  - condition: numeric_state
    entity_id: sensor.temperature_sensor_bureau_temperature_2
    above: 20
  actions:
  - action: cover.set_cover_position
    data:
      entity_id:
      - cover.bureau_jardin
      position: 40
```

**Key differences from ground floor:**
- Time window: 08:00-13:00 (morning sun exposure)
- Uses average of 2 external sensors instead of all 6
- No 2°C differential needed (just external > internal)

### Opening Automation

```yaml
- id: open_bureau_cover_when_weather_closed
  alias: Open Bureau cover when automatically closed
  triggers:
  - trigger: time_pattern
    minutes: /5
  conditions:
  - condition: time
    alias: Time 14h00~14h30
    after: '14:00:00'
    before: '14:30:00'
  - condition: or
    conditions:
    - condition: template
      value_template: '{{ states.automation.open_bureau_cover_when_automatically_closed.attributes.last_triggered == none }}'
    - condition: template
      value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.open_bureau_cover_when_automatically_closed'', ''last_triggered'')) |int(0)) > 28800 }}'
  - condition: template
    value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.close_bureau_cover_based_on_temperature'', ''last_triggered'')) |int(0)) < 28800 }}'
  actions:
  - action: cover.open_cover
    data:
      entity_id:
      - cover.bureau_jardin
  description: ''
```

The office cover opens briefly at 14:00-14:30 since the sun has moved away from that window.

## Zone 3: First Floor Velux Covers

### Closing Automation

```yaml
- id: cover_floor_weather
  alias: Close first floor covers based on afternoon temperature
  triggers:
  - trigger: time_pattern
    minutes: /10
  conditions:
  - condition: time
    alias: Time 12~18
    after: '11:00:00'
    before: '18:00:00'
  - condition: or
    conditions:
    - condition: template
      value_template: '{{ states.automation.close_first_floor_covers_based_on_afternoon_temperature.attributes.last_triggered == none }}'
    - condition: template
      value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.close_first_floor_covers_based_on_afternoon_temperature'', ''last_triggered'')) |int(0)) > 28800 }}'
  - condition: template
    value_template: '{{ states.sensor.average_temperature_external.state|float > states.sensor.average_temperature_first_floor.state|float }}'
  actions:
  - action: cover.close_cover
    data:
      entity_id:
      - cover.velux_gaia_jardin_roller_shutter
      - cover.velux_bastien_jardin_roller_shutter
      - cover.velux_biblioteque_roller_shutter
  description: ''
```

**Key differences:**
- Time window: 11:00-18:00 (starts earlier due to roof exposure)
- No 2°C differential (roof heats up faster)
- Covers fully close (not 40%)
- Controls Velux roof windows

### Opening Automation

```yaml
- id: open_floor_when_weather_closed
  alias: Open first floor covers when automatically closed
  triggers:
  - trigger: time_pattern
    minutes: /10
  conditions:
  - condition: time
    alias: Time 19h00~20
    after: '19:00:00'
    before: '20:00:00'
  - condition: or
    conditions:
    - condition: template
      value_template: '{{ states.automation.open_first_floor_covers_when_automatically_closed.attributes.last_triggered == none }}'
    - condition: template
      value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.open_first_floor_covers_when_automatically_closed'', ''last_triggered'')) |int(0)) > 28800 }}'
  - condition: template
    value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.close_first_floor_covers_based_on_afternoon_temperature'', ''last_triggered'')) |int(0)) < 28800 }}'
  actions:
  - action: cover.open_cover
    data:
      entity_id:
      - cover.velux_gaia_jardin_roller_shutter
      - cover.velux_bastien_jardin_roller_shutter
      - cover.velux_biblioteque_roller_shutter
  description: ''
```

## The "Already Executed" Condition

All automations use this pattern to prevent multiple executions per day:

```yaml
- condition: or
  conditions:
  - condition: template
    value_template: '{{ states.automation.YOUR_AUTOMATION_ID.attributes.last_triggered == none }}'
  - condition: template
    value_template: '{{ ( as_timestamp(now()) - as_timestamp(state_attr(''automation.YOUR_AUTOMATION_ID'', ''last_triggered'')) |int(0)) > 28800 }}'
```

This checks if:
1. The automation was never triggered (first run), OR
2. The last trigger was more than 8 hours ago (28800 seconds)

Why 8 hours? It prevents re-execution in the same timeframe while allowing execution the next day.

## Lessons Learned After 3 Years

1. **Averaged sensors are more reliable** - Single sensor failures don't break the system
2. **Multiple zones matter** - Different sun exposures need different timing
3. **Auto-reopening is essential** - Covers shouldn't stay closed all night
4. **10-minute intervals are sufficient** - 5 minutes was overkill and used more CPU
5. **The 2°C differential works well** - Prevents false triggers on cloudy days
6. **Velux need special treatment** - Roof windows heat up faster and need full closure

## What's Next?

The original post mentioned adding light intensity (lux) sensors to prevent closing covers when it's cloudy but warm. I've implemented this in my external lighting automations and plan to integrate it here as well.

Stay tuned for the next update!

---

**Related posts:**
- [Original post (2023)](/homeassistant-close-cover-to-control-the-home-temperature/)
- [Home Assistant: Motion Sensor Coupled with a Switch](/home-assistant-motion-sensor-coupled-with-a-switch/)
- [Seamlessly Automate Your Home with Hitachi Devices](/seamlessly-automate-your-home-with-hitachi-devices-a-custom-home-assistant-integration/)
