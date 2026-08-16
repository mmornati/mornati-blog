---
title: Smart VMC (Mechanical Ventilation System)
tags:
- smart-home
- vmc
- fibaro
- shelly
date: '2022-08-23T11:56:33.562000+00:00'
slug: smart-vmc-mechanical-ventilation-system
---



Making your home smart allows several benefits, but the most important is that you can automate everything you want based on special events: close the cover if the sun is hotting the house; turn off all the lights when you are leaving, ...
If well parametrized it is making all your home, much more environment friendly.

Today I would like to talk about the "Mechanical Ventilation System" (VMC here in France): a system used to renovate internal air by reducing bad smell and humidity. 

![mev_2.webp](/images/smart-vmc-mechanical-ventilation-system/00-LPqvFMQf8.webp)

Normally, the simplest device is having 2 speeds (slow and fast), **is running 24H/24**, and we can manually change the speed by acting on a switch.
It is exactly at this point that automation is becoming interesting. For example: if the humidity is too high in one of the rooms in which VMC is extracting the air, we can auto-move to the fastest speed.
But, how to proceed?

## VMC wiring diagram

![schema_vmc.png](/images/smart-vmc-mechanical-ventilation-system/01-fuATrrfe9.png)

In the double-speed VMC, there are two capacitors used to "help the engine" start and run at the correct speed; the power is going to the engine via these two capacitors. The speed is selected with the proper wire going through a single capacitor or both two.

