---
title: The new Ghost Blog base Docker
categories:
- web-dev-blogging
- devops
date: '2017-09-16T22:00:00+00:00'
slug: the-new-ghost-blog-base-docker
tags:
  - docker
  - ghost
  - blog
  - nginx
  - devops
description: A lightweight, reusable Ghost blog Docker image stripped of custom plugins, making it easy for anyone to deploy and run.
---

I'm continuing to work on slimming down the [Docker Ghost Blog](/docker-ghost-blog-slim-down/) I created.

## Overview

I started the project to simplify managing my blog and, for this reason, it included everything I needed. Which is another way of saying that it wasn't really "basic" enough to be used by anyone.

I was pleasantly surprised to see that the Docker was pulled many times: **100K+** (which is the max count for the docker hub... I don't know exactly how many times was downloaded!).

For this reason I removed all the customizations from this base version I'm using in my blog, the [Cloudinary storage plugin](/ghost-storage-cloudinary/) for example, providing an easy-to-use Docker for anyone.

## Usage

**How can I start using Ghost?** Quick and easy:

```bash
docker pull mmornati/docker-ghostblog:1.8.6
docker run -d -p 2368:2368 -v /opt/blog-data:/ghost-override mmornati/docker-ghostblog:1.8.6
```

These commands are downloading the **1.8.6** version of the docker and starting it up on the **2368** port and using the **/opt/blog-data** folder as blog content folder.

In the GitHub README file, I included some other parameters: I used them to make an automatic link to the [Docker nginx-proxy](https://github.com/jwilder/nginx-proxy). It automatically exposes through the ports 80 and 443 all other web dockers using some environment variables.