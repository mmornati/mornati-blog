---
title: 'Home Assistant: motion sensor coupled with a switch'
categories:
- smart-home
tags:
- automation
- home-assistant
- motion-sensor
date: '2023-01-02T07:00:42.411000+00:00'
slug: home-assistant-motion-sensor-coupled-with-a-switch
description: Use a motion sensor and an input boolean to prevent outdoor lights from turning off when manually switched on.
---

Have you ever waved your arms at a motion sensor to turn on your outdoor light while having dinner on the deck? It happened to me all the time and was really frustrating... so I created an automation to stop it! 😎

**What do you need?**

* A smart bulb (or equivalent to control a bulb)
    
* A smart motion sensor
    
* A `input_boolean` to check the way the light is powered on
    

## **Input Boolean**

Nothing special here, you just need to put it within your `input_boolean.yaml` file or directly in the `configuration.yaml`, depending on how you are managing your HassIO configuration.  
To simplify things, I put this in my global configuration file: `input_boolean: !include components/input_boolean.yaml`

```yaml
input_boolean: !include components/input_boolean.yaml
```

This lets you keep all boolean configurations in one file.

Another approach, which I use for automations, is to use a folder and let Home Assistant merge everything: `automation: !include_dir_merge_list automations/`

```yaml
automation: !include_dir_merge_list automations/
```

This lets you put one YAML per automation, keeping things organized.

Back to our boolean. What to put in the file:

```yaml
terrasse_salon_auto_on:
  name: Terrasse Salon Motion ON
  icon: mdi:lightbulb
```

This will create an `input_boolean` named `terrasse_salon_auto_on` we will use later in our automation.

## **The Automation**

We have two automations: one for power-on, one for power-off.

```yaml
- alias: Terrasse Salon ON
  id: terrasse_salon_on
  trigger:
    platform: state
    entity_id: binary_sensor.motion_salon_occupancy
    to: "on"
  condition:
    - condition: state
      entity_id: light.terrasse_salon
      state: "off"
    - condition: numeric_state
      entity_id: sensor.motion_salon_illuminance_lux
      below: 50
    - condition: state
      entity_id: input_boolean.terrasse_motion_sensor_enabled
      state: "on"
  action:
    - service: light.turn_on
      entity_id: light.terrasse_salon
    - service: input_boolean.turn_on
      entity_id: input_boolean.terrasse_salon_auto_on

- alias: Terrasse Salon OFF
  id: terrasse_salon_off
  trigger:
    platform: state
    entity_id: binary_sensor.motion_salon_occupancy
    to: "off"
    for:
      minutes: 2
  condition:
    - condition: state
      entity_id: light.terrasse_salon
      state: "on"
    - condition: or
      conditions:
        - condition: state
          entity_id: input_boolean.terrasse_salon_auto_on
          state: "on"
        - condition: state
          entity_id: input_boolean.ignore_light_manual_on
          state: "on"
  action:
    - service: light.turn_off
      entity_id: light.terrasse_salon
    - service: input_boolean.turn_off
      entity_id: input_boolean.terrasse_salon_auto_on
```

Let's go through each part to understand how it works.

### **The Trigger**

We want to control the light based on motion detection, so we use a state trigger on the motion sensor.

```yaml
trigger:
    platform: state
    entity_id: binary_sensor.motion_salon_occupancy
    to: "on"
```

When the occupancy sensor turns on, the automation triggers.

For the off trigger, we improve it slightly to prevent flickering when movement isn't constant.

```yaml
trigger:
    platform: state
    entity_id: binary_sensor.motion_salon_occupancy
    to: "off"
    for:
      minutes: 2
```

The `for: minutes` handles this: if occupancy is off for 2 minutes, the action triggers.

### **The Conditions**

When there's motion, when should the light turn on? When it's dark and the light is off, of course.

```yaml
condition:
    - condition: state
      entity_id: light.terrasse_salon
      state: "off"
    - condition: numeric_state
      entity_id: sensor.motion_salon_illuminance_lux
      below: 50
    - condition: state
      entity_id: input_boolean.terrasse_motion_sensor_enabled
      state: "on"
```

* The `state` part is checking if the light is off
    
* `numeric_state` checks the motion sensor's illuminance value. What value to use? I ran some tests. 0 would work (no light), but I moved it up slightly to also trigger in low light.
    
* The last `state` is another `input_boolean` that can completely disable the light. I use this at night: if the alarm is on, no one will be outside, so motion shouldn't turn on the light.
    

The power-off automation is similar, but this is where the magic happens with our `input_boolean`.

```yaml
  condition:
    - condition: state
      entity_id: light.terrasse_salon
      state: "on"
    - condition: or
      conditions:
        - condition: state
          entity_id: input_boolean.terrasse_salon_auto_on
          state: "on"
        - condition: state
          entity_id: input_boolean.ignore_light_manual_on
          state: "on"
```

* The light must be on.
    
* The `input_boolean` we configured. The light turns off only if it was turned on by automation. If we turned it on manually, the flag stays false and the light won't turn off automatically.
    
* There's also an `or` condition with a second boolean that overrides this: it forces the light off regardless of how it was turned on.
    

### **The Action**

If conditions are met, the light turns on or off — and we also control the `input_boolean`.

```yaml
  action:
    - service: light.turn_on
      entity_id: light.terrasse_salon
    - service: input_boolean.turn_on
      entity_id: input_boolean.terrasse_salon_auto_on
```

The turn-on script fires two services: one for the light, one to set the boolean to `true`. This marks that the light was turned on by automation.  
This is the simplest way I've found, but there are other approaches.

The power-off does the opposite: it sets the flag back to false.

```yaml
  action:
    - service: light.turn_off
      entity_id: light.terrasse_salon
    - service: input_boolean.turn_off
      entity_id: input_boolean.terrasse_salon_auto_on
```