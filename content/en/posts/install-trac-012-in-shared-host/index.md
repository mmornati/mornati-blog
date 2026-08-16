---
title: Install Trac 0.12 in shared host
date: '2011-09-05T22:00:00+00:00'
slug: install-trac-012-in-shared-host
---



I'm going ahead testing installation of tools I need on my shared host. Today I take my time to test <a href="http://trac.edgewall.org/" target="_blank">Trac</a> 0.12, an enhanced wiki and issue tracking system for software development.

Naturally, using this version require Python 2.6 (that fortunately I've ready-to-use on <a href="http://www.bluehost.com" target="_blank">BlueHost</a>), and, like the Trac guide says, you need <strong>Genshi</strong> and <strong>Babel</strong> installed to use it. So, this time, we will try to use easy_install to simplify our installation. With easy_install in fact, you can just specify the name of the package you want to install, and will be automatically downloaded, <strong>with any required dependencies</strong>, and then installed.
Let's go...
<pre><code> [user@ci-server ~]# easy_install-2.6 --install-dir $HOME/.local/lib/python2.6/site-packages/ Genshi

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
Finished processing dependencies for Genshi</code></pre>
And now Babel, required at version 0.9.5.
<pre><code> [user@ci-server ~]# easy_install-2.6 --install-dir $HOME/.local/lib/python2.6/site-packages/ Babel==0.9.5

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
Finished processing dependencies for Babel==0.9.5</code></pre>
Now, we can try install Trac, always using easy_install (but if you prefer, following the Django guide, you can install it using the "normal" python installation procedure). In this way, without specifying the version, you will be sure to have the latest available (latest stable).
<pre><code> [user@ci-server ~]# easy_install-2.6 --install-dir $HOME/.local/lib/python2.6/site-packages/ Trac

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
Finished processing dependencies for Trac</code></pre>
Done! You trac is installed. Now you need just some other little things to see it in action.
First thing, <strong>create a trace project</strong>.
<pre><code> [user@ci-server ~]# trac-admin /home2/mornatin/public_html/trac/kermit initenv
Creating a new Trac environment at /home2/mornatin/public_html/trac/kermit

Trac will first ask a few questions about your environment
in order to initialize and prepare the project database.

 Please enter the name of your project.
 This name will be used in page titles and descriptions.

Project Name [My Project]&gt; Kermit

 Please specify the connection string for the database to use.
 By default, a local SQLite database is created in the environment
 directory. It is also possible to use an already existing
 PostgreSQL database (check the Trac documentation for the exact
 connection string syntax).

Database connection string [sqlite:db/trac.db]&gt; 

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

Congratulations!</code></pre>
Now we have to link Trac with apache (I'm always on shared host, and, even to test thing, I cannot open port different by default http/https). Using trac-admin you can invoke the fact.cgi script creation with command:
<pre><code> [user@ci-server ~]# trac-admin ./kermit/ deploy ./
Copying resources from:
  trac.web.chrome.Chrome
    /home2/mornatin/.python-eggs/Trac-0.12.2-py2.6.egg-tmp/trac/htdocs
    /home2/mornatin/public_html/trac/kermit/htdocs
Creating scripts.</code></pre>
where, the first folder is the trac repository you have created before and the second one is the apache folder. Scripts (fastCGI, CGI and WSGI) are created inside <strong>cgi-bin </strong>subfolder.
If you make executable the script you want to use (chmod +x script-name) you can already test your trac installation using a url like <strong>http://www.yoursite.com/trac/cgi-bin/trac.fcgi</strong>.

Naturally is not to cool to use an url like that one, so we can configure a <strong>.htaccess</strong> to invoke our script.
<pre><code> Options -Indexes
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /cgi-bin/trac.fcgi/$1 [L,QSA]
RewriteRule ^$ cgi-bin/trac.fcgi [L]</code></pre>
Finished. Access the folder where you have created your .htaccess file and you should see your trac running.
