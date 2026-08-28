---
title: "Docker GhostBlog Cloudinary: The New One for This Blog, and for You"
categories:
- devops
- web-dev-blogging
date: '2017-09-16T22:00:00+00:00'
slug: docker-ghostblog-cloudinary-the-new-one-for-this-blog-and-for-you
tags:
  - docker
  - ghost
  - cloudinary
  - blog
  - images
description: "An all-in-one Docker image for running Ghost with Cloudinary storage — the same setup powering this blog."
---

I've been fine-tuning my blog setup and wanted to share a ready-to-use Docker image so you can benefit from it too.

If you'd like a Docker for your Blog, you can use my new [docker-ghostblog-cloudinary](https://github.com/mmornati/docker-ghostblog-cloudinary) (the one used to run this blog).

This Docker is based on the [docker-ghostblog](https://github.com/mmornati/docker-ghostblog) image and it adds a different storage for images: Cloudinary. Every time you add an image to a post, as a post background image, or in the blog settings, all the images are sent directly to Cloudinary and then served through it.

## Why Cloudinary?

**Why you should store images somewhere else than your blog host?**
For me it depends only on your host and the persons visiting it. Images (and media files in general) are often the heaviest and slowest resources to load, so it is for me better to keep them as near as possible to the final "browser". And then we have to consider that, depending on your blog traffic, this can consume a lot of bandwidth and it can slow down the user experience.
OK, that's not the case for my blog :) *BUT*...
![Schermata-2017-09-17-alle-21.13.01.png](/images/docker-ghostblog-cloudinary-the-new-one-for-this-blog-and-for-you/00-Schermata-2017-09-17-alle-21.13.01.png)
the blog server is in France and there are readers from everywhere. I think this decision will allow a faster loading for anyone.

## Usage

If you'd like a Docker with a pre-configured Cloudinary plugin, you can take this one.

```bash
docker pull mmornati/docker-ghostblog-cloudinary:1.8.6
docker run -d -p 2368:2368 -e WEB_URL=http://test.blog -e SERVER_HOST=12.4.23.5 -e SERVER_PORT=4000 -e CLOUDINARY_URL=cloudinary://87237872387:aaaaaaaaaaaa@blog-mornati-net -v /opt/data:/ghost-override mmornati/docker-ghostblog-cloudinary:1.8.6
```

The **CLOUDINARY_URL** environment variable is used to configure the plugin with the information about your Cloudinary account.