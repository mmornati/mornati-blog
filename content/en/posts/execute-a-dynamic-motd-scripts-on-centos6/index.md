---
title: Execute a dynamic MOTD scripts on Centos6
categories:
- linux-sysadmin
date: '2013-11-11T23:00:00+00:00'
slug: execute-a-dynamic-motd-scripts-on-centos6
tags:
  - centos
  - motd
  - pam
  - linux
  - sysadmin
description: How to configure dynamic MOTD (Message Of The Day) scripts on CentOS 6 or any RedHat-based system using PAM and custom bash scripts.
---

A thing I found useful in the default configuration of Debian and Ubuntu Systems is the MOTD message (Message Of The Day) display. Any time you log into the system, you get information about package updates, load, and more.

The following guide shows how to configure it on a CentOS system (or any RedHat-based system).

## PAM Configuration

First, we need to configure a PAM connection module:

```bash
vi /etc/pam.d/login
```

Add this line at the end of the file:

```
session    optional     pam_motd.so
```

## Creating the Dynamic MOTD Script

Then we need to create our scripts and execute them anytime we log into the system. For the execution part, as you surely know, any bash shell runs a script named `/etc/profile` (with user customizations if present). So we can simply add a call to our scripts at the end of this file, something like `/usr/local/bin/dynmotd`.

Then create, and make executable, the script, putting all the information you want to display to users. The following is the script I'm using on my home server:

```bash
#!/bin/bash

PROCCOUNT=`ps -Afl | wc -l`
PROCCOUNT=`expr $PROCCOUNT - 5`
GROUPZ=`groups`

if [[ $GROUPZ == *irc* ]]; then
ENDSESSION=`cat /etc/security/limits.conf | grep "@irc" | grep maxlogins | awk {'print $4'}`
PRIVLAGED="IRC Account"
else
ENDSESSION="Unlimited"
PRIVLAGED="Regular User"
fi

echo -e "\033[1;32m
 _                                                            _
| |                                                      _   (_)              _
| | _   ___  ____   ____   ____   ___   ____ ____   ____| |_  _   ____   ____| |_
| || \ / _ \|    \ / _  ) |    \ / _ \ / ___)  _ \ / _  |  _)| | |  _ \ / _  )  _)
| | | | |_| | | | ( (/ / _| | | | |_| | |   | | | ( ( | | |__| |_| | | ( (/ /| |__
|_| |_|\___/|_|_|_|\____|_)_|_|_|\___/|_|   |_| |_|\_||_|\___)_(_)_| |_|\____)\___)

\033[0;35m+++++++++++++++++: \033[0;37mSystem Data\033[0;35m :+++++++++++++++++++
+  \033[0;37mHostname \033[0;35m= \033[1;32m`hostname`
\033[0;35m+   \033[0;37mAddress \033[0;35m= \033[1;32m`/sbin/ifconfig eth0 | grep "inet addr" | awk -F: '{print $2}' | awk '{print $1}'`
\033[0;35m+    \033[0;37mKernel \033[0;35m= \033[1;32m`uname -r`
\033[0;35m+    \033[0;37mUptime \033[0;35m= \033[1;32m`uptime | sed 's/.*up ([^,]*), .*/1/'`
\033[0;35m+       \033[0;37mCPU \033[0;35m= \033[1;32m`cat /proc/cpuinfo | egrep -i '^model name' | head -1 | sed -e 's/^.*: //'`
\033[0;35m+    \033[0;37mMemory \033[0;35m= \033[1;32m`cat /proc/meminfo | grep MemTotal | awk {'print $2'}` kB
\033[0;35m+   \033[0;37mUpdates \033[0;35m= \033[1;32m`cat /tmp/yum_updates.txt`
\033[0;35m++++++++++++++++++: \033[0;37mUser Data\033[0;35m :++++++++++++++++++++
+  \033[0;37mUsername \033[0;35m= \033[1;32m`whoami`
\033[0;35m+ \033[0;37mPrivlages \033[0;35m= \033[1;32m$PRIVLAGED
\033[0;35m+  \033[0;37mSessions \033[0;35m= \033[1;32m`who | grep $USER | wc -l` of $ENDSESSION MAX
\033[0;35m+ \033[0;37mProcesses \033[0;35m= \033[1;32m$PROCCOUNT of `ulimit -u` MAX
\033[0;35m+++++++++++++++++++++++++++++++++++++++++++++++++++"
```

You can put whatever you want in this script, but if you have commands that take a long time to run, your login will take a long time too! For example, you can see in my script I'm using information from a file named `/tmp/yum_updates.txt`. This file just has the number of updates available for my system. I use a file because the yum execution could take a long time if a repository update is needed. The file is updated by another script I put in my crontab:

```
0 0 * * * /usr/local/bin/check_updates > /tmp/yum_updates.txt
```

The script contains:

```bash
#!/bin/sh

IFACE=eth0

if [ -n "$(/sbin/ifconfig $IFACE | /bin/grep RUNNING)" ]; then
        /usr/bin/yum -d 0 check-update 2>/dev/null | echo $(($(wc -l)-1))
fi

exit 0
```

This means if my server is connected (via eth0), it executes `yum check-update` and puts the result in the text file.