## How to connect a Smart Module?
We need to choose a **double** Switch Smart module (allow to select the slow or fast mode) and able to send "indefinitely" the power to the engine.
Saying these because online we can find a ton of tutorials talking about the "Fibaro Roller Shutter", the module used to automate the covers. With the old version ([FGR-222](https://manuals.fibaro.com/roller-shutter-2/)) the device settings allow to remove the "stop timer" (engine always on). With the new device ([FGR-223](https://manuals.fibaro.com/content/manuals/en/FGR-223/FGR-223-EN-T-v1.2.pdf)) Fibaro removes this setting and the engine will be stopped after a while. It is now a dedicated Cover device.

To automate the VMC (or anything else requiring permanent power from the module), on the Fibaro side we need to look to all the FGS-xxx devices. The latest double switch is now the [FGS-224](https://manuals.fibaro.com/smart-module/).

But Fibaro means Z-Wave protocol, which means SmartBox Hub understanding the protocol. If you are starting or you don't want a Hub (or you want a cheaper device 🤑), you can check the new [Shelly modules](https://shelly.cloud/) which are working on your home WiFi simplifying a lot of your Smart Home configuration. For the VMC automation, you can check the [Shelly 2.5](https://shelly.cloud/products/shelly-25-smart-home-automation-relay/).
In my case, I already had a SmartHome Box and, even due to the location I wasn't sure about the WiFi signal, I preferred the Fibaro automation using the FGS-224.

The wiring is really simple and you can follow what is proposed directly on the device documentation.

![image.png](/images/smart-vmc-mechanical-ventilation-system/02-3zRo5_czU.png)

We can modify a little bit the first schema and introduce our Smart Module:

![schema_vmc_fgs224.png](/images/smart-vmc-mechanical-ventilation-system/03-RUbSwuz3s.png)

NB: If you are choosing a different one, you have to check the documentation to be sure how to link it up.

The module is providing the power to the VMC via the Q1 or Q2 link that you need to connect to the slow and fast speed (never mind which one on what, you can name them later into your smarthome box).

## Home Assistant Integration and Configuration
First of all, you have to pair the device based on the decisions you made before: Wifi, Z-Wave, SmartBox Hub, or not, ... 

Once the Fibaro is paired with your box you have a new device with the following properties:

![image.png](/images/smart-vmc-mechanical-ventilation-system/04-ohNnA2ROY.png)

You don't need any specific setting over the device; the important part here is the 2 switches (in my screenshot "VMC" and "(2)"... no idea why by default it is named in this shitty way 😅).
Each one is acting over a *Qx* out pin, and if you linked in the correct way, it will send the power to the proper VMC speed cable.

⚠️ **WARNING** you don't have to power on the two switches at the same time. Your VMC could not like the way power is provided.

For this reason, in my installation, I based the switch changes on an *input_select* component with 3 states *Off*, "Speed 1" and "Speed 2".

```
input_select:
  vmc:
    name: VMC State
    icon: mdi:fan
    options:
      - "Off"
      - "Speed 1"
      - "Speed 2"
``` 
Then 3 automations are **reacting** to the input_select state change.

```
automation:
  - id: vmc_slow
    alias: VMC Speed 1
    trigger:
      - platform: state
        entity_id: input_select.vmc
        to: "Speed 1"
    action:
      - service: switch.turn_off
        entity_id: switch.vmc_2
      - delay: 5
      - service: switch.turn_on
        entity_id: switch.vmc
  
  - id: vmc_fast
    alias: VMC Speed 2
    trigger:
      - platform: state
        entity_id: input_select.vmc
        to: "Speed 2"
    action:
      - service: switch.turn_off
        entity_id: switch.vmc
      - delay: 5
      - service: switch.turn_on
        entity_id: switch.vmc_2
  
  - id: vmc_off
    alias: VMC Off
    trigger:
      - platform: state
        entity_id: input_select.vmc
        to: "Off"
    action:
      - service: switch.turn_off
        entity_id: switch.vmc_2
      - service: switch.turn_off
        entity_id: switch.vmc
```

The actions are changing the switch states to be sure we never have the 2 switches on at the same time
```
- service: switch.turn_off
  entity_id: switch.vmc_2
- delay: 5
- service: switch.turn_on
  entity_id: switch.vmc
```
Before it will switch off the one we don't need anymore, wait 5 seconds (or whatever... I even think it is not necessary at all, but I preferred to keep it safe with a little delay) and switch on the other switch.

With a *sensor* we can track the VMC status and speed:
```
- platform: template
  sensors:
    vmc_status:
      friendly_name: VMC Status
      icon_template: >
        {% if is_state("switch.vmc", "on") and is_state('switch.vmc_2', 'off') %}
         mdi:fan-speed-1
        {% elif is_state("switch.vmc_2", "on") and is_state('switch.vmc', 'off') %}
          mdi:fan-speed-2
        {% elif is_state('switch.vmc', 'off') and is_state('switch.vmc_2', 'off')%}
          mdi:fan-off
        {% else %}
          mdi:fan-alert
        {% endif %}
      value_template: >
        {% if is_state('switch.vmc', 'on') and is_state('switch.vmc_2', 'off') %}
          Vitesse 1
        {% elif is_state('switch.vmc_2', 'on') and is_state('switch.vmc', 'off') %}
          Vitesse 2
        {% elif is_state('switch.vmc', 'off') and is_state('switch.vmc_2', 'off')%}
          Off
        {% else %}
          failed
        {% endif %}
```

For a simple integration, this is everything you need. You can display everything in a Lovelace card to control your VMC:

```
type: entities
entities:
  - entity: sensor.vmc_status
    icon: ''
    secondary_info: last-changed
  - entity: input_select.vmc
state_color: true
title: VMC
show_header_toggle: false
```
giving you something like:

![image.png](/images/smart-vmc-mechanical-ventilation-system/05-RLCrhcYXQ.png)

## Full Automation
This is quite cool, isn't it? But making the VMC smart is to give full autonomy to your home, and keep always **the good parameters** (the VMC speed). If we keep only a button to change it manually, there is not many differences from the initial classical button.

In my case I installed [a device](https://sonoff.tech/product/smart-home-security/snzb-02/) in each room, giving me the temperature and the humidity. Depending on the version and the brand of the device you can have even the pressure, the CO2, ... or several other parameters.

So, we can easily automate based on the humidity of rooms!!

```
- id: shutdown_vmc_based_humidity
  alias: Auto VMC Off Humidity < 55
  trigger:
    - platform: time_pattern
      minutes: "/30"
  condition:
    - and:
        - condition: numeric_state
          entity_id: sensor.humidity_114
          below: 55
        - condition: numeric_state
          entity_id: sensor.humidity_112
          below: 55
        - condition: numeric_state
          entity_id: sensor.humidity_93
          below: 55
        - condition: template
          value_template: "{{ not is_state('input_select.vmc', 'Off') }}"
  action:
    - service: input_select.select_option
      target:
        entity_id: input_select.vmc
      data:
        option: "Off"

- id: startup_vmc_based_humidity
  alias: Auto VMC On 55 < Humidity < 70
  trigger:
    - platform: time_pattern
      minutes: "/30"
  condition:
    - and:
        - condition: numeric_state
          entity_id: sensor.humidity_114
          above: 55
        - condition: numeric_state
          entity_id: sensor.humidity_114
          below: 70
        - condition: numeric_state
          entity_id: sensor.humidity_112
          above: 55
        - condition: numeric_state
          entity_id: sensor.humidity_112
          below: 70
        - condition: numeric_state
          entity_id: sensor.humidity_93
          above: 55
        - condition: numeric_state
          entity_id: sensor.humidity_93
          below: 70
        - condition: template
          value_template: "{{ not is_state('input_select.vmc', 'Vitesse 1') }}"
  action:
    - service: input_select.select_option
      target:
        entity_id: input_select.vmc
      data:
        option: "Vitesse 1"

- id: increase_vmc_speed_based_humidity
  alias: Auto VMC Speed 2 Humidity > 70
  trigger:
    - platform: time_pattern
      minutes: "/30"
  condition:
    - and:
        - or:
            - condition: numeric_state
              entity_id: sensor.humidity_114
              above: 70
            - condition: numeric_state
              entity_id: sensor.humidity_112
              above: 70
            - condition: numeric_state
              entity_id: sensor.humidity_93
              above: 70
        - condition: template
          value_template: "{{ not is_state('input_select.vmc', 'Vitesse 2') }}"
  action:
    - service: input_select.select_option
      target:
        entity_id: input_select.vmc
      data:
        option: "Vitesse 2"
```

In my configuration, I'm checking 3 rooms: the kitchen, the bathroom, and the toilet (each one is having the VMC air link). We need to take care of the "OR" and "AND" to prevent 2 actions to be triggered at the same time.
* If the humidity **in all the rooms** is less than 55%: power off the VMC
* If the humidity is in a selected interval for all the rooms: Speed 1
* If the humidity is higher than a defined value (70%) in **at least** one room: Speed 2

About the humidity values you can put whatever you want... on my side, I based the automation on the idea that the internal humidity, to be comfortable, should be between 40% and 70%.

I'm triggering with a time pattern and not directly on the humidity value to prevent a lot of speed changes when the humidity is around the selected limit. With the time trigger, once changed, the configuration will be kept for at least 30 minutes.

When automation has a valid trigger and condition, the action is changing the input_select, and not directly the switch. In this way, we are keeping our configuration safe because we have only one component (the input_select) controlling our VMC and the two switches. Even if 2 automation, due to a wrong configuration, will be fired at the same time, they are changing the input_select value that can be single, resulting in a specific final VMC state.

When everything will be OK, your VMC will react to the humidity to keep a confortable home environment

![image.png](/images/smart-vmc-mechanical-ventilation-system/06-wTKC5vwdA.png)
