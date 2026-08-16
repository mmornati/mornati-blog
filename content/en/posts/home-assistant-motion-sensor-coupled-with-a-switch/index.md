---
title: 'Home Assistant: motion sensor coupled with a switch'
tags:
- automation
- home-assistant
- motion-sensor
date: '2023-01-02T07:00:42.411000+00:00'
slug: home-assistant-motion-sensor-coupled-with-a-switch
---



Did you already move your harms to your motion sensor to power on your external light, for example when you are on your deck having dinner? It happened all the time to me and it is really frustrating... so I created automation to stop it! 😎

**What do you need?**

* A smart bulb (or equivalent to control a bulb)
    
* A smart motion sensor
    
* A `input_boolean` to check the way the light is powered on
    

## **Input Boolean**

Nothing special here, you just need to put it within your `input_boolean.yaml` file or directly in the `configuration.yaml`, depending on how you are managing your HassIO configuration.  
To simplify my global configuration, on my side I put this within the global configuration file: `input_boolean: !include components/input_boolean.yaml`

```yaml
input_boolean: !include components/input_boolean.yaml
```

Which then allows you to put all your booleans configurations within the defined file.

A different way to include external files, which I'm using with automation, is to put a folder instead of a file and ask Home Assistant to merge everything to get the final configuration:automation: `!include_dir_merge_list automations/`

```yaml
automation: !include_dir_merge_list automations/
```

This allows your *automation* folder to put 1 YAML per automation and so separate it to simplify the management.

Anyway, getting back to our boolean. What you have to put inside the external file is:

```yaml
terrasse_salon_auto_on:
  name: Terrasse Salon Motion ON
  icon: mdi:lightbulb
```

This will create an `input_boolean` named `terrasse_salon_auto_on` we will use later in our automation.

## **The Automation**

We have two different automation to control the power-on and the power-off.

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

As usual, we will enter each part of the script to understand what it does.

### **The Trigger**

We want to turn on and off the light bulb when motion is detected. So we will use a state trigger on this particular sensor.

```yaml
trigger:
    platform: state
    entity_id: binary_sensor.motion_salon_occupancy
    to: "on"
```

When the `occupancy` sensor of the motion sensor is moving to `on` the script is triggered.

For the off part, we improve a little bit the trigger to prevent the light from flickering all the time if we are outside but not always moving or not always in front of the motion sensor.

```yaml
trigger:
    platform: state
    entity_id: binary_sensor.motion_salon_occupancy
    to: "off"
    for:
      minutes: 2
```

The `for minutes` is doing the job: if the occupancy is off for at least 2 minutes, the action is triggered.

### **The Conditions**

If there is motion, when do we want to power on the light? If it is dark and if, for sure, the light is off. So, this is mainly what we find:

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
    
* The `numeric_state` is validated by the illuminance value provided by the motion sensor. Which value to put here? Just made some tests. 0 should be a good value (no light at all) but I preferred to move a little bit up to have the power bulb powered on with low illuminance.
    
* The last `state` is another `input_boolean` I added to be able to completely prevent light from being powered on. I'm using this during the night: if the night alarm is on, this means nobody will go outside, so I don't want to have the lights powered on by movements.
    

For the power-off action, there is something similar, but it is here we will use the added input boolean to do the magic.

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

* The `state` of the light. It sure must be on
    
* The state `input_boolean` we previously configured. We will power off the light bulb if it was automatically turned on (we will see in a while when this flag will be turned on). This means if we power on the light with the home assistant application or if a switch, the flag should be false and the light won't be turned off.
    
* Here you will see a `or` condition with a second `input_boolean.ignore_light_manual_on`. I'm using it to disable the previous flag: If I want to turn off anyway the light, never mind how it was turned on.
    

### **The Action**

If everything is validated the light should be turned on or off, depending on the automation we are considering, but not only: we will control the `input_boolean` at this level.

```yaml
  action:
    - service: light.turn_on
      entity_id: light.terrasse_salon
    - service: input_boolean.turn_on
      entity_id: input_boolean.terrasse_salon_auto_on
```

You can see in the turn-on script, two services are fired: one for the light itself and the second one to move the boolean to `true`. This means if the light is turned on by the automation, the boolean contains the value to check this.  
It is in my opinion the simple way to control this, but you can check in many other ways.

On the power-off part, it is exactly the opposite: we move the flag to false to get back to the initial state.

```yaml
  action:
    - service: light.turn_off
      entity_id: light.terrasse_salon
    - service: input_boolean.turn_off
      entity_id: input_boolean.terrasse_salon_auto_on
```
