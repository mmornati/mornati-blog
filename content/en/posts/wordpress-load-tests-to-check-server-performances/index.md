---
title: 'Wordpress: load tests to check server performances'
date: '2013-11-02T23:00:00+00:00'
slug: wordpress-load-tests-to-check-server-performances
---



In the <a href="http://blog.mornati.net/2013/11/02/wordpress-nginx-php-fpm-on-ovh-vps/">previous</a> post I described how you can tune nginx to keep memory on your server.
But, with any tune configuration, you can't chose a value without retest later your server/app performances: have a "larger" configuration means you are using more resources than the real need; but use a "smaller" configuration means a poor user experience, like low response, error from the server, ...
If you have many facebook friends and you can ask to all of them to get access to your blog at 8:00PM you are executing a really good stress test: many requests from different places, with different ip addresses, ... you have a <em>real life</em> stress test. The problem is that you cannot measure the result. Try to ask to a facebook friend "how many milliseconds took the homepage to laod?"  :D

I'm joking... but it was just to introduce a tool you can use to make a good stress test with a result measurements. The standard in the opensource for this is <a href="http://jmeter.apache.org/">Apache JMeter</a> than you can download and install on your machine to register and execute the test. But, in this way, you don't have a really good test because server will always see a single user (same ip address) and can produce response using cached data.
On the web you have a free LoadTest Platform, based on JMeter, you can use to make stress test to your wordpress: <a href="http://blazemeter.com/">BlazeMaster</a>.
With the simple web interface you can setup your blog url, some pages/posts you want to visit, the number of concurrent users, the rump up period and the test duration.
Then you just start your recorded test and you will get an email with the result link when the test will be finished.
Here the results I got with the configuration I show you up in my previous post:
<a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641034/blog_loadtest_kl6i29.png">![blog_loadtest](/images/wordpress-load-tests-to-check-server-performances/00-blog_loadtest_kl6i29.png)</a>Memory compared with number of concurrent connections. We can see that memory grow up every time I have an increase of simultaneous connections, which means, for what we saw, php-fpm need another child process to manage that number of connections. If you look in the graph I'm testing with users between 20 and 50 (simultaneous users !!), so 4 child processes are enough for 50 concurrent users on a standard wordpress blog.
You can check this looking to others graphs produced by BlazeMaster test, such as, response time, errors produced, ...
<a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641033/blog_error_graph_v4n6qs.png">![blog_error_graph](/images/wordpress-load-tests-to-check-server-performances/01-blog_error_graph_v4n6qs.png)</a>This one is the OK response graph (200) compared to the number of connections. It shows that that server is OK until 60 users and then, with many other users making requests, responses decreases to 0: the server does not have time to respond to all the incoming requests.
With 4 max child process in the php-fpm server, we can have at a given time 40 concurrent users, that surely slow down responses, but all of them receive the requested page!
That's enough for my little blog!
How about yours? :)

&nbsp;
