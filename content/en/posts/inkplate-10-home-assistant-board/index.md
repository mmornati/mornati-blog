---
title: InkPlate 10 Home Assistant Board
tags:
- dashboard
- smart-home
- home-assistant
date: '2022-10-30T19:28:34.037000+00:00'
slug: inkplate-10-home-assistant-board
---



When you move everything to "smart", you may lose some information. What about if your room temperature is measured and sent to a "computer" to show it on a dashboard? How you can see the information without a mobile or a PC?
It is becoming interesting or required, to have a physical board somewhere.

I took time to check how to push information over a tablet, but autonomy and especially the "hi tech" device in the living room, is not fitting into all the family's loved styles.
So after a long period, I found a good alternative using an e-ink screen with an ESP32 microcontroller.

![PXL_20221028_105806914.jpeg](/images/inkplate-10-home-assistant-board/00-0tdqckze3.jpeg)

### Device Description
I bought a [InkPlate 10"](https://www.crowdsupply.com/soldered/inkplate-10) which is giving a correct size board in a complete board. The ESP32 microcontroller is coming with a built-in WiFi controller and is largely used today in many SmartHome devices. This is giving you access to a lot of pre-built resources for any kind of usage.

In the board I received, as shown on a board sticker, there is a GPIO controller missing due to the current chip shortage. 😱 Not so critical for me as I didn't plan to use it in my tests.

![image.png](/images/inkplate-10-home-assistant-board/01-GjBTMnTIT.png)

To complete the devices you would love to buy a 3.7V battery pack. This will allow you to use the InkPlate without a permanent power link. You can in this way plan to put it almost everywhere in your house.


![PXL_20221030_132437671.jpeg](/images/inkplate-10-home-assistant-board/02-Jue_tpJi7.jpeg)
![PXL_20221030_132835722.jpeg](/images/inkplate-10-home-assistant-board/03-rpm2PbHaq.jpeg)

**WARNING**: take care when you look for the battery about the polarity. On the net (personally, I looked on Amazon) there are a lot of models with reversed polarity.

### Device Configuration
To start using the InkPlate device you just need to put a firmware in your ESP32 microcontroller and do everything you want: you have a screen, you have a microcontroller... few lines of code and there you go. 
In my case, I just wanted to display an HomeAssistant (kiosk) dashboard, in real-time or updated every while during the day.
And looking on the NET you will surely find what you need without losing a lot of time to start. For what I needed, the [HomePlate](https://github.com/lanrat/homeplate) repository is having all the information I needed to start with a ready to go firmware.

You have a very few steps to do:

* copy the `config_exemple.h` file into `config.h`
* put the information you need for WiFi, MQTT, ... and the image URL to display. To simplify the board display it must be converted into an image
* install the PlatformIO cli. On Mac is quite easy with brew `brew install platformio`
* Build the homeplate sources with the device connected to the USB-C port to your Mac: `pio run`

![image.png](/images/inkplate-10-home-assistant-board/04-Lq5BQiWrB.png)

![PXL_20221029_200914317.jpeg](/images/inkplate-10-home-assistant-board/05-G4Z2E52BN.jpeg)
![PXL_20221029_213540670.jpeg](/images/inkplate-10-home-assistant-board/06-kxMo2N4f3.jpeg)

### Create HA Board Image
As described in the repository, there is a simple way to create a board image. Once again is something you can find online: [hass-lovelace-kindle-screensaver](https://github.com/sibbl/hass-lovelace-kindle-screensaver).

There is a simple `docker-compose.yaml` file you have to configure with your HA information and start it up. In my case, I preferred to run it on a separed RPi I already had and using for some other tools.

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

* the `CRON_JOB` can be configured to reduce the number of screenshot. 
* `RENDERING_SCREEN_HEIGHT` and `RENDERING_SCREEN_WIDTH` with the InkPlate screen size
* `ROTATION` depending how you want to display your board (horizontal or vertical)


Now that everything is configured you can enjoy your physical dashboard.


![PXL_20221030_145515531.jpeg](/images/inkplate-10-home-assistant-board/07-vKgOU_458.jpeg)
