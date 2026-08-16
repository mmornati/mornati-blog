---
title: Trac 0.12 on BlueHost with Python 2.7
date: '2012-01-12T23:00:00+00:00'
slug: trac-012-on-bluehost-with-python-27
---



After some requests from **Nikos** on the Trac post I noticed that the article I wrote to use Trac on BlueHost cannot work anymore. As I said in this [post](http://blog.mornati.net/2011/11/30/install-python-2-7-on-bluehost/) BlueHost decided to remove the Python 2.6 installed by default, and the [previous guide](http://blog.mornati.net/2011/09/06/install-trac-0-12-in-shared-host/) was based on that version of Python.
Anyway thanks to **Nikos** for this new post ;)

After the installation of version 2.7.2 (or the one you prefer) of python as you can see in the previously linked article, it's really simple to install Trac too.

First of all you "need" to install **easy_install** for your version of python (it's not true that you need but it's the fastest way to install python libraries).
<pre class="language-bash command-line" data-user="mmornati" data-host="macosx"><code class="language-bash">wget http://peak.telecommunity.com/dist/ez_setup.py
python ez_setup.py</code></pre>
Or naturally use Python2.7 command if you don't have your version as default in your shared host console.

Now you can install Trac with all required dependencies. Differently from my previous Trac post, now you don't need to specify the installation directory because the home directory of your python version is already in your home folder. This means you can install Python library directly in the python folder (without root permission)
<pre class="language-bash command-line" data-user="mmornati" data-host="macosx"><code class="language-bash">easy_install-2.7 Genshi
easy_install-2.7 Babel==0.9.5
easy_install-2.7 Trac</code></pre>
If you have trac (and/or any other library) installed for python 2.6 you can purge out the installation directory (in any case you can't use these library anymore).
<pre class="language-bash command-line" data-user="mmornati" data-host="macosx"><code class="language-bash">rm -rf .local/lib/python2.6</code></pre>
Now if installation worked good you should have access to trac-admin command, and, as the previous guide you can create your trac environment.
<pre class="language-bash command-line" data-user="mmornati" data-host="macosx"><code class="language-bash">trac-admin /home2/mornatin/public_html/trac/kermit initenv
cd /home2/mornatin/public_html/trac
trac-admin ./kermit/ deploy ./
cp cgi-bin/trac.fcgi ./</code></pre>
The .htaccess file configuration is the one you can read in the previous Trac article.
<pre class="language-bash command-line" data-user="mmornati" data-host="macosx"><code class="language-bash">Options -Indexes
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /cgi-bin/trac.fcgi/$1 [L,QSA]
RewriteRule ^$ cgi-bin/trac.fcgi [L]</code></pre>
All should be configured correctly and you should have access to your trac using your browser.

If have problems running **trac-admin** command you can have some different problems:

* Your python path is not correctly exported. Check if you have a configuration like this in your **.bashrc** file
<pre class="language-bash command-line" data-user="mmornati" data-host="macosx"><code class="language-bash">export PATH=$HOME/python272/bin:$HOME/.local/bin:$HOME/.local/usr/bin:$PATH</code></pre>
* You had installed Trac for python 2.6 and when you run trac-admin command you receive an error message about python 2.6 binary. You need to remove trac-admin symbolic link in .local/bin folder.
<pre class="language-bash command-line" data-user="mmornati" data-host="macosx"><code class="language-bash">rm .local/bin/trac-admin</code></pre>
