---
title: 'Ghost Blog: update made easy using a docker container'
date: '2016-08-30T22:00:00+00:00'
slug: ghost-blog-update-made-easy-using-a-docker-container
---



The [Ghost Blog Platform](https://ghost.org/), which I'm using for this blog, is still a sort of **beta code**. It contains today plenty of new functions and you can start do everything you like (or at least everything that should be done into a blog); it is OpenSource based on [NodeJS](https://nodejs.org/en/) and you can easily extend it, create themes, ...

This **beta status** is still impacting the update process: 

* you have to check the changelog (to imagine if anything could be broken)
* you have to download the source code
* follow the update procedure (it is always the same, but you can't known)
* copy the new code to your server 
* back the content folder (just to be sure you won't lose anything)
* restart everything (NodeJS server)

And... if nothing is working... **rollback** following the same procedure bottom up.

This means you need every time at least 15 minutes when all is good... or lose a couple of hours if you need to fix stuffs.

### Docker as simple solution
Using the docker container base concept: **a container is immutable** we can automate all this procedure. This will reduce the manual actions and, in case of rollback, you can simply restart the previous container where you still have your old ghost version.

You can find what I'm using for this blog on my [GitHub repository](https://github.com/mmornati/docker-ghostblog).

![Dockerfile](/images/ghost-blog-update-made-easy-using-a-docker-container/00-ecxmnjht8mnf0vqrgp5k.png)

As you can see into the Dockerfile, based on the NodeJS 4.5 LTS, we are always downloading the latest version of Ghost, keep the **dynamic configuration** which is using some *environment variables* and executing some cool staffs that I let you discover reading the Dockerfile :)

The Ghost **content folder** is outside your docker container, mounted as external volume; so it is not necessary to backup it during the procedure (even if I suggested 'cause we never known) and, especially, you can **start a new docker to test if all is good without putting your blog offline**. 
If all is ok for you, you can than shutdown the previous Docker container and restart the new one: your blog **will be offline for less than a minute**.

I let you discover everything, completing with just some examples this blog post:

**Build the GhostBlog container**
<pre class="language-bash command-line" data-user="root" data-host="server"><code class="language-bash">git clone https://github.com/mmornati/docker-ghostblog.git
cd docker-ghostblog
docker build -t mmornati/docker-ghostblog:0.10.0 .
</code></pre>

**Start the built container**
<pre class="language-bash command-line" data-user="root" data-host="server"><code class="language-bash">docker run -d --name blog -p 80:2368 -e WEB_URL=http://blog.mornati.net -e SERVER_HOST=0.0.0.0 -e SERVER_PORT=2368 -e CLOUDINARY_URL=cloudinary://11111:aaaaaa_bbbb@blog-mornati-net -v /opt/ghost-blog-content:/ghost-override mmornati/docker-ghostblog:0.10.0</code></pre>

**Check if all is good**
<pre class="language-bash command-line" data-user="root" data-host="server"><code class="language-bash">docker ps</code></pre>

![](/images/ghost-blog-update-made-easy-using-a-docker-container/01-bxejwvdtt0sbdwqf2n9u.png)

**Access to your container**
```bash
http://localhost
```

**Download my prebuilt containers**

I'm using the [DockerHub](https://hub.docker.com/r/mmornati/docker-ghostblog/) automatic build function: any time I'm changing stuffs on github, DockerHub is creating a new version of the container.
All is available online, so you can simple make a `docker pull` to retrieve the latest version (or a specific one).

<pre class="language-bash command-line" data-user="root" data-host="server"><code class="language-bash">docker pull mmornati/docker-ghostblog</code></pre>
