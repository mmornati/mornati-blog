---
title: Samsung CloudAgent disk usage
categories:
- mobile-gadgets
date: '2013-12-10T23:00:00+00:00'
slug: samsung-cloudagent-disk-usage
tags:
  - samsung
  - cloudagent
  - storage
  - dropbox
  - cache
  - android-tips
description: How to reclaim disk space on your Samsung phone by disabling the CloudAgent local cache for Dropbox camera uploads.
---

If you have a Samsung phone and you don't understand where you are losing most of your storage space, check the CloudAgent application.

The CloudAgent app is the one behind the Cloud menu inside the Settings menu.

[![Screenshot_NormarAppImage](/images/samsung-cloudagent-disk-usage/00-Screenshot_NormarAppImage_xwdsoj.png)](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391640978/Screenshot_NormarAppImage_xwdsoj.png)

If you link your Dropbox account to your phone and use it to automatically upload photos and videos, the cloud settings are, by default, configured to make a local backup of all camera upload images and videos. This means after a while your cache will take up a lot of space on your phone (in the `cloudagent/cache/root/` folder).

You can check and disable this setting by going to **Settings > Cloud**, then selecting **Pictures** and **Videos** to check if the cache is enabled and to disable it. When you disable it, all locally cached files are automatically deleted (Dropbox uploaded photos and locally taken photos are not affected).