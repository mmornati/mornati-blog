---
title: CentOS 6 as Apple TimeMachine Backup
date: '2014-02-08T23:00:00+00:00'
slug: centos-6-as-apple-timemachine-backup
categories:
  - System Administration
  - macOS
  - Backup
tags:
  - centos
  - timemachine
  - netatalk
  - avahi
  - apple
  - backup
  - nas
description: >-
  Configure a CentOS 6 Linux server as a network TimeMachine backup disk using
  Netatalk and Avahi, replicating Apple's TimeCapsule functionality.
---

TimeCapsule is the Apple (closed) backup system. But even if closed, you can configure a Linux server to be your TimeMachine network disk, just like TimeCapsule does.

First you need a Linux system and, to follow this step-by-step guide, you need a CentOS 6.X Linux.

## Installation

Configure the EPEL repository, if your system is not yet configured with it:

```bash
sudo rpm -Uvh http://www.mirrorservice.org/sites/dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
```

Then install all the necessary services:

```bash
sudo yum clean all
sudo yum make cache
sudo yum -y install netatalk avahi dbus nss-mdns
```

## Configuration

Configure the Netatalk service by editing `/etc/netatalk/afpd.conf` and adding the following line at the end of the file:

```bash
- -transall -uamlist uams_randnum.so,uams_dhx.so,uams_dhx2.so -nosavepassword -advertise_ssh
```

Create the folder to use for TimeMachine backups:

```bash
mkdir -p /mnt/data/TimeMachine
chown youruser:youruser /mnt/data/TimeMachine
```

Where *youruser* is a Linux local user that can connect to the system (with a password) and the one you want to allow to use TimeMachine backup.

Then edit the Netatalk AppleVolumes file (`/etc/netatalk/AppleVolumes.default`) and add the folder you want to use for your backups:

```bash
/mnt/data/TimeMachine allow:youruser options:usedots,upriv,tm dperm:0775 fperm:0660 cnidscheme:dbd
```

You just need to change *youruser* with the previously selected user.

Next configure the nsswitch service in the file `/etc/nsswitch.conf` and add the following line at the end:

```bash
hosts:      files mdns4_minimal dns mdns mdns4
```

In Avahi, configure the afpd service to be broadcast on the network via the Avahi daemon. Create the file `/etc/avahi/services/afpd.service` with the following content:

```xml
<?xml version="1.0" standalone='no'?>
<!DOCTYPE service-group SYSTEM "avahi-service.dtd">
<service-group>
<name replace-wildcards="yes">%h</name>
<service>
<type>_afpovertcp._tcp</type>
<port>548</port>
</service>
<service>
<type>_device-info._tcp</type>
<port>0</port>
<txt-record>model=TimeCapsule</txt-record>
</service>
</service-group>
```

Disable the SSH service from Avahi:

```bash
mv /etc/avahi/services/ssh.service /etc/avahi/services/ssh.service.disabled
```

If you have iptables enabled on your system, you need to open the ports used by TimeMachine. Add these lines to your `/etc/sysconfig/iptables` file:

```bash
-A INPUT -p tcp -m state --state NEW -m tcp --dport 548 -j ACCEPT
-A INPUT -p tcp -m state --state NEW -m tcp --dport 5353 -j ACCEPT
-A INPUT -p tcp -m state --state NEW -m tcp --dport 5354 -j ACCEPT
-A INPUT -p udp -m udp --dport 548 -j ACCEPT
-A INPUT -p udp -m udp --dport 5353 -j ACCEPT
-A INPUT -p udp -m udp --dport 5354 -j ACCEPT
```

Reload the iptables configuration, or restart the service:

```bash
/sbin/service iptables restart
```

Enable and start all services:

```bash
/sbin/chkconfig netatalk on
/sbin/chkconfig messagebus on
/sbin/chkconfig avahi-daemon on

/sbin/service avahi-daemon restart
/sbin/service messagebus restart
/sbin/service netatalk restart
```

Going back to your Mac the disk should be visible in your TimeMachine.
If not, try to check the services (`/sbin/service xxx status`) and restart them.

![TimeMachine](/images/centos-6-as-apple-timemachine-backup/00-yrbeqnnb3oe5bufjv9l3.png)

Enjoy your new OpenSource (and low cost!) TimeCapsule