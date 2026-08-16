---
title: MacBook Pro and SSD Disk Tips
date: '2013-06-03T22:00:00+00:00'
slug: macbook-pro-and-ssd-disk-tips
categories:
  - macOS
  - Hardware
  - Tips
tags:
  - ssd
  - macbook
  - trim
  - hibernate
  - optimization
description: Tips to extend SSD life on a MacBook Pro by enabling TRIM, relocating the hibernate file, and moving downloads to a secondary disk.
---

Putting an SSD drive in your Mac will speed up most daily activities (e.g. startup from 1 minute to 12 seconds), but there's still a serious problem with this type of technology: the number of disk writes is limited.

In everyday usage, maybe you don't install/delete applications or store your documents on a separate device (USB stick for example), but your OS will surely write stuff to your SSD disk: logs, tmp files, downloads (with default location), ...
There are some tips and changes you can make in OS X to try to extend the life of your powerful SSD drive.

## SSD TRIM

"TRIM is a feature that allows solid state drives to automatically handle garbage collection, cleaning up unused blocks of data and preparing them for rewriting." Knowing that on an SSD drive you don't have access time (there are no mechanical heads to place before reading data), with the TRIM function an SSD will write to a different area of your disk each time. In this way you can extend your disk life.

Unfortunately the SSD TRIM function is activated by default for all MacBooks with an "Apple" SSD, but if you decide to change your disk later, nothing is prepared in OS X to activate this function.
You can simply bypass this limitation using [Chameleon SSD Optimizer](http://chameleon.alessandroboschini.it/index.php): open the application, click on the trim button, restart your Mac and that's all.

## MEDIA FILES

An easy first step is to put all your media files on a different disk: iTunes, iPhoto, iMovie, Aperture, ... libraries can be placed on a secondary disk (for disk size reasons too).

## HIBERNATE

By default any MacBook is not configured with real hibernate mode: the RAM content is not directly written to the disk every time you close the lid. It uses a *Safe Sleep:* the content of the RAM remains in place and the RAM is powered to keep these data. When the Mac passes the **standby delay**, this content is written to the disk to enter hibernate mode.

Always using Chameleon you can easily change the hibernate mode forcing, for example, your Mac to never write to the SSD. The problem is that if your battery runs flat, you'll lose your session (and maybe documents/information).

An alternative to this method could be to just place the "ram file" on a different drive (if you have a second disk drive in your Mac).

Using the command *pmset -g* you can check the current configuration for hibernate.
```bash
 MacBook-Pro-di-Marco:~ mmornati$ sudo pmset -g
Active Profiles:
Battery Power           -1*
AC Power                -1
Currently in use:
 standbydelay         4200
 standby              0
 halfdim              1
 sms                  1
 hibernatefile        /var/vm/sleepimage
 disksleep            10
 sleep                10
 hibernatemode        3
 ttyskeepawake        1
 displaysleep         2
 acwake               0
 lidwake              1
```
The important information here are: *standbydelay* and *hibernatefile.* The first one tells us that our Mac will wait 4200 seconds before entering "real hibernate mode" (before any information is written to the disk). The *hibernatefile* is the location where RAM content is stored.

For example I decided just to relocate my *sleepimage* file.

Create folder on the second drive:
```bash
 MacBook-Pro-di-Marco:~ mmornati$ mkdir -p /Volumes/Media/System/vm
```
Change the *hibernatefile* property:
```bash
 sudo pmset -a hibernatefile /Volumes/Media/System/vm/sleepimage
```
Check your current settings:
```bash
 MacBook-Pro-di-Marco:~ mmornati$ sudo pmset -g
Active Profiles:
Battery Power           -1*
AC Power                -1
Currently in use:
 standbydelay         4200
 standby              0
 halfdim              1
 sms                  1
 hibernatefile        /Volumes/Media/System/vm/sleepimage
 disksleep            10
 sleep                10
 hibernatemode        3
 ttyskeepawake        1
 displaysleep         2
 acwake               0
 lidwake              1
```

Now any time your Mac enters hibernate mode, the RAM content is written to /Volumes/Media drive (my second internal HD).

## DOWNLOAD LOCATION

In your browser(s), any time you want to download files, they are written into the default download folder (~/Downloads). If you use a single drive in your Mac, you can change the settings to select a different location. If you want to "keep" this default location but write files to the secondary disk, you can create a *symbolic link* to it.
```bash
 cp -r ~/Downloads /Volumes/Media/
 sudo rm -rf ~/Downloads/
 ln -s /Volumes/Media/Downloads/ ~/Downloads
```
Now when any of your browsers writes to ~/Downloads, it's written to the secondary disk into the configured location.

There are surely many other services you can switch to the secondary disk drive, but proceeding this way you have an SSD drive you are not using for your Mac (all files are written, and so read, from the secondary disk).

## Resources

http://www.garron.me/en/mac/macbook-hibernate-sleep-deep-standby.html