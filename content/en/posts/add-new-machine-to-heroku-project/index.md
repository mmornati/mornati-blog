---
title: Add new machine to Heroku project
categories:
- devops
date: '2012-05-10T22:00:00+00:00'
slug: add-new-machine-to-heroku-project
tags:
  - heroku
  - git
  - ssh
  - deployment
  - workflow
description: How to add a new machine's SSH key to your Heroku account so you can clone and manage Heroku repositories from multiple computers.
---

## Overview

If, like me, you use many computers, you need to reconfigure things to allow all your machines. Today I was stuck on a Heroku repository clone (SSH key problem on my work laptop).

## Adding Your SSH Key

To add a new machine to your Heroku account (after Heroku package installation, using gem for example), just use:

```bash
mmornati@notebook projects$ heroku keys:add

Found existing public key: /home/mmornati/.ssh/id_rsa.pub
Uploading SSH public key /home/mmornati/.ssh/id_rsa.pub
```

## Verification

If everything worked well, you should have access to your repository:

```bash
mmornati@notebook projects$ git clone git@heroku.com:mmornatibot.git
Cloning into 'mmornatibot'...
remote: Counting objects: 226, done.
remote: Compressing objects: 100% (219/219), done.
remote: Total 226 (delta 41), reused 141 (delta 2)
Receiving objects: 100% (226/226), 95.28 KiB | 50 KiB/s, done.
Resolving deltas: 100% (41/41), done.
```
