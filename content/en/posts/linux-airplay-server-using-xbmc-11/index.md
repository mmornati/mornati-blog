---
title: Linux Airplay server using XBMC 11
date: '2012-04-05T22:00:00+00:00'
slug: linux-airplay-server-using-xbmc-11
---



I finally had time to test the latest version of <a href="http://xbmc.org/">XBMC</a> media center (version 11) on my Fedora 16.
My first test was using directly the rpm provided on rawhide repositories (fedora and rpm-fusion-free) but in this way many others components will be updated (like gnome for example) because the package is produced for Fedora 17.

So, following this little <a href="http://beta.hiscorebob.lu/2012/02/how-to-compile-xbmc-11-in-fedora-16/">guide</a> that provides all necessary steps, I built XBMC directly on my Fedora.
The only things to add at the end, is to export the lib folder for the normal user (at least, on my fedora xbmc didn't work without this step).

So, for example, you can edit your .bashrc file:
<pre><code> mmornati@desktop ~$ pwd
/home/mmornati
mmornati@desktop ~$ vi .bashrc</code></pre>
Adding this line at the end of the file
<pre><code> export LD_LIBRARY_PATH="/usr/local/lib":$LD_LIBRARY_PATH</code></pre>
And then you can startup you XBMC without problem :D

As you can see in the following picture, it's really simple to use XBMC as AirPlay server (for videos, photos and music).

<a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641356/foto_rmlvlv.png">![](/images/linux-airplay-server-using-xbmc-11/00-foto_rmlvlv.png)</a>
