---
title: Home Assistant with RPi4 - Improvements
tags:
- raspberry-pi
- smart-home
categories:
- Smart Home
- DIY
- IoT
description: Upgrading my Raspberry Pi 4 Home Assistant setup with an SSD, UPS module, and ConBee II — moving off the SD card for reliability and performance.
date: '2021-04-24T20:07:12.622000+00:00'
slug: home-assistant-with-rpi4-improvements
---

## Overview

I started with Home Assistant over RPi more or less 3 years ago. The reason was simple: I needed to add protocols for what I was using at home and in the Smart Home Box universe you should choose between a few protocols or an incredible price (and maybe anyway not all the protocols you want to use).

At the beginning, my Hass was controlling only a couple of ZWave devices and now, after moving into a new house 8 months ago, everything is under Home Assistant control. This means no more external custom doomed boxes.

## Why Centralize?

The first reason: when you start adding smart devices you will have after a while a great number of custom applications to control each of them. Philips Hue, iRobot, Somfy, Netatmo, Xiaomi, Konyks, ... it's crazy.

![Screenshot_20210424_193804.jpeg](/images/home-assistant-with-rpi4-improvements/00-t8wTBIt7L.jpeg)

There's a second reason: when we moved into the new house I started adding a lot of lights and accessories on the philips hue bridge. Quickly I had problems on some accessories disconnected or with an incredible lag answering to a command. On the [Hue website](https://www.philips-hue.com/en-us/p/hue-bridge/046677458478#:~:text=Add%20smart%20switches%2C%20sensors%2C%20and,and%20fully%20automate%20your%20home.) there is information I didn't see before: you can add **up to 12 devices** to the Hue Bridge. **12 devices are really nothing**! You have switches (!), movement captors, temperature captors, dry captors, ... and only with switches I had more than 12 🤬

![image.png](/images/home-assistant-with-rpi4-improvements/01-lgGAKH76v.png)

So I moved my Philips Hue installation to Hass via the [ConBeeII key](https://phoscon.de/en/conbee2)... that's rock!

## So why more improvements?

There is a bad thing in the "standard" RPi installation: the SD Card. SD cards aren't designed for when you have a lot of writes... and Hass is writing a lot on the disk for logging, database information, ... And when the lifecycle of the SD Card is ended it simply breaks and you will lose your SmartHome box.

And another fact is about performances: SD Card compared to a standard SSD is very slow in IO. I didn't take the time to test on my configuration, but there are tons of posts on the net showing this. Just proposing [one](https://www.tomshardware.com/news/raspberry-pi-4-ssd-test,39811.html).

## The Upgrade Kit

Looking on the net, it seems that when you want to pimp up your RPi there is a leader on that: [Geekworm](https://geekworm.com/). You have lot of devices on their website to add the UPS "function", connect a disk, a bigger box, ... The only "bad thing" is that you don't get any documentation with the devices, but in the end, who cares when you have the internet? 😁

I chose my kit in a couple of days especially checking a very important thing: the availability 😜 And I went for the [X857-C3](https://geekworm.com/products/for-raspberry-pi-4-x857-msata-ssd-shield-x857-c1-case-x708-ups-power-mgnt-board-dc-5v-4a-power-supply-kit?_pos=4&_sid=e49ee8fb6&_ss=r)

![image.png](/images/home-assistant-with-rpi4-improvements/02-CsAQGEf9N.png)

That's in the end quite impressive... but I think nevermind the kit, you will always have a similar result: a module for the power management/UPS (with or without a battery kit), a module for the external disk (SATA or mSATA) and the external case.

Assembling it with the proper video is quite simple... even without it is not so complex, but it's important to know where the cables need to be connected to the power supply board... and that's not easy without the proper board documentation.

![IMG_20210422_200543.jpg](/images/home-assistant-with-rpi4-improvements/03-KCVRrPEhz.jpeg)

![IMG_20210422_204829.jpg](/images/home-assistant-with-rpi4-improvements/04-FnqNlPbPg.jpeg)

![IMG_20210422_204158.jpg](/images/home-assistant-with-rpi4-improvements/05-bnqosmGWn.jpeg)

![IMG_20210422_204832.jpg](/images/home-assistant-with-rpi4-improvements/06-kF9JHoSRk.jpeg)

![IMG_20210422_205115.jpg](/images/home-assistant-with-rpi4-improvements/07-AJchr0p_B.jpeg)

## Installation

Then the OS installation part: how can I move my operating system from the SD to the SSD without losing all the configuration... adding back all the devices, which are now more than one hundred, it is definitely not a thing I want to do 😁

But **Home Assistant really shines here** you'll be ready in just a few minutes (less than 5 in my case).

1. Start the RPi4 with a rasbian on an SD card.
2. Upgrade the EEPROM to have the final bootloader version (you need it to select the proper boot order). Just check the [official documentation](https://www.raspberrypi.org/documentation/hardware/raspberrypi/booteeprom.md) for it or any blog post on the net.
3. Install a fresh HassOS version on the SSD (usually */dev/sda* in your RPi4). The Hass documentation show you [how to install using Balena Etcher](https://www.home-assistant.io/installation/raspberrypi) but this requires that you can connect the SSD to your laptop. In my case the mSATA via USB was not working... so I just made it on the CLI in Raspbian.
```
xz -dc hassos.img.xz | sudo dd of=/dev/sda
```
4. Remove the SD Card and reboot. If all the previous steps were good, you will have a new Hass installation
5. Copy from the original SDCard the latest snapshot (it is maybe important to make a fresh one just before starting this procedure as Step0!) into the */backup* folder.
6. Browse the Hass web interface into the snapshot restore page and you should see the copied one. Select it and restore...
7. On the SSD, this takes just a few seconds for this operation... then the HassIO will reboot and you will get back your SmartHome Box!

## Known Issues

Known right now, but I spent a little bit (too much) to figure out why. The ConBeeII Key linked to the RPi4 USB is not working due to interferences with the <strike>mSATA disk (or SATA seems the same problem)</strike> USB3 port where I linked the external Disk. The problem, as explained in the [Intel Whitepaper](https://www.intel.fr/content/www/fr/fr/products/docs/io/universal-serial-bus/usb3-frequency-interference-paper.html), is related to the USB3 technical design.

You have some information on the [deconz GitHub repo](https://github.com/dresden-elektronik/deconz-rest-plugin/issues/1803).

The solution is just to move the ConBee2 stick away from the RPi, with a long USB cable.

In the end, my installation looks the following... a bit crazy but it is working.

![image.png](/images/home-assistant-with-rpi4-improvements/08-hnu7oSta_.png)

Hope this could help someone of you installing and configuring a secured smart home box. Feel free to contact me if you have any kind of questions or doubt about the procedure.