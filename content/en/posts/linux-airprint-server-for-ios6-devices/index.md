---
title: Linux AirPrint Server for iOS6 Devices
date: '2012-09-21T22:00:00+00:00'
slug: linux-airprint-server-for-ios6-devices
description: Fix your Linux AirPrint server after the iOS6 update by adding image/urf support to CUPS and Avahi configuration.
categories:
  - Linux
  - iOS
  - System Administration
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

After this, your printer should be visible on your local network. To allow printing from any iOS6 application, you also need to add these two files to your CUPS configuration.

**`/usr/share/cups/mime/apple.types`**

```bash
image/urf urf (0,UNIRAST)
```

**`/usr/share/cups/mime/local.convs`**

```bash
image/urf application/vnd.cups-postscript 66 pdftops
```

Now your AirPrint printer should work correctly!

Thanks a lot **Ranil** for your help!

## Full Setup Script

Also moved from the comments, here is the complete [Jam](http://blog.mornati.net/2012/09/22/linux-airprint-server-for-ios6-devices/comment-page-1/#comment-3667) guide to set up an AirPrint server for iOS6. Reading the commands in the script, I can say this is a step-by-step guide for Fedora 16/17. For CentOS/RedHat you need to adjust some steps slightly.

```bash
# AS ROOT:
echo "image/urf urf (0,UNIRAST)" > /usr/share/cups/mime/apple.types
echo "image/urf application/vnd.cups-postscript 66 pdftops" > /usr/share/cups/mime/local.convs
# pdftops can be installed with: yum install poppler-utils
# restore SELINUX permissions
restorecon /usr/share/cups/mime/*
# restart cups (print server)
systemctl restart cups.service

# AS USER:
# download airprint-generate.py as stated above and run it from: https://github.com/tjfontaine/airprint-generate
cd /tmp/
python airprint-generate.py

# AS ROOT:
mv /tmp/AirPrint-*.service /etc/avahi/services/
restorecon /etc/avahi/services/*
# restart the avahi service
systemctl restart avahi-daemon.service

# check the new AirPort service is running
avahi-browse --all
# no avahi-browse? install it: yum install avahi-tools
```

I think you should say a big thanks to **Jam** for this script! ;)