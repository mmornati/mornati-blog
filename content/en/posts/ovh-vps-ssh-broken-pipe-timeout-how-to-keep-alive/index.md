---
title: 'OVH VPS SSH Broken Pipe (Timeout): How to keep alive'
date: '2014-01-11T23:00:00+00:00'
slug: ovh-vps-ssh-broken-pipe-timeout-how-to-keep-alive
categories:
  - System Administration
  - DevOps
tags:
  - ssh
  - ovh
  - vps
  - timeout
  - keepalive
  - linux
description: 'How to fix SSH broken pipe timeouts on OVH VPS by configuring ServerAliveInterval on the client side.'
---

## Introduction

I recently noticed that on my OVH VPS Server, SSH sessions hang up with *Write failed: Broken pipe* message after a while when I leave them unused for about 30 seconds. This means you will need to reconnect once again, keeping all SSH/bash processes alive (waste of memory!).

I think there's a proxy between me and my server that kills idle connections.

## Client Configuration

To solve this problem you can change settings on the client by adding the *ServerAliveInterval* property to your SSH config file.
If you are on Linux or Mac client, you need to edit *ssh_config*:

```bash
sudo vi /etc/ssh_config
```

Append to the end of file:

```bash
ServerAliveInterval 30
```

which means your client sends a *handshake* message every 30 seconds to the server.

If you have a windows client you can set the KeepAlive like in the following screenshot:

![keepAlive](/images/ovh-vps-ssh-broken-pipe-timeout-how-to-keep-alive/00-keepAlive_wrk4p3.jpg)

## Verification

Now all your ssh connection should be kept active even if you leave your computer for a coffe ;)