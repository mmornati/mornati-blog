---
title: Install Gitweb on your host
categories:
- linux-sysadmin
- programming
date: '2011-09-15T22:00:00+00:00'
slug: install-gitweb-on-your-host
tags:
  - git
  - gitweb
  - bluehost
  - shared-hosting
  - cgi
  - perl
  - version-control
description: How to install and configure Gitweb on a shared hosting environment, including building from source and Apache setup.
---

![Git](/images/install-gitweb-on-your-host/00-view_git-logo_h7xuib.png)

Today we will see how to install gitweb on our (shared) host (I'm always talking about host because all the tests are done on my shared host service, always [Bluehost](http://www.bluehost.com) ;), most of all because if you want to install a service like this, on your personal server you can simply install it by RPM/DEB package).

## Finding Gitweb

The big problem is *where I can find gitweb?* Directly within the git sources ;) This means if you have [installed git from sources](/2011/08/29/host-personale/) you have already built gitweb too and you just need to install it.

```bash
mornatin@mornati.net [~/git-2011-09-07/gitweb]# ll
total 300
drwxr-xr-x  3 mornatin mornatin   4096 Sep 16 12:51 ./
drwxr-xr-x 19 mornatin mornatin  12288 Sep 14 14:31 ../
-rw-r--r--  1 mornatin mornatin  18130 Aug 30 13:35 INSTALL
-rw-r--r--  1 mornatin mornatin   5508 Aug 30 13:35 Makefile
-rw-r--r--  1 mornatin mornatin  18849 Aug 30 13:35 README
-rwxr-xr-x  1 mornatin mornatin 231347 Aug 30 13:35 gitweb.perl*
drwxr-xr-x  3 mornatin mornatin   4096 Sep 14 14:31 static/
```

Here you can see a not-built git web project, located in "latest" git sources (git-2011-09-07) gitweb folder. So, if you just want to install gitweb without git (for example to get latest version of gitweb without changing your git) you can enter this directory and run a simple *make*.

## Building Gitweb

```bash
mornatin@mornati.net [~/git-2011-09-07/gitweb]# make
    SUBDIR ../
make[1]: `GIT-VERSION-FILE' is up to date.
    GEN gitweb.cgi
```

Now, if all worked well, looking in gitweb folder, you can find a *cgi* file.

```bash
mornatin@mornati.net [~/git-2011-09-07/gitweb]# ll
total 536
drwxr-xr-x  3 mornatin mornatin   4096 Sep 16 12:59 ./
drwxr-xr-x 19 mornatin mornatin  12288 Sep 14 14:31 ../
-rw-r--r--  1 mornatin mornatin    815 Sep 16 12:59 GITWEB-BUILD-OPTIONS
-rw-r--r--  1 mornatin mornatin  18130 Aug 30 13:35 INSTALL
-rw-r--r--  1 mornatin mornatin   5508 Aug 30 13:35 Makefile
-rw-r--r--  1 mornatin mornatin  18849 Aug 30 13:35 README
-rwxr-xr-x  1 mornatin mornatin 231143 Sep 16 12:59 gitweb.cgi*
-rwxr-xr-x  1 mornatin mornatin 231347 Aug 30 13:35 gitweb.perl*
drwxr-xr-x  3 mornatin mornatin   4096 Sep 14 14:31 static/
```

## Installing Gitweb

What you need to do now is just to copy the *cgi* script in your apache and all *static* files (in the static folder inside the gitweb one).

```bash
cp *.cgi /home/user/public_html/git
cp static/* /home/user/public_html/git
```

## Configuration

Now you have to configure your gitweb service creating the file **gitweb_config.perl** in the same place of cgi file (in this example /home/user/public_html/git). In this file you can cut &amp; paste this code

```perl
# where is the git binary?
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
$site_name = "My Gitweb";
```

Where you have to specify: the location of the git binary, the place of your git repository (the root directory where all git projects are located, git web will check for git repository starting from this path), and optionally some style settings and descriptions.

## Apache Setup

The only thing remaining is the configuration of your *.htaccess file* (or a httpd/conf.d/*.conf file if you have root access to your server).
You can configure like this one adding a basic authentication to create a private gitweb service

```apache
AuthType Basic
AuthName "git repository"
AuthUserFile "/home/user/passwd"
require valid-user
Options +ExecCGI
RewriteEngine On
RewriteRule ^$ gitweb.cgi
RewriteRule ^([?].*)$ gitweb.cgi$1
```

The key line to enable gitweb is starting from *Options* line.

## Conclusion

Now you can use gitweb and start browsing your projects. Enjoy!