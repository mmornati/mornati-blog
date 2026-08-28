---
title: Docker Ghost Blog Slim down
categories:
- devops
- web-dev-blogging
date: '2017-09-14T22:00:00+00:00'
slug: docker-ghost-blog-slim-down
tags:
  - docker
  - ghost
  - alpine
  - multi-stage
  - optimization
description: >-
  Reducing a 1GB Ghost blog Docker image to a fraction of its size using Alpine
  base images and multi-stage builds.
---

A big image isn't ideal if it contains build and development tools.

I spent the last two days working on the [Docker used for this blog](https://github.com/mmornati/docker-ghostblog) following this base concept:
> The image used during the development is maybe not the best one for the production environment.

In the end one thing was clear: I didn't need a **1GB** image just to run the Ghost Blog.
![oaid9fkubxvnis2qagw5](/images/docker-ghost-blog-slim-down/00-oaid9fkubxvnis2qagw5.png)
Into the image there were a lot of useless stuff and lot of intermediate layers.
![uzw5w5kftxcuywn2vdgg](/images/docker-ghost-blog-slim-down/01-uzw5w5kftxcuywn2vdgg.png)

## Overview

## Step 1: Change Base Image
Before I was using the [Node 6](https://github.com/nodejs/docker-node/blob/17c50cb300581280805a4183524fbf57840f3a7e/6.11/Dockerfile) which is great for development of a NodeJS application but it contains a lot of stuff which is not necessary in production.
Now I decided to use the [alpine](https://github.com/nodejs/docker-node/blob/17c50cb300581280805a4183524fbf57840f3a7e/6.11/alpine/Dockerfile) version of Node.
What is the difference?
**265Mb** vs **19Mb** !!
![qe9i7koa9fagrdnwzgtb](/images/docker-ghost-blog-slim-down/02-qe9i7koa9fagrdnwzgtb.png)

## Step 2: Multi-Stage Build
Since the 17.05 version, Docker introduces the multi-stage builds: in the same Dockerfile you can use multiple **FROM** statements. Each can use a specific image and starts a new stage of build.
You can then copy artifacts from 1 stage to another.

Ex:
**Stage 1**: build front application from sources
**Stage 2**: build java back application from source
**Stage 3**: create the final image getting binaries from Stage 1 and Stage 2

In this way you can add to the Stage 1 the packages required to build and check the front application, in the Stage 2 the java utils/library/packages to build the application... but in the final image (the one you want to deploy in production) you don't need all this build tools.

You can check the result of this big refactor looking to this [Dockerfile](https://github.com/mmornati/docker-ghostblog/blob/master/Dockerfile).
The installation of Ghost, using the GhostCLI, doesn't work correctly in the node alpine image. For this build stage I used the standard node image, **but it is not the one used in the final container**.

## Step 3: Separate Migration
I also decided to separate the Ghost database migration script and the Ghost Blog.
So far I used the migration script only 2 times, but it is taking lot of space in the blog image.

Right now there is a new [Docker](https://github.com/mmornati/docker-ghostdbmigrate) we can use when a database migration is required.
```bash
docker run -it --rm --name blogmigrate -e NODE_ENV=production -e DB_CURRENT_VERSION=1.0.2 -v /Users/mmornati/ghost-blog-test:/ghost-override mmornati/docker-ghostdbmigrate:v1.8.6
```

You need to use the same version of the Ghost blog you want to run!

## Result
![qbqcwuq7fw7uqhz3xulf](/images/docker-ghost-blog-slim-down/03-qbqcwuq7fw7uqhz3xulf.png)
Impressive, isn't it? :)