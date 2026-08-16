---
title: What Docker is for?
tags:
- docker
- software-engineering
- docker-images
categories:
- DevOps
- Docker
description: "What Docker really does for developers and production: solving environment setup, eliminating 'it works on my laptop', and the mindset shift from VMs to immutable containers."
date: '2021-12-30T20:16:02.358000+00:00'
slug: what-docker-is-for
---

Even in 2021, not all IT people seem to understand the power behind containers. Docker is one implementation, but certainly the most well-known and widely used on developer laptops today.

It's better than several years ago, but even this year, in discussions about both development and production usage, I realized not everyone understands why it became the base of everything today.

Let me revisit some examples used in my [previous blog](https://blog.mornati.net/sre-or-why-it-practices-changed).

### Developer's laptop benefits
A long time ago, in a galaxy far away (ok it was only in Italy, but is still far away), I used to spend the first X days configuring my laptop every time I switched projects. Because the application server was not always the same, the same went for the database, ant or maven, the JDK 1.3 or 1.4 (yeah, I already told you I'm old? 😅).
So the first step was: I'm a sysadmin and I need to understand how to install all the requirements before even starting to code anything.

> ah you are on Linux? Our documentation is only for Windows, why are you on Linux?

And sometimes the project was even not working the first day because I'd installed some part of the setup incorrectly. The `DEV-LONGSTART.md` was always too long and the first week was usually lost in shitty stuff.

Docker creates an abstraction layer over all of this. Today I don't even know how I should install most of the tools I'm using: PostgreSQL, Redis cluster, RabbitMQ, ... I remove the SysAdmin part and finally have a `DEV-QUICKSTART.md` file which explains that you need to install the docker-engine, maven/gradle, and which version of JDK you should use (thanks to [sdkman](https://sdkman.io/) this part can always being ignored). Then you run a `docker-compose` and you are ready to local test everything you developed. The database contains some base data, the cache is configured, etc.
You move from `X days` to `X hours` (or even less).

It's not the only benefit, but in my opinion, it's the most interesting one.

### Production benefits

> It was working on my laptop

How many times have we used, as developers, this sentence? And it was always the truth, but why? Because the production environment was never like the developer laptop: Windows vs Linux, Sun JDK vs IBM/Oracle JDK, File System case insensitive vs case sensitive, ... "I saw things you wouldn't believe".

Docker — or it's better to talk about `containerd` today because many production systems no longer use the Docker Engine — helps fix all these problems.
The test a developer runs on their laptop — with Docker, if you remember the previous point — uses the same binary that will be used in production. What is running and tested on the CI is the same thing deployed in production. And if it was running somewhere else, the only thing that could be wrong is the "production system configuration"... it should be easy to debug.

But we need to move away from the mental model we've always used. The **Docker container is NOT a virtual machine**. Don't compare it to VMware, you should never ask "how do I persist things inside a container?".
The **immutability** of Docker images helps us because if it runs once, restarting the container (or better, recreating it from the base image) should work again... and if it is not the case it is surely due to the environment and not the image. So, even if we can change container content, install new packages, etc., that's not how we should work! We should change our mental model and create our image "ready to go" from the start. If I need new packages I create a new image for my application.

I don't want to get into the technical details of how Docker works and why I'm saying all these things. There are a ton of articles (even on my blog), documentations, books, ...
It's important to start using something knowing **how it works**, reading things, understanding, ... and then check if this new technology **is fixing any of your problems**, if it is not maybe you don't need to use it. Moving from tech A to tech B just because everyone is using it, or because you want to be marketable, without changing anything else, won't really help you: you won't become skilled and you won't fix any problems — you might even add new ones.