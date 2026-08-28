---
title: Linux AirPrint Server for iOS6 Devices
categories:
- linux-sysadmin
date: '2012-09-21T22:00:00+00:00'
slug: linux-airprint-server-for-ios6-devices
description: Fix your Linux AirPrint server after the iOS6 update by adding image/urf support to CUPS and Avahi configuration.
tags:
  - airprint
  - linux
  - ios6
  - printing
  - avahi
  - cups
  - ios
---

After the iOS6 update, my Linux AirPrint server stopped working for my iDevices. I'm referring to my [previous article](/en/posts/linux-as-airprint-server/) explaining how you can configure a Linux machine as an AirPrint server.

## The Fix

Fortunately, there is no change to the AirPrint protocol. [Ranil](http://blog.mornati.net/2011/09/28/linux-as-airprint-server/comment-page-1/#comment-3660) gave us the solution (thanks a lot for your testing!).

You need to add `image/urf` to the `pdl` section of your `.service` file. For example, in my file I now have:

```bash
pdl=application/octet-stream,application/pdf,application/postscript,image/gif,image/jpeg,image/png,image/tiff,text/html,text/plain,application/vnd.cups-banner,application/vnd.cups-command,application/vnd.cups-pdf,application/vnd.cups-postscript,image/urf
```

After this, your printer should be visible on your local network again. To completely enable printing from any iOS6 application, you also need to add these two files to your CUPS configuration.

### `/etc/cups/ppd/your-printer.ppd`

Find the `*cupsFilter` line and add:

```bash
*cupsFilter: "application/vnd.cups-pdf 0 -"
```

### `/usr/share/cups/mime/local.convs`

Add the following line to convert `image/urf` to a printable format:

```bash
image/urf application/vnd.cups-raster 100 - 
```

### `/usr/share/cups/mime/local.types`

Register the `image/urf` MIME type:

```bash
image/urf urf (100,fls)
```

Restart CUPS and Avahi after making these changes:

```bash
sudo service cups restart
sudo service avahi-daemon restart
```

Your AirPrint should now work with iOS6 devices.