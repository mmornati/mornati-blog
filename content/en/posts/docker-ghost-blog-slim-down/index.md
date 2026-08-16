---
title: Docker Ghost Blog Slim down
date: '2017-09-14T22:00:00+00:00'
slug: docker-ghost-blog-slim-down
categories:
  - DevOps
  - Docker
tags:
  - docker
  - ghost
  - alpine
  - optimization
  - devops
description: "How I slimmed down the Ghost blog Docker image from 1GB to ~150MB using Alpine, multi-stage builds, and separating the database migration script."
---

## Overview

A big image is not (always) good if it contains build and development tools.

I spent the last two days working on the [Docker image used for this blog](https://github.com/mmornati/docker-ghostblog) following this basic concept:
> The image used during the development is maybe not the best one for the production environment.

In the end one thing was certain: I did not need a **1 GB** image just to run the Ghost Blog.
![oaid9fkubxvnis2qagw5](/images/docker-ghost-blog-slim-down/00-oaid9fkubxvnis2qagw5.png)
The image contained a lot of useless stuff and many intermediate layers.
![uzw5w5kftxcuywn2vdgg](/images/docker-ghost-blog-slim-down/01-uzw5w5kftxcuywn2vdgg.png)

## Step 1: Base Image

Before, I was using the [Node 6](https://github.com/nodejs/docker-node/blob/17c50cb300581280805a4183524fbf57840f3a7e/6.11/Dockerfile) image, which is the best when you are developing a Node.js application but contains a lot of tooling that is not necessary in production.
Now I decided to use the [Alpine](https://github.com/nodejs/docker-node/blob/17c50cb300581280805a4183524fbf57840f3a7e/6.11/alpine/Dockerfile) version of Node.
What is the difference?
**265 MB** vs **19 MB**!
![qe9i7koa9fagrdnwzgtb](/images/docker-ghost-blog-slim-down/02-qe9i7koa9fagrdnwzgtb.png)

## Step 2: Multi-stage Build

Since version 17.05, Docker introduced multi-stage builds: in the same Dockerfile you can now use multiple **FROM** statements. Each of them can use a specific image and starts a new build stage.
You can then copy artifacts from one stage to another.

Example:
**Stage 1**: build frontend application from source
**Stage 2**: build Java backend application from source
**Stage 3**: create the final image, getting binaries from Stage 1 and Stage 2

In this way you can add to Stage 1 the packages required to build and check the frontend application, and to Stage 2 the Java utilities and libraries needed to build the backend... but in the final image (the one you want to deploy in production) you do not need any of these build tools.

You can check the result of this big refactor in this [Dockerfile](https://github.com/mmornati/docker-ghostblog/blob/master/Dockerfile).
The installation of Ghost using Ghost-CLI does not work correctly in the Node Alpine image. For this build stage I used the standard Node image, **but it is not the one used in the final container**.

## Step 3: Separate Migration

I also decided to separate the Ghost database migration script from the Ghost Blog image.
So far I have used the migration script only twice, but it takes up a lot of space in the blog image.

There is now a separate [Docker image](https://github.com/mmornati/docker-ghostdbmigrate) we can use when a database migration is required.

```bash
docker run -it --rm --name blogmigrate -e NODE_ENV=production -e DB_CURRENT_VERSION=1.0.2 -v /Users/mmornati/ghost-blog-test:/ghost-override mmornati/docker-ghostdbmigrate:v1.8.6
```

You will need to use the same version of the Ghost blog you want to run!

## Result

![qbqcwuq7fw7uqhz3xulf](/images/docker-ghost-blog-slim-down/03-qbqcwuq7fw7uqhz3xulf.png)
Impressive, isn't it? :)