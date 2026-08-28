---
title: Mount Hubic cloud disk on your local Linux
categories:
- linux-sysadmin
date: '2013-11-03T23:00:00+00:00'
slug: mount-hubic-cloud-disk-on-your-local-linux
tags:
  - hubic
  - ovh
  - cloud
  - webdav
  - swift
  - cloudfuse
  - centos
description: Mount your OVH Hubic cloud storage on Linux using Swift and CloudFuse.
---

[Hubic](https://hubic.com/it/) is the french Dropbox clone, created by OVH, offering 25Gb storage for free. When it came out there weren't many clients for different operating systems but there was a useful (undocumented) feature: the webdav. Using webdav you could mount your Hubic drive on any system to copy your files.

Some weeks ago, when the latest OS client (the Linux one) came out, OVH decided to remove the webdav access... but unfortunately the client currently has some bugs and isn't as easy to use as "copy a file into a folder".

Fortunately, you can get your local Hubic folder back using [Swift](http://docs.openstack.org/developer/swift/) and [CloudFuse](https://github.com/redbo/cloudfuse). Here are the instructions to get it working on Centos6.

## Overview

To simplify the usage of swift, you can use a PHP swift proxy to your hubic account.

## Install the Swift Proxy

```bash
git clone https://github.com/Toorop/HubicSwiftGateway.git
mv HubicSwiftGateway/src/www /var/www/html/hubic
mkdir /var/www/html/cache
chown apache:apache /var/www/html/cache
```

Here we're assuming your Apache root folder is */var/www/html*. And naturally, Apache with PHP 5 should already be installed on your system.

## Install CloudFuse

Now you can install the cloudfuse project. For Centos6 I created the RPM to simplify your work, but if you prefer you can download the sources from github and follow the instructions on the README to build it. The RPMs are located on my repo: [http://repo.mornati.net/extras/](http://repo.mornati.net/extras/). You can configure it as yum repository for your centos server using:

```bash
echo > /etc/yum.repos.d/mornati-extras.repo << EOF
[mornati-extras]
name=MornatiNet-Extras
baseurl=http://repo.mornati.net/extras/centos/$releasever/$basearch/
gpgcheck=0
enalbed=1
EOF
```

And install then cloudfuse using yum

```bash
yum -y install cloudfuse
```

To allow a normal user to mount the Hubic drive using CloudFuse, the user must be in the *fuse* group, and the mount point should be owned by the fuse group.

```bash
usermod -aG fuse mmornati
chgrp fuse /mnt/hubic; chmod g+w /mnt/hubic
chgrp fuse /mnt/hubic; chmod g+w /mnt/cubic
```

## Configuration

Before you can mount your hubic drive, you need to configure your account data in a file named **.cloudfuse** in the home directory of the user you want to use to mount.

```bash
username=hubicuname
api_key=hubicpassword
authurl=http://localhost/hubic/
cache_timeout=20
```

Where, authurl is the URL to your Swift HTTP proxy. So, in my example, the proxy was installed on the same system where I want to mount the Hubic drive too.

## Mounting

Now you're ready to mount your Hubic drive on your system:

```bash
/usr/local/bin/cloudfuse /mnt/hubic/ -o noauto_cache,sync_read
```

If everything worked, you should be able to list your Hubic files

```bash
mmornati@desktop ~$ ls /mnt/hubic/default
Backup  Documents  Images  Videos
```