---
title: Apache and mod_auth_openid on F16/Centos
categories:
- linux-sysadmin
date: '2012-05-22T22:00:00+00:00'
slug: apache-and-modauthopenid-on-f16centos
tags:
  - apache
  - openid
  - mod_auth
  - fedora
  - centos
  - authentication
  - security
description: A guide to installing and configuring mod_auth_openid on Fedora 16 and Centos to protect your Apache web server using OpenID authentication.
---



A simple way to protect your web server today, without creating every time a different user name/password, is to use one of the many OpenID servers available on internet.

We can say that everyone today has a gmail (at least one) account, and, if you are one of the people all over the world that does not have a gmail account, we can add Twitter and Facebook and you are surely in.

## Installation

Using mod_auth_openid you can protect your web server directly in your apache configuration (conf or .htaccess) file. So, to use it you first need to install this module. Fortunately I found on internet a [repository](http://repo.kaldung.com/centos/) with rpms for Centos5 and Centos6 and I created rpms for [Fedora16](http://repos.mornati.net/openid/) (that is my test machine at home).
So, for example on F16, you can do:
```bash
yum localinstall http://repos.mornati.net/openid/fedora16/RPMS/libopkele-2.0.4-1.fc16.i686.rpm
yum localinstall http://repos.mornati.net/openid/fedora16/RPMS/mod_auth_openid-0.6-3.fc16.i686.rpm
```
I used *yum localinstall* because libopkele has some dependencies that are resolved (and installed) by yum.

## Apache Configuration

Now your apache web server is ready to use OpenID. To configure it you can check official doc on the project [website](http://findingscience.com/mod_auth_openid/). Here's an example of my configuration to use Google OpenID.

Check your configuration to verify if access restriction override is allowed. For example in */etc/httpd/conf/httpd.conf*
```apache
    #
    # Possible values for the Options directive are "None", "All",
    # or any combination of:
    #   Indexes Includes FollowSymLinks SymLinksifOwnerMatch ExecCGI MultiViews
    #
    # Note that "MultiViews" must be named *explicitly* --- "Options All"
    # doesn't give it to you.
    #
    # The Options directive is both complicated and important.  Please see
    # http://httpd.apache.org/docs/2.2/mod/core.html#options
    # for more information.
    #
    Options Indexes FollowSymLinks

    #
    # AllowOverride controls what directives may be placed in .htaccess files.
    # It can be "All", "None", or any combination of the keywords:
    #   Options FileInfo AuthConfig Limit
    #
    AllowOverride All

    #
    # Controls who can get stuff from this server.
    #
    Order allow,deny
    Allow from all
```
The line to check is **AllowOverride**, you should have AuthConfig (or All like in my example).

## .htaccess Configuration

Then you can create a **.htaccess** file in the folder you want to protect. And put a content like the following
```apache
AuthType OpenID
require valid-user

AuthOpenIDTrusted ^https://www.google.com/accounts/o8/ud
AuthOpenIDSingleIdP https://www.google.com/accounts/o8/id
AuthOpenIDAXRequire email http://openid.net/schema/contact/email ilmorna@gmail.com
```
```apache
AuthOpenIDAXUsername email
```
The first two lines specify that you want to use OpenID as authentication system and you want a valid-user to allow the access (that just means the user should be authenticated on gmail).
Then, the property *AuthOpenIDSindleIdP* specify to the mod_auth_openid the address to use for the authentication (here is the google one); the property *AuthOpenIDAXRequire*, as product doc says, can be used to verify some openid parameters, like the email, first and last name, birth date, etc. It's important if you really want to protect your server because, without this, any person that has a gmail account (and if you remember we supposed that anyone today has this kind of account) can access to your "web pages".
In my example I check the email parameter with the "regex"; it's not really a regex with a single mail specified, but you can create a line like:
```apache
AuthOpenIDAXRequire email http://openid.net/schema/contact/email [mail@gmail.commail2@gmail.commail3@gmail.com]
```
or, if you have a google apps account
```apache
AuthOpenIDAXRequire email http://openid.net/schema/contact/email @businessmail\.com$
```
[Here](http://openid.net/specs/openid-attribute-properties-list-1_0-01.html) you can find description for any other OpenID available parameter if you need other access rules.

## Testing

After this little conf, if you try to get access to your protected page, you will be redirected to gmail login, or to a gmail page asking for access if you are already logged in into gmail account. After the gmail login open id parameters are sent to your server and checked with your access rules. If everything passes -> Access to page.
