---
title: Wordpress + Nginx + php-fpm on OVH VPS
date: '2013-11-02T23:00:00+00:00'
slug: wordpress-nginx-php-fpm-on-ovh-vps
---



I recently purchased a VPS Classic from OVH to migrate my blog. Worked good on my previous host service, but was a shared service that means sometimes the access time to a page was too long (very very long!).
A difference on a VPS (Virtual Private Server) comparing to a simple host service, is that you need to manage all the server stuffs: it is an empty box you need to configure to do what want. Considering the base VPS I bought has just 512Mb of RAM I tried to select and tune all the services installed.
All the following instructions are for the CentOS Linux distribution.
<h2>Install the webserver</h2>
First of all you need to add some external (not base) repositories:
<pre><code>rpm -Uvh http://download.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm

rpm -Uvh http://rpms.famillecollet.com/enterprise/remi-release-6.rpm

cat &gt; /etc/yum.repos.d/nginx.repo &lt;&lt; EOF
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/centos/$releasever/$basearch/
gpgcheck=0
enabled=1
EOF</code></pre>
Now you are ready to install all required packages:
<pre><code>yum --enablerepo=remi,remi-php55 install nginx php-fpm php-common php-mysqlnd php-xml php-gd php-pdo mysql-server</code></pre>
If all worked well, you environment is ready for your wordpress blog
<h2>Configuration</h2>
<strong>Nginx</strong> (Engine X) web server does not include a module to use php as backend language, for this reason you should have an external "php server" to handle this kind of pages, for example <strong>php-fpm</strong> (PHP FastCGI Process Manager). In this setup we leave the configuration of php-fpm with all the defaults parameters (later we will tune it up...). That means it starts up with a TCP listener (127.0.0.1:9000) and we must configure nginx to send all http requests to it.
Create a file in <em>/etc/nginx/conf.d</em> named, for example, <em>blog.conf</em>. The following is my configuration file that is already optimized for the <a href="http://wordpress.org/plugins/w3-total-cache/">W3C TotalCache Plugin</a>
<pre><code>server {
    <strong>listen</strong> 5.135.145.38:80;
    <strong>server_name</strong> blog.mornati.net;

    <strong>root</strong> /path/to/wordpress/file/blog;
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
            # rewrite ^/wp-content/w3tc/min/([a-f0-9]+)\/(.+)\.(include(\-(footer|body))?(-nb)?)\.[0-9]+\.(css|js)$ /wp-content/w3tc/min/index.php?tt=$1&amp;gg=$2&amp;g=$3&amp;t=$7 last;
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
        try_files /wp-content/w3tc/pgcache/$cache_uri/_index.html $uri $uri/ /index.php?q=$uri&amp;$args;
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

}</code></pre>

As you can see in the latest <em>location</em> configuration, all requests to a php file will redirected to a fastcgi script (the php-fpm).
The important things to configure are:
<ol>
	<li><strong>listen</strong>: address:port where your nginx webserver will listen for requests. Normally the base configuration <em>listen 80<strong> </strong></em>should work. On the OVH VPS you must specify the public ip address of your server to to prevent errors on nginx startup</li>
	<li><strong>server_name</strong>: the variable to configure the <em>virtual host </em>of your webserver. That means all requests coming on your public ip address (the one configured in the listen variable) using the domain name specified in the server_name variable, will be handled by the current configuration. That also means you could have different website on the same nginx server; you just need to assign a different server name.</li>
	<li><strong>root</strong>: the folder on your server containing files you want to serve through the webserver. For example all the wordpress files should be copied inside the folder configured here.</li>
</ol>
You are ready to extract wordpress (or any other php application) to the configured folder.
<h2>Start all services</h2>
Now you can test your configuration by starting up all the services:
<pre><code>service nginx start
service php-fpm start
service mysqld start

chkconfig nginx on
chkconfig php-fpm on
chkconfig mysqld on</code></pre>
Going to the configured domain name, should allow you the access to your wordpress blog (or to the wordpress setup page if need to configure a new blog).
<h2>Tuning</h2>
Depending on the traffic of your blog, you can try to tune it up to reduce the used resources.
For example, my blog has normally 200/300 visit per day from europe and USA, which is important to know the access time to the blog and "calculate" the simultaneous connections.
An important thing to understand is the meaning of "simultaneous": exactly in the same moment two (or more users) access to a website page (producing a request to the webserver, a php page compilation, ...). If you have a user that request a blog post and spends then 5 minutes reading it, in that 5 minutes you could have 2 or 3 other users accessing your blog. User are accessing simultaneously in the real life, but not for your application server: a reading user are not using resources from your server!

&nbsp;

So... 200 users a day means you don't have many simultaneous connections (in theory, but is a thing you have to check), so you can configure the webserver (nginx and php-fpm) in consequence.

<strong>nginx tune</strong>
From nginx side, the important variables to start your tuning are <strong>worker_processes</strong> and <strong>worker_connections</strong>: the first one configure how many nginx processes are created on your server (1 by default) and the second one indicates how many connections (clients) can handled by any process.
So you can calculate the number of clients allowed on your nginx with:
<em>max clients = worker_processes * worker_connections
</em>On my server I leaved the default parameters for the nginx server, means 1 process with <strong>1024</strong> connections (file <em>/etc/nginx/nginx.conf</em>)

Why if I just say there are few concurrent users?
Another important thing to know is how a browser works with a web page.
When we ask a page to a webserver (for example a php page), it compile the php file (if needed) and send back to our browser the html version of a file (1 request to the webserver). Then, in the page, we normally have references to JavaScript files, Stylesheets files, images, fonts, ... So the browser, to complete the page we requested, execute other requests to the webserver: one for any <em>static</em> file. So a single user accessing a single page on a webserver, produces 10/20 requests (!!), or more, depending on your page. That means with 2 or 3 users we can easily reach hundreds connection to the server.

<strong>php-fpm tune
</strong>If you don't tune the default configuration, the php "web server" can handle hundreds connections without problems, BUT, it will use "lot" of ram: more than 200Mb.
Is not really an high value, I know, but when you have a virtual machine with 512mb of RAM, means the php-fpm uses half of your RAM.
The important configuration part is the one concerning the <em>child processes</em>.
<pre><code>; Choose how the process manager will control the number of child processes.
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
; Note: This value is mandatory.</code></pre>
A child process could handles a single user requests. So, for example, 200 processes means 200 simultaneous users.
On my server, after some tests, I'm using this configuration:
<pre><code>pm = dynamic
pm.max_children = 4
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 2
pm.max_requests = 200</code></pre>
That means I can have maximum 4 concurrent connections to the php part (for security you can increase the max to an higher value): a php thread normally answer to a user in less then a second (!).
When php-fpm service start up it creates 2 child processes, the others will be created only if required. You should find the good number for your child processes and put this number into start_servers variable: having required processes ready allow a faster response to the users (no time needed to create a new process).
With this configuration I can assure that php-fpm processes took only <strong>70Mb</strong> of ram on my server (any new php-fpm process takes about 24Mb of ram more), and when I have moments with "many" concurrent users could go up to about <strong>120Mb</strong>.
<pre><code>[mmornati@vps38203 ~]$ sudo python ps_mem.py 
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
=================================</code></pre>

To create this useful configuration I follow this <a href="http://www.if-not-true-then-false.com/2011/nginx-and-php-fpm-configuration-and-optimizing-tips-and-tricks/">guide</a>. If !1 then 0 it's an incredible technical blog :)
