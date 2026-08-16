---
title: Install Django in a Shared Hosting Environment
date: '2011-09-01T22:00:00+00:00'
slug: install-django-in-shared-host
categories:
  - Web Development
  - Django
tags:
  - django
  - python
  - shared hosting
  - bluehost
  - fastcgi
  - apache
description: A step-by-step guide to installing Django on shared hosting without root access, covering Django installation, FastCGI configuration, and Apache setup.
---

After [discovering Python 2.6](http://blog.mornati.net/2011/08/31/bluehost-com-and-python-2-6/) on my shared hosting, the next step is to install [Django](https://www.djangoproject.com/). Since my user account is not a *sudoer* and I don't have the root password, I cannot use the server's package system for installation.

Fortunately, Python projects like Django are quite simple to install manually.

## Installing Django

Download and install Django using the following commands:

```bash
wget http://www.djangoproject.com/download/1.3/tarball/
tar xzvf Django-1.3.tar.gz
cd Django-1.3
python2.6 setup.py install --user
```

**Note:** I used the `python2.6` command to specify that I want to install and use Django with Python 2.6. If you have a `python` alias configured, that should be sufficient. For Python 2.4, the `--user` option does not work, so use this command instead:

```bash
python setup.py install --home $HOME/.local
```

## Adding Django to Your PATH

Next, add your Django installation to your user PATH by editing your `.bashrc` file. In your home folder, run:

```bash
vi .bashrc
```

Add the following line:

```bash
export PATH=$HOME/.local/bin:$HOME/.local/usr/bin:$PATH
```

After these two simple steps, Django is ready and you can create your first project or install an existing one.

## Configuring Your Django Project for the Web

Assuming you have your Django project installed in `~/projects/kermit-webui`, you need to configure two components to make it accessible from a browser:

1. A Python FastCGI script to load your Django application
2. An `.htaccess` file to configure Apache and load the script

### Creating the Public HTML Folder

First, create the `public_html` folder where these components will reside:

```bash
mkdir ~/public_html/kermit
cd ~/public_html/kermit
```

### Creating the FastCGI Script

Create the FastCGI script with the following content:

```bash
vi kermit.fcgi
```

```python
#!/usr/bin/python2.6
import sys, os

# Add a custom Python path.
sys.path.insert(0, "/home/user/.local/lib/python2.6")
sys.path.insert(13, "/home/user/projects/kermit")

os.environ['DJANGO_SETTINGS_MODULE'] = "webui.settings"

from django.core.servers.fastcgi import runfastcgi
runfastcgi(method="threaded", daemonize="false")
```

At the end of the script, as you can see, we start the FastCGI listener to accept incoming requests.

### Configuring the .htaccess File

Now configure the `.htaccess` file:

```bash
vi .htaccess
```

```apache
AddHandler fcgid-script .fcgi
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_URI} !=/favicon.ico
RewriteCond %{REQUEST_URI} !^/static/

RewriteRule ^(.*)$ kermit.fcgi/$1 [QSA,L]
```

This configuration sets up the [Apache RewriteEngine](http://httpd.apache.org/docs/current/mod/mod_rewrite.html) to direct all requests to the `kermit.fcgi` script, except for requests containing `/static/` in the URL (where static files like CSS, images, and JavaScript are stored) and `favicon.ico`.

### Setting File Permissions

The FastCGI script needs executable permissions:

```bash
chmod 0755 kermit.fcgi
```

## Installing Additional Packages

That's all for the basic setup. Depending on your hosting provider and project requirements, you may need to install additional packages. For BlueHost, using Django with FastCGI requires installing the [flup](http://www.saddi.com/software/flup/) project.

Download and install flup:

```bash
wget http://www.saddi.com/software/flup/dist/flup-1.0.2.tar.gz
tar xzvf flup-1.0.2.tar.gz
cd flup-1.0.2
```

For Python 2.6/2.7:

```bash
python setup.py install --user
```

For earlier Python versions:

```bash
python setup.py install --home $HOME/.local
```

## Conclusion

Now you can browse your Django application! :D

To see a working example of this setup, point your browser to [http://kermit.mornati.net](http://kermit.mornati.net).