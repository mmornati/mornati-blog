---
title: How to update to Ghost 1.9.0 with Docker
date: '2017-09-22T22:00:00+00:00'
slug: how-to-update-to-ghost-190-with-docker
---



If you are using the docker-ghostblog or docker-ghostblog-cloudinary to run your blog, you can simply update to the new versions.

Sometimes you will need to upgrade the database schema, like the migration from 1.8.6 version to the 1.9.0.
After the blog startup you will notice that docker is immediately shutdown and, checking into the blog log you will find a log like the following one:
![Capture-d-e-cran-2017-09-23-a--19.35.16.png](/images/how-to-update-to-ghost-190-with-docker/00-Capture-d-e-cran-2017-09-23-a--19.35.16.png.png)
In this case just run the correct docker-ghostdbmigrate to upgrade your database and then start the blog.

#### Full migration procedure
<pre class="language-bash command-line" data-user="mmornati" data-host="macosx"><code class="language-bash">docker pull mmornati/docker-ghostblog-cloudinary:1.9.0
docker pull mmornati/docker-ghostdbmigrate:1.9.0
docker run -it --rm --name blogmigrate -e NODE_ENV=production -e DB_CURRENT_VERSION=1.8.6 -v /opt/ghost-blog:/ghost-override mmornati/docker-ghostdbmigrate:1.9.0
docker run -d -p 2368:2368 -e WEB_URL=http://test.blog -e SERVER_HOST=12.4.23.5 -e SERVER_PORT=4000 -e CLOUDINARY_URL=cloudinary://87237872387:aaaaaaaaaaaa@blog-mornati-net -v /opt/data:/ghost-override mmornati/docker-ghostblog-cloudinary:1.9.0
</code></pre>

Enjoy your blog updated...
