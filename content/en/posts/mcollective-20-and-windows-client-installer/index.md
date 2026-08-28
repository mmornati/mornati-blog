---
title: MCollective 2.0 and Windows Client Installer
categories:
- devops
date: '2012-05-18T22:00:00+00:00'
slug: mcollective-20-and-windows-client-installer
tags: [mcollective, puppet, windows, kermit, devops, automation]
description: How MCollective 2.0 unlocks Windows server control and the custom installer built with Rake and Inno Setup for offline environments.
---

## Overview

With MCollective version [2.0](http://puppetlabs.com/misc/download-options/) we now have support for controlling Windows Servers. The only thing you must be aware of is that you need to update all your infrastructure to mco 2.0 because you cannot control servers that have a different version installed.

## The Windows Installer

This allows us to complete the support of our KermIT project, which is (we have many enhancements in development ;)) a web interface to control mcollective infrastructure by adding Windows support. The "problem" was that no Windows package was available during our tests and, knowing that usual production environment servers could not have access to internet, this could cause installation problems.

For this reason we developed and created an installer for Windows Server using [Rake](http://rake.rubyforge.org/) (make for ruby project) and [Inno Setup](http://www.jrsoftware.org/isinfo.php) to create the final .exe setup file.

## Downloads

If you want to test it you can find the installer (and source for the Rake file) [here](http://repos.mornati.net/mcollective/).

Enjoy and report us any problem.