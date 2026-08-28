---
title: Install personal Jabber Server on CentOS using ejabberd
categories:
- linux-sysadmin
date: '2014-03-30T22:00:00+00:00'
slug: install-personal-jabber-server-on-centos-using-ejabberd
tags:
  - ejabberd
  - jabber
  - xmpp
  - centos
  - chat
  - server
description: How to install and configure an ejabberd XMPP/Jabber server on CentOS, create users, and configure DNS SRV records.
---

Here's a quick guide to install a jabber server on CentOS machine.

## eJabberd Installation

On your server type, as root user:

```bash
yum -y install ejabberd
```

Create an admin user for your server using the cli interface:

```bash
ejabberdctl register admin localhost yourpassword
```

Grant the created user admin privileges. To do this modify the **/etc/ejabberd/ejabberd.cfg**

```bash
%% Admin user
{acl, admin, {user, "admin", "localhost"}}.

%% Hostname
{hosts, ["localhost"]}.
```

Now you can start the server:

```bash
/etc/init.d/ejabberd start
```

## Create a user

You can perform all configuration via the web interface, but I prefer the command line. So, to add a new user via CLI, you can execute:

```bash
ejabberdctl register username yourdomain userpassword
```

replacing *username*, *userpassword*, and *yourdomain* with what you prefer.

By now you can connect using a jabber client to the configured server.
By default the configured server port is **5222**.

## Configure DNS

If you want to expose your server using an host/dns name, you should configure your dns server adding:

Doc DNS:

```bash
_xmpp-client._tcp.example.net. TTL IN SRV priority weight port target
_xmpp-server._tcp.example.net. TTL IN SRV priority weight port target
_xmpp-client._tcp.example.net. 86400 IN SRV 5 0 5222 example.net. 
_xmpp-server._tcp.example.net. 86400 IN SRV 5 0 5269 example.net.
```

Now you have an xmpp-server identified for your **example.net** domain.

Via: [Source](https://www.digitalocean.com/community/articles/how-to-install-ejabberd-xmpp-server-on-ubuntu), [DNS](http://wiki.xmpp.org/web/SRV_Records)