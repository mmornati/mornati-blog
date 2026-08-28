---
title: Mcollective 2.3.2 Windows Installer
categories:
- devops
date: '2013-10-24T22:00:00+00:00'
slug: mcollective-232-windows-installer
tags:
  - mcollective
  - windows
  - puppet
  - installer
  - innosetup
description: Packaged MCollective 2.3.2 as a Windows installer using InnoSetup for silent deployment via Puppet or other automation tools.
---

## Overview

I recently got back to working on [MCollective](http://docs.puppetlabs.com/mcollective/) for Windows for one of our customers and, after searching on Google, I discovered that [Puppet Labs](http://puppetlabs.com) apparently decided to release the MCollective package for Windows only with Puppet Enterprise. Really strange things...

Anyway, MCollective is an open-source project. I needed a package for Windows to script installation in an easy way, so I created the installation package. I love opensource :D

In the [past](http://blog.mornati.net/2012/05/19/mcollective-2-0-and-windows-client-installer/) I've already created a package in the past for the 2.0.0 version, so I just retrieved the old script and repackaged the latest sources.

## Download

You can find Windows packages here:
[http://repos.mornati.net/mcollective/](http://repos.mornati.net/mcollective/)

## Installation

You can install MCollective using the graphical wizard, but if you want to script it using, for example, Puppet you need to skip the wizard and proceed with a silent installation.

```bash
mcollective_2_3_2_Setup.exe /VERYSILENT /LOG="mco_install.log" /DIR="C:\mcollective"
```

On InnoSetup (the tool I used to package MCollective) you can find a list of all available CLI parameters: [http://www.jrsoftware.org/ishelp/index.php?topic=setupcmdline](http://www.jrsoftware.org/ishelp/index.php?topic=setupcmdline). Naturally, to get it working, your server should have a Ruby version installed and have the binary folder in the PATH environment variable.

## Configuration

After you configure the *server.cfg* file with AMQP server and security information, you can start the service. You can find it in the Windows Services tool and the service name is "The Marionette Collective".

Your Windows machine is now in your MCollective network!