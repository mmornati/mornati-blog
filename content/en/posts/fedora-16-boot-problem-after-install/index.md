---
title: Fedora 16 boot problem after install
date: '2011-11-29T23:00:00+00:00'
slug: fedora-16-boot-problem-after-install
categories:
  - Linux
  - System Administration
tags:
  - fedora
  - fedora16
  - gpt
  - boot
  - installation
  - bios
  - anaconda
description: How to fix the Fedora 16 boot problem caused by GPT disk labelling on BIOS systems.
---

## The Problem

In the latest version of the Fedora distribution, developers decided to format the disk using **GPT label** on it. The problem is that many BIOS can't recognize the disk as bootable after the installation, leaving you unable to access your new system.
After hours spent trying to fix my installation (without success), I noticed that on the [known bugs](http://fedoraproject.org/wiki/Common_F16_bugs#Incorrect_partition_type_assigned_to_.2Fboot_partition_on_GPT-labelled_disks) page there was the real solution to the problem, even if, in my opinion, it's not well explained.

## The Solution

Anyway, if you want to install Fedora 16 without spending time later fixing the boot problem or re-installing it, the solution is to force the installation procedure to use the normal partitioning system, so you can let Fedora decide how to format your disk (as usual, that is my preferred installation method: decide everything later).

Add the **nogpt** property to anaconda before starting the installation procedure. To do this you should see in your DVD menu (just after the boot) an option saying something like "add properties" or "change properties". You just need to select it, write **nogpt** and start the installation. Then you can install your Fedora normally.

## Final Thoughts

Don't know why the Fedora team decided to use this system in the latest version, but in any case, I don't think it was a good idea. Many users, that don't want to spend time on problems like this, or don't know linux very well to try to fix the problem manually, simply move away from this distribution: Ubuntu is simple to install and to manage after installation.
In my opinion this is absolutely the worst decision the dev team could have made!
