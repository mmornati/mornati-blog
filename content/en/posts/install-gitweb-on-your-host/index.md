---
title: Install Gitweb on your host
date: '2011-09-15T22:00:00+00:00'
slug: install-gitweb-on-your-host
---



<a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641473/view_git-logo_h7xuib.png">![Git](/images/install-gitweb-on-your-host/00-view_git-logo_h7xuib.png)</a>Today we will see how to install gitweb on our (shared) host (I'm always talking about host because all the tests are done on my shared host service, always <a href="http://www.bluehost.com">Bluehost</a> ;), most of all because if you want to install a service like this, on your personal server you can simply install it by RPM/DEB package).

The big problem is <em>where I can find gitweb?</em> Directly within the git sources ;) This means if you have <a href="http://blog.mornati.net/2011/08/29/host-personale/">installed git from sources</a> you have already build gitweb too and you just need to install it.
<pre><code> mornatin@mornati.net [~/git-2011-09-07/gitweb]# ll
total 300
drwxr-xr-x  3 mornatin mornatin   4096 Sep 16 12:51 ./
drwxr-xr-x 19 mornatin mornatin  12288 Sep 14 14:31 ../
-rw-r--r--  1 mornatin mornatin  18130 Aug 30 13:35 INSTALL
-rw-r--r--  1 mornatin mornatin   5508 Aug 30 13:35 Makefile
-rw-r--r--  1 mornatin mornatin  18849 Aug 30 13:35 README
-rwxr-xr-x  1 mornatin mornatin 231347 Aug 30 13:35 gitweb.perl*
drwxr-xr-x  3 mornatin mornatin   4096 Sep 14 14:31 static/</code></pre>
Here you can see a not-built git web project, located in "latest" git sources (git-2011-09-07) gitweb folder. So, if you just want to install gitweb without git (for example to get latest version of gitweb without changing your git) you can enter this directory and run a simple <em>make</em>.
<pre><code> mornatin@mornati.net [~/git-2011-09-07/gitweb]# make
    SUBDIR ../
make[1]: `GIT-VERSION-FILE' is up to date.
    GEN gitweb.cgi</code></pre>
Now, il all worked well, looking in gitweb folder, you can find a <em>cgi</em> file.
<pre><code> mornatin@mornati.net [~/git-2011-09-07/gitweb]# ll
total 536
drwxr-xr-x  3 mornatin mornatin   4096 Sep 16 12:59 ./
drwxr-xr-x 19 mornatin mornatin  12288 Sep 14 14:31 ../
-rw-r--r--  1 mornatin mornatin    815 Sep 16 12:59 GITWEB-BUILD-OPTIONS
-rw-r--r--  1 mornatin mornatin  18130 Aug 30 13:35 INSTALL
-rw-r--r--  1 mornatin mornatin   5508 Aug 30 13:35 Makefile
-rw-r--r--  1 mornatin mornatin  18849 Aug 30 13:35 README
-rwxr-xr-x  1 mornatin mornatin 231143 Sep 16 12:59 gitweb.cgi*
-rwxr-xr-x  1 mornatin mornatin 231347 Aug 30 13:35 gitweb.perl*
drwxr-xr-x  3 mornatin mornatin   4096 Sep 14 14:31 static/</code></pre>
What you need to do now is just to copy the <em>cgi</em> script in your apache and all <em>static</em> files (in the static folder inside the gitweb one).
<pre><code> cp *.cgi /home/user/public_html/git
cp static/* /home/user/public_html/git</code></pre>
Now you have to configure your gitweb service creating the file <strong>gitweb_config.perl</strong> in the same place of cgi file (in this example /home/user/public_html/git). In this file you can cut&amp;paste this code
<pre><code> # where is the git binary?
$GIT = "/usr/bin/git";

# where are our git project repositories?
$projectroot = "/home/user/repositories";

# what do we call our projects in the gitweb UI?
$home_link_str = "My gitweb service";

#  where are the files we need for gitweb to display?
@stylesheets = ("gitweb.css");
$logo = "git-logo.png";
$favicon = "git-favicon.png";

# what do we call this site?
$site_name = "My Gitweb";</code></pre>
Where you have to specify: the location of git bin, the place of your git repository (the root directory where all git projects are located, git web will check for git repository starting from this path), and optionally some style stuffs and descriptions).

The only thing remaining is the configuration of your <em>.htaccess file </em>(or a httpd/conf.d/*.conf file if you have root access to your server).
You can configure like this one adding a basic authentication to create a private gitweb service
<pre><code> AuthType Basic
AuthName "git repository"
AuthUserFile "/home/user/passwd"
require valid-user
Options +ExecCGI
RewriteEngine On
RewriteRule ^$ gitweb.cgi
RewriteRule ^([?].*)$ gitweb.cgi$1</code></pre>
The important things to enable gitweb is starting from <em>Options</em> line.

Now you can use gitweb and start browse your projects. Enjoy!
