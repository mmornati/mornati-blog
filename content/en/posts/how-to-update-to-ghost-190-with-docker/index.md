---
title: How to update to Ghost 1.9.0 with Docker
date: '2017-09-22T22:00:00+00:00'
slug: how-to-update-to-ghost-190-with-docker
categories:
  - DevOps
  - Docker
  - Blogging
tags:
  - docker
  - ghost
  - migration
  - update
  - database
description: How to migrate a Ghost blog running in Docker from version 1.8.6 to 1.9.0 using the docker-ghostdbmigrate tool.
---

## Overview

If you are using the docker-ghostblog or docker-ghostblog-cloudinary to run your blog, you can simply update to the latest version.

Sometimes you may need to upgrade the database schema, like the migration from 1.8.6 version to the 1.9.0.
After starting the blog, you'll notice the container shuts down immediately and, checking the blog logs, you'll find something like:
![Capture-d-e-cran-2017-09-23-a--19.35.16.png](/images/how-to-update-to-ghost-190-with-docker/00-Capture-d-e-cran-2017-09-23-a--19.35.16.png)
In this case, just run the correct docker-ghostdbmigrate to upgrade your database and then start the blog.

## Migration Procedure

```bash
docker pull mmornati/docker-ghostblog-cloudinary:1.9.0
docker pull mmornati/docker-ghostdbmigrate:1.9.0
docker run -it --rm --name blogmigrate -e NODE_ENV=production -e DB_CURRENT_VERSION=1.8.6 -v /opt/ghost-blog:/ghost-override mmornati/docker-ghostdbmigrate:1.9.0
docker run -d -p 2368:2368 -e WEB_URL=http://test.blog -e SERVER_HOST=12.4.23.5 -e SERVER_PORT=4000 -e CLOUDINARY_URL=cloudinary://87237872387:aaaaaaaaaaaa@blog-mornati-net -v /opt/data:/ghost-override mmornati/docker-ghostblog-cloudinary:1.9.0
```

Enjoy your updated blog.