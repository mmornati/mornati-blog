---
title: Linux as AirPrint server
date: '2011-09-27T22:00:00+00:00'
slug: linux-as-airprint-server
---



An annoying feature of recent iOS is the AirPrint capability! I'm saying that is annoying because you can print from your iOS device only to enabled printers. Today this feature is added to lot of printers, but maybe (like in my situation) means: <strong>change my printer with a new one</strong>.

Considering that I'm using printer just in rare situations (like print online flying tickets) is not reasonable to change it! So, looking on internet, I found that you can easily create an AirPrint printer server using a <a href="http://netputing.com/airprintactivator">native application</a> for MacOSX/Windows or, if you have a linux home server like me, the <strong>avahi </strong>service included in linux distributions.

To configure your avahi service with your printer you can use this python script: <a href="https://github.com/tjfontaine/airprint-generate">https://github.com/tjfontaine/airprint-generate</a> with this simple command
<pre><code> python airprint-generate.py</code></pre>
that will automatically look in your linux cups configuration, extract your printer and generate the file for avahi. If you have more than one printer configure you can pass a parameter to the script saying witch printer you want to configure.

If all works well you should have a file with a name like this: <strong>AirPrint-EPSONDX5000.service</strong> containing all required information.
Now, just copying this file in the avahi service folder, you will enable your printer:
<pre><code> mv AirPrint-EPSONDX5000.service /etc/avahi/services/AirPrint-EPSONDX5000.service</code></pre>
If all works well you should have this on your iOS device:

<a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641471/foto_gdwi2d.png">![](/images/linux-as-airprint-server/00-foto_gdwi2d.png)</a>
<strong>NOTE:</strong> I noticed with some avahi version there is problem discovering printers: printer is shown in your iOS device just for a couple of minute and then you cannot see it anymore. To fix this problem I just added in crontab (run every minute):
<pre><code> touch /etc/avahi/services/AirPrint-EPSONDX5000.service</code></pre>
I know that is not a really cool solution, but I didn't found anything better. Actually on my Fedora the problem with amahi seems fixed, but "remember the touch" if you have problems ;)

<strong>UPDATE:</strong>
Following the <strong>matt</strong> suggestion in the comments, you can edit your iptables firewall rules allowing multicast DNS traffic (mDNS).
For example add in your <em>/etc/sysconfig/iptables</em> file, this line
<pre><code> -A RH-Firewall-1-INPUT -p udp --dport 5353 -d 224.0.0.251 -j ACCEPT</code></pre>
Using an <em>iptables -L</em> you should then see a line like this:
<pre><code> ACCEPT     udp  --  anywhere             224.0.0.251          udp dpt:mdns</code></pre>
Thanks a lot matt for your help!!!
