---
title: MacBook Pro and SSD Disk Tips
date: '2013-06-03T22:00:00+00:00'
slug: macbook-pro-and-ssd-disk-tips
---



Even if put an SSD drive in your mac, will quicken the very most of the daily activities (ex. startup from 1 minute to 12 seconds), remains a serious problem with this type of technology: the number of disk writes is limited.

In an everyday usage maybe you don't install/delete applications or your store documents in a separate device (usb stick for example), but your OS will surely write stuffs to your SSD disk: logs, tmp files, downloads (with default location), ...
There are some tips/changes you can make on your OSX, to try to extend the life of your powerful SSD drive.

<strong>SSD TRIM</strong>

"TRIM is a feature that allows solid state drives to automatically handle garbage collection, cleaning up unused blocks of data and preparing them for rewriting." and, knowing on an SSD drive you don't have access time (there's no mechanical heads to place before read data), with the TRIM function an SSD will write any time on a different area of your disk. In this way you can extend your disk life.

Unfortunately the SSD TRIM function is activated by default for all MacBook with an "Apple" SSD, but if you decide to change your disk later, there is nothing prepare in OSX to activate this function.
You can simply bypass this limitation using <a href="http://chameleon.alessandroboschini.it/index.php" target="_blank">Chameleon SSD Optimizer</a>: open the application, click on the trim button, restart your mac and that's all.

<strong>MEDIA FILES
</strong>

First easy settings is to put all your media files into a different disk: iTunes, iPhoto, iMovie, Aperture, ... libraries could be placed in a secondary disk (for a disk size reason too).

<strong>HIBERNATE</strong>

By default any MacBook is not configured with a "real" hibernate mode: the RAM content is not directly written to the disk any time you close the lid. It uses a <em>Safe Sleep: </em>the content of the RAM remains in place and the RAM is powered to keep these data. When the Mac pass the <strong>standby delay</strong>, this content is written to the disk to enter the hibernate mode.

Always using Chameleon you can easily change the hibernate mode forcing, for example, your Mac to never write to the SSD. Problem is that your battery runs flat you will loose your session (and maybe documents/informations).

Alternative to this method could be just to place the "ram file" to a different driver (if you have the second disk drive in your mac).

Using the command <em>pmset -g</em> you can check the current configuration for hibernate.
<pre><code> MacBook-Pro-di-Marco:~ mmornati$ sudo pmset -g
Active Profiles:
Battery Power           -1*
AC Power                -1
Currently in use:
 standbydelay         4200
 standby              0
 halfdim              1
 sms                  1
 hibernatefile        /var/vm/sleepimage
 disksleep            10
 sleep                10
 hibernatemode        3
 ttyskeepawake        1
 displaysleep         2
 acwake               0
 lidwake              1</code></pre>
The important informations here are: <em>standbydelay</em> and <i>hibernatefile.</i> The first one say us that our mac will wait 4200 seconds before entering the "real' hibernate mode (before any information is written to the disk). The <em>hibernatefile</em> is the location where ram content are stored.<i> </i>

For example I decided just to relocate my <em>sleepimage</em> file.

Create folder on the second driver:
<pre><code> MacBook-Pro-di-Marco:~ mmornati$ mkdir -p /Volumes/Media/System/vm</code></pre>
Change the <em>hibernatefile</em> property
<pre><code> sudo pmset -a hibernatefile /Volumes/Media/System/vm/sleepimage</code></pre>
Check your currents settings
<pre><code> MacBook-Pro-di-Marco:~ mmornati$ sudo pmset -g
Active Profiles:
Battery Power           -1*
AC Power                -1
Currently in use:
 standbydelay         4200
 standby              0
 halfdim              1
 sms                  1
 hibernatefile        /Volumes/Media/System/vm/sleepimage
 disksleep            10
 sleep                10
 hibernatemode        3
 ttyskeepawake        1
 displaysleep         2
 acwake               0
 lidwake              1</code></pre>
&nbsp;

Now any time your mac enters hibernate mode, the ram content is written in /Volumes/Media drive (my second internal hd).

<strong>Download Location</strong>

In your(s) browser(s), any time you want to download files, they are written into default download folder (~/Downloads). If you use a single driver in your mac, you can change settings in it to select a different location. If you want to "keep" this default location but write file into the secondary disk, you can create a <em>symbolic link </em>to it.
<pre><code> cp -r ~/Downloads /Volumes/Media/
sudo rm -rf ~/Downloads/
ln -s /Volumes/Media/Downloads/ ~/Downloads</code></pre>
Now, when any of your browsers, will write to ~/Downloads is written to the secondary disk into the configured location.

&nbsp;

There are surely many other services you can switch to the secondary disk drive, but proceeding this way you have an SSD drive you are not using for you Mac (all file are written, and so read, from the secondary disk).

<strong>Ressources</strong>

http://www.garron.me/en/mac/macbook-hibernate-sleep-deep-standby.html
