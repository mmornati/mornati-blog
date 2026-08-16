---
title: Galaxy Note 2 - Bluetooth frequently disconnects
date: '2015-02-05T23:00:00+00:00'
slug: galaxy-note-2-bluetooth-frequently-disconnects
---




I spent some time looking around to an annoying bluetooth problem on my Android device: bluetooth devices (smartwatch, handfree in my car, ...) frequently disconnect making them inusables.
At the beginning I thought the problem was the custom rom I was using. So I try some others roms and I switched back to the Note2 stock rom but problem was still there.

Surfing/searching on internet I found this post on the android project [page](https://code.google.com/p/android/issues/detail?id=63456).
It seems since Android 4.4.2, Google changed the power for the bluetooth device (or it creates a sort of link between  WiFi and bluetooth) and with this the bluetooth range was extremely dropped: in same case you need to keep close the two devices (less than 30cms).

After some tests I found a workaround that is working for me on my Galaxy Note 2: when you need to use the bluetooth -> disable WiFi (simple but annoying).

To automate this configuration I used an automate tasker for android. Something like [Tasker](https://play.google.com/store/apps/details?id=net.dinglisch.android.taskerm&hl=fr_FR), [AutomateIT](https://play.google.com/store/apps/details?id=AutomateItPro.mainPackage&hl=fr_FR), [Atooma](https://play.google.com/store/apps/details?id=com.atooma&hl=fr_FR) or any other you could know.
You just need to create a very simple rule, and all will be atomatic.

When Bluetooth device (X) is connected -> Disable WiFi
When Bluetooth device (X) is disconnected -> Enable WiFi

In this way, any time I start up my car, my tasker disables the WiFi and Bluetooth works without any problem!

I didn't tested with Lollipop yet (there is anything official for Note2 at the moment) and I don't know if this problem is fixed; but if you have any strange problem with your bluetooth just try to turn off the phone's WiFi.

