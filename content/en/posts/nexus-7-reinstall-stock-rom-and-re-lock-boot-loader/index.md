---
title: 'Nexus 7: reinstall stock rom and re-lock boot loader'
date: '2013-10-25T22:00:00+00:00'
slug: nexus-7-reinstall-stock-rom-and-re-lock-boot-loader
---



After the problem I had on my Nexus 7 and the <a href="http://blog.mornati.net/2013/10/26/nexus-7-restore-to-factory-default/">wipe data test</a>, my tables was always locked on the boot image.
So, the second thing (and I think the last one too) I could test, was a complete reinstallation of the rom.
Before going ahead, you need a computer with the Android SDK installed and the <em>platform-tool</em><strong> </strong>folder in the class path of your machine (means you can run, for example, <em></em><i>fast boot</i> from everywhere).
<ol>
	<li>Download the factory image for your nexus device from here: <a href="https://developers.google.com/android/nexus/images">https://developers.google.com/android/nexus/images</a>
I suppose the same thing should work for any other device if you can retrieve the factory ROM.</li>
	<li>Reboot your device into fastboot menu (as I described <a href="http://blog.mornati.net/2013/10/26/nexus-7-restore-to-factory-default/">here</a>)</li>
	<li>Enter in the ROM folder you downloaded, where you should have the script to reinstall it (<em>flash-all.sh</em> or <em>flash-all.bat</em>)</li>
	<li>Execute the script and you should see on the screen a question asking you if you want to unlock the boot loader (you must unlock it to install the stock ROM)
<a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641043/bootloader_n_7_03_grand_ytf4yi.png">![bootloader_n_7_03_grand](/images/nexus-7-reinstall-stock-rom-and-re-lock-boot-loader/00-bootloader_n_7_03_grand_ytf4yi.png)</a></li>
	<li>On your computer screen you can follow the ROM installation log. When procedure ends (if no problem occurred) your device will be automatically boot.</li>
</ol>
For security reasons, as suggested by Google too, it's better to relock your boot loader (in any case you can always unlock it if needed).
<ol>
	<li>Reboot the device in fast boot mode</li>
	<li>From your computer execute <em>fastboot oem lock </em>
<pre><code> MacBook-Pro-di-Marco:nakasi-jwr66y mmornati$ fastboot oem lock
&lt; waiting for device &gt;
...
(bootloader) Bootloader is locked now.
OKAY [  1.447s]
finished. total time: 1.447s</code></pre>
</li>
</ol>
Now you have a completely new device (at least software side).

&nbsp;
