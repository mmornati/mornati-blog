---
title: Improve your Android battery life
date: '2013-09-12T22:00:00+00:00'
slug: improve-your-android-battery-life
categories:
  - Android
  - Apps
  - Tips
tags:
  - android
  - battery
  - nfc
  - tasker
  - automation
  - macrodroid
description: Automate your Android device to save battery life using NFC Task Launcher and Macrodroid — no more forgetting to toggle Bluetooth, WiFi, or GPS.
---

## Overview

I like to use my smartphone with all functions always activated, but this is naturally a thing which contributes negatively to battery life. I tried to switch off, for example, the Bluetooth when I'm not using it, but then I get back to my car and only when I'm receiving a phone call I discover I'm not linked with the car because I forgot to reactivate the Bluetooth function... So, no... I cannot use a device in this way. Recently I discovered a little (but powerful) application which helps me do this **automatically**: [**NFC Task Launcher**](https://play.google.com/store/apps/details?id=com.jwsoft.nfcactionlauncher&hl=en). Yes, the name suggests you use it with NFC tags, but the developers also added other interesting features even without NFC: wifi connect/disconnect, bluetooth connect/disconnect, gps position, ... To show you how my smartphone usage has changed, I'll describe some tasks I added to this application.

## NFC Task Launcher

1. *Event:* Connection to Home WiFi. *Actions*: disable GPS, disable 3G data, disable bluetooth
2. *Event:* Disconnecting from Home Wifi. *Actions:* Enable GPS, Enable 3G Data, Enable bluetooth
3. *Event:* Connection to Car Bluetooth system (done automatically after wifi disconnection event) *Actions*: Disable WiFi, Switch to Driving Mode
4. *Event:* Disconnection from Bluetooth car system *Action*: Enable WiFi, Switch off Driving mode

## Sample Tasks

And some other events when I'm at office, when will be night, when I'm in a specific GPS position (i.e. to the gym switch to vibrate mode). The application allows many other actions like send a message, start a phone call, make a check-in on facebook, start an application, set an alarm, ... You can do what you want, you just need imagination!! :) And then, of course, if you have NFC tags (actually are not too expensive) you can extend the usage of the application. For example a task "when it's 10 PM, set lock phone mode and add an alarm for 7AM" is not bad, but, if you are outside for a party the task would still fire. If you put, for example, an nfc sticker near your bed, you can have this task execute when you put the phone on the sticker (**Near** field communication)! :) With all this stuffs executed automatically, I don't need to worry about switch on and off functions but I can say that I don't need to charge my battery every day like before!

[![NFC Task Launcher](http://img.youtube.com/vi/17ASsGo8kIk/0.jpg)](https://www.youtube.com/watch?v=17ASsGo8kIk)

## Macrodroid Alternative

**UPDATE**: After the post comment (you can read) about a different app to do something similar, I investigated a little bit and I found a better application (with more triggers and events available, easier to use in my opinion, and with a cool web interface): [Macrodroid](https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid)