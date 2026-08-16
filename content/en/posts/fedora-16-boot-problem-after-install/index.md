---
title: Fedora 16 boot problem after install
date: '2011-11-29T23:00:00+00:00'
slug: fedora-16-boot-problem-after-install
---



In this latest version of Fedora distribution, developers decided to format disk using <strong>GPT label</strong> on it. The problem is that many BIOS can't recognize disk as bootable after the installation, so that you cannot access to your new system.
After hours spent trying to fix my installation (without success), I noticed that on the <strong><a href="http://fedoraproject.org/wiki/Common_F16_bugs#Incorrect_partition_type_assigned_to_.2Fboot_partition_on_GPT-labelled_disks">knowing bugs</a></strong> page there was the real solution to the problem, even if, in my opinion, it's not well explained.

Anyway, if you want to install Fedora 16 without spend time later fixing the boot problem or re-installing it, the solution is to force the installation procedure to use the normal partitioning system, so you can let Fedora decide how to format your disk (as usual, that is my preferred installation way: decide all after).

Add the <strong>nogpt</strong> property to anaconda before starting the installation procedure. To do this you should see in your DVD menu (just after the boot) a voice saying something mike "add properties" or "change properties". You have just to select it, write nogpg and startup the installation. Then you can install your Fedora normally.

Don't know why the Fedora team decided to use this system in the latest version, but in any case, I think wasn't a good idea. Many users, that don't want to lose time around problems like this, or don't know linux very well to try to fix the problem manually, simply run away from this distribution: Ubuntu it's simple to install and to manage after installation.
In my opinion this is absolutely the worst decision dev team could take!
