---
title: Docker Ghost Blog 1.5.0 released - New Migration feature
date: '2017-08-06T22:00:00+00:00'
slug: docker-ghost-blog-150-released-new-migration-feature
---



New version just released with a new database migration function inside the docker.

In these latests weeks the Ghost team released lot of new versions and it is quite difficult to follow and keep the docker updated.

Anyway you can find the **1.5.0** version on DockerHub.

![znwt0vbqoqwlv7re6emz](/images/docker-ghost-blog-150-released-new-migration-feature/00-znwt0vbqoqwlv7re6emz.png)

Working on this new version I discovered that database should be migrated to be able to use the docker with the latest version.
To simplify the migration of your "external" database I added a new command to the docker which simplify the migration.

You can now simply run the following command, which is starting the latest version of the docker and migrate the database.

<pre class="language-bash command-line" data-user="mmornati" data-host="macosx"><code class="language-bash">docker run -it --rm --name blogtest -p 2368:2368 -e NODE_ENV=production -e DB_CURRENT_VERSION=1.0.2 -v /Users/mmornati/ghost-blog-test:/ghost-override mmornati/docker-ghostblog:v1.5.0 /ghost/migrate-database.sh</code></pre>

You have naturally to change:

* the **-v** parameter to reference your ghost external folder;
* the **DB_CURRENT_VERSION** with the version of database (the Ghost version you were using before the Docker update)
* the version of the new Docker you want to start (mmornati/docker-ghostblog:v1.5.0 in this exemple I'm starting the latest available at the moment I'm writing this article)

If all was ok, you should have something like this
![jglhg1dj27dbgspd1z3a](/images/docker-ghost-blog-150-released-new-migration-feature/01-jglhg1dj27dbgspd1z3a.png)

Quite easy, isn't it?
