---
title: Qubino ZMNHJD1 and Home Assistant installation
date: '2018-11-03T23:00:00+00:00'
slug: qubino-zmnhjd1-and-home-assistant-installation
categories:
  - Smart Home
  - DIY
  - IoT
tags:
  - qubino
  - home-assistant
  - zwave
  - radiator
  - smart-home
description: >-
  Setting up the Qubino ZMNHJD1 pilot wire module for electric radiator control
  via ZWave+ and Home Assistant, including temperature sensor integration and
  automation configuration.
---

## Overview

The first device I added to my Smart Home installation after the addition of the ZWave protocol is the [**Qubino ZMNHJD1**](https://www.amazon.co.uk/ZMNHJD1-Pilot-Module-Electric-Radiator/dp/B01HHCCVGY/ref=sr_1_1?ie=UTF8&qid=1541363277&sr=8-1&keywords=ZMNHJD1) module.

![Image for post](/images/qubino-zmnhjd1-and-home-assistant-installation/00-0_YtmUpzsaHP6Kl9mP.jpg)

This is a pilot wire module for an electric radiator working on the ZWave+ network, which means you can add a temperature sensor and use it to script the radiator control.
You can link this module to an electric radiator with 4 or 6 orders.

![Image for post](/images/qubino-zmnhjd1-and-home-assistant-installation/02-0_2JdxUAumH385qHvX.jpg)

![Image for post](/images/qubino-zmnhjd1-and-home-assistant-installation/04-0_LcA18KHK1bfeBwOc.jpg)

The Qubino will allow the remote control (via the ZWave signal) this part of your radiator and not directly — well, depending on the order, you can change the temperature.

## Installation

The global installation is really easy and the instructions that come with the module (or online) can help you reach your goal.

In the end, just link the power to the Qubino module on the "L" and "N" connectors and then the Pilote Wire to the "Q" one.

Yeah I know, I didn't use the right cables… but I had nothing else at home and I wanted to use it as soon as possible.
In my case, I also added the temperature sensor [ZMNHEA1](https://www.amazon.co.uk/Qubino-Temperature-Sensor-Z-Wave-ZMNHEA1/dp/B00R6FH410/ref=pd_sim_201_1?_encoding=UTF8&pd_rd_i=B00R6FH410&pd_rd_r=1f91ae0a-e070-11e8-a8ce-4d34901cd81c&pd_rd_w=heHcY&pd_rd_wg=SEkcB&pf_rd_i=desktop-dp-sims&pf_rd_m=A3P5ROKL5A1OLE&pf_rd_p=1e3b4162-429b-4ea8-80b8-75d978d3d89e&pf_rd_r=QFJ5KK9FF34ZK3SCTN8Q&pf_rd_s=desktop-dp-sims&pf_rd_t=40701&psc=1&refRID=QFJ5KK9FF34ZK3SCTN8Q) to the module.

## Home Assistant Configuration

![Image for post](/images/qubino-zmnhjd1-and-home-assistant-installation/06-0_WZlVVwLsW0inKbXn.png)

Once completed you can synchronize the module and your ZWave installation simply with a click on the module button for 5 seconds (all the instructions are inside the module itself) and then a similar operation on your ZWave "server" (Home Assistant in my case).

![Image for post](/images/qubino-zmnhjd1-and-home-assistant-installation/08-0_5gxg2zW_ltxiOD97.png)

Click on the **Add Node Secure** button in the ZWave configuration section to start the modules search.
If all worked well you will find the new Qubino device in the list of linked nodes.

## Qubino Configuration

![Image for post](/images/qubino-zmnhjd1-and-home-assistant-installation/10-0_ygKR_s_ZzAyi8W3D.png)

The last step is configuring it through HAssio of your electric radiator.
The list of available sensors and commands, visible in the node panel of the Qubino device, should be like the following one:

**pilot_wire_level**: it is the value actually configured on the pilot wire which allows to identify the order set.
**pilot_wire_switch**: used to set the desired order sending a correct value on the pilot wire
**pilot_wire_temperature**: if you linked the temperature sensor, you will find the temperature value checking on this sensor
The other controls are useful only if you linked your qubino using the optional "buttons"

![Image for post](/images/qubino-zmnhjd1-and-home-assistant-installation/12-0_yCme20J1CVvAQ1vv.jpg)

**Yes, but what are the correct values to set for each order?**
In the following table, available on the net, you can figure out what to do…

Maybe… Ok, definitely not easy to figure out which are the right values. In my case, I spent several hours before figuring out what to put in the configuration (and once again, the internet was my friend) and a couple of months to be sure about the configuration because I installed it at the end of the summer and the radiator wasn't working yet.

## Automations

Here what I configured for my 6 orders radiator, into the **automations.yaml** file.

```yaml
- alias: Set Qubino to Comfort
  initial_state: 'off'
  trigger:
    platform: state
    entity_id: input_select.qubino
    to: 'Comfort'
  action:
    service: light.turn_on
    entity_id: light.qubino_zmnhjd1_flush_dimmer_pilot_wire_level
    data:
      brightness: 100
  id: 322e1962112842dab4defab990286212
- alias: Set Qubino to Comfort -1
  initial_state: 'off'
  trigger:
    platform: state
    entity_id: input_select.qubino
    to: 'Comfort -1'
  action:
    service: light.turn_on
    entity_id: light.qubino_zmnhjd1_flush_dimmer_pilot_wire_level
    data:
      brightness: 45
  id: bb19039062934ca5ba4f26ead890b4ee
- alias: Set Qubino to Comfort -2
  initial_state: 'off'
  trigger:
    platform: state
    entity_id: input_select.qubino
    to: 'Comfort -2'
  action:
    service: light.turn_on
    entity_id: light.qubino_zmnhjd1_flush_dimmer_pilot_wire_level
    data:
      brightness: 35
  id: ee3069bd1f16476ea33ff4b1a875575a
- alias: Set Qubino to Eco
  initial_state: 'off'
  trigger:
    platform: state
    entity_id: input_select.qubino
    to: 'Eco'
  action:
    service: light.turn_on
    entity_id: light.qubino_zmnhjd1_flush_dimmer_pilot_wire_level
    data:
      brightness: 25
  id: 8397b8f4cccd4dca90996ba38e760ba4
- alias: Set Qubino to Anti Freeze
  initial_state: 'off'
  trigger:
    platform: state
    entity_id: input_select.qubino
    to: 'Anti Freeze'
  action:
    service: light.turn_on
    entity_id: light.qubino_zmnhjd1_flush_dimmer_pilot_wire_level
    data:
      brightness: 15
  id: 04d972cb89ba4fce96b669c95e4e4e48
- alias: Set Qubino to Stop
  initial_state: 'off'
  trigger:
    platform: state
    entity_id: input_select.qubino
    to: 'Stop'
  action:
    service: light.turn_off
    entity_id: light.qubino_zmnhjd1_flush_dimmer_pilot_wire_level
    data:
      brightness: 0
  id: 9d3e9fcf237449eaac1bd771e1509b0b
```

I then add a simple input to allow a quick configuration of the radiator status:

```yaml
input_select:
  qubino:
    name: Qubino Modes
    options:
      - Off
      - Anti-Freeze
      - Eco
      - Comfort -2
      - Comfort -1
      - Comfort
    initial: Comfort
```

![Image for post](/images/qubino-zmnhjd1-and-home-assistant-installation/14-0_LkwbPe4ik82Hluku.png)

This results in a combo box with the allowed values for your Qubino.

![Image for post](/images/qubino-zmnhjd1-and-home-assistant-installation/16-0_yFRDa8ppqqo0MbDM.png)

And then for sure, you can add the temperature sensor somewhere in your interface. A complete configuration using all the commands can be something like the following:

If you want you can find the whole configuration I'm using at home on my GitHub repository: [https://github.com/mmornati/home-assistant-config](https://github.com/mmornati/home-assistant-config)

Are you ready for winter? :)

_Originally published at_ [_https://blog.mornati.net_](https://blog.mornati.net/qubino-device-for-electric-radiator/) _on November 4, 2018._