---
title: Linux as AirPrint server
categories:
- linux-sysadmin
date: '2011-09-27T22:00:00+00:00'
slug: linux-as-airprint-server
description: Turn any Linux server with CUPS into an AirPrint server using avahi, so you can print from iOS devices without buying a new AirPrint-enabled printer.
tags:
  - airprint
  - linux
  - ios
  - printing
  - avahi
  - cups
  - bonjour
  - mdns
---

## Introduction

One frustrating aspect of recent iOS versions is the AirPrint capability! I'm saying that is annoying because you can print from your iOS device only to enabled printers. Today this feature is added to a lot of printers, but maybe (like in my situation) it means changing my printer with a new one.

Since I only use my printer occasionally (like printing online flying tickets) it's not reasonable to buy a new one! So, looking on internet, I found that you can easily create an AirPrint printer server using a [native application](http://netputing.com/airprintactivator) for MacOSX/Windows or, if you have a Linux home server like I do, the **avahi** service included in Linux distributions.

## Setting Up Avahi

To configure your avahi service with your printer you can use this python script: [https://github.com/tjfontaine/airprint-generate](https://github.com/tjfontaine/airprint-generate) with this simple command:

```bash
python airprint-generate.py
```

that will automatically look in your Linux cups configuration, extract your printer and generate the file for avahi. If you have multiple printers configured you can pass a parameter to the script saying which printer you want to configure.

If everything worked correctly you should have a file with a name like this: **AirPrint-EPSONDX5000.service** containing all required information.
Now, just copying this file in the avahi service folder, you will enable your printer:

```bash
mv AirPrint-EPSONDX5000.service /etc/avahi/services/AirPrint-EPSONDX5000.service
```

If everything worked correctly your printer should appear on your iOS device:

![iOS printing](/images/linux-as-airprint-server/00-foto_gdwi2d.png)

## Installing and Crontab Fix

**NOTE:** I noticed that with some avahi versions, there's a problem discovering printers: printer is shown in your iOS device just for a couple of minutes and then it disappears. To fix this problem I just added in crontab (run every minute):

```bash
touch /etc/avahi/services/AirPrint-EPSONDX5000.service
```

I know that is not a really cool solution, but I haven't found anything better. Actually on my Fedora the problem with avahi seems to be fixed, but "remember the touch" if you run into issues ;)

## Important Update: Firewall Configuration

Following the **matt** suggestion in the comments, you can edit your iptables firewall rules allowing multicast DNS traffic (mDNS).
For example add in your `/etc/sysconfig/iptables` file, this line

```bash
-A RH-Firewall-1-INPUT -p udp --dport 5353 -d 224.0.0.251 -j ACCEPT
```

Using an `iptables -L` you should then see a line like this:

```bash
ACCEPT     udp  --  anywhere             224.0.0.251          udp dpt:mdns
```

Thanks a lot matt for your help!!!