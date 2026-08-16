---
title: Execute a dynamic MOTD scripts on Centos6
date: '2013-11-11T23:00:00+00:00'
slug: execute-a-dynamic-motd-scripts-on-centos6
---



A thing I found useful in the default configuration of Debian and Ubuntu Systems, is the MOTD message (Message Of The Day) display, any time you login into system, information about packages updates, load, ...

The following guide display how you can configure it on a Centos System (or we could say any RedHat based system).

First of all, we need to configure a PAM connection module:
<pre><code> <code>vi /etc/pam.d/login</code></pre>
Adding this line at the end of the file
<pre><code> <code>session    optional     pam_motd.so</code></pre>
Then we need to create our scripts and execute it anytime we log into system. For the execution part, as you surely know, any bash execution, run a script named <strong>/etc/profile</strong> (with, if presents, some user customizations). So we can simply add a call to our scripts at the end of this file, something like <em>/usr/local/bin/dynmotd</em>.

Then create, and make executable, the scripts, putting all information you want to display to the users. The following is, for example, the script I'm using on my home server.
<pre><code> <code>blog/core/built/scripts/ghost.js:      updateScrollPos(this, sPos.scrollLeft, sPos.scrollTop);
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
\033[0;35m+++++++++++++++++++++++++++++++++++++++++++++++++++</code></pre>
You can put what you want on this scripts, but if you have commands that takes long time to run, means your login takes long time!!
For example, you can see in my script, I'm using informations contents into a file named <em>/tmp/yum_updates.txt</em>. This file just has the number of updates available for my system and I'm using file because the yum execution could take long time, if a repository updates is needed. The file is updated by another scripts I put on my crontab:
<pre><code> <code>0 0 * * * /usr/local/bin/check_updates &gt; /tmp/yum_updates.txt</code></pre>
The scripts contains:
<pre><code> <code>#!/bin/sh

IFACE=eth0

if [ -n "$(/sbin/ifconfig $IFACE | /bin/grep RUNNING)" ]; then
        /usr/bin/yum -d 0 check-update 2&gt;/dev/null | echo $(($(wc -l)-1))
fi

exit 0</code></pre>
Means, if my server is connected (with eth0) then execute the command <em>yum check-update</em> putting the result in the text file.
