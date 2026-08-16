---
title: Optimize Ghost for SEO - SiteMap generator
date: '2014-02-10T23:00:00+00:00'
slug: optimize-ghost-for-seo-sitemap-generator
categories:
  - Blogging
  - Web Development
  - SEO
tags:
  - ghost
  - seo
  - sitemap
  - ruby
  - mysql
  - blogging
description: Generate a fast sitemap.xml for Ghost by reading the MySQL database directly instead of crawling the web server.
---

## Overview

An important thing to be well referenced on search engines (is there anything other than Google? :D) is the **sitemap.xml**. In this file you should list all the pages of your website with some parameters to instruct the reader (the search engine robot for example) about the last update of a page, the update frequency and page priority.

![SiteMap.xml](/images/optimize-ghost-for-seo-sitemap-generator/00-bcukeftn8msbjpdahz17.png)

After some tests of scripts found online, I decided to create a specific sitemap generator for the Ghost blogging platform. The reasons is that all scripts I found and tests check for pages contacting Ghost through the web server (asking for pages and checking all links on each page).
This is surely a good way to identify all pages and resources of your website automatically... BUT it could take a long time to be generated.

## The Script

With the script I created, which you can find on [github repository](https://github.com/mmornati/ghost-sitemap-generator), all pages for the sitemap file are generated simply reading the database:

* list of published posts (draft are excluded) and static pages
* list of all pages (i.e. http://blog.mornati.net/page/2/)

This way, your sitemap is generated in seconds.

Currently the script works only for MySQL database (that is my actual installation), but with some little extensions we can add any other possible database.

## Usage

If you execute the script without parameters a help document is shown on the screen:

```bash
ruby generate_ghost_sitemap.rb 
Missing options: site, priority, frequency, destfile, hostname, user, password, dbname
Usage: generate_ghost_sitemap.rb [options]
    -h, --help                       Display this screen
    -s, --site SITE                  Site base URL. EX: blog.mornati.net
    -f, --frequency FREQUENCY        Update Frenquency. One of: always,hourly,daily,weekly,monthly,yearly,never
    -p, --priority PRIORITY          Update priority. Values between 0.0 et 1.0
    -d, --destfile DESTFILE          Sitemap destination file. Ex. /usr/share/server/sitemap.xml
    -t, --test                       Do not ping Google after sitemap generation
    -v, --verbose                    Verbose execution
    -m, --mysql HOSTNAME             MySQL hostname
    -u, --user USERNAME              MySQL Username
    -w, --password PASSWORD          MySQL Password
    -b, --dbname DBNAME              Database name
```

## Automation

So, to use it, you can simply add a cron job with all required parameters to access to your Ghost DB and to generate the sitemap file. The user executing cron must have access to the sitemap folder (so normally should be: root/apache/nginx).

For example:

```bash
0 0 * * * /usr/bin/ruby /root/generate_ghost_sitemap.rb -s blog.mornati.net -p 0.5 -f daily -m localhost -u ghost -w mypasswd -b ghost -v -d /usr/share/nginx/ghost/sitemap.xml
```

The script's execution is scheduled any day at midnight with all the options you can read ;)