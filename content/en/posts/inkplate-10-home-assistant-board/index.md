---
title: InkPlate 10 Home Assistant Board
tags:
- dashboard
- smart-home
- home-assistant
categories:
- Smart Home
- DIY
- Home Assistant
description: 'Build a physical Home Assistant dashboard using the InkPlate 10" e-ink screen with ESP32 — a battery-powered, low-profile display for your smart home.'
date: '2022-10-30T19:28:34.037000+00:00'
slug: inkplate-10-home-assistant-board
---


When you move everything to "smart", you might lose some information. What about if your room temperature is measured and sent to a "computer" to show it on a dashboard? How do you see the information without a phone or PC?
It becomes interesting, even necessary, to have a physical display somewhere.

I spent time looking into using a tablet, but battery life and the high-tech look doesn't fit everyone's style.
So after a long period, I found a good alternative using an e-ink screen with an ESP32 microcontroller.

![PXL_20221028_105806914.jpeg](/images/inkplate-10-home-assistant-board/00-0tdqckze3.jpeg)

### Device Description
I bought a [InkPlate 10"](https://www.crowdsupply.com/soldered/inkplate-10) which offers a good-sized display in a complete package. The ESP32 microcontroller comes with built-in WiFi and is widely used in smart home devices today. This gives you access to many pre-built resources for any kind of usage.

The board I received has a missing GPIO controller, as noted on the sticker, due to the current chip shortage. 😱 Not critical for me since I didn't plan to use it.

![image.png](/images/inkplate-10-home-assistant-board/01-GjBTMnTIT.png)

To complete the setup, you'll want to buy a 3.7V battery pack. This lets you use the InkPlate without a permanent power connection, so you can place it almost anywhere in your house.


![PXL_20221030_132437671.jpeg](/images/inkplate-10-home-assistant-board/02-Jue_tpJi7.jpeg)
![PXL_20221030_132835722.jpeg](/images/inkplate-10-home-assistant-board/03-rpm2PbHaq.jpeg)

**WARNING**: be careful about battery polarity — there are many models with reversed polarity online.

### Device Configuration
To start using the InkPlate device you just need to flash firmware to the ESP32 and do whatever you want: you have a screen, you have a microcontroller... few lines of code and there you go. 
In my case, I just wanted to display a Home Assistant dashboard, updated periodically throughout the day.
And looking on the NET you'll surely find what you need without spending much time to start. For what I needed, the [HomePlate](https://github.com/lanrat/homeplate) repository is having all the information I needed to start with a ready to go firmware.

You have a very few steps to do:

* copy `config_exemple.h` to `config.h`
* add your WiFi, MQTT, and image URL. The board display needs the image pre-converted
* install the PlatformIO cli. On Mac, it's easy with Homebrew `brew install platformio`
* Build the Homeplate sources with the device connected to your Mac via USB-C: `pio run`

![image.png](/images/inkplate-10-home-assistant-board/04-Lq5BQiWrB.png)

![PXL_20221029_200914317.jpeg](/images/inkplate-10-home-assistant-board/05-G4Z2E52BN.jpeg)
![PXL_20221029_213540670.jpeg](/images/inkplate-10-home-assistant-board/06-kxMo2N4f3.jpeg)

### Create HA Board Image
As described in the repository, there is a simple way to create a board image. Once again, this is something you can find online: [hass-lovelace-kindle-screensaver](https://github.com/sibbl/hass-lovelace-kindle-screensaver).

There is a simple `docker-compose.yaml` file you have to configure with your HA information and start it up. I preferred to run it on a separate Raspberry Pi I already had and using for some other tools.

```
version: "3.8"

services:
  app:
    image: sibbl/hass-lovelace-kindle-screensaver:latest
    environment:
      - HA_BASE_URL=http://192.168.xx.xx:8123
      - HA_SCREENSHOT_URL=/lovelace-kiosk/0?kiosk
      - HA_ACCESS_TOKEN=xxxxx
      - CRON_JOB=0/5 * * * *
      - RENDERING_TIMEOUT=30000
      - RENDERING_DELAY=0
      - RENDERING_SCREEN_HEIGHT=825
      - RENDERING_SCREEN_WIDTH=1200
      - GRAYSCALE_DEPTH=8
      - OUTPUT_PATH=/output/cover.png
      - LANGUAGE=en
      - ROTATION=0
      - SCALING=1
    ports:
      - 5000:5000
    volumes:
      - ./output/:/output
```

Some important things here:

* the `CRON_JOB` setting controls how often screenshots are taken. 
* `RENDERING_SCREEN_HEIGHT` and `RENDERING_SCREEN_WIDTH` should match the InkPlate screen size
* `ROTATION` depending how you want to display your board (horizontal or vertical)


Now that everything is configured you can enjoy your physical dashboard.


![PXL_20221030_145515531.jpeg](/images/inkplate-10-home-assistant-board/07-vKgOU_458.jpeg)