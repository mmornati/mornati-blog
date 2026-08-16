---
title: 'Fedora 18: Can''t Unlock the Screen'
date: '2013-03-24T23:00:00+00:00'
slug: fedora-18-cant-unlock-the-screen
categories:
  - Linux
  - Fedora
  - Troubleshooting
tags:
  - fedora
  - gnome
  - screen-lock
  - inotify
  - troubleshooting
description: 'After updating Fedora 18, the screen unlock stops working due to a GNOME Shell bug. Here are two workarounds: killing gnome-shell or increasing inotify watchers.'
---

After the latest Fedora updates I'm getting a boring problem with the unlock: I can normally login after the startup but not after a lock screen (CTRL + ALT + L for example).

## The Problem

Looking into log you should find something like the following:

```bash
Mar 25 13:33:15 notebook gdm-password][12579]: AccountsService-WARNING: Failed to connect to the ConsoleKit seat object: No space left on device
```

It's a gnome-shell bug, as described here: [Red Hat Bugzilla #872118](https://bugzilla.redhat.com/show_bug.cgi?id=872118). But in this way my desktop is completely useless.

I found two different ways to workaround/fix the problem.

## Solution 1: Kill Gnome Shell

Connect with root on a new terminal (CTRL + ALT + F2), and here kill the gnome-shell process.

```bash
mmornati@notebook ~$ sudo ps aux | grep gnome-shell
mmornati  1967  6.4  3.9 2041492 156052 ?      Sl   21:15   1:25 /usr/bin/gnome-shell
mmornati  2127  0.0  0.3 739228 14552 ?        Sl   21:15   0:00 /usr/libexec/gnome-shell-calendar-server
gdm       3531  0.5  2.0 1425268 78348 ?       Sl   21:28   0:02 gnome-shell --mode=gdm
mmornati  4570  0.0  0.0 109184   884 pts/1    S+   21:37   0:00 grep --color=auto gnome-shell

mmornati@notebook ~$ sudo kill -9 3531
```

The problem with this solution is that you have to execute a manual task each time we want to unlock Fedora screen.

## Solution 2: Increase inotify Watches

A second method consists in changing a parameter of the *inotify* process to allow more watches users. I'm not sure, at the moment, if this could cause some others problems, but for me it works now.

To do this, create a new sysctl configuration file for inotify, for example `inotify.conf` with this parameter inside:

```bash
mmornati@notebook ~$ cat /etc/sysctl.d/inotify.conf 
fs.inotify.max_user_watches=100000
```

All should work correctly now!

Enjoy