---
title: CentOS 6 as Apple TimeMachine Backup
date: '2014-02-08T23:00:00+00:00'
slug: centos-6-as-apple-timemachine-backup
---



TimeCapsule is the Apple (closed) backup system. But... even if closed, you can configure a linux server to be your TimeMachine network disk, like TimeCapsule does.

First of all you need a linux system and, to follow this step-by-step guide, you need a CentOS 6.X linux.

#### Installation
Configure EPEL repository, if your system is not yet configured with it:

<pre class="language-bash command-line" data-user="marco" data-host="centos"><code class="language-bash">sudo rpm -Uvh http://www.mirrorservice.org/sites/dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
</code></pre>

Then install all the necessary services:

<pre class="language-bash command-line" data-user="marco" data-host="centos"><code class="language-bash">sudo yum clean all
sudo yum make cache
sudo yum -y install netatalk avahi  dbus nss-mdns </code></pre>

####Configuration
Configure netatalk service editing the */etc/netatalk/afpd.conf* file and adding the following line at the end of the file:

<pre class="language-bash"><code class="language-bash">- -transall -uamlist uams_randnum.so,uams_dhx.so,uams_dhx2.so -nosavepassword -advertise_ssh</code></pre>

Create folder to use for TimeMachine backups:

<pre class="language-bash command-line" data-user="marco" data-host="centos"><code class="language-bash">mkdir -p /mnt/data/TimeMachine
chown youruser:youruser /mnt/data/TimeMachine</code></pre>

Where *youruser* is a linux local user that can connect to the system (with a password) and the one you want to allow to use TimeMachine backup.

Then edit the netatalk AppleVolumes file (*/etc/netatalk/AppleVolumes.default*) and add the folder you want to use for your backups:

<pre class="language-bash"><code class="language-bash">/mnt/data/TimeMachine allow:<b>youruser</b> options:usedots,upriv,tm dperm:0775 fperm:0660 cnidscheme:dbd</code></pre>

You just need to change *youruser* with the previously selected user.

Next configure the nsswitch service into the file */etc/nsswitch.conf* and add the following line at the end:

<pre class="language-bash"><code class="language-bash">hosts:      files mdns4_minimal dns mdns mdns4</code></pre>

In Avahi, configure the afpd service to be brodcasted on the network via the avahi daemon. Create the file */etc/avahi/services/afpd.service* with the following content:

<pre class="language-xml"><code class="language-xml">&lt;?xml version=”1.0″ standalone=’no’?&gt;
&lt;!DOCTYPE service-group SYSTEM “avahi-service.dtd”&gt;
&lt;service-group&gt;
&lt;name replace-wildcards=”yes”>%h&lt;/name&gt;
&lt;service&gt;
&lt;type>_afpovertcp._tcp&lt;/type&gt;
&lt;port>548&lt;/port&gt;
&lt;/service&gt;
&lt;service&gt;
&lt;type>_device-info._tcp&lt;/type&gt;
&lt;port>0&lt;/port&gt;
&lt;txt-record>model=TimeCapsule&lt;/txt-record&gt;
&lt;/service&gt;
&lt;/service-group&gt;</code></pre>

Disable the SSH service from avahi:

<pre class="language-bash command-line" data-user="marco" data-host="centos"><code class="language-bash">mv /etc/avahi/services/ssh.service /etc/avahi/services/ssh.service.disabled
</code></pre>

If you have iptables enabled on your system, you need to open the ports used by TimeMachine. Add these lines to your */etc/sysconfig/iptables* file:

<pre class="language-bash"><code class="language-bash">-A INPUT -p tcp -m state --state NEW -m tcp --dport 548 -j ACCEPT
-A INPUT -p tcp -m state --state NEW -m tcp --dport 5353 -j ACCEPT
-A INPUT -p tcp -m state --state NEW -m tcp --dport 5354 -j ACCEPT
-A INPUT -p udp -m udp --dport 548 -j ACCEPT
-A INPUT -p udp -m udp --dport 5353 -j ACCEPT
-A INPUT -p udp -m udp --dport 5354 -j ACCEPT</code></pre>

Reload the iptables configuration, or restart the service:

<pre class="language-bash command-line" data-user="root" data-host="centos"><code class="language-bash">/sbin/service iptables restart</code></pre>

Ensable and start all service:

<pre class="language-bash command-line" data-user="root" data-host="centos"><code class="language-bash">/sbin/chkconfig netatalk on
/sbin/chkconfig messagebus on
/sbin/chkconfig avahi-daemon on

/sbin/service avahi-daemon restart
/sbin/service messagebus restart
/sbin/service netatalk restart</code></pre>

Going back to your Mac the disk should be visible in your TimeMachine. 
If not try to check services (*/sbin/service xxx status*) and restart them.

![TimeMachine](/images/centos-6-as-apple-timemachine-backup/00-yrbeqnnb3oe5bufjv9l3.png)

Enjoy your new OpenSource (and low cost!!) TimeCapsule
