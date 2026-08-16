---
title: 'HomeAssistant: Close cover to control the home temperature'
tags:
- automation
- weather
- home-assistant
- cover
date: '2023-01-01T09:00:42.310000+00:00'
slug: homeassistant-close-cover-to-control-the-home-temperature
---



Today I will show you a simple script to help increase your home's energetic performance by regulating the internal temperature base on the external values.  
It is the first simpler version based on a single temperature point but I have a newer one ready to be tested but I need to wait for hotter days 😅

**What do you need for this?**  
\* Automatic / Home Assistant controller Covers  
\* One (or more) temperature sensors  
\* and for sure, one or more windows exposed to the sunlight 😉

### **The Trigger**

As I already described for the presence simulation script, the trigger is a `time_pattern` because I want to constantly recheck during a specific time frame if conditions are met.  
An alternative, to reduce the number of execution, is to use a [Multi Trigger](https://www.home-assistant.io/docs/automation/trigger/#multiple-triggers): when one of the triggers is validated, the automation is started. I will see at the end of the blog article how we can change automation in this way.

```yaml
trigger:
  - platform: time_pattern
    minutes: "/5"
```

Automation is started every 5 minutes

### **The Conditions**

Here we will find a lot of tests to be sure we are closing at the right moment.

```yaml
condition:
    - condition: time
      alias: "Time 13~20"
      after: "12:30:00"
      before: "18:00:00"
    - condition: or
      conditions:
        - condition: template
          # If automation was never triggered
          value_template: "{{ states.automation.close_cover_based_on_afternoon_temperature.attributes.last_triggered == none }}"
        - condition: template
          # If automation not played in the last 8 hours (means played only the day before)
          value_template: "{{ ( as_timestamp(now()) - as_timestamp(state_attr('automation.close_cover_based_on_afternoon_temperature', 'last_triggered')) |int(0)) > 28800 }}"
    - condition: template
      value_template: "{{ states.sensor.netatmo_maison_willems_indoor_namodule1_temperature.state|float > states.sensor.capteur_mouvement_salon_temperature.state|float + 2 }}"
    - condition: numeric_state
      entity_id: sensor.capteur_mouvement_salon_temperature
      above: 20
```

**Time**  
The window covers I want to control are south-exposed, for this reason, I'm going to execute the automation only during the afternoon when the sun is completely facing the windows: `after: "12:30:00" before: "18:00:00"`

**Not executed already**

```yaml
- condition: or
      conditions:
        - condition: template
          # If automation was never triggered
          value_template: "{{ states.automation.close_cover_based_on_afternoon_temperature.attributes.last_triggered == none }}"
        - condition: template
          # If automation not played in the last 8 hours (means played only the day before)
          value_template: "{{ ( as_timestamp(now()) - as_timestamp(state_attr('automation.close_cover_based_on_afternoon_temperature', 'last_triggered')) |int(0)) > 28800 }}"
```

This part of the script, which seems hard to understand I know, is used to check if the automation was already fired (until the execution) **or** never executed at all (necessary for the first execution or if the last time was long away that historic data are removed).  
For this check, we use the `last_triggered` property on the automation itself, checking if it `none` or if the last execution was fired more than **8 hours** before. Why 8 hours? Never mind, in the end, you just need to put here a value preventing the execution in the same timeframe (12h30 to 18h) and allowing the execution the day after (18h to 12h30). The value 8 is covering both 2 cases: greater than 6:30 hours (18-12h30) and less than 18:30 hours (12h30 - 18h).

**Temperature**

```yaml
    - condition: template
      value_template: "{{ states.sensor.netatmo_maison_willems_indoor_namodule1_temperature.state|float > states.sensor.capteur_mouvement_salon_temperature.state|float + 2 }}"
    - condition: numeric_state
      entity_id: sensor.capteur_mouvement_salon_temperature
      above: 20
```

The 2 other conditions are checking the internal and external temperature.  
For the internal, second condition, I'm checking only the temperature sensor in the room where I control the covers and it must be **above** 20 degrees to trigger the automation.  
The other condition is checking the difference between the internal and the external temperature: the external must be at least 2 degrees greater than the internal.  
\* `states.sensor.netatmo_maison_willems_indoor_namodule1_temperature.state|float` external module  
\* `states.sensor.capteur_movement_salon_temperature.state|float + 2` internal module + 2 degrees.

### The Action

If everything is validated, the covers are closed.

```yaml
  action:
    - service: cover.set_cover_position
      data:
        entity_id:
          - cover.salon_n1_6
          - cover.salon_n2
          - cover.salon_n3_12
          - cover.salon_n4_14
          - cover.chambre_jardin_3
        position: 40
```

All the covers I want to control are placed at 40%. Not completely closed, but it is enough to reduce the light entering the room.  
I added an additional cover in a separate room without creating another action. It is only to simplify the management as the exposure is the same.

If we put it all together the script is the following:

```yaml
- id: cover_closes_weather
  alias: "Close cover based on afternoon temperature"
  trigger:
    - platform: time_pattern
      minutes: "/5"
  condition:
    - condition: time
      alias: "Time 13~20"
      after: "12:30:00"
      before: "18:00:00"
    - condition: or
      conditions:
        - condition: template
          # If automation was never triggered
          value_template: "{{ states.automation.close_cover_based_on_afternoon_temperature.attributes.last_triggered == none }}"
        - condition: template
          # If automation not played in the last 8 hours (means played only the day before)
          value_template: "{{ ( as_timestamp(now()) - as_timestamp(state_attr('automation.close_cover_based_on_afternoon_temperature', 'last_triggered')) |int(0)) > 28800 }}"
    - condition: template
      value_template: "{{ states.sensor.netatmo_maison_willems_indoor_namodule1_temperature.state|float > states.sensor.capteur_mouvement_salon_temperature.state|float + 2 }}"
    - condition: numeric_state
      entity_id: sensor.capteur_mouvement_salon_temperature
      above: 20
  action:
    - service: cover.set_cover_position
      data:
        entity_id:
          - cover.salon_n1_6
          - cover.salon_n2
          - cover.salon_n3_12
          - cover.salon_n4_14
          - cover.chambre_jardin_3
        position: 40
```

I used it for the last 2 years and there is a big difference in the temperature feeling you have when the covers are closed. So it is a big game changer for me.

### **Different triggers to reduce the number of execution**

As I said at the beginning, we can find a different way to manage the trigger, instead of the simple `time_pattern`. This will contribute to reducing the number of executions: even if the action is not fired, we are entering in the conditions check, using a little bit of your CPU.

If we get back our automation, the real information we need to trigger the automation is the temperature: external is more than 2 degrees greater than internal and internal is above 20 degrees.  
An example of what we can change:

```yaml
automation:
  trigger:
    - platform: template
      value_template: "{{ states.sensor.netatmo_maison_willems_indoor_namodule1_temperature.state|float > states.sensor.capteur_mouvement_salon_temperature.state|float + 2 }}"
      for:
        minutes: 5
```

In this way, we are triggering based on the external vs internal condition, and we check if the value remains true for at least 5 minutes.  
We could add a second trigger about the internal temperature only, but we have to keep in mind that the trigger is evaluated with an **or** condition: if at least one is true, the action script is executed (but maybe conditions prevent it to be fired).

```yaml
    - platform: numeric_state
      entity_id: sensor.capteur_mouvement_salon_temperature
      above: 20
```

It is up to you to define what is the best trigger in your situation, and what you are ready to accept in terms of the number of "false" executions.

### Future enhancement

This is the version I used so far but the action was "wrongly" fired sometime. As it is based only on temperature, in the summer all the conditions can be valid even if it is rainy outside. With these weather conditions, the internal temperature is not increasing because the sun is not going through the windows.  
At the end of summer, I installed some new external motion sensors I can use to add a new parameter: *light intensity.*

![](/images/homeassistant-close-cover-to-control-the-home-temperature/00-cdc0b1d4-5e15-42de-8b35-c96978aba0a0.png)

What I added is a test about the *lux* parameter, which I'm already using to trigger the external spots.  
But this is another story 😎
