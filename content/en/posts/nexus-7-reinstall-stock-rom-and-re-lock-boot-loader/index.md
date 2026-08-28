---
title: 'Nexus 7: reinstall stock rom and re-lock boot loader'
categories:
- mobile-gadgets
date: '2013-10-25T22:00:00+00:00'
slug: nexus-7-reinstall-stock-rom-and-re-lock-boot-loader
tags:
  - nexus-7
  - android
  - bootloader
  - stock-rom
  - fastboot
description: "How to reinstall the stock ROM on a Nexus 7 stuck on the boot image and relock the boot loader for security."
---

After the problem I had on my Nexus 7 and the [wipe data test](/2013/10/26/nexus-7-restore-to-factory-default/), my tablet was always stuck on the boot image.
So, the second thing (and probably the last) I could try, was a complete reinstallation of the ROM.

## Reinstall Stock ROM

Before proceeding, you need a computer with the Android SDK installed and the *platform-tools* folder in your PATH (so you can run fastboot from anywhere).

1. Download the factory image for your Nexus device from [the Google Developers site](https://developers.google.com/android/nexus/images). I assume the same process should work for any other device if you can find the factory ROM.
2. Reboot your device into fastboot mode (as I described [here](/2013/10/26/nexus-7-restore-to-factory-default/)).
3. Enter the ROM folder you downloaded, where you should find the script to reinstall it (*flash-all.sh* or *flash-all.bat*).
4. Execute the script and you should see a question asking you to unlock the boot loader (you need to unlock it to install the stock ROM).

![Unlock bootloader prompt](/images/nexus-7-reinstall-stock-rom-and-re-lock-boot-loader/00-bootloader_n_7_03_grand_ytf4yi.png)

5. On your computer screen, you can follow the ROM installation log. When the procedure ends (if no errors occurred), your device will boot automatically.

## Relock Bootloader

For security reasons, as suggested by Google too, it's better to relock your boot loader (you can always unlock it again if needed).

1. Reboot the device in fastboot mode.
2. From your computer, execute `fastboot oem lock`:

```bash
MacBook-Pro-di-Marco:nakasi-jwr66y mmornati$ fastboot oem lock
< waiting for device >
...
(bootloader) Bootloader is locked now.
OKAY [  1.447s]
finished. total time: 1.447s
```

Now you have a completely new device (at least software side).