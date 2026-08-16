---
title: Docker images and files chown
date: '2017-11-05T23:00:00+00:00'
slug: docker-images-and-files-chown
categories: [DevOps, Docker]
tags: [docker, chown, images, optimization, devops]
description: How the chown command affects Docker image size, and how to avoid wasting disk space by understanding image layers and copy-on-write.
---

## Overview

I never thought much about the Docker containers and the impact the **chown** (change the ownership of a file) command can have on the final image. I think chown should be forbidden (as much as possible) because it will produce bigger images than necessary.

But let's review together how Docker works to understand what I just said.

## Docker Image Layers

As you surely know, any Docker image consists of overlapping layers

![Image for post](/images/docker-images-and-files-chown/00-0_7afKkmuMtuOGywTq.jpg)

In the Docker official documentation, you can find

> *A Docker image is built up from a series of layers. Each layer represents an instruction in the image's Dockerfile. Each layer except the very last one is read-only. \[…\] Each layer is only a set of differences from the layer before it.*

For any instruction contained in your Dockerfile (and in all the FROM images) you get an additional layer. You can check by running the **history** command on it:

```bash
docker history mmornati/docker-ghostblog:1.16.0 /bin/sh -c #(nop) CMD ["/bin/sh" "/ghost/... 0B /bin/sh -c #(nop) VOLUME [/ghost-override] 0B /bin/sh -c #(nop) HEALTHCHECK &{["CMD-SHE... 0B /bin/sh -c #(nop) EXPOSE 2368 0B /bin/sh -c #(nop) ENV NODE_ENV=production 0B /bin/sh -c #(nop) WORKDIR /ghost 0B /bin/sh -c #(nop) ENV HOME=/ghost 0B /bin/sh -c #(nop) USER ghost 0B /bin/sh -c chown -R ghost:ghost /ghost && ... 108MB /bin/sh -c #(nop) COPY dir:ec27a30893731c0... 108MB /bin/sh -c addgroup -S -g 1276 ghost && ... 5.13kB /bin/sh -c #(nop) LABEL maintainer=Marco ... 0B /bin/sh -c #(nop) CMD ["node"] 0B /bin/sh -c apk add --no-cache --virtual .b... 3.91MB /bin/sh -c #(nop) ENV YARN_VERSION=0.27.5 0B /bin/sh -c addgroup -g 1000 node && ad... 45.6MB /bin/sh -c #(nop) ENV NODE_VERSION=6.11.3 0B /bin/sh -c #(nop) ENV NPM_CONFIG_LOGLEVEL... 0B /bin/sh -c #(nop) CMD ["/bin/sh"] 0B /bin/sh -c #(nop) ADD file:89e72bfc19e8162... 4.81MB
```

In the output, you can see the list of commands and the disk space consumed by each one. The result should be read bottom-up: the lower layer is the first one.

## Copy-on-Write

To manage the files in the multiple layers, Docker is using the copy on write strategy.

> *Copy-on-write is a strategy of sharing and copying files for maximum efficiency. If a file or directory exists in a lower layer within the image, and another layer (including the writable layer) needs read access to it, it just uses the existing file. The first time another layer needs to modify the file (when building the image or running the container), the file is copied into that layer and modified. This minimizes I/O and the size of each of the subsequent layers. These advantages are explained in more depth below.*

So, simply put, when you need to change a file contained in another layer, Docker copies the file in the layer where you are modifying it, so in your final image, the file appears twice and takes up twice the disk space (one per layer).

**What about if you need to delete a file present in another layer?** Following what we just see, the file is "hidden" in the final layer because you delete it, but the disk space is taken because the file is still present in the previous layer! So it is "useless" to remove a file.

This is the reason why, for example, the **clean all** in the following command is useless if your target is to prevent waste of disk space:

```bash
RUN yum -y install php RUN yum clean all
```

This other one instead will produce a single layer with the PHP package installed and with the yum cache correctly cleaned.

```bash
RUN yum -y install php && yum clean all
```

## The Chown Problem

What about the chown? It is following the same rules: applying change ownership to a file, for Docker means copy that file in the new layer and change the ownership. Every time you use it, you're taking up more disk space than you need. In the history I pasted before there is the example about the image I was using for this blog:

```bash
/bin/sh -c chown -R ghost:ghost /ghost && ... 108MB /bin/sh -c #(nop) COPY dir:ec27a30893731c0... 108MB
```

The first line (reading bottom-top) COPY a folder into the container (1 layer) the second one is changing the ownership of the file (1 layer). Result: 108Mb the copy **+** 108Mb to chown. **I was wasting 108Mb of space because of the chown!!**

## The Fix

To prevent waste of disk space we have always to think **how we can reduce the number of layers**. Specifically for the chown problem, in the recent versions of Docker, you can add the ownership of the files as a parameter of the COPY command ( **— chown=-user-**):

```bash
COPY --from=plugin-builder --chown=node /builder/cloudinary-store
```

which is producing the copy and the ownership in the same command and so in a single layer.

The result refactoring this blog image (~270Mb-108Mb):

![Image for post](/images/docker-images-and-files-chown/02-0_pPmGpr6TAHkvELrU.png)

In the end, when you are building images for the production it is important to think of the disk space and to keep in mind that your goal is to reduce the number of layers.

*Originally published at* [*https://blog.mornati.net*](https://blog.mornati.net/docker-images-and-chown/) *on November 6, 2017.*