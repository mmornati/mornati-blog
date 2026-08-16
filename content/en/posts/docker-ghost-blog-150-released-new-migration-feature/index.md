---
title: Docker Ghost Blog 1.5.0 released - New Migration feature
date: '2017-08-06T22:00:00+00:00'
slug: docker-ghost-blog-150-released-new-migration-feature
categories:
  - DevOps
  - Docker
  - Blogging
tags:
  - docker
  - ghost
  - migration
  - database
  - devops
description: Docker Ghost Blog 1.5.0 adds a new database migration command to help keep your Ghost database in sync with the latest Docker image versions.
---

A new version has just been released with a new database migration function inside the Docker image.

In recent weeks the Ghost team released many new versions and it is quite difficult to keep up and keep the Docker image updated.

You can find the **1.5.0** version on DockerHub.

![znwt0vbqoqwlv7re6emz](/images/docker-ghost-blog-150-released-new-migration-feature/00-znwt0vbqoqwlv7re6emz.png)

## Overview

Working on this new version I discovered that the database should be migrated before using the Docker image with the latest version.
To simplify migration of your "external" database, I added a new command to the Docker image.

## Migration Command

You can now simply run the following command, which starts the latest version of the Docker image and migrates the database.

```bash
docker run -it --rm --name blogtest -p 2368:2368 -e NODE_ENV=production -e DB_CURRENT_VERSION=1.0.2 -v /Users/mmornati/ghost-blog-test:/ghost-override mmornati/docker-ghostblog:v1.5.0 /ghost/migrate-database.sh
```

## Parameters

You will need to change:

* the **-v** parameter to reference your Ghost external folder;
* the **DB_CURRENT_VERSION** to match the database version (the Ghost version you were using before the Docker update)
* the version of the new Docker image you want to start (`mmornati/docker-ghostblog:v1.5.0` in this example — I am starting the latest available at the time of writing)

If all went well, you should see something like this:
![jglhg1dj27dbgspd1z3a](/images/docker-ghost-blog-150-released-new-migration-feature/01-jglhg1dj27dbgspd1z3a.png)

Quite easy, isn't it?