---
title: 'KermIT: Dynamic Groups for Resources'
date: '2012-07-24T22:00:00+00:00'
slug: kermit-dynamic-groups-for-resources
categories:
  - KermIT
  - DevOps
  - Infrastructure
tags:
  - kermit
  - mcollective
  - dynamic-groups
  - server-management
  - devops
description: Learn how KermIT's Dynamic Groups feature automatically adds servers to groups based on rules, eliminating manual admin work.
---

## What Are Dynamic Groups?

A new interesting feature we are currently coding in the KermIT web application is **Dynamic Groups**. You can define a rule to group servers (and later, all kinds of resources), and they will be automatically added to this group if they match the rule. In this way, any new server added (or removed) from the KermIT network will appear (or disappear) in the correct group without any manual interaction for the admin user.

## How It Works

[video src="http://www.mornati.net/video_kermit/video/KermIT%20-%20Dynamic%20Groups.mp4" width="100%"]

In the video you can see how to create dynamic groups and how servers are added to a group with a simple refresh. As I said, this function is still in development and you can currently create dynamic groups based on facts.

## What's Next

Stay tuned for news about this cool feature! :D