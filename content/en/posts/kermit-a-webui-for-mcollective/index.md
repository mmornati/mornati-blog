---
title: 'KermIT: a WebUI for MCollective'
date: '2012-01-28T23:00:00+00:00'
slug: kermit-a-webui-for-mcollective
categories:
  - DevOps
  - System Administration
  - Tools
tags:
  - kermit
  - mcollective
  - puppet
  - webui
  - server-management
  - provisioning
  - devops
description: 'KermIT provides a complete and customizable web interface for MCollective and Puppet, enabling visual server control and provisioning across your infrastructure.'
---

## Introduction

Server control and provisioning is becoming more important every day due to server farm growth. In reality today server farms are not too big, but using virtualization systems you can have many machines in a single server. So, the challenge was finding a way to create or recreate our virtual or physical machines and a simple way to control them.

To accomplish these operations you can find many products on the market, both open source and closed source. My preferred tools are: [Puppet](http://puppetlabs.com/), for the provisioning part, and [Mcollective](http://docs.puppetlabs.com/mcollective/) for the control part. What I didn't love was relying solely on the CLI (I love CLI tools, but it's difficult to sell products to our customers without anything cool to show. That's the reason why Apple does a lot of money today: the same thing as others, but with a cool interface ;))... anyway, for this reason we started thinking about an interface to help us use mcollective (and behind it, Puppet too), and the implementation we propose is: **[KermIT](http://kermit.fr/)**. A complete and customizable web interface to control and provision your servers.

![](/images/kermit-a-webui-for-mcollective/00-Screenshot-3_pdiznj.png)

## Why KermIT?

Kermit currently offers many functionalities and we're adding every day something new. The current version allows you to discover your mcollective "clients" (machines you can control), on any machine, it discovers installed agents with all actions (the things you can execute on that machine) and presents all these operations on the web interface with, if needed, a form to request parameters for the execution.

For example, if you want to execute a "service httpd start" operation, in kermit you just select the target server (or you can execute the commands on ALL servers at the same time), select the service agent and start action, and the interface will display a window asking you the service name. Nothing to configure, except mcollective with the proper certificates (you can find all instructions on Kermit [documentation](http://www.kermit.fr/documentation/) or directly on mcollective documentation for the client configuration).

## Features

We also developed platforms to control and customize service execution. For example JBoss or PostgreSQL platforms allow you to execute a deploy operation, with autofilled fields using the target server information (you don't have to fill up all fields by hand, but Kermit queries the target server, for example, the list of available jboss instances).

There's also a complete ACL system within the web interface for application security. You can protect any server, agent and operations using a single username or a group name, so you can restrict critical operations to administrators only (i.e. a developer can deploy a new war in jboss but can't execute any other operation, and can only operate on development machines).

And many other things...

## Getting Started

<http://www.youtube.com/watch?v=WMZodfLfzBw&list=PLE6AD5E02BB4B773D&index=4&feature=plpp_video>

You can access other videos on my [YouTube page](http://www.youtube.com/playlist?list=PLE6AD5E02BB4B773D).

We're currently updating and refactoring kermit after complete testing on a hundred-server farm... so stay tuned for any update (like the kermit website ;)). Naturally you can install, use and test it using provided RPM repositories (for EL5 at the moment but soon for EL6 too) or, if you prefer, using [sources](https://github.com/kermitfr/kermit-webui).

## Conclusion

Any comment is welcome. :)