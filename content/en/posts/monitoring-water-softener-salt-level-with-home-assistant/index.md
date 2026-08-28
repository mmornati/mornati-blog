---
title: 'Monitoring Your Water Softener Salt Level with Home Assistant'
categories:
- smart-home
tags:
- smart-home
- home-assistant
- zigbee
- zigbee2mqtt
- water-softener
- iot
date: '2026-08-16T10:00:00.000000+00:00'
slug: monitoring-water-softener-salt-level-with-home-assistant
translationKey: monitoring-water-softener-salt-level-with-home-assistant
description: How to monitor your water softener salt level using a waterproof Zigbee water leak sensor and Home Assistant automation.
cover: cover.png
showHero: true
---

If you have a water softener at home, you know how important it is to keep the salt reservoir filled. Running out of salt means hard water flowing through your home, which can damage appliances, leave scale deposits, and make your skin feel dry. But how do you know when it's time to refill before it's too late?

## The Smart Solution

Instead of manually checking the salt level (or forgetting to check until it's too late), you can implement a smart monitoring system using a **water leak sensor** placed directly in the salt tank. The concept is ingeniously simple:

> **When the salt level drops low enough that water reaches the sensor, it's time to refill.**

This approach works because in a water softener, the brine solution sits at the bottom of the tank. As salt dissolves, the water level remains stable, but when salt is nearly depleted, the sensor (placed at a strategic low point) gets wet - triggering an alert.

## The Recommended Device: Aqara Water Leak Sensor

I've been using the **Aqara Water Leak Sensor (model SJCGQ11LM)** for this purpose, and I recommend it for several reasons:

| Feature | Details |
|---------|---------|
| **Waterproof Rating** | **IP67** - Fully dustproof and waterproof |
| **Connectivity** | Zigbee (requires a compatible hub or Zigbee2MQTT) |
| **Battery Life** | Over 2 years on a single CR2032 battery |
| **Size** | Compact: 50mm diameter, fits easily in salt tanks |
| **Compatibility** | Works with Home Assistant via Zigbee2MQTT, ZHA, or Aqara Hub |

The **IP67 rating** is crucial here - the sensor will be submerged in water (or brine solution) regularly, and this rating ensures it can withstand being in the water without damage. The sensor detects water at just 0.5mm depth, making it perfect for early detection.

**Where to buy:**
- [Aqara Official Store](https://www.aqara.com/en/product/water-sensor.html)
- [Amazon](https://www.amazon.com/dp/B07D39MSZS)
- [AliExpress](https://www.aliexpress.com/item/4000071259351.html)
- [Domadoo (EU)](https://www.domadoo.fr/en/peripheriques/4519-aqara-capteur-d-eau-zigbee-6970504210257.html)

## Implementation

### 1. Zigbee2MQTT Configuration

First, ensure your sensor is paired with your Zigbee network. In your `zigbee2mqtt/configuration.yaml`, add a friendly name:

```yaml
'0x00158d00044f1bd4':
  friendly_name: water_sensor_softner
```

### 2. The Automation

This automation triggers when the water sensor detects water (meaning salt is low):

```yaml
- id: '1761499181494'
  alias: 'Water: Low Salt in Softener'
  description: Alert when water softener salt is low (sensor sits in salt tank; water reaching it means low salt).
  triggers:
  - entity_id: binary_sensor.water_sensor_softner_water_leak
    from: 'off'
    to: 'on'
    trigger: state
  conditions: []
  actions:
  - action: notify.notify
    data:
      message: '⚠️ Manque de sel dans l''adoucisseur ! Action requise : remplir le réservoir de sel.'
  mode: single
```

### How It Works

1. The sensor sits at the bottom of the salt tank, suspended above the brine solution
2. As long as there's enough salt, the sensor remains dry
3. When salt levels drop critically low, water contacts the sensor probes
4. The sensor sends a `water_leak: true` signal via Zigbee
5. Home Assistant detects the state change and triggers the automation
6. You receive a notification to refill the salt

## Customization Options

You can enhance this setup with:

- **Multiple notifications**: Add actions for email, Telegram, or voice announcements
- **Dashboard integration**: Add the sensor to your Home Assistant dashboard with a nice card
- **Historical tracking**: Monitor how often the sensor triggers to optimize your refill schedule
- **Smart valves**: Automatically shut off water if combined with a solenoid valve (advanced)

## Conclusion

This simple yet effective DIY solution transforms your water softener into a smart appliance. No more guessing or unexpected hard water days. The total cost is under €30 for the sensor, and the peace of mind is priceless.

---

**Related Articles:**
- [Integrating the Everblue Smart Water Meter with Home Assistant](/integrating-the-everblue-smart-water-meter-with-home-assistant/)
- [Home Assistant: Use ZigBee Buttons to Control Other Protocol Devices](/home-assistant-use-zigbee-buttons-to-control-other-protocol-devices/)
- [Home Assistant: Control Your Covers Based on Temperature](/homeassistant-close-cover-to-control-the-home-temperature-v2/)
