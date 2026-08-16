---
title: 'Home Assistant: use ZigBee buttons to control other protocol devices'
tags:
- automation
- home-assistant
- zigbee
- zigbee2mqtt
- mosquitto
date: '2022-12-31T07:40:41.972000+00:00'
slug: home-assistant-use-zigbee-buttons-to-control-other-protocol-devices
categories:
- Smart Home
- DIY
- Home Assistant
description: Use ZigBee buttons to control devices on different protocols via Home Assistant automation and Zigbee2MQTT events.
---

In this blog post, I'll show how you can use ZigBee in a completely different and unusual way.  
You can control devices using a different protocol (e.g., Z-Wave covers), but more importantly, use different buttons on the same controller for different devices or perform different actions based on the number of clicks within a short period.

Do you know the [Philips Hue Switch](https://www.philips-hue.com/fr-fr/p/hue-hue-dimmer-switch--modele-le-plus-recent-/8719514274617)? When you bind it to lights, each button gets a fixed function: toggle, increase or decrease intensity, and play a scenario. But I never used some of those buttons.

I'll describe everything using my actual **Zigbee2MQTT** setup. By adjusting the event part, it can be adapted to any ZigBee add-on.

## The Direct Binding

The standard way to configure a switch is by binding it to a light or group within the add-on.

![](/images/home-assistant-use-zigbee-buttons-to-control-other-protocol-devices/00-61568862-81bb-4e3c-bd18-e22efc2bee69.png)

The big advantage: the button and light are directly connected, so they work even without Home Assistant or Zigbee2MQTT. This way, regardless of restarts or upgrades, the lights can still be controlled physically.

The downside is that within Zigbee2MQTT, you can only do a simple bind — the switch does what it's designed to do by default.

## Button events

An alternative is to detect generated events and automate based on them.  
But there are side effects: events only reach Home Assistant when ZigBee automation is running, and automations only execute when the core is up. So buttons may go offline during maintenance. This is important — it can be a pain for your family if you're always tinkering with Home Assistant 😅😱

### What events are produced by my switch

Each button always produces an event sent to Home Assistant. This means you don't need to change anything in your configuration to switch from binding to events.  
But, what events does your button produce? It depends on the button — even the brand can change how events are generated.

To discover them, start a listener in the Home Assistant developer tools, and as I said at the beginning the event depends on your add-on: for Deconz it's `deconz_event`, for ZHA it's `zha_event`, etc. And what about ZigBee2MQTT? Events are sent as messages on the message broker. So, instead of listening to an event, you can listen to a message topic. 😎

I'm doing this directly on the terminal. I'm not sure if there's a better way, but this one is simple enough.

```bash
mosquitto_sub -h 127.0.0.1 -v -t "zigbee2mqtt/switch_entree"
```

The important part is the `-t` parameter (topic): use your device name after `zigbee2mqtt`.

**WARNING**: in the latest Mosquitto version, you need strong authentication. Add `-u` and `-P` parameters to provide the username and password.

Once the script is executed, if an event of the device you want to check comes up, you will see it on the screen.

![](/images/home-assistant-use-zigbee-buttons-to-control-other-protocol-devices/01-48f5d445-53f5-49f6-982c-4f259b7d13b8.png)

In the screenshot, you have all the `action` related to the Philips Hue Switch (the first generation): `on_press`, `up_press`, `up_press_release`, ...  
You can then use the desired ones within your automation, and even add other parameters coming in each event to trigger your action differently.

If these steps don't show events, you can change the topic or listen for all events coming from ZigBee2MQTT. For this just use the *wildcard* as the topic name: `-t "zigbee2mqtt/#"`  
In this way, you'll see **a lot** of events if you have a large network!

![](/images/home-assistant-use-zigbee-buttons-to-control-other-protocol-devices/02-300995b0-291e-451d-a152-3328c4ffc097.png)

## The Automation

Now we have everything needed to set up the automation.  
I provide here an example:

```bash
- alias: Switch Toggle Entree
  id: switch_toggle_entree
  trigger:
    platform: mqtt
    topic: "zigbee2mqtt/switch_entree_02"
  condition:
    condition: template
    value_template: '{{ "on_press" == trigger.payload_json.action }}'
  action:
    entity_id: light.entree
    service: light.toggle

- alias: Switch Toggle Escalier
  id: switch_toggle_escalier
  trigger:
    platform: mqtt
    topic: "zigbee2mqtt/switch_entree_02"
  condition:
    condition: template
    value_template: '{{ "off_press" == trigger.payload_json.action }}'
  action:
    entity_id: light.escalier
    service: light.toggle
```

The switch's upper button toggles a light, and the "off button" another one. The toggle service is just changing the state based on the actual one: if powered on, the light will be switched off; and the opposite.

But with automation, a world of possibilities opens up 😎 We can change the light intensity based on the hour of the day: if it is after midnight but before 7 AM the light is powered on at 30%, 100% all other hours.

This is where you need to weigh the side effects against what you gain from automation.