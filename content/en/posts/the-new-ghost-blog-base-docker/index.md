---
title: The new Ghost Blog base Docker
date: '2017-09-16T22:00:00+00:00'
slug: the-new-ghost-blog-base-docker
---



I'm going ahead working on the slim of the [Docker Ghost Blog ](https://blog.mornati.net/docker-ghost-blog-slim-down/) I created.

I started the project to simplify the manage of my Blog and, for this reason, was keeping all the things I needed. Which is another way to say that it wasn't so "basic" to be used by anyone.

I was happily hurt in seeing that the Docker was pulled plenty of times: **100K+ times** (which is the max count for the docker hub... I don't know exactly how many times was downloaded!).

For this reason I removed from this base version all the custom things I'm using in my blog, the [Cloudinary storage plugin](https://blog.mornati.net/ghost-storage-cloudinary/) for example, providing an easy to use Docker for anyone.

#### How can I start using Ghost?
Quick and easy:
<pre class="language-bash command-line" data-user="mmornati" data-host="macosx"><code class="language-bash">docker pull mmornati/docker-ghostblog:1.8.6
docker run -d -p 2368:2368 -v /opt/blog-data:/ghost-override mmornati/docker-ghostblog:1.8.6</code></pre>

These commands are downloading the **1.8.6** version of the docker and starting it up on the **2368** port and using the **/opt/blog-data** folder as blog content folder.

Into the github README file I put some other parameter: I used them to make an automatic link to the [Docker nginx-proxy](https://github.com/jwilder/nginx-proxy). It is automatically exposing through the ports 80 and 443 all other web dockers using some environment variables.
