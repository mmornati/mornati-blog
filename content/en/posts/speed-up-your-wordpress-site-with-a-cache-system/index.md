---
title: Speed up your Wordpress site with a cache system
date: '2013-11-12T23:00:00+00:00'
slug: speed-up-your-wordpress-site-with-a-cache-system
---



I was reading articles about caching systems for Wordpress, and I found many conflicting opinions: or completely pro cache or absolutely against cache framework.

I then decided to make a simple test to verify if it was really useful to have a cache on this blog (I've <a href="http://wordpress.org/plugins/w3-total-cache/">W3 Total Cache</a> installed since the beginning) and here you are the results...
NB. On my nginx web server I've gzip activated on both tests with a browser cache for all static files.

<strong>Without cache</strong>
<pre><code> <code>MacBook-Pro-di-Marco:~ mmornati$ ab -n 100 -c5 http://blog.mornati.net/
This is ApacheBench, Version 2.3 &lt;$Revision: 655654 $&gt;
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking blog.mornati.net (be patient).....done

Server Software:        nginx/1.4.3
Server Hostname:        blog.mornati.net
Server Port:            80

Document Path:          /
Document Length:        55299 bytes

Concurrency Level:      5
Time taken for tests:   65.994 seconds
Complete requests:      100
Failed requests:        0
Write errors:           0
Total transferred:      5576900 bytes
HTML transferred:       5529900 bytes
Requests per second:    1.52 [#/sec] (mean)
Time per request:       3299.694 [ms] (mean)
Time per request:       659.939 [ms] (mean, across all concurrent requests)
Transfer rate:          82.53 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:      173  321  79.4    317     483
Processing:  1676 2906 587.0   2845    4604
Waiting:     1068 2113 596.4   2058    3726
Total:       2038 3226 577.0   3178    4947

Percentage of the requests served within a certain time (ms)
  50%   3178
  66%   3424
  75%   3673
  80%   3720
  90%   3873
  95%   4160
  98%   4779
  99%   4947
 100%   4947 (longest request)</code></pre>
<strong>With W3C Total Cache</strong>
<pre><code> <code>MacBook-Pro-di-Marco:~ mmornati$ ab -n 100 -c5 http://blog.mornati.net/
This is ApacheBench, Version 2.3 &lt;$Revision: 655654 $&gt;
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking blog.mornati.net (be patient).....done

Server Software:        nginx/1.4.3
Server Hostname:        blog.mornati.net
Server Port:            80

Document Path:          /
Document Length:        55619 bytes

Concurrency Level:      5
Time taken for tests:   2.994 seconds
Complete requests:      100
Failed requests:        0
Write errors:           0
Total transferred:      5640878 bytes
HTML transferred:       5617244 bytes
Requests per second:    33.40 [#/sec] (mean)
Time per request:       149.717 [ms] (mean)
Time per request:       29.943 [ms] (mean, across all concurrent requests)
Transfer rate:          1839.70 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:       16   21   2.6     21      29
Processing:    81  125  18.5    121     186
Waiting:       34   54  15.3     52     105
Total:        105  145  18.4    141     207

Percentage of the requests served within a certain time (ms)
  50%    141
  66%    148
  75%    155
  80%    158
  90%    169
  95%    184
  98%    200
  99%    207
 100%    207 (longest request)</code></pre>
I think the results are impressive:
4947 vs 207 ms = <strong>2289,855%</strong> better with the cache activate

You have to set correctly your Wordpress cache framework to prevent caching problems; for example, new post not shown on the homepage... but, I think you should have a caching framework on a wordpress website!

If you decide to use it with the NGINX web server, here you are my configuration.
<pre><code> <code>server {
    listen 5.135.145.38:80;
    server_name blog.mornati.net;

    root /usr/share/nginx/blog;
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
