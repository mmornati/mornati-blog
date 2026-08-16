---
title: 'Home Assistant: simple "presence simulation" script'
tags:
- automation
- script
- light
- home-assistant
date: '2022-12-30T09:00:42.305000+00:00'
slug: home-assistant-simple-presence-simulation-script
---



Do you remember the "[Home Alone](https://en.wikipedia.org/wiki/Home_Alone)" movie? When Kevin simulate the presence of his family at home using lights, television sounds, persons moving in the living room, ...?  
You can do the same using your Smart Home devices and Home Assistant.

What to control depends on the connected devices you have but there are infinite possibilities: start the light randomly, play music if presence is detected somewhere around the home, ... I show here a simple script controlled by automation to start **a random light** at a **random hour**.

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

The script is executing sequentially the `turn_on`, `delay` and `turn_off`, each of these steps is getting a variable: the light (or it can be any device with ON/OFF mode) to control and the global duration.

The `parallel` at the beginning allows several lights to be started in the same timeframe.

![](/images/home-assistant-simple-presence-simulation-script/00-557297a8-6c59-4135-91a6-1c87f5eb0d04.png)

If you use a different mode, a previously started script can be killed and so the lights will never be turned off. I preferred the parallel to have an even more random simulation.

## The automation

The automation will then start the script providing the correct parameters.

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

The `trigger` I'm using a simple `time_pattern`: the automation is started every 30 minutes. I preferred this to a specific time or event because we can be outside the home even after the specific chosen event. To understand this, imagine you decide to start the automation at 20h and then, in the condition you have to add a check "if I'm not at home". If this check is false the automation stop without any execution. But, if you leave the home at 20h05 it will never be triggered again. To fix this you can create a second automation linked to the "going out event" but personally I find it easy to understand with a simple time pattern. There is a code executed every 30 minutes, but in the end, home assistant is mainly doing nothing.

The `condition` is a group of checks. It is executed only if:

* the `away` boolean is true. In my case, the boolean is set to true when I set the alarm in "away mode".
    
* We are after the `sunset,` or better 30 minutes before the sunset using the offset I put. So I simulate the presence only if it is dark outside
    
* until a specific hour. The script goes ahead doing stuff until 23h59.
    

The `action` is where we are then doing the magic: the previous configuration script is executed with the two variables (light and duration) **filled** **dynamically up.**

The **light choice** is made using  
`{{states.group.simulation_lights.attributes.entity_id | random}}`  
I created a group with a list of lights I want to use to simulate the presence. I put only the lights within the rooms visible from the outside.

```yaml
simulation_lights:
  name: Lights Presence Simulation
  entities:
    - light.salle_manger
    - light.cuisine_table
    - light.bureau_marco
    - light.salon_corner
```

The `random` function is used to select randomly 😎 within the provided list. The result is the entity ID to use.

The **duration** is selected in a similar way with  
`"00:{{ '{:02}'.format(range(5,30) | random | int) }}:00"`  
The final result is a string like *00:10:00,* so we have the number of minutes the light must be kept on.  
To understand the script:

* `'{:02}'` is giving the number of digits of the final "number". Here we are saying that the format must **always** be a two digits string. *5* will be *05*. If we have a different format the delay procedure in the script will fail with an error.
    
* `range(5,30)` says we want any number between 5 and 30 (minutes).
    
* `random` nothing to add I think
    
* `int` is to convert the result as a number without a decimal.  
    If we put it all together the script can be read as the following: *select a random number between 5 and 30, converted it into an integer, and then formatted as 2 digit string.*
    

If we get the whole automation at once, `every 30 minutes the automation is started and if the conditions are met, a light within the defined group is selected and turned on for a random time between 5 and 30`.

You can change any of the parameters I described, to adapt everything to your particular case.
