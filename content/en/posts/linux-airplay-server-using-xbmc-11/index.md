---
title: Linux Airplay server using XBMC 11
categories:
- linux-sysadmin
date: '2012-04-05T22:00:00+00:00'
slug: linux-airplay-server-using-xbmc-11
tags:
  - xbmc
  - kodi
  - airplay
  - linux
  - fedora
  - media-center
  - streaming
description: How to set up an AirPlay server on Fedora 16 by compiling XBMC 11 from source, including the necessary LD_LIBRARY_PATH configuration.
---

## Overview

I finally had time to test the latest version of [XBMC](http://xbmc.org/) media center (version 11) on my Fedora 16.
My first test was using directly the rpm provided on rawhide repositories (fedora and rpm-fusion-free) but in this way many other components will be updated (like gnome for example) because the package is produced for Fedora 17.

## Installation

So, following this little [guide](http://beta.hiscorebob.lu/2012/02/how-to-compile-xbmc-11-in-fedora-16/) that provides all necessary steps, I built XBMC directly on my Fedora.

## Configuration

The only thing to add at the end is to export the lib folder for the normal user (at least, on my fedora xbmc didn't work without this step).

So, for example, you can edit your .bashrc file:

```bash
mmornati@desktop ~$ pwd
/home/mmornati
mmornati@desktop ~$ vi .bashrc
```

Adding this line at the end of the file:

```bash
export LD_LIBRARY_PATH="/usr/local/lib":$LD_LIBRARY_PATH
```

And then you can start XBMC without problem :D

## Usage

As you can see in the following picture, it's really simple to use XBMC as AirPlay server (for videos, photos and music).

![XBMC AirPlay server](/images/linux-airplay-server-using-xbmc-11/00-foto_rmlvlv.png)