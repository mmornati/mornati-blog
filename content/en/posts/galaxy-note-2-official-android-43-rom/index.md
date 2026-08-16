---
title: Galaxy Note 2 Official Android 4.3 ROM
date: '2013-12-23T23:00:00+00:00'
slug: galaxy-note-2-official-android-43-rom
---



After some <a href="http://blog.mornati.net/2013/12/23/hurricane-rom-short-review-before-changing-it/">custom ROM tests</a> I come back to the official Samsung ROM; the latest ROM that Samsung recently released for the "old" Note 2 phablet phone.
To reinstall the official ROM I can't use neither the OTA Upgrade nor the Kies Upgrade. The problem was the phone wasn't recognized by Samsung service as the official one, and in any case the Android version was already the latest one. So I installed the official 4.1.2 to try to use one of the official methods, and for this I installed <a href="https://play.google.com/store/apps/details?id=eu.chainfire.mobileodin.pro&amp;hl=fr">mobile ODIN</a> on my phone.

You should proceed in this way:
<ul>
	<li>install mobile odin</li>
	<li>Download the official custom ROM (4.1.2 or 4.3)</li>
	<li>Copy the downloaded tar.md5 file on your phone (internal or external SD card)</li>
	<li>Chose the copied ROM within ODIN and do the installation</li>
</ul>
<a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391640952/unnamed_otuopm.jpg">![unnamed](/images/galaxy-note-2-official-android-43-rom/00-unnamed_otuopm.jpg)</a>

If you decide, in odin, not to root the phone and install mobile odin with the custom rom, the process also reset the "custom rom counter" to erase any trace of phone change. To prevent any possible bug I also decide to make a full reset of data and cache memories.

If all worked well you should have a phone provisioned with the original Samsung ROM.

Since I had chosen to install the 4.1.2 ROM, after the phone boot and basic configuration, I tried to make an OTA update ("You already have the latest version") and a Kies Update ("You cannot use Kies to update your phone"). So... even after all of this, nothing changed.

Now you can proceed, I think, in two different way:
<ul>
	<li>root the telephone, install odin, and rerun the same procedure with the new ROM (not sure what should happen with the latest Knox security introduced by Samsung)</li>
	<li>Install the standard ROM with the standard odin procedure</li>
</ul>
If you have a Windows computer it's simple because you can use the "real" odin program, but, if like me, you just have a Mac or a Linux computer, you must use <a href="http://forum.xda-developers.com/showthread.php?t=755265">Heimdall</a> to manually install your ROM.

First of all you need to download the official Samsung ROM you want to install on your phone, and here google should help you pointing to the right file (<a href="http://terafile.co/7e131532a6ad/N7100XXUEMK9_N7100OXXEMK4_OXX.zip">Note 2 ROM</a>).
Then you have to connect the Phone via USB to a computer with Heimdall installed and the Samsung drivers to recognize your phone, and reboot it in the <em>Odin Mode </em>(Volume Down + Home + Power buttons pressed at the same time).

Check if the phone is recognized by your computer with
<pre><code> <code class="bash">sudo heimdall detect</code></pre>
Extract the list of partitions from your phone to use to provision it:
<pre><code> <code class="shell">sudo heimdall download-pit --output /tmp/note2.pit --no-reboot</code></pre>
Then extract the tar.md5 file (is a simple renamed tar.gz file) and push all the ROM's files on your device via heimdall:
<pre><code> <code>heimdall flash --pit /tmp/note2.pit --verbose --SYSTEM system.img --BOOT boot.img --RECOVERY recovery.img --CACHE cache.img --HIDDEN hidden.img --RADIO modem.bin --TZSW tz.img --BOOTLOADER sboot.bin</code></pre>
After a while, and if all worked well, your telephone should reset in your brand new system.
It's important to make a full rom installation (with all the partitions I listed in my command), in a different way your telephone boot but It detects you have installed a custom ROM (due to missing Knox requirements... that means you must install it on your phone :(). And more, without a full installation the wireless does not correctly work.

If you have problems executing one, or more, heimdall's operations (and you are using a Mac), maybe you should fix some Samsung driver problems:
<pre><code> <code>sudo kextunload -b com.devguru.driver.SamsungComposite
sudo kextunload -b com.devguru.driver.SamsungComposite
sudo kextunload -b com.devguru.driver.SamsungACMControl</code></pre>
Take care, all operations should be run as <em>root</em> user (with sudo prepend to any command, or changing user for root with <em>sudo su</em> command).

I can say that this new ROM seems more stable than the customs I tested, and, even if is not "optimized" in term of memory and/or processor usage, I have no memory problem.

&nbsp;
