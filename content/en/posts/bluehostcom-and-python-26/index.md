---
title: Bluehost.com and Python 2.6...
date: '2011-08-30T22:00:00+00:00'
slug: bluehostcom-and-python-26
---



I found python 2.6 installed on <a href="http://www.bluehost.com">BlueHost</a> but is not enabled by default. That means if you simply run a <em>python</em> command you will have version 2.4
<pre><code> user@mornati.net [~]# python
Python 2.4.3 (#1, May  5 2011, 16:39:10)
[GCC 4.1.2 20080704 (Red Hat 4.1.2-50)] on linux2
Type "help", "copyright", "credits" or "license" for more information.
&gt;&gt;&gt;</code></pre>
But... inside the user home folder there is also the version 2.6 (ok, not 2.7 neither 3.0, but at least a step ahead :))
<pre><code> user@mornati.net [~]# whereis python
python: /bin/python /bin/python.orig /bin/python2.6-config /bin/python2.4 /bin/python2.6 /usr/bin/python /usr/bin/python.orig /usr/bin/python2.6-config /usr/bin/python2.4 /usr/bin/python2.6 /sbin/python /sbin/python.orig /sbin/python2.6-config /sbin/python2.4 /sbin/python2.6 /usr/sbin/python /usr/sbin/python.orig /usr/sbin/python2.6-config /usr/sbin/python2.4 /usr/sbin/python2.6 /lib/python2.4 /lib/python2.3 /lib/python2.6 /usr/lib/python2.4 /usr/lib/python2.3 /usr/lib/python2.6 /usr/include/python2.4 /usr/include/python2.6 /usr/share/man/man1/python.1.gz</code></pre>
So <em>/bin/python2.6</em> is you run command.
<pre><code> user@mornati.net [~]# python2.6
Python 2.6 (r26:66714, Apr  1 2009, 20:44:00)
[GCC 4.1.2 20080704 (Red Hat 4.1.2-44)] on linux2
Type "help", "copyright", "credits" or "license" for more information.
&gt;&gt;&gt;</code></pre>
Now to use by default the version 2.6 without using the <em>"</em>bad" <em>python2.6 </em>command, just edit your .bashrc file. Add this line at the end of your file:
<pre><code> alias python=”python2.6″</code></pre>
And.... enjoy!
