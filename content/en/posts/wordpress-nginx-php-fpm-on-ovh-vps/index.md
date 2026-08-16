---
title: Wordpress + Nginx + php-fpm on OVH VPS
date: '2013-11-02T23:00:00+00:00'
slug: wordpress-nginx-php-fpm-on-ovh-vps
categories: [WordPress, Server, DevOps]
tags: [wordpress, nginx, php-fpm, ovh, vps, centos, performance]
description: A step-by-step guide to installing and tuning WordPress with Nginx and PHP-FPM on an OVH VPS running CentOS, including performance optimization for low-memory environments.
---

I recently purchased a VPS Classic from OVH to migrate my blog. It worked well on my previous host service, but it was a shared service, which means sometimes the access time to a page was too long (very very long!).

A difference with a VPS (Virtual Private Server) compared to a shared hosting service is that you need to manage all the server stuff: it's an empty box you need to configure to do what you want. Since the base VPS I bought has only 512 MB of RAM, I tried to carefully select and tune all the installed services.

All the following instructions are for the CentOS Linux distribution.

## Install the Web Server

First of all you need to add some external (not base) repositories:

```bash
rpm -Uvh http://download.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm

rpm -Uvh http://rpms.famillecollet.com/enterprise/remi-release-6.rpm

cat > /etc/yum.repos.d/nginx.repo << EOF
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/centos/$releasever/$basearch/
gpgcheck=0
enabled=1
EOF
```

Now you are ready to install all required packages:

```bash
yum --enablerepo=remi,remi-php55 install nginx php-fpm php-common php-mysqlnd php-xml php-gd php-pdo mysql-server
```

If everything worked, your environment is ready for your WordPress blog.

## Configuration

**Nginx** (Engine X) web server does not include a module to use PHP as backend language, for this reason you should have an external "PHP server" to handle this kind of pages, for example **PHP-FPM** (PHP FastCGI Process Manager). In this setup we'll leave the php-fpm configuration with all the default parameters (later we will tune it up...). That means it starts with a TCP listener (127.0.0.1:9000) and we must configure nginx to send all HTTP requests to it.

