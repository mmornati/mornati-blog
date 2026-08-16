---
title: Linux Airprint Server for iOS6 devices
date: '2012-09-21T22:00:00+00:00'
slug: linux-airprint-server-for-ios6-devices
---



After iOS6 update my Linux Airprint server does not work anymore for my iDevices. I'm referring to my <a href="http://blog.mornati.net/2011/09/28/linux-as-airprint-server/">previous article</a> explaining how you can configure a linux machine as Linux Airprint Server!

Fortunately there is no change to the Airprint protocol. <a href="http://blog.mornati.net/2011/09/28/linux-as-airprint-server/comment-page-1/#comment-3660">Ranil</a> give us the solution (thanks a lot for your test!!)

You should add to your previous configuration <em>.service</em> file, into pdl section, <strong>image/urf</strong>. For example, in my file now I have:
<pre><code> pdl=application/octet-stream,application/pdf,application/postscript,image/gif,image/jpeg,image/png,image/tiff,text/html,text/plain,application/vnd.cups-banner,application/vnd.cups-command,application/vnd.cups-pdf,application/vnd.cups-postscript,image/urf</code></pre>
After this your print should be visible in your local network. To completely allow print with any iOS6 application, you have to add also these two files in your cups configuration.<strong></strong>

<strong>/usr/share/cups/mime/apple.types</strong>
<pre><code> image/urf urf (0,UNIRAST)</code></pre>
<strong>/usr/share/cups/mime/local.convs</strong>
<pre><code> image/urf application/vnd.cups-postscript 66 pdftops</code></pre>
Now your <em>AirPrinter</em> should work correctly!

Thanks a lot <strong>Ranil</strong> for your help!

Moved from comment, here the complete <a href="http://blog.mornati.net/2012/09/22/linux-airprint-server-for-ios6-devices/comment-page-1/#comment-3667"><strong>Jam</strong></a> guide to setup an AirPrint server for iOS6. Reading the commands executed in the "script" i can say that is step-by-step guide for a Fedora16/17. For a Centos/RedHat you have to change a little bit some steps.
<pre><code> #AS ROOT:
echo “image/urf urf (0,UNIRAST)” &gt; /usr/share/cups/mime/apple.types
echo “image/urf application/vnd.cups-postscript 66 pdftops” &gt; /usr/share/cups/mime/local.convs
# pdftops can be installed with: yum install poppler-utils
#restore SELINUX permissions
restorecon /usr/share/cups/mime/*
#restart cups (print server)
systemctl restart cups.service

#AS USER:
#download airprint-generate.py as stated above and run it from: https://github.com/tjfontaine/airprint-generate
cd /tmp/
python airprint-generate.py

#AS ROOT:
mv /tmp/AirPrint-*.service /etc/avahi/services/
restorecon /etc/avahi/services/*
#restart the avahi service
systemctl restart avahi-daemon.service

#check the new AirPort service is running
avahi-browse --all
# no avahi-browse ?, install it: yum install avahi-tools</code></pre>
I think you should say a big thanks to <strong>Jam</strong> for this script! ;)
