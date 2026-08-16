---
title: Mount Hubic cloud disk on your local Linux
date: '2013-11-03T23:00:00+00:00'
slug: mount-hubic-cloud-disk-on-your-local-linux
---



<a href="https://hubic.com/it/">Hubic</a> is the french Dropbox clone, created by OVH, offering 25Gb storage for free. When it sorted out there weren't many clients for the different operating systems but there was an useful (undocumented) fonction: the webdav. Using webdav you could mount your Hubic drive on any system to copy your files.
Some weeks ago, when the latest OS client (the linux one) come out, OVH decided to remove the webdav access... but unfortunately the client at the moment has some bugs and is not so easy-to-use like "copy e file into a folder".
<p style="text-align: left;">Fortunately you can get back your "local cubic folder" using <a href="http://docs.openstack.org/developer/swift/">Swift</a> and <a href="https://github.com/redbo/cloudfuse">CloudFuse</a>.
Here you are the instruction to get it working on Centos6.</p>
To simplify the usage of swift, you can use a PHP swift proxy to your hubic account.
<pre><code> <code>git clone https://github.com/Toorop/HubicSwiftGateway.git
mv HubicSwiftGateway/src/www /var/www/html/hubic
mkdir /var/www/html/cache
chown apache:apache /var/www/html/cache</code></pre>
Here we are supposing your apache root folder is <em>/var/www/html.</em> And naturally, the apache with php5 should already be installed on your system.<em> </em>

Now you can install the cloudfuse project. For Centos6 I created the RPM to simplify your work, but if you prefer you can download the sources from github and follow the instructions on the README to build it.
The RPMs are located on my repo: <a href="http://repo.mornati.net/extras/">http://repo.mornati.net/extras/
</a>You can configure it as yum repository for your centos server using:
<pre><code> <code>echo &gt; /etc/yum.repos.d/mornati-extras.repo &lt;&lt; EOF
[mornati-extras]
name=MornatiNet-Extras
baseurl=http://repo.mornati.net/extras/centos/$releasever/$basearch/
gpgcheck=0
enalbed=1
EOF</code></pre>
And install then cloudfuse using yum
<pre><code> <code>yum -y install cloudfuse</code></pre>
To allow a normal user to mount the hubic driver using could fuse, must be in the <em>fuse</em> group, and the mount point should be owned by the fuse group.
<pre><code> <code>usermod -aG fuse mmornati
chgrp fuse /mnt/hubic; chmod g+w /mnt/hubic
chgrp fuse /mnt/hubic; chmod g+w /mnt/cubic</code></pre>
Before you can mount your hubic drive, you need to configure your account data in a file named <strong>.cloudfuse</strong> in the home directory of the user you want to use to mount.
<pre><code> <code>username=hubicuname
api_key=hubicpassword
authurl=http://localhost/hubic/
cache_timeout=20</code></pre>
Where, authurl is the url to your Swift HTTP proxy. SO, in my example, the proxy was installed on the same system where I want to mount the Hubic drive too.

Now you are ready to mount your hubic driver on your system:
<pre><code> <code>/usr/local/bin/cloudfuse /mnt/hubic/ -o noauto_cache,sync_read</code></pre>
If all worked well you should be able to list your Hubic files
<pre><code> <code>mmornati@desktop ~$ ls /mnt/hubic/default
Backup  Documents  Images  Videos</code></pre>
