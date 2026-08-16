---
title: 'GateOne, an HTML5 SSH shell on your browser'
date: '2013-11-12T23:00:00+00:00'
slug: gateone-an-html5-ssh-shell-on-your-browser
categories:
  - Development
  - DevOps
tags:
  - gateone
  - ssh
  - html5
  - centos
  - websocket
  - tornado
description: How to install and configure GateOne, an HTML5 SSH shell that runs in your browser, on CentOS 6 for accessing SSH through HTTP/HTTPS-only networks.
---

Sometimes I work on networks which only allow HTTP and HTTPS connections. That means I can't connect to any external server using SSH or FTP.

A simple way to work around this limitation is to install a VPN service reachable via standard HTTPS port — for example an OpenVPN server on port 443.

Today I want to show you the "workaround 2.0": an SSH shell written in HTML5 that you can use within any modern browser: [GateOne](https://github.com/liftoff/GateOne).

Below are instructions to install it on CentOS (tested on CentOS 6 but should work on CentOS 5 too).

## Install Tornado Web Server

Install [Tornado](http://www.tornadoweb.org/en/stable/) (the web server used by GateOne):

```bash
rpm -Uvh https://github.com/downloads/liftoff/GateOne/tornado-2.4-1.noarch.rpm
```

## Install GateOne

Now install GateOne using the provided RPM package:

```bash
rpm -Uvh https://github.com/downloads/liftoff/GateOne/gateone-1.1-1.noarch.rpm
```

## First Run

Even though the RPM includes an init.d script, the first time you need to start it manually using the Python file. This allows GateOne to create all necessary files and SSL certificates:

```bash
python /opt/gateone/gateone.py
[W 131113 22:19:49 terminal:181] Could not import the Python Imaging Library (PIL) so images will not be displayed in the terminal
[W 131113 22:19:49 gateone:2893] dtach command not found.  dtach support has been disabled.
[I 131113 22:19:49 gateone:2917] Connections to this server will be allowed from the following origins: 'http://localhost https://localhost http://127.0.0.1 https://127.0.0.1'
[I 131113 22:19:49 gateone:2305] Using google authentication
[I 131113 22:19:49 gateone:2404] Loaded plugins: bookmarks, convenience, example, help, logging, logging_plugin, mobile, notice, playback, ssh
[I 131113 22:19:49 gateone:3054] Listening on https://*:443/
[I 131113 22:19:49 gate one:3060] Process running with pid 11674
```

## Configuration

Now that all files are generated, stop GateOne with CTRL+C and configure it before starting the server. On the CentOS RPM package, the configuration file is located at `/opt/gateone/server.conf`. The important property to configure is `origins`:

```
origins = "http://localhost;https://localhost;http://127.0.0.1;https://127.0.0.1;https://ssh.yourserver.com"
```

Specify all allowed virtual hosts that can connect to your SSH shell. With the setting above, a user cannot connect using the server's public IP address (`https://ip_addr`) but can connect using the server hostname or locally. See the GateOne documentation for a description of all properties.

## Start the Service

Once configured, start the GateOne service:

```bash
/etc/init.d/gateone start
chkconfig gateone on
```

If you use a recent version of Firefox or Chrome you should be able to see the SSH prompt. Safari does not seem to work (due to an HTTP Sockets problem) and Internet Explorer... well, it is Internet Explorer. Microsoft is still implementing CSS2 — you should be able to use GateOne in 10 years. :)

## Features

There are some interesting features in GateOne. For example, all SSH sessions are logged and recorded. You can use it to create documentation screencasts like [this one](http://www.mornati.net/GateOneDemo.html).