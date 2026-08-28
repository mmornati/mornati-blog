---
title: Install CynogenMod 11 on Galaxy Note 2 N7100
categories:
- mobile-gadgets
date: '2014-09-26T22:00:00+00:00'
slug: install-cynogenmod-11-on-galaxy-note-2-n7100
tags:
  - cyanogenmod
  - galaxy-note-2
  - android
  - rom
  - root
  - odin
  - recovery
description: Step-by-step guide to root your Samsung Galaxy Note 2 N7100 and install CyanogenMod 11 using Odin and PhilZ recovery.
---

![CyanogenMod11](/images/install-cynogenmod-11-on-galaxy-note-2-n7100/00-ojblzkc3x1pfnpdlirgi.jpg)

## Root Your Note 2

First of all, you need to prepare your computer with the Samsung Note 2 driver installed. The easiest way is to install [Kies](http://www.samsung.com/fr/support/usefulsoftware/KIES/).

* Copy the SuperSU update.zip file to your Galaxy Note 2.
* Now power off your phone and boot it into the Download Mode by pressing and holding **Volume Down**, **Home** and **Power** buttons together. Hold the buttons until the screen powers on and the warning screen appears. Then tap **Volume Up** key to enter Download Mode.
* Open [Odin](http://www.mediafire.com/download/3bzubpzhdfbviat/Odin_v3.09.zip) application.
* Now connect your device to the computer via USB cable.
* Wait until the "Added!" message appears in Odin and the ID:COM box turns light blue.
* Click the AP button and choose [**philz_touch_6.26.6-n7100.tar.md5**](http://goo.im/devs/philz_touch/CWM_Advanced_Edition/n7100/philz_touch_6.26.6-n7100.tar.md5) file.
* Uncheck the Auto Reboot option on Odin.
* Now hit the Start button to begin root installation.
* Wait until the installation completes and soon a PASS message with green background should appear in Odin. PhilZ CWM recovery has now been flashed to your phone.
* Now unplug the USB cable, remove the back cover and take out the battery.
* Wait for about 30 seconds before reinserting the battery.
* Now boot the device into recovery mode. Press and hold **Volume Up**, **Home** and **Power** keys together until the display turns on and the Samsung logo flickers and disappears. Now release the **Power** button but continue holding other keys till your Note 2 boots into PhilZ recovery mode.
* Browse to Install zip from sdcard option, navigate to [**UPDATE-SuperSU-vx.xx.zip**](http://goo.im/devs/philz_touch/CWM_Advanced_Edition/n7100/philz_touch_6.26.6-n7100.tar.md5) and select it.
* Confirm the installation and when the file is flashed to the device, return to the main menu in recovery.
* Hit Reboot system button once the root installation is complete.

**Problem#1**: If you keep getting SuperSu has stopped notifications constantly then follow these steps to fix:

* Uninstall SuperSu (Dont worry you won't lose root access)
* Now download SuperSu again from playstore
* Doing this installs SuperSu on /data/app partition where it won't get stopped by KNOX

**Problem#2**: If Fix no1 doesn't work for you then try this out:

* Download Terminal Emulator from the playstore.
* Launch it and type the following code:

`su pm disable com.sec.knox.seandroid`

**Note**: This will disable the Knox apps which prevent SuperSu from running

**Problem#3**: If none of the above steps work to disable Knox. Then try the following:

* Using any Root Explorer go to /system / app & / system / priv-app and delete all the apps having the word Knox in it. Also delete their corresponding odex files.
* This should work without fail. But doing this modifies your system partition and you may lose OTA functionality temporarily.

[Via - Root Galaxy Note 2](http://www.ibtimes.co.uk/root-galaxy-note-2-n7100-android-4-4-2-kitkat-install-philz-recovery-1447891)

## Install CyanogenMod 11

* Download the CyanogenMod version you prefer and the GoogleApps.

[CyanogenMod](https://download.cyanogenmod.org/?device=n7100)

[GApps](http://wiki.cyanogenmod.org/w/Google_Apps)

* Copy these two files on your phone. The target location is not important, the best is to copy both files into your phone's root folder for easy access and copy speed.
* Restart the phone into the recovery mode (**home** + **power** + **volume up** when the Samsung logo appears, leave the **home** button until the recovery app is charged)
* Wipe all Data, Cache and, in the advanced menu, the Dalvik Cache.
* Select the *Install ZIP* option and choose the CM installation file
* At the end of this installation, repeat the procedure to install GApps
* Back to the main menu and select *Reboot* menu option

CM 11 is now installed on your Note2 Phone.

**Note**: The first startup could take several minutes