---
title: What Docker is for?
tags:
- docker
- software-engineering
- docker-images
date: '2021-12-30T20:16:02.358000+00:00'
slug: what-docker-is-for
---



Yes, it seems that even in 2021 not all IT people understood the power behind containers. Docker is one of the implementations but for sure the most known and used today on the developer laptops.

It is going better than several years ago, but even this year both for developer and production usage, I took part in discussions on the net that made me think that not all the IT guys understood why it became the base of everything today.

I could get back some examples used in my  [previous blog](https://blog.mornati.net/sre-or-why-it-practices-changed).

### Developer's laptop benefits
A long time ago, in a galaxy far away (ok it was only in Italy,  but is still far away), I used to spend the first X days configuring my laptop all the time I was changing projects. Because the application server was not always the same, the same for the database, ant or maven, the JDK 1.3 or 1.4 (yeah, I already said you I'm old? 😅).
So the first step was: I'm a sysadmin and I need to understand how to install all the requirements before even starting to code anything.

> ah you are on Linux? Our documentation is only for Windows, why are you on Linux?

And sometimes the project was even not working the first day because I wrongly installed some part of the whole setup. The `DEV-LONGSTART.md` was always too long and the first week was usually lost in shitty stuff.

Docker makes an abstraction layer to all these things. Today I don't even know how I should install most of the tools I'm using: PostgreSQL, Redis cluster, RabbitMQ, ... I remove the SysAdmin part and I finally have a `DEV-QUICKSTART.md` file which is explaining you have to install the docker-engine, maven/gradle, and which version of JDK you should use (thanks to  [sdkman](https://sdkman.io/) this part can always being ignored). Then you run a `docker-compose` and you are ready to local test everything you developed. The database contains some base data, the cache is configured, etc.
You move from `X days` to `X hours` (or even less).

Is not the only benefit but is, in my opinion, the most interesting one. 

### Production benefits

> It was working on my laptop

How many times have we used, as developers, this sentence? And it was always the truth, but why? Because the production environment was neven like the developer laptop: Windows vs Linux, Sun JDK vs IBM/Oracle JDK, File System case insensitive vs case sensitive, ... "I saw things you wouldn't believe".

Docker, or it's better to talk about `containerd` today because many production systems are not using the `docker-engine` anymore, is helping to fix all these problems.
The test made by a developer on its laptop, with Docker if you remember the previous point, is testing with the same "binary" that will be then used to run the application in production. What is running and tested on the CI is the same thing deployed in production. And if it was running somewhere else, the only thing that could be wrong is the "production system configuration"... it should be easy to debug.

But we should get out from *mind model* with always used. The **Docker container is NOT a virtual machine**. You have not compared it to VMWare, you should never do "things inside a container, how I will persist them?".
The **immutability** of Docker images is helping us because if it runs at least once if I restart the container (or better recreate it from the base image) it should work again... and if it is not the case it is surely due to the environment and not the image. So, even if we can change the Docker container content, install new packages, etc. is not in this way that we should work! We should change our *mind model* and directly create our image "ready to go". If I need new packages I create a new image for my application.


I don't want to start technically describing how docker is working and why I'm saying all these things. There are a ton of articles (even on my blog), documentations, books, ... 
It is important to start using something knowing **how it is working**, reading things, understanding, ... and then check if this new technology **is fixing any of your problems**, if it is not maybe you don't need to use it. Moving only from tech A to tech B because "anybody is using it now" or "I want to be skilled on it to be market aligned", but changing nothing else will not really help you: you won't be skilled and you fix any problems (you are maybe adding some others instead).
