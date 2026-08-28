---
title: 'KermIT: Assign Puppet Classes to a Server Within the WebUI'
categories:
- devops
date: '2012-07-19T22:00:00+00:00'
slug: kermit-assign-puppet-classes-to-a-server-within-the-webui
tags:
  - kermit
  - puppet
  - hiera
  - provisioning
  - redis
  - devops
description: 'How to provision servers by assigning Puppet classes directly within the KermIT web interface, using Hiera and Redis for scalable configuration management.'
---

These days we are working, on the [KermIT](http://www.kermit.fr) master branch, adding some new interesting features (and refactoring a lot of our code).

## The Feature

Here is a video that shows how you can provision the servers, changing the assigned [puppet](http://puppetlabs.com/puppet/puppet-open-source/) classes directly within the KermIT web interface.

[video src="http://www.mornati.net/video_kermit/video/Kermit-Edit_Puppet_Classes_with_Hiera_backend.mp4" width="100%"]

## Prerequisites

What you should have is a puppet master configured to use [Hiera](http://projects.puppetlabs.com/projects/hiera/), which allows you to define the puppet `site.pp` not in a static way, but importing definitions using Hiera. Here is my dev file:

```puppet
node default {
    include sudo
}

node centos6 inherits default {
    hiera_include('centos6.mmornati.lan', '')
}

node puppet inherits default {
    hiera_include($hostame, '')
}
```

What will happen when puppet reads this file, is a call to Hiera to get information using the machine's hostname (or the static string `centos6.mmornati.lan`).

## Storage

To increase the scalability of our infrastructure, KermIT and Hiera store the puppet configuration into a [Redis](http://redis.io/) database. So, when you change server information from KermIT, everything is simply stored into Redis, and the next time the puppet agent is fired, it will read the latest configuration from the database.

## Try It Out

At the moment we don't have a KermIT development RPM, but you can test all these features by getting the code directly from [github](https://github.com/thinkfr/kermit-webui) (branch master). On the KermIT website, [an article](http://www.kermit.fr/kermit/blog/2012/07/01/puppet-hiera/) explains step by step how you can install Hiera on your system.

[![KermIT Hiera](/images/kermit-assign-puppet-classes-to-a-server-within-the-webui/00-kermit-hiera_nrksjg.png)](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641230/kermit-hiera_nrksjg.png)