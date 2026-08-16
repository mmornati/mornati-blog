---
title: Smart Water Heater with Home Assistant and Shelly device
tags:
- automation
- smart-home
- home-assistant
- shelly
date: '2022-08-24T10:00:00.627000+00:00'
slug: smart-water-heater-with-home-assistant-and-shelly-device
---



Going ahead making my home smarter and, hopefully, reduce the electricity invoice by being more environmentally friendly... if adding electric devices can be considered in this way 😩 

This time I want to share how I made my water heater smarter... and I decided to do it by looking at my electricity consumption graphic during my 2 weeks holidays.

![image.png](/images/smart-water-heater-with-home-assistant-and-shelly-device/00-Qpqvjva8r.png)

During the night the consumption was high (at least higher than during the day) and for the rest of the day, only the smart devices, internet box, camera, ... Why that? Because our water heaters (we have 2) are statically configured to work every night at about 2 o'clock. But nobody will use the water... and it was heat every day. 😱😱 That made me crazy... I could shut them down before leaving (but I dismembered)... but in this way, the first day at home you won't have hot water (because it takes several hours).

## Water Heater power circuit?
In my case, I had a "Day Night circuit breaker" piloted by an electronic clock.

![schema-contact-jour-nuit.png](/images/smart-water-heater-with-home-assistant-and-shelly-device/01-m3eZEmNor.png)

There is a 25A circuit used to power up the water heater and a second one, 2A, powering the clock and giving the signal to the day/night circuit breaker.
When the clock gives a signal to the day/night device, this will let the power from the 20A circuit go to the water heater.
In some cases, you can replace the clock with the electrical company day/night switch but the working process is exactly the same.

## Which module?
It depends on your installation, but the thing to keep in mind is that a water heater is a power consumption device, and It is maybe not a good idea to power it up via a smart device.
Following the previous schema, the easiest way to make it smarter is to replace the clock with a smart switch.

After a while of looking online I decided to test a Shelly device: the [Shelly Plus 1](https://shelly.cloud/shelly-plus-1/).
I only needed a little change in my electrical configuration

![schema-jn-shelly.png](/images/smart-water-heater-with-home-assistant-and-shelly-device/02-4lwzcBNDW.png)

Now the signal to activate the day/night circuit breaker is given by the shelly device.
Quite easy isn't it? 😎

## Configuration
First of all, you need to configure the device within the Shelly application. Just follow
the instruction provided with the device and in a couple of minutes, you are ready to go.

![Screenshot_20220823-220709.png](/images/smart-water-heater-with-home-assistant-and-shelly-device/03-kOUyeW_Mm.png)

If you don't have a SmartHome Box or you don't want to integrate it, you can do everything within the Shelly application:
![Screenshot_20220823-221048.png](/images/smart-water-heater-with-home-assistant-and-shelly-device/04--cvUhUQmR.png)

To proceed to Home Assistant you may need to install the latest firmware version for your Shelly device (always inside the application) which is required by the HA integration.

## Home Assistant
To import your Shelly device into Home Assistant you need to install the [Shelly Integration](https://www.home-assistant.io/integrations/shelly/) and then provide your device IP. 

![image.png](/images/smart-water-heater-with-home-assistant-and-shelly-device/05-m3Mhe202a.png)

There are some configurations to let the full control of the Shelly device within Home Assistant (Update, Reboot, ...) but to work with your water heater you just need the switch one.

From now on, it is like any other automation. How do you want to control it? When? Based on a sensor or not? ... And just configure accordingly.

In my case, the French electric company gave me 2 timeframes each day with a reduced cost: one during the night and one during the day. I decided to let it work during the night timeframe.

```
- id: water_heater_on
  alias: "Water Heater ON"
  mode: parallel
  trigger:
    - platform: time
      at: "01:24:00"
  condition:
    - condition: state
      entity_id: input_boolean.vacation
      state: "off"
  action:
    - service: switch.turn_on
      entity_id: switch.shellyplus1_XXXXXXXX_switch_0
- id: water_heater_off
  alias: "Water Heater OFF"
  mode: parallel
  trigger:
    - platform: time
      at: "07:24:00"
  condition:
    - condition: state
      entity_id: input_boolean.vacation
      state: "off"
  action:
    - service: switch.turn_off
      entity_id: switch.shellyplus1_XXXXXXXX_switch_0
```

So, coming back to my initial frustration, there is an added flag compared to the static configuration I had before:

```
condition:
    - condition: state
      entity_id: input_boolean.vacation
      state: "off"
```

The Water Heater is started at the defined time, but only if I'm not on holiday (and not home). Hopefully, I will be able to be more green 😎
