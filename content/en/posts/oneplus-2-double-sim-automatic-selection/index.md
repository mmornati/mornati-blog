---
date: '2022-10-08T20:20:36+00:00'
slug: oneplus-2-double-sim-automatic-selection
title: OnePlus 2 - Double SIM automatic selection
categories:
  - Android
  - Mobile
tags:
  - oneplus
  - dual-sim
  - oxygenos
  - tasker
  - automation
description: 'How to automate dual SIM selection on the OnePlus 2 using Tasker and Dual Sim Control to work around OxygenOS limitations, especially for car Bluetooth connectivity.'
---

As I described [here](https://blog.mornati.net/oneplus-2-double-sim-and-ask-every-time-bug-workaround/), there is currently a bug preventing proper usage of what I am going to explain. But it will work when OnePlus fixes the problem in OxygenOS.

The Dual SIM features in OxygenOS are really basic: you can select a SIM for data, a default for texts and calls (or let the phone ask every time) and that is all. You cannot, for example, configure a custom SIM for a contact or group of contacts.
The worst thing for me is the uselessness of the in-car system when the phone is set to ask every time. In this case, making a call with contact selection on the car system just opens the popup on the phone, making it useless!

For the first problem (the default SIM for contact or group) you can just download another [dialer](https://blog.mornati.net/oneplus-2-double-sim-and-ask-every-time-bug-workaround/) (it only works on the phone). For the second one, I am using an automation app that works really well on the OnePlus 2.

You need to download two Android applications on your phone:

* [Tasker](https://play.google.com/store/apps/details?id=net.dinglisch.android.taskerm)
  ![Tasker](/images/oneplus-2-double-sim-automatic-selection/00-unnamed-4_hk24xx.jpg)
* [Dual Sim Control](https://play.google.com/store/apps/details?id=pt.joaormf.mtkcontrol)
  ![Dual Sim Control](/images/oneplus-2-double-sim-automatic-selection/01-unnamed-2_dxjszu.png)

Both are paid apps, but not too expensive.

With Tasker, you can automate your phone: perform an action when a trigger fires.
For example: toggle WiFi when you connect to the car Bluetooth, disable GPS when you are at home, and many other things.
It does not let you change dual SIM settings directly, but for this you can use the Dual Sim Control, which is both a standalone app and a Tasker plugin.

So, the only thing you need to do is (for example):
create a trigger that changes the SIM card configuration from "Ask every time" to "SIMx" when the phone is connected to a Bluetooth device; switch the settings back when it disconnects.

In this way, when I enter my car, I am selecting the default SIM and I will be able to make calls without touching the phone.