Create a file in `/etc/nginx/conf.d` named, for example, `blog.conf`. The following is my configuration file that is already optimized for the [W3C TotalCache Plugin](http://wordpress.org/plugins/w3-total-cache/):

```bash
server {
    listen 5.135.145.38:80;
    server_name blog.mornati.net;

    root /path/to/wordpress/file/blog;
    index               index.php index.html index.htm;

    access_log /var/log/nginx/blog.access.log;
    error_log /var/log/nginx/blog.error.log;

    # Use gzip compression
    # gzip_static       on;  # Uncomment if you compiled Nginx using --with-http_gzip_static_module
    gzip                on;
    gzip_disable        "msie6";
    gzip_vary           on;
    gzip_proxied        any;
    gzip_comp_level     5;
    gzip_buffers        16 8k;
    gzip_http_version   1.0;
    gzip_types          text/plain text/css application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript image/png image/gif image/jpeg;

    # Rewrite minified CSS and JS files
    location ~* \.(css|js) {
        if (!-f $request_filename) {
            rewrite ^/wp-content/w3tc/min/(.+\.(css|js))$ /wp-content/w3tc/min/index.php?file=$1 last;
            # Use the following line instead for versions of W3TC pre-0.9.2.2
            # rewrite ^/wp-content/w3tc/min/([a-f0-9]+)\/(.+)\.(include(\-(footer|body))?(-nb)?)\.[0-9]+\.(css|js)$ /wp-content/w3tc/min/index.php?tt=$1&gg=$2&g=$3&t=$7 last;
        }
    }

    # Set a variable to work around the lack of nested conditionals
    set $cache_uri $request_uri;
    # POST requests and urls with a query string should always go to PHP
    if ($request_method = POST) {
        set $cache_uri 'no cache';
    }
    if ($query_string != "") {
        set $cache_uri 'no cache';
    }

    # Don't cache uris containing the following segments
    if ($request_uri ~* "(\/wp-admin\/|\/xmlrpc.php|\/wp-(app|cron|login|register|mail)\.php|wp-.*\.php|index\.php|wp\-comments\-popup\.php|wp\-links\-opml\.php|wp\-locations\.php)") {
        set $cache_uri "no cache";
    }

    # Don't use the cache for logged in users or recent commenters
    if ($http_cookie ~* "comment_author|wordpress_[a-f0-9]+|wp\-postpass|wordpress_logged_in") {
        set $cache_uri 'no cache';
    }

    # Use cached or actual file if they exists, otherwise pass request to WordPress
    location / {
        try_files /wp-content/w3tc/pgcache/$cache_uri/_index.html $uri $uri/ /index.php?q=$uri&$args;
    }

    # Cache static files for as long as possible
    location ~* \.(xml|ogg|ogv|svg|svgz|eot|otf|woff|mp4|ttf|css|rss|atom|js|jpg|jpeg|gif|png|ico|zip|tgz|gz|rar|bz2|doc|xls|exe|ppt|tar|mid|midi|wav|bmp|rtf)$ {
        try_files       $uri =404;
        expires         max;
        access_log      off;
    }

    # Deny access to hidden files
    location ~* /\.ht {
        deny            all;
        access_log      off;
        log_not_found   off;
    }

    # Pass PHP scripts on to PHP-FPM
    location ~* \.php$ {
        try_files       $uri /index.php;
        fastcgi_index   index.php;
        fastcgi_pass    127.0.0.1:9000;
        include         fastcgi_params;
        fastcgi_param   SCRIPT_FILENAME    $document_root$fastcgi_script_name;
        fastcgi_param   SCRIPT_NAME        $fastcgi_script_name;
    }

}
```

As you can see in the latest `location` configuration, all requests to a PHP file will be redirected to a fastcgi script (the php-fpm).

The important things to configure are:

1. **listen**: address:port where your nginx webserver will listen for requests. Normally the base configuration `listen 80` should work. On the OVH VPS you must specify the public IP address of your server to prevent errors on Nginx startup.
2. **server_name**: the variable to configure the *virtual host* of your webserver. That means all requests coming to your public IP address using the domain name specified in the server_name variable will be handled by the current configuration. That also means you could have different websites on the same Nginx server; you just need to assign a different server name.
3. **root**: the folder on your server containing files you want to serve through the webserver. For example all the WordPress files should be copied inside the folder configured here.

You're ready to extract WordPress (or any other PHP application) to the configured folder.

## Start All Services

Now you can test your configuration by starting up all the services:

```bash
service nginx start
service php-fpm start
service mysqld start

chkconfig nginx on
chkconfig php-fpm on
chkconfig mysqld on
```

Going to the configured domain name should give you access to your WordPress blog (or to the WordPress setup page if you need to configure a new blog).

## Tuning

Depending on the traffic of your blog, you can try tuning it to reduce resource usage.

For example, my blog has normally 200/300 visits per day from Europe and the USA, which makes it important to know the access time and calculate simultaneous connections.

An important thing to understand is the meaning of "simultaneous": exactly in the same moment two (or more) users access a website page (producing a request to the webserver, a PHP page compilation, ...). If a user requests a blog post and spends 5 minutes reading it, in those 5 minutes you could have 2 or 3 other users accessing your blog. These users are accessing simultaneously in real life, but not for your application server: a reading user is not using resources from your server!

So with 200 users a day you don't have many simultaneous connections (in theory, but this is something you have to check), so you can configure the webserver (nginx and php-fpm) accordingly.

### Nginx Tuning

On the Nginx side, the important variables to start your tuning are **worker_processes** and **worker_connections**: the first one configures how many nginx processes are created on your server (1 by default) and the second one indicates how many connections (clients) can be handled by any process.

So you can calculate the maximum clients for Nginx with:

*mx clients = worker_processes * worker_connections*

On my server I left the default parameters for the nginx server, meaning 1 process with **1024** connections (file `/etc/nginx/nginx.conf`).

Why, when I just said there are few concurrent users?

Another important thing to know is how a browser works with a web page.

When we ask a page to a webserver (for example a PHP page), it compiles the PHP file (if needed) and sends back the HTML version to our browser (1 request to the webserver). Then, in the page, we normally have references to JavaScript files, stylesheets, images, fonts, ... So the browser, to complete the page we requested, executes other requests to the webserver: one for each static file. So a single user accessing a single page on a webserver produces 10-20 requests (!!), or more, depending on your page. That means with 2 or 3 users we can easily reach hundreds of connections to the server.

### PHP-FPM Tuning

If you don't tune the default configuration, the PHP "web server" can handle hundreds of connections without problems, BUT, it will use "a lot" of RAM: more than 200 MB.

It's not really a high value, I know, but when you have a virtual machine with 512 MB of RAM, it means PHP-FPM uses half of your RAM.

The important configuration part is the one concerning the *child processes*.

```bash
; Choose how the process manager will control the number of child processes.
; Possible Values:
;   static  - a fixed number (pm.max_children) of child processes;
;   dynamic - the number of child processes are set dynamically based on the
;             following directives:
;             pm.max_children      - the maximum number of children that can
;                                    be alive at the same time.
;             pm.start_servers     - the number of children created on startup.
;             pm.min_spare_servers - the minimum number of children in 'idle'
;                                    state (waiting to process). If the number
;                                    of 'idle' processes is less than this
;                                    number then some children will be created.
;             pm.max_spare_servers - the maximum number of children in 'idle'
;                                    state (waiting to process). If the number
;                                    of 'idle' processes is greater than this
;                                    number then some children will be killed.
; Note: This value is mandatory.
```

A child process can handle a single user's request. So, for example, 200 processes means 200 simultaneous users.

On my server, after some tests, I'm using this configuration:

```bash
pm = dynamic
pm.max_children = 4
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 2
pm.max_requests = 200
```

That means I can have a maximum of 4 concurrent connections to the PHP part (for safety you can increase the max to a higher value): a PHP thread normally answers a user in less than a second (!).

When the PHP-FPM service starts up, it creates 2 child processes; the others will be created only if required. You should find the right number of child processes for your setup and put this number into start_servers variable: having the required processes ready allows for a faster response to the users (no time needed to create a new process).

With this configuration I can assure that php-fpm processes take only **70 MB** of RAM on my server (any new php-fpm process takes about 24 MB of RAM more), and when I have moments with "many" concurrent users it could go up to about **120 MB**.

```bash
[mmornati@vps38203 ~]$ sudo python ps_mem.py 
 Private  +   Shared  =  RAM used	Program

  4.0 KiB +  27.5 KiB =  31.5 KiB	dbus-daemon
 36.0 KiB +  31.5 KiB =  67.5 KiB	atd
 24.0 KiB +  51.0 KiB =  75.0 KiB	mingetty (6)
 60.0 KiB +  24.0 KiB =  84.0 KiB	mdadm
224.0 KiB +  62.5 KiB = 286.5 KiB	crond
156.0 KiB + 147.0 KiB = 303.0 KiB	master
  4.0 KiB + 337.5 KiB = 341.5 KiB	mysqld_safe
220.0 KiB + 137.0 KiB = 357.0 KiB	qmgr
332.0 KiB +  35.0 KiB = 367.0 KiB	init
484.0 KiB +  81.5 KiB = 565.5 KiB	rsyslogd
728.0 KiB + 173.0 KiB = 901.0 KiB	nrsysmond (2)
660.0 KiB + 368.5 KiB =   1.0 MiB	bash
928.0 KiB + 431.5 KiB =   1.3 MiB	sudo
  1.4 MiB + 230.0 KiB =   1.7 MiB	nginx (2)
  1.2 MiB + 481.0 KiB =   1.7 MiB	pickup
940.0 KiB +   1.8 MiB =   2.7 MiB	sshd (3)
  3.3 MiB + 483.5 KiB =   3.7 MiB	fail2ban-server
  6.4 MiB + 236.5 KiB =   6.6 MiB	mysqld
  7.7 MiB + 175.0 KiB =   7.9 MiB	named
 74.4 MiB +   4.7 MiB =  79.1 MiB	php-fpm (3)
---------------------------------
                        109.1 MiB
=================================
```

To create this useful configuration I followed this [guide](http://www.if-not-true-then-false.com/2011/nginx-and-php-fpm-configuration-and-optimizing-tips-and-tricks/). if !1 then 0 is an incredible technical blog :)