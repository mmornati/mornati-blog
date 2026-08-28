---
title: 'KermIT WebUI: new version and the road to 2.0'
categories:
- devops
date: '2012-10-26T22:00:00+00:00'
slug: kermit-webui-new-version-and-the-road-to-20
tags:
  - kermit
  - mcollective
  - webui
  - selinux
  - dynamic-groups
  - devops
description: 'KermIT WebUI reaches a new stable milestone with automated SELinux configuration, DynamicGroups with compound filters, a refactored Admin Area, and more — paving the road to version 2.0.'
---

## Overview

Today we completed the first big development part of the [KermIT](http://www.kermit.fr) project and we can consider it "really stable" for production environments. It was stable even with all previous versions, which means it could already be used for production, but with this version we completed many useful things and automated many setup/installation processes.

## Changelog

Important changes in this release:

- script to automatically configure SeLinux rules for KermIT
- setup script for all post installation operations
- New version of RestMCO (2.0-5), more flexible using POST messages
- Completed dev of DynamicGroups with expressions. Expression is anything allowed by [mcollective compound filter](http://www.devco.net/archives/2012/06/23/mcollective-2-0-complex-discovery-statements.php)
- Complete refactor of Admin Area
- And more...

[video src="http://www.mornati.net/video_kermit/KermIT-AdminAreaRefactored.mp4" width="100%"]

[video src="http://www.mornati.net/video_kermit/KermIT-DynamicGroups.mp4" width="100%"]