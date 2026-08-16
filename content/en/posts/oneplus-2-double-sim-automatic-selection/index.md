---
date: '2022-10-08T20:20:36+00:00'
slug: oneplus-2-double-sim-automatic-selection
title: OnePlus 2 - Double SIM automatic selection
---

# OnePlus 2 - Double SIM automatic selection

As I described [here](https://blog.mornati.net/oneplus-2-double-sim-and-ask-every-time-bug-workaround/) there is actually a bug which is preventing a correct usage of what I'm going to explain here. But it will work when OnePlus will fix the problem in OxygenOS.

The functionalities added to the DualSim part of OxygenOS are really basic: you can select your SIM card for data, your default SIM for Text Message and calls (or let the phone to ask you every time) and that's all. You can't, for example, configure a custom SIM for a contact or group of contacts.
The worst thing to me is the useless functions in OnCarSystem, if you let the phone configured to ask you every time you want to make a phone call. In this case, making a call with contact selection on your car system, just open the selection popup on your phone making it useless!

For the first problem (the default SIM for contact or group) you can just download another [dialer](https://blog.mornati.net/oneplus-2-double-sim-and-ask-every-time-bug-workaround/) (it works only on phone). For the second one I'm just using an automation program which is (was) working really well on the OnePlus 2.

You can download two Android application on your phone:

* [Tasker](https://play.google.com/store/apps/details?id=net.dinglisch.android.taskerm)
![Tasker](/images/oneplus-2-double-sim-automatic-selection/00-unnamed-4_hk24xx.jpg)
* [Dual Sim Control](https://play.google.com/store/apps/details?id=pt.joaormf.mtkcontrol)
![Dual Sim Control](/images/oneplus-2-double-sim-automatic-selection/01-unnamed-2_dxjszu.png)

Both two are paid applications, but not too expensive.

With tasker you can do what you want with your phone: do an action when a trigger is fired.
For example: toggle WiFi when you are connected to the car bluetooth system, disable GPS when you are at home, and many many many others things.
Actually is not allowing you to change the dual SIM settings, but for this you can use the Dual Sim Control application which is a standalone application and a tanker plugin.

So, the only things you have to do is (for example):
Create a trigger which changes the SIM card configuration from "Ask every time" to "SIMx" when the phone is connected to the Bluetooth X device; switch back the settings when is disconnected.

In this way, when I enter my car, I'm selecting the default SIM and I'll be able to make calls without touching the phone.
