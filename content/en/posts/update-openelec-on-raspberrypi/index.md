---
title: Update OpenELEC on RaspberryPI
date: '2013-02-27T23:00:00+00:00'
slug: update-openelec-on-raspberrypi
---



You can use a <a href="http://www.raspberrypi.org/" target="_blank">RaspberryPI</a> computer in many differents way. Personally I decided to use it as mediacenter with an <a href="http://xbmc.org/" target="_blank">XBMC</a> program.

After the first installation I spent lot of time to configure any things in XBMC: share folders for videos, share folders for music, ... So the problem I had was about the "update" process. The OpenELEC is based on a linux distribution but there is nothing to automate packages installation or update (I mean something like <strong>yum</strong> or <strong>apt-get</strong>), I it's not possible for any system update to reconfigure anything.

I looked on internet and in the end I found a simple script that help you in the update process.
<pre class="language-bash line-numbers"><code class="language-bash">
#!/bin/bash

# change working directory 
cd /storage

# location of the nightlies
url="http://openelec.thestateofme.com/"

# get base, revision and filename of last build
last_base=`curl -s $url | grep .tar.bz2 | sed 's/.*\(OpenELEC-RPi.*\).tar.bz2.*/\1/' | sort | tail -1`
last_revision=`echo $last_base | sed 's/.*\(r[0-9]*\)/\1/'`
last_filename=$last_base.tar.bz2

# folder name is set equal to base
foldername=$last_base

# get currently installed revision
this_revision=`cat /etc/version | sed 's/.*\(r[0-9]*\)/\1/'`

# check if currently installed revision is up-to-date
if [ $this_revision == $last_revision ]
then
    echo "System is up-to-date, no update required."
    exit
else
    echo "Update required, will download latest version."
fi

# clean up previously interrupted update
if [ -a $last_filename ]; then
    echo "Clean up previously interrupted update files."
    rm $last_filename
fi
if [ -a $foldername ]; then
    echo "Clean up previously interrupted update files."
    rm -rf $foldername
fi

# download corresponding file to working directory
urltolast=$url/$last_filename
wget $urltolast
echo -e  "Download complete\n"

# uncompressing the tarball
echo "Uncompressing tarball, files extracted:"
tar -xvjf $last_filename

# check if image folder exists, otherwise exit
if [ ! -d $foldername ]; then
   echo "Cannot find extracted folder."
   exit
fi

# check if .update folder exists, otherwise create it
if [ ! -d /storage/.update ]; then
    mkdir /storage/.update
fi

# move OpenELEC files (including .md5 files) to update folder
mv $foldername/target/* /storage/.update/
echo -e "\nOpenELEC files succesfully moved to update directory"

# clean up
rm -r $foldername
rm $last_filename
echo "Temporary files deleted"

# sync and reboot system to apply updates
echo "System will restart shortly"
echo "Enjoy!"
sleep 5s
sync
reboot
</code></pre>
Sorry to the author because I can't remember where I found it, and I don't even know if it's the original version or if I modified it. In any case it works perfectly.

What you just need to do is to copy it on your RaspberryPi/OpenELEC system and execute it. The script will check if a new version is available, it will download it and then reboot the raspberry when all is ready for the update (update will be automatically installed after the reboot).

How you can copy the script on your OpenELEC and execute an update? You can make an <strong>SSH connection </strong>to the RaspberryPi.
<pre class="language-bash command-line" data-user="marco" data-host="notebook" data-output="2-10"><code class="language-bash">ssh root@192.168.0.25
##############################################
# OpenELEC - The living room PC for everyone #
# ...... visit http://www.openelec.tv ...... #
##############################################

OpenELEC Version: devel-20130119143821-r12975
OpenELEC git: 6bc259fb5cdf4f941e85e43132a0a31e211af937
root@192.168.0.25's password: 
</code></pre>
Where <strong>192.168.0.25</strong> is the ip address of my Raspberry. I make the SSH connection using a Linux/Mac computer (where ssh is available by default on the command line); if you are on Windows, you need to use <a href="http://www.putty.org/" target="_blank">Putty</a> to make the ssh connection!

The default username/password to connect to OpenELEC via SSH are:

username: <strong>root
</strong>password: <strong>openelec</strong>

After connection you can create your script where you want on your system (you are root so be carefull because you can do anything). Normally where you have a lot of free space is <strong>/storege</strong>, but if you are not sure, you can check it with a <strong>df -h</strong>:
<pre class="language-bash command-line" data-user="root" data-host="raspberrypi" data-output="2-8"><code class="language-bash">df -h
Filesystem                Size      Used Available Use% Mounted on
none                    185.0M     90.1M     94.9M  49% /dev
/dev/mmcblk0p1          124.7M     98.8M     26.0M  79% /flash
/dev/mmcblk0p2            3.6G    127.5M      3.3G   4% /storage
/dev/loop0               90.0M     90.0M         0 100% /
none                    186.5M         0    186.5M   0% /dev/shm</code></pre>

Then you can create the script file using <strong>vi</strong>, for example typing something like:
<pre class="language-bash command-line" data-user="root" data-host="raspberrypi"><code class="language-bash">vi update.sh</code></pre>
And here you can paste the content of the script I put in this article.
After this you need to make the script <em>executable</em> and execute it, with:
<pre class="language-bash command-line" data-user="root" data-host="raspberrypi"><code class="language-bash">chmod +x update.sh
./update.sh</code></pre>
You should have an output like the following:
<pre class="language-bash command-line" data-user="root" data-host="raspberrypi" data-output="2-17"><code class="language-bash">./update.sh 
Update required, will download latest version.
Connecting to openelec.thestateofme.com (46.149.19.9:80)
OpenELEC-RPi.arm-dev 100% |*****************************************************************************************************| 92078k  0:00:00 ETA
Download complete

Uncompressing tarball, files extracted:
OpenELEC-RPi.arm-devel-20130228144321-r13387/
[...]
OpenELEC-RPi.arm-devel-20130228144321-r13387/target/SYSTEM
OpenELEC-RPi.arm-devel-20130228144321-r13387/openelec.ico
OpenELEC-RPi.arm-devel-20130228144321-r13387/INSTALL

OpenELEC files succesfully moved to update directory
Temporary files deleted
System will restart shortly
Enjoy!</code></pre>
Finished! After the reboot your OpenELEC is updated. You can check it simply with an ssh connection (after the connection you should see the version directly on your screen) or going in the settings in your XBMC.
