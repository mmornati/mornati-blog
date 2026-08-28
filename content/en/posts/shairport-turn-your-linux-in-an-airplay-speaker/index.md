---
title: 'Shairport: Turn Your Linux into an AirPlay Speaker'
categories:
- linux-sysadmin
date: '2012-03-21T23:00:00+00:00'
slug: shairport-turn-your-linux-in-an-airplay-speaker
tags:
  - shairport
  - airplay
  - linux
  - fedora
  - audio
  - streaming
description: Install Shairport on Fedora 16 to turn your Linux machine into an AirPlay speaker for streaming audio from iOS devices.
---

I just discovered and tested a nice project that allows you to create an AirPlay server to use as a simple speaker for your iOS device (for example send audio from your iPod to your Linux PC): [Shairport](https://github.com/albertz/shairport)!!

## Overview

Installing and using it on Fedora 16 is really simple.

## Installation

First of all you should install all the required packages to build this project:

```bash
yum install openssl-devel libao libao-devel perl-Crypt-OpenSSL-RSA perl-IO-Socket-INET6 perl-libwww-perl avahi-tools
```

Then, after a clone of the git repository:

```bash
git clone https://github.com/albertz/shairport.git
```

You can enter in the shairport directory and build it:

```bash
mmornati@desktop shairport$ make
cc -O2 -Wall   -DHAIRTUNES_STANDALONE hairtunes.c alac.o -o hairtunes -lm -lpthread -lssl -lcrypto -lao
cc -O2 -Wall   -c socketlib.c -o socketlib.o
cc -O2 -Wall   -c shairport.c -o shairport.o
cc -O2 -Wall   -c hairtunes.c -o hairtunes.o
cc -O2 -Wall   socketlib.o shairport.o alac.o hairtunes.o -o shairport -lm -lpthread -lssl -lcrypto -lao
```

## Usage

Now you can simply start the shairport script and check if everything works using your iOS device:

```bash
mmornati@desktop shairport$ perl shairport.pl
Established under name 'D2908EECAA5A@ShairPort 3882 on desktop'
requesting resend on 1 packets (port 53568)
```

![From iPhone di Marco](/images/shairport-turn-your-linux-in-an-airplay-speaker/00-From-iPhone-di-Marco_yvxyqb.png)