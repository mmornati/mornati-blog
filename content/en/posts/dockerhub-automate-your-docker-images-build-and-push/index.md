---
title: 'DockerHub: automate your docker images build and push'
date: '2016-09-03T22:00:00+00:00'
slug: dockerhub-automate-your-docker-images-build-and-push
categories:
  - DevOps
  - Docker
tags:
  - docker
  - dockerhub
  - ci
  - automation
  - devops
description: 'How to configure DockerHub to automatically build and push Docker images from your GitHub repository.'
---

## Overview

The [DockerHub](https://hub.docker.com/) website was created by Docker to allow developers to automate the Docker images build and push the image into the Docker repository.
In this way you don't need to use your CPU time to build the image and not even your bandwidth to upload the image into the Docker repository to allow others to pull it.

The procedure to configure DockerHub is really simple.

## Configuration

**1)** Create a repository pointing to your source repository (GitHub repo):
![RepositoryDefinition](/images/dockerhub-automate-your-docker-images-build-and-push/00-ompu7km5llsymm9fyos8.png)
and set it as an automated build. It's not necessary but in this way anytime you are pushing changes to your repository, DockerHub will build the Docker image automatically.
![AutomatedBuildDefinition](/images/dockerhub-automate-your-docker-images-build-and-push/01-edfosetsfbifisc1xmfu.png)

**2)** Configure then for your repository the branch and/or tag you want to auto-check for builds.
![TriggerBuildDefinition](/images/dockerhub-automate-your-docker-images-build-and-push/02-b1oqzuxesturkuozdybc.png)
In the example, which is mine ghostblog configuration, there is a "listener" on the **master** branch building the **latest** version of the Docker and a second lister checking tag.
If any tag is pushed matching the RegExp into the name:
`/^v.[0-9.]+$/`
an image is built using the same version as the one used into the tagname.
Examples:

* **v.0.10.1** tag triggers a build of an image tagged as v.0.10.1
* **update_dockerfile** tag is ignored by dockerhub

**3)** Change your code on the associated GitHub repo and push code (and tags if needed).
You can see if any build is started on the *Build Details* page. 
![BuildDetailsPage](/images/dockerhub-automate-your-docker-images-build-and-push/03-qf7hzy0d3numjssgplwk.png)
At the end of the build procedure (depending on your Docker could take only few seconds or hours) you will have the status of the Docker image:
![DockerBuildSuccess](/images/dockerhub-automate-your-docker-images-build-and-push/04-wa8sp3ijlaqkue9us2xv.png)
Or, in case of errors:
![DockerBuildError](/images/dockerhub-automate-your-docker-images-build-and-push/05-mvy4fsbd4yerjzedyyf2.png)
You can then click on the failing build to access to the details. Here you can find the build problem and check the build log.
![DockerBuildErrorDetails](/images/dockerhub-automate-your-docker-images-build-and-push/06-xbn59rtguhw3kb5ycwjv.png)
![DockerBuildLog](/images/dockerhub-automate-your-docker-images-build-and-push/07-f9hjfiyxdbexlyjk2eag.png)
**4)** Check on the *Tags* page to see the available images of your docker.
Here you are also able to manage them removing, for example, some old or wrong image.
![DockerImages](/images/dockerhub-automate-your-docker-images-build-and-push/08-djz6sg5idluo2aovoqcb.png)

## Building

**5)** As I said at the beginning, all images built using this method are available on the Docker repository.
This means you can simply *pull* the desired image/tag.

```bash
sudo docker pull mmornati/docker-ghostblog:v0.10.0
```

> **INFO:** all images built using this method are "fresh" image. This means that all the intermediate steps are removed for any new build.
In my example **it is important to have this** because one of the steps into the Dockerfile is downloading a file from internet (ghost latest version). If you keep all the build steps there's no guarantee to have the Ghost's latest version into your Docker.

```dockerfile
# Install Ghost
RUN \
  cd /tmp && \
  wget https://ghost.org/zip/ghost-latest.zip && \
  unzip ghost-latest.zip -d /ghost && \
  rm -f ghost-latest.zip
```

## Conclusion

It is easy and quick, isn't it? :)