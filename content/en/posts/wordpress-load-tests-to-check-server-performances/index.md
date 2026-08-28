---
title: 'Wordpress: load tests to check server performances'
categories:
- web-dev-blogging
- devops
date: '2013-11-02T23:00:00+00:00'
slug: wordpress-load-tests-to-check-server-performances
tags:
  - wordpress
  - load-test
  - jmeter
  - blazemeter
  - performance
  - nginx
description: 'Load testing your WordPress blog with Apache JMeter and BlazeMeter to measure nginx and php-fpm performance under concurrent users.'
---

## Overview

In the [previous](http://blog.mornati.net/2013/11/02/wordpress-nginx-php-fpm-on-ovh-vps/) post I described how you can tune nginx to keep memory on your server.
But, with any tune configuration, you can't choose a value without retest later your server/app performances: having a larger configuration means you are using more resources than the real need; but using a smaller configuration means a poor user experience, like low response, error from the server, ...
If you have many Facebook friends and you can ask to all of them to get access to your blog at 8:00PM you're executing a really good stress test: many requests from different places, with different ip addresses, ... you have a *real-life* stress test. The problem is that you cannot measure the result. Try asking a Facebook friend how many milliseconds it took the homepage to load :D

## Load Testing Tools

I'm joking... but it was just to introduce a tool you can use to make a good stress test with a result measurements. The standard in open-source for this is [Apache JMeter](http://jmeter.apache.org/), which you can download and install on your machine to register and execute the test. But, in this way, you don't have a really good test because server will always see a single user (same ip address) and can produce response using cached data.
There's also a free load test platform on the web, based on JMeter, you can use to make stress test to your wordpress: [BlazeMeter](http://blazemeter.com/).
With the simple web interface you can setup your blog url, some pages/posts you want to visit, the number of concurrent users, the ramp-up period and the test duration.
Then you just start your recorded test and you'll get an email with the result link when the test finishes.

## Test Results

Here the results I got with the configuration I show you up in my previous post:
[![blog_loadtest](/images/wordpress-load-tests-to-check-server-performances/00-blog_loadtest_kl6i29.png)](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641034/blog_loadtest_kl6i29.png)
This compares memory usage with the number of concurrent connections. We can see that memory grows every time there's an increase of simultaneous connections, which means, from what we saw, php-fpm needs another child process to manage that number of connections. In the graph, I'm testing with between 20 and 50 users (simultaneous users!), so 4 child processes are enough for 50 concurrent users on a standard wordpress blog.
You can check this looking at the other graphs produced by BlazeMeter test, such as response time and errors.
[![blog_error_graph](/images/wordpress-load-tests-to-check-server-performances/01-blog_error_graph_v4n6qs.png)](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641033/blog_error_graph_v4n6qs.png)
This one is the OK response graph (200) compared to the number of connections. It shows that the server is OK until 60 users and then, with many more users making requests, responses decrease to 0: the server does not have time to respond to all the incoming requests.
With 4 max child process in the php-fpm server, we can have 40 concurrent users at a given time, which will slow down responses, but all of them will receive the requested page!
That's enough for my little blog!
How about yours? :)