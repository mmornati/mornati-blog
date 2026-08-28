---
title: Install Agilo Open for Trac 0.12 on BlueHost
categories:
- linux-sysadmin
- devops
date: '2012-05-25T22:00:00+00:00'
slug: install-agilo-open-for-trac-012-on-bluehost
---



After an hard work of developer, finally <a href="http://www.agilofortrac.com/">Agilo</a> sort out a new completely refactored version of this software. If you want to manage your project with the Agile (and Scrum) methodology, for FREE, this one I think is the best easy solution.

Looking on the web site you can find now also a PRO version, but fortunately you can still have a free (even with less functionalities) version.

Some time ago we see <a href="http://blog.mornati.net/2012/01/13/trac-0-12-on-bluehost-with-python-2-7/">how</a> to install <a href="http://trac.edgewall.org/">trac</a> on <a href="http://www.bluehost.com/">BlueHost</a>; now we add to our installation all the Agilo Capabilities.
So, we start this guide, supposing that you trac is working on your blue host account.

You should start downloading the Agilo OpenSource version: the source code of the project.
<pre><code> wget http://www.agilofortrac.com/en/download/agilo_source.tar.gz</code></pre>
Then decompress the agile sources:
<pre><code> tar xf agilo-0.9.8.tar</code></pre>
and run the installation
<pre><code> cd agilo-0.9.8
python setup.py install</code></pre>
In this example we are supposing that your <em>python</em> binary is the same you have used to install trac. If false use the correct binary name.

Then we have just to enable Agilo in our trac environment editing the trac.ini config file:
<pre><code> vi /home2/mornatin/public_html/trac/projects/conf/trac.ini</code></pre>
And add this lines at the end of file
<pre><code> [components]
agilo.* = enabled</code></pre>
Now we just need to upgrade Trac database and Wiki to add all agile functionalities:
<pre><code> trac-admin /home2/mornatin/public_html/trac/projects upgrade
trac-admin /home2/mornatin/public_html/trac/projects wiki upgrade</code></pre>
That's all. If everything worked well you should see the agile interface accessing to your trac web app.

<a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641345/Schermata-05-2456073-alle-21_50_49_pchxku.png">![](/images/install-agilo-open-for-trac-012-on-bluehost/00-Schermata-05-2456073-alle-21_50_49_pchxku.png)</a>
