---
title: PushBullet notifications for Kerberos.io
categories:
- smart-home
date: '2017-09-26T22:00:00+00:00'
slug: pushbullet-notifications-for-kerberos-io
tags:
  - kerberos
  - pushbullet
  - notifications
  - raspberry-pi
  - surveillance
description: >-
  Learn how to configure PushBullet notifications for Kerberos.io using the
  WebHook feature and a custom Hook project on a Raspberry Pi.
---

## Overview

[Kerberos.io](https://kerberos.io/) is an affordable video surveillance system (probably the cheapest on the market) that you can install on a RaspberryPI and using it with a USB camera, an IP camera, or with the RPi camera.

![Image for post](/images/pushbullet-notifications-for-kerberos-io/00-0_k5Dygy7yzMbyimjt.jpg)

## Configuration

You can configure different kinds of notification when motion is detected.

One of the available methods is the **WebHook** and, using this configuration, I created a [Hook project](https://github.com/mmornati/kerberosio-hooks) (extensible by plugins) that sends notifications to PushBullet.
The information about the installation and configuration is available on the project README file.

![Image for post](/images/pushbullet-notifications-for-kerberos-io/02-0_FQToXvq79WQCGr0L.png)

## Testing

If you want to make a simple test before linking the hook to Kerberos.io, or to debug if something isn't working correctly, you can make a post-call to the hook project using, for example, Postman.

![Image for post](/images/pushbullet-notifications-for-kerberos-io/04-0_sMY1of0rLWMHf6IH.png)

You should receive a Pushbullet message on all your linked devices (or on a specific device you selected), with the image taken by the Kerberos.io camera.

## Future Plans

The plugin system is already developed, and I plan to add other notifications like mail and TextMessage. I said it's WIP because I'd like to improve it by enforcing interfaces and predefined functions for plugin development.

Everything is open source. If you test or use it and you have any comments or improvements, don't hesitate to leave comments (here or better on [GitHub](https://github.com/mmornati/kerberosio-hooks)).

*Originally published at* [https://blog.mornati.net](https://blog.mornati.net/pushbullet-notifications-for-kerberos-io/) *on September 27, 2016.*