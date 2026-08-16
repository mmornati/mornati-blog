---
title: Install Python 2.7 on BlueHost
date: '2011-11-29T23:00:00+00:00'
slug: install-python-27-on-bluehost
---



After I <a href="http://blog.mornati.net/2011/08/31/bluehost-com-and-python-2-6/">discovered the presence of Python 2.6</a> on BlueHost, they decided to remove this installation by default. Fortunately it's really simple to build Python from sources and install it (and naturally, the good thing is that all required packages to build Python are installed on BlueHost servers).
So here the steps to follow to build and install the python version you prefer (tested with Python 2.6 and 2.7.x).
<pre><code> wget http://www.python.org/ftp/python/2.7.2/Python-2.7.2.tgz
tar xzvf Python-2.7.2.tgz</code></pre>
and, just a note, the package is well done and it will create a Python subfolder :)

After this we can already configure and install it.
<pre><code> cd Python-2.7.2
./configure -prefix=/home2/mornatin/python272 --enable-unicode=ucs4
make
make install</code></pre>
Change the Python version in this example and the installation directory with what you prefer. Naturally, considering you are on shared host (if you have a dedicated server you can install python using your distribution package system), you have access only to your home folder, so the target directory must be inside your home.
If all worked well, at the end of this procedure your python is correctly install in your system and you can start using it. To test you can just simply try to start the binary file
<pre><code> /home2/mornatin/python272/bin/python</code></pre>
A thing I can suggest, if you don't want to override the BlueHost default python and/or if you want to install different python version, is to rename the <strong>python</strong> binary with something different. For example:
<pre><code> mv /home2/mornatin/python272/bin/python /home2/mornatin/python272/bin/python27</code></pre>
After this step you can add the python <strong>bin</strong> folder to your <strong>PATH</strong> and use it everywhere:
<pre><code> export PATH=/home2/mornatin/python272/bin:$PATH</code></pre>
All configured and you can start working with your new python version. An important thing to remember is that, if you haven't python 2.7 (or other) configured as default python, when you want to install a new module in it, you should invoke the correctly binary file. Following this installation example:
<pre><code> python27 setup.py install</code></pre>
&nbsp;
