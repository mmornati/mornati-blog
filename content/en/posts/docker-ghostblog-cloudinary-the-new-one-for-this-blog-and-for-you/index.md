---
title: docker-ghostblog-cloudinary The new one for this blog, and for you
date: '2017-09-16T22:00:00+00:00'
slug: docker-ghostblog-cloudinary-the-new-one-for-this-blog-and-for-you
---



If you want an all-in-one Docker for your Blog, you can use my new [docker-ghostblog-cloudinary](https://github.com/mmornati/docker-ghostblog-cloudinary) (the one used to run this blog).

This Docker is based on the [docker-ghostblog](https://github.com/mmornati/docker-ghostblog) image and it is adding a different images storage: Cloudinary. Any time you add an image, into a post, as post back image or into the blog settings area, all the images are sent directly to Cloudinary and then served through it.

**Why you should store images somewhere else than your blog host?**
For me it depends only on your host and the persons visiting it. The images, or in general the media files, are often the most busy and longest-running resources to download, so it is for me better to keep them as near as possible to the final "browser". And then we have to consider that, depending on your blog traffic, this can take lot of bandwidth and it can slow down the user experience. 
Ok, ok, it is not the case for my blog :) *BUT*... 
![Schermata-2017-09-17-alle-21.13.01.png](/images/docker-ghostblog-cloudinary-the-new-one-for-this-blog-and-for-you/00-Schermata-2017-09-17-alle-21.13.01.png.png)
the blog server is in France and there are readers from everywhere. I think this decision will allow a faster loading for anyone.

If you want the Docker with a pre-configured Cloudinary plugin, you can take this one.

<pre class="language-bash command-line" data-user="mmornati" data-host="macosx"><code class="language-bash">docker pull mmornati/docker-ghostblog-cloudinary:1.8.6
docker run -d -p 2368:2368 -e WEB_URL=http://test.blog -e SERVER_HOST=12.4.23.5 -e SERVER_PORT=4000 -e CLOUDINARY_URL=cloudinary://87237872387:aaaaaaaaaaaa@blog-mornati-net -v /opt/data:/ghost-override mmornati/docker-ghostblog-cloudinary:1.8.6</code></pre>

The **CLOUDINARY_URL** environment variable is used to configure the plugin with the information about your Cloudinary account.
