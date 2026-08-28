---
title: New Official update for the Cloudinary Ghost Storage plugin
categories:
- web-dev-blogging
date: '2017-09-16T22:00:00+00:00'
slug: new-official-update-for-the-cloudinary-ghost-storage-plugin
tags:
  - ghost
  - cloudinary
  - storage
  - plugin
  - npm
description: A long-overdue update for the Cloudinary Ghost Storage plugin including ownership changes, a new npm package, and several important fixes.
---

I took the time to update and fix some things for the Cloudinary Ghost Storage plugin, but let me explain everything in order.

## Plugin Ownership

## [@sethbrasile](https://github.com/sethbrasile): where is the plugin creator?
No idea. I tried to reach him several times (and in several ways) in recent months without success. Because the first version of the plugin was waiting for some pull requests to be fully compliant with Ghost 1.X.

I checked with the Ghost community if we could switch the link to the "official" plugin... and if [@sethbrasile](https://github.com/sethbrasile) comes back, we can restore the original link.
So, right now, the link to the plugin you can find on the [Ghost Official Page](https://docs.ghost.org/v1/docs/using-a-custom-storage-module) points to the [fork hosted on my github space](https://github.com/mmornati/ghost-cloudinary-store). And this version is **updated** and **fixed**!!

![Schermata-2017-09-17-alle-18.32.59.png](/images/new-official-update-for-the-cloudinary-ghost-storage-plugin/00-Schermata-2017-09-17-alle-18.32.59.png)

## Installation

## How can I install this version of the plugin?
This is the tricky part: since I couldn't get in touch with [@sethbrasile](https://github.com/sethbrasile) I couldn't get access to the NPM library to deliver the new version.
So I decided, for the moment, to change the name of the npm lib. You can find the new version [here](https://www.npmjs.com/package/cloudinary-store); and naturally install it via npm:

```bash
npm install cloudinary-store
```

On the repository you can find all the instructions to install it on your blog.

## What's New

## What are the news?
* The **exists** method to check if an image is already on cloudinary is now working correctly (the API we were using was not the correct one)
* There is a new configuration section to manage the file names. ![Schermata-2017-09-17-alle-18.43.06.png](/images/new-official-update-for-the-cloudinary-ghost-storage-plugin/01-Schermata-2017-09-17-alle-18.43.06.png)
You can check the available parameters directly on the Cloudinary API documentation: [https://cloudinary.com/documentation/image_upload_api_reference#upload](https://cloudinary.com/documentation/image_upload_api_reference#upload)
* During the upload we use the original filename and not the browser random one
* The file name management helps prevent duplicated images on your Cloudinary space. You can personalize this part with the Cloudinary API parameter (random name by cloudinary, base name + random part, only the original name, override or not in case of duplicated, ...)

You can reach me directly or via a GitHub issue if you have any kind of problem with the plugin.