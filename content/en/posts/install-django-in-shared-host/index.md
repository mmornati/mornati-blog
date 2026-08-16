---
title: Install Django in shared host...
date: '2011-09-01T22:00:00+00:00'
slug: install-django-in-shared-host
---



The next step (after the <a href="http://blog.mornati.net/2011/08/31/bluehost-com-and-python-2-6/">Python 2.6 discovered</a>) is to install <a href="https://www.djangoproject.com/">Django</a> in my shared host.
Naturally my user account is not a <em>sudoers</em> and I don't have the root password, so the installation using the server package system is not possible.

Fortunately any Python project is quite simple to install, and Django is a Python project :D
<pre><code> wget http://www.djangoproject.com/download/1.3/tarball/
tar xzvf Django-1.3.tar.gz
cd Django-1.3
python2.6 setup.py install --user</code></pre>
<strong>Note</strong>: I used <em>python2.6</em> command to show out I want to install and use it with that version of Python. Naturally if you have an alias <em>python</em> should be sufficient. Same thing if you want to install it using Python 2.4, in this case the <em>--user</em> option does not work, so the right command to run is
<pre><code> python setup.py install --home $HOME/.local</code></pre>
Then, add yur Django installation to your user PATH, setting it in <em>.bashrc</em> file. In your home folder run:
<pre><code> vi .bashrc
export PATH=$HOME/.local/bin:$HOME/.local/usr/bin:$PATH</code></pre>
<div>After this two simple steps Django is ready and you can create your first project (or install your existing project).</div>
<div>Supposing you have your Django project installed into <em>~/projects/kermit-webui </em>to make it accessible from browser you need two components configured. The first thing is a Python fastcgi script to load your Django application, the second thing is the .htaccess file to configure your Apache and load the script.</div>
<div>First of all we create the <em>public_html</em> folder where we put our two components</div>
<div>
<pre><code> mkdir ~/public_html/kermit
cd ~/public_html/kermit</code></pre>
</div>
<div>Here we will create the fastcgi script</div>
<div>
<pre><code> vi kermit.fcgi

#!/usr/bin/python2.6
import sys, os
# Add a custom Python path.
sys.path.insert(0, "/home/user/.local/lib/python2.6")
sys.path.insert(13, "/home/user/projects/kermit")
os.environ['DJANGO_SETTINGS_MODULE'] = "webui.settings"
from django.core.servers.fastcgi import runfastcgi
runfastcgi(method="threaded", daemonize="false")</code></pre>
At the end of the script, as you can see, we start the fastcgi listener, to accept incoming requests.

</div>
<div>
<div>
<div>Now we are ready to configure the .htaccess file</div>
<div>
<pre><code> vi .htaccess

AddHandler fcgid-script .fcgi
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_URI} !=/favicon.ico
RewriteCond %{REQUEST_URI} !^/static/     

RewriteRule ^(.*)$ kermit.fcgi/$1 [QSA,L]</code></pre>
Basically we are configuring the <a href="http://httpd.apache.org/docs/current/mod/mod_rewrite.html">Apache RewriteEngine</a>, saying that all requests sould be sent to <em>kermit.fcgi</em> script except requests with <em>/static/</em> in the url (my static file, like css, imgs, js, ... are there) and favicon.ico.

</div>
<div>This script should have 755 access rule, so:</div>
<div>
<pre><code> chmod 0755 kermit.fcgi</code></pre>
</div>
<div>
<div>
<div>And that's "all". Depending on your hosting and projects could be necessary to install some other packages. On BlueHost to use Django with fastcgi you need to install <em>flup </em>project.</div>
<div>
<pre><code> $ wget http://www.saddi.com/software/flup/dist/flup-1.0.2.tar.gz
$ tar xzvf flup-1.0.2.tar.gz
$ cd flup-1.0.2</code></pre>
</div>
<div>

Like shown before, for Python 2.6/2.7:
<pre><code> $ python setup.py install --user</code></pre>
For previous versions:
<pre><code> $ python setup.py install --home $HOME/.local</code></pre>
</div>
</div>
</div>
</div>
</div>
Now you can browse your django application :D

If you want to see a first result of this test, point your browser on <a href="http://kermit.mornati.net">http://kermit.mornati.net</a>
