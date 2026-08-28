---
title: Update Galaxy Note 2 to Official Android 4.4 with Heimdall
categories:
- mobile-gadgets
date: '2014-05-13T22:00:00+00:00'
slug: update-galaxy-note-2-to-official-android-44-with-heimdall
tags:
  - samsung
  - galaxy-note-2
  - heimdall
  - android
  - kitkat
  - firmware
  - update
description: How to update a Galaxy Note 2 (N7100) to the official Android 4.4.2 KitKat using Heimdall on Mac or Linux, with detailed steps and firmware details.
---

![Note 2 KitKat](/images/update-galaxy-note-2-to-official-android-44-with-heimdall/00-note2-4_c8bkk0.jpg)

## Overview

New Galaxy Note 2... and once again OTA and Kies updates didn't work :S

Some weeks ago here in France (but I suppose today is everywhere), Samsung rolled out the [new Android 4.4.2 for the Galaxy Note 2 GSM](http://www.androidauthority.com/galaxy-note-2-kitkat-update-android-4-4-2-372972/) (N7100) devices. If you have problem updating and/or checking for updates always return "Your device has the latest version installed" you can update it using [Odin](http://forum.xda-developers.com/showthread.php?t=1738841) or [Heimdall](http://glassechidna.com.au/heimdall/). 
The first one is simpler to use, but not available on Mac/Linux... better yet, today there's [jOdin](https://builds.casual-dev.com/jodin3/), a Java version of Odin that works on any system. I tested it on my MacBook and, even if the devices was correctly detected, I wasn't able to update it... and I thought it felt dangerous to update with a tool that behaved strangely.

## Update Procedure

To update your Galaxy Note 2 using Heimdall you can proceed as follows:

* [Download the firmware](http://www.phonandroid.com/forum/galaxy-note-2-n7100-roms-officielles-et-custom-f487.html) you want to install (the latest available for French phone is the **N7100XXUFND3 XEF**)
* Install Heimdall (if you don't have it).
* Check if your phone is correctly recognized:

```bash
sudo heimdall detect
```

* Download the PIT file (partition table of your phone):

```bash
sudo heimdall download-pit --output /tmp/note2.pit --no-reboot
```

* Extract the tar.md5 file (rename it to tar.gz if you have problem)

* Push all the ROM's files on your device via heimdall:

```bash
heimdall flash --pit /tmp/note2.pit --verbose --SYSTEM system.img --BOOT boot.img --RECOVERY recovery.img --CACHE cache.img --HIDDEN hidden.img --RADIO modem.bin --TZSW tz.img --BOOTLOADER sboot.bin
```

Wait 5/10 minutes (you can see the progress operation in heimdall) and your telephone should automatically reboot.

> **NOTE**: This procedure does **not** increment the Mod ROM Counter nor the Knox Flag. It's an update like the Kies one.

> **NOTE**: With this procedure you do **not** lose your data.

## Firmware Details

**Model name**: Galaxy Note 2
**Model**: GT-N7100
**Country**: France
**Version**: Android 4.4.2 KitKat
**Changelist**: 1280411
**Build date**: 8 April
**Product Code**: XEF
**PDA**: N7100XXUFND3
**CSC**: N7100OXAFND3
**MODEM**: N7100XXUFND3

## What's New

* Smoother interface: even if the pin pad (to unlock your phone) it is smaller then before and sometime difficult to use
![Interface](/images/update-galaxy-note-2-to-official-android-44-with-heimdall/01-note2-2_evrgdn.jpg)
* Faster performance: I don't have enought
* White status bar icons: I prefer the colored icons
* Full-screen album art and a camera shortcut on the lock screen: I think this is the reason behind the smaller pin pad
* Wireless printing and NFC tap-to-pay support: Wireless printed was already present in the previous versions but, in this version, you can decide to deactivate the printer services you don't use (available HP and Samsung)
* Options to set default messaging and launcher apps: good way to set default apps and now you can decide to use only Hangouts for messages and not receive messages twice.
* Transparent status bar: it was already present in the previous version
* Better stability: I don't have enough hours on this version, but right now it's ok without a phone reset. To check the battery drain it seems ok but sometime I see an abnormal drain.

*[Source](http://www.ibtimes.co.uk/samsung-releases-android-4-4-2-kitkat-galaxy-note-2-changelog-screenshots-1446073)*