---
title: Galaxy Note 2 Official Android 4.3 ROM
categories:
- mobile-gadgets
date: '2013-12-23T23:00:00+00:00'
slug: galaxy-note-2-official-android-43-rom
tags: [samsung, galaxy-note-2, android, samsung-rom, odin, heimdall, firmware]
description: How to install the official Android 4.3 ROM on a Samsung Galaxy Note 2 using Mobile ODIN or Heimdall, with step-by-step instructions for Windows, Mac, and Linux.
---

## Overview

After some [custom ROM tests](/2013/12/23/hurricane-rom-short-review-before-changing-it/) I came back to the official Samsung ROM; the latest ROM that Samsung recently released for the "old" Note 2 phablet phone.
To reinstall the official ROM I couldn't use either the OTA Upgrade nor the Kies Upgrade. The problem was the phone wasn't recognized by Samsung service as the official one, and in any case the Android version was already the latest one. So I installed the official 4.1.2 to try to use one of the official methods, and for this I installed [mobile ODIN](https://play.google.com/store/apps/details?id=eu.chainfire.mobileodin.pro&hl=fr) on my phone.

## Using Mobile ODIN

You should proceed in this way:

- install mobile odin
- Download the official custom ROM (4.1.2 or 4.3)
- Copy the downloaded tar.md5 file on your phone (internal or external SD card)
- Chose the copied ROM within ODIN and do the installation

![unnamed](/images/galaxy-note-2-official-android-43-rom/00-unnamed_otuopm.jpg)

If you decide, in odin, not to root the phone and install mobile odin with the custom rom, the process also reset the "custom rom counter" to erase any trace of phone change. To prevent any possible bug I also decided to make a full reset of data and cache memories.

If all worked well you should have a phone provisioned with the original Samsung ROM.

Since I had chosen to install the 4.1.2 ROM, after the phone boot and basic configuration, I tried to make an OTA update ("You already have the latest version") and a Kies Update ("You cannot use Kies to update your phone"). So... even after all of this, nothing changed.

Now you can proceed, I think, in two different ways:

- root the telephone, install odin, and rerun the same procedure with the new ROM (not sure what should happen with the latest Knox security introduced by Samsung)
- Install the standard ROM with the standard odin procedure

## Using Heimdall

If you have a Windows computer it's simple because you can use the "real" odin program, but, if like me, you just have a Mac or a Linux computer, you must use [Heimdall](http://forum.xda-developers.com/showthread.php?t=755265) to manually install your ROM.

First of all you need to download the official Samsung ROM you want to install on your phone, and here google should help you pointing to the right file ([Note 2 ROM](http://terafile.co/7e131532a6ad/N7100XXUEMK9_N7100OXXEMK4_OXX.zip)).
Then you have to connect the Phone via USB to a computer with Heimdall installed and the Samsung drivers to recognize your phone, and reboot it in the *Odin Mode* (Volume Down + Home + Power buttons pressed at the same time).

Check if the phone is recognized by your computer with

```bash
sudo heimdall detect
```

Extract the list of partitions from your phone to use to provision it:

```bash
sudo heimdall download-pit --output /tmp/note2.pit --no-reboot
```

Then extract the tar.md5 file (it's a simple renamed tar.gz file) and push all the ROM's files on your device via heimdall:

```bash
heimdall flash --pit /tmp/note2.pit --verbose --SYSTEM system.img --BOOT boot.img --RECOVERY recovery.img --CACHE cache.img --HIDDEN hidden.img --RADIO modem.bin --TZSW tz.img --BOOTLOADER sboot.bin
```

After a while, and if all worked well, your phone should reboot in your brand new system.
It's important to make a full rom installation (with all the partitions I listed in my command), otherwise your telephone boot but it detects you have installed a custom ROM (due to missing Knox requirements... that means you must install it on your phone :(). And more, without a full installation the wireless doesn't work correctly.

If you have problems executing one, or more, heimdall's operations (and you are using a Mac), maybe you should fix some Samsung driver problems:

```bash
sudo kextunload -b com.devguru.driver.SamsungComposite
sudo kextunload -b com.devguru.driver.SamsungComposite
sudo kextunload -b com.devguru.driver.SamsungACMControl
```

Take care, all operations should be run as *root* user (with sudo prepend to any command, or changing user for root with *sudo su* command).

I can say that this new ROM seems more stable than the customs I tested, and, even if is not "optimized" in terms of memory and/or processor usage, I have no memory problem.