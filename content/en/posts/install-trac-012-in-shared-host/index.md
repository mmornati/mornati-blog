---
title: Install Trac 0.12 on Shared Hosting
date: '2011-09-05T22:00:00+00:00'
slug: install-trac-012-in-shared-host
categories:
  - Development
  - DevOps
tags:
  - trac
  - python
  - shared-hosting
  - project-management
  - wiki
  - issue-tracking
description: A step-by-step guide to installing Trac 0.12 on shared hosting with Apache and FastCGI configuration.
---

I'm testing the installation of tools I need on my shared host. Today I'm installing [Trac 0.12](http://trac.edgewall.org/), an enhanced wiki and issue tracking system for software development.

Trac 0.12 requires Python 2.6 (which I have available on [BlueHost](http://www.bluehost.com)), and as the Trac documentation states, you need **Genshi** and **Babel** installed. To simplify the installation, I'll use `easy_install`, which automatically downloads and installs packages along with their dependencies.

## Install Dependencies

### Install Genshi

```bash
[user@ci-server ~]# easy_install-2.6 --install-dir $HOME/.local/lib/python2.6/site-packages/ Genshi

Searching for Genshi
Reading http://pypi.python.org/simple/Genshi/
Reading http://genshi.edgewall.org/
Reading http://genshi.edgewall.org/wiki/Download
Best match: Genshi 0.6
Downloading http://ftp.edgewall.com/pub/genshi/Genshi-0.6-py2.6.egg
Processing Genshi-0.6-py2.6.egg
Moving Genshi-0.6-py2.6.egg to /home2/mornatin/.local/lib/python2.6/site-packages
Adding Genshi 0.6 to easy-install.pth file

Installed /home2/mornatin/.local/lib/python2.6/site-packages/Genshi-0.6-py2.6.egg
Processing dependencies for Genshi
Finished processing dependencies for Genshi
```

### Install Babel 0.9.5

```bash
[user@ci-server ~]# easy_install-2.6 --install-dir $HOME/.local/lib/python2.6/site-packages/ Babel==0.9.5

Searching for Babel==0.9.5
Reading http://pypi.python.org/simple/Babel/
Reading http://babel.edgewall.org/
Reading http://babel.edgewall.org/wiki/Download
Best match: Babel 0.9.5
Downloading http://ftp.edgewall.com/pub/babel/Babel-0.9.5-py2.6.egg
Processing Babel-0.9.5-py2.6.egg
creating /home2/mornatin/.local/lib/python2.6/site-packages/Babel-0.9.5-py2.6.egg
Extracting Babel-0.9.5-py2.6.egg to /home2/mornatin/.local/lib/python2.6/site-packages
Adding Babel 0.9.5 to easy-install.pth file
Installing pybabel script to /home2/mornatin/.local/lib/python2.6/site-packages/
Installed /home2/mornatin/.local/lib/python2.6/site-packages/Babel-0.9.5-py2.6.egg
Processing dependencies for Babel==0.9.5
Finished processing dependencies for Babel==0.9.5
```

## Install Trac

Now we can install Trac using `easy_install`. If you prefer, you can also use the standard Python installation procedure as described in the Django guide. Using `easy_install` without specifying a version ensures you get the latest stable release.

```bash
[user@ci-server ~]# easy_install-2.6 --install-dir $HOME/.local/lib/python2.6/site-packages/ Trac

Searching for Trac
Reading http://pypi.python.org/simple/Trac/
Reading http://trac.edgewall.org/
Reading http://trac.edgewall.org/wiki/TracDownload
Reading http://projects.edgewall.com/trac
Reading http://projects.edgewall.com/trac/wiki/TracDownload
Reading http://trac.edgewall.com/
Best match: Trac 0.12.2
Downloading ftp://ftp.edgewall.com/pub/trac/Trac-0.12.2.zip
Processing Trac-0.12.2.zip
Running Trac-0.12.2/setup.py -q bdist_egg --dist-dir /tmp/easy_install-gZb1BF/Trac-0.12.2/egg-dist-tmp-_EJVF6
catalog 'trac/locale/vi/LC_MESSAGES/messages.po' is marked as fuzzy, skipping
catalog 'trac/locale/fa/LC_MESSAGES/messages.po' is marked as fuzzy, skipping
catalog 'trac/locale/el/LC_MESSAGES/messages.po' is marked as fuzzy, skipping
Adding Trac 0.12.2 to easy-install.pth file
Installing trac-admin script to /home2/mornatin/.local/lib/python2.6/site-packages/
Installing tracd script to /home2/mornatin/.local/lib/python2.6/site-packages/

Installed /home2/mornatin/.local/lib/python2.6/site-packages/Trac-0.12.2-py2.6.egg
Processing dependencies for Trac
Finished processing dependencies for Trac
```

Done! Trac is now installed. You just need a few more steps to get it running.

## Create a Trac Project

First, create a Trac project using the `trac-admin` command:

```bash
[user@ci-server ~]# trac-admin /home2/mornatin/public_html/trac/kermit initenv
Creating a new Trac environment at /home2/mornatin/public_html/trac/kermit

Trac will first ask a few questions about your environment
in order to initialize and prepare the project database.

 Please enter the name of your project.
 This name will be used in page titles and descriptions.

Project Name [My Project]> Kermit

 Please specify the connection string for the database to use.
 By default, a local SQLite database is created in the environment
 directory. It is also possible to use an already existing
 PostgreSQL database (check the Trac documentation for the exact
 connection string syntax).

Database connection string [sqlite:db/trac.db]>

Creating and Initializing Project
 Installing default wiki pages
   TracRevisionLog imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracRevisionLog
   TracNotification imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracNotification
   SandBox imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/SandBox
   InterTrac imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/InterTrac
   InterWiki imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/InterWiki
   TracImport imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracImport
   TracTicketsCustomFields imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracTicketsCustomFields
   TracSupport imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracSupport
   WikiDeletePage imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/WikiDeletePage
   TracModWSGI imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracModWSGI
   WikiStart imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/WikiStart
   TracQuery imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracQuery
   TitleIndex imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TitleIndex
   TracRoadmap imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracRoadmap
   TracIni imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracIni
   TracBrowser imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracBrowser
   PageTemplates imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/PageTemplates
   TracUnicode imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracUnicode
   TracReports imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracReports
   TracInstall imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracInstall
   InterMapTxt imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/InterMapTxt
   WikiRestructuredText imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/WikiRestructuredText
   TracWiki imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracWiki
   WikiProcessors imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/WikiProcessors
   WikiHtml imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/WikiHtml
   TracInterfaceCustomization imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracInterfaceCustomization
   TracLinks imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracLinks
   TracTickets imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracTickets
   TracBackup imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracBackup
   TracLogging imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracLogging
   WikiNewPage imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/WikiNewPage
   TracUpgrade imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracUpgrade
   WikiRestructuredTextLinks imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/WikiRestructuredTextLinks
   TracFineGrainedPermissions imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracFineGrainedPermissions
   TracChangeset imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracChangeset
   CamelCase imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/CamelCase
   TracRss imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracRss
   TracRepositoryAdmin imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracRepositoryAdmin
   TracSearch imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracSearch
   TracAdmin imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracAdmin
   TracNavigation imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracNavigation
   TracWorkflow imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracWorkflow
   RecentChanges imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/RecentChanges
   TracModPython imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracModPython
   TracGuide imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracGuide
   WikiPageNames imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/WikiPageNames
   TracPlugins imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracPlugins
   TracPermissions imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracPermissions
   TracTimeline imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracTimeline
   WikiMacros imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/WikiMacros
   TracStandalone imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracStandalone
   TracEnvironment imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracEnvironment
   TracFastCgi imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracFastCgi
   TracAccessibility imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracAccessibility
   TracCgi imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracCgi
   TracSyntaxColoring imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/TracSyntaxColoring
   WikiFormatting imported from /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/wiki/default-pages/WikiFormatting

---------------------------------------------------------------------
Project environment for 'Kermit' created.

You may now configure the environment by editing the file:

  /home2/mornatin/public_html/trac/kermit/conf/trac.ini

If you'd like to take this new project environment for a test drive,
try running the Trac standalone web server `tracd`:

  tracd --port 8000 /home2/mornatin/public_html/trac/kermit

Then point your browser to http://localhost:8000/kermit.
There you can also browse the documentation for your installed
version of Trac, including information on further setup (such as
deploying Trac to a real web server).

The latest documentation can also always be found on the project
website:

  http://trac.edgewall.org/

Congratulations!
```

## Configure Apache with FastCGI

Since I'm on shared hosting and cannot open ports other than the default HTTP/HTTPS, I need to integrate Trac with Apache. Use `trac-admin` to generate the FastCGI script:

```bash
[user@ci-server ~]# trac-admin ./kermit/ deploy ./
Copying resources from:
  trac.web.chrome.Chrome
    /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/htdocs
    /home2/mornatin/public_html/trac/kermit/htdocs
Creating scripts.
```

The first argument is the Trac repository you created earlier, and the second is the Apache folder. The scripts (FastCGI, CGI, and WSGI) are created inside the `cgi-bin` subfolder.

Make the script executable:

```bash
chmod +x cgi-bin/trac.fcgi
```

At this point, you can test your Trac installation using a URL like `http://www.yoursite.com/trac/cgi-bin/trac.fcgi`.

However, using a URL like that is not ideal. Instead, configure a `.htaccess` file to invoke the script cleanly:

```apache
Options -Indexes
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /cgi-bin/trac.fcgi/$1 [L,QSA]
RewriteRule ^$ cgi-bin/trac.fcgi [L]
```

Finished! Access the folder where you created your `.htaccess` file, and you should see Trac running.