---
title: 'Home Assistant: simple "presence simulation" script'
categories:
- smart-home
tags:
- automation
- script
- light
- home-assistant
description: "Simulate presence at home with random lights using a Home Assistant script — perfect for deterring burglars while you're away."
date: '2022-12-30T09:00:42.305000+00:00'
slug: home-assistant-simple-presence-simulation-script
---


Do you remember "[Home Alone](https://en.wikipedia.org/wiki/Home_Alone)"? When Kevin simulates his family's presence using lights, television sounds, persons moving in the living room, ...?  
You can do the same using your Smart Home devices and Home Assistant.

What to control depends on your devices, but there are infinite possibilities: turn on lights randomly, play music when motion is detected... Here's a simple script that starts a random light at a random time.

## The script

Add the following script in your scripts configuration file (ie `scripts.yaml`)

```yaml
light_duration:
  mode: parallel 
  description: "Turns on a light for a while, and then turns it off"
  fields:
    light:
      description: "A specific light"
      example: "light.bedroom"
    duration:
      description: "How long the light should be on in minutes"
      example: "25"
  sequence:
    - service: homeassistant.turn_on
      data:
        entity_id: "{{ light }}"
    - delay: "{{ duration }}"
    - service: homeassistant.turn_off
      data:
        entity_id: "{{ light }}"
```

I found it somewhere on the net a while ago, but I don't remember exactly where (so, sorry about the missing reference if you are the original writer of the script 😅).

The script runs `turn_on`, `delay`, and `turn_off` sequentially, each using a variable: the light (or any device with ON/OFF mode) and the overall duration.

The `parallel` mode allows multiple lights to run simultaneously.

![](/images/home-assistant-simple-presence-simulation-script/00-557297a8-6c59-4135-91a6-1c87f5eb0d04.png)

With other modes, a running script would be killed, and the light would never turn off. I chose parallel for a more random simulation.

## The automation

The automation then starts the script with the correct parameters.

```yaml
- id: random_away_lights
  alias: "Random Away Lights"
  mode: parallel 
  trigger:
    - platform: time_pattern
      minutes: "/30"
  condition:
    - condition: state
      entity_id: input_boolean.away
      state: "on"
    - condition: sun
      after: sunset
      after_offset: "-00:30:00"
    - condition: time
      before: "23:59:00"
  action:
    service: script.light_duration
    data:
      light: "{{states.group.simulation_lights.attributes.entity_id | random}}"
      duration: "00:{{ '{:02}'.format(range(5,30) | random | int) }}:00"
```

The `trigger` is a simple `time_pattern`: the automation runs every 30 minutes. I prefer this over a specific time because we might be away even after the chosen event. For example, if you set the automation at 8 PM and add an 'away from home' condition, but leave at 8:05 PM, it never triggers. But, if you leave the home at 20h05 it will never be triggered again. You could create a second automation for leaving events, but I find the time pattern simpler. The code runs every 30 minutes, but Home Assistant is mostly idle.

The `condition` is a group of checks. It runs only if:

* the `away` boolean is true. In my case, the boolean is set to true when I set the alarm in "away mode".
    
* It's after sunset (or 30 minutes before, using the offset) I put. So presence is only simulated when it's dark outside
    
* I limit it to a specific hour — the script runs until 11:59 PM.
    

The `action` is where the magic happens: the script is executed with dynamically filled variables.

The **light choice** is made using  
`{{states.group.simulation_lights.attributes.entity_id | random}}`  
I created a group of lights visible from the outside.

```yaml
simulation_lights:
  name: Lights Presence Simulation
  entities:
    - light.salle_manger
    - light.cuisine_table
    - light.bureau_marco
    - light.salon_corner
```

The `random` function selects a random light from the list. The result is the entity ID to use.

The **duration** is selected in a similar way with  
`"00:{{ '{:02}'.format(range(5,30) | random | int) }}:00"`  
The final result is a string like *00:10:00,* so we have the number of minutes the light must be kept on.  
To understand the script:

* `'{:02}'` is giving the number of digits of the final "number". Here we are saying that the format must **always** be a two digits string. *5* will be *05*. If we have a different format the delay procedure in the script will fail with an error.
    
* `range(5,30)` says we want any number between 5 and 30 (minutes).
    
* `random` nothing to add I think
    
* `int` is to convert the result as a number without a decimal.  
    Put together, the script reads as follows: *select a random number between 5 and 30, convert to integer, format as a 2-digit string.*
    

So every 30 minutes, if conditions are met, a random light is selected and turned on for 5 to 30 minutes.

You can adjust any of these parameters to suit your needs.
