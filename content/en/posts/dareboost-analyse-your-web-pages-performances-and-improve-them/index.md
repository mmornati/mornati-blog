---
title: 'DareBoost: Analyse your web pages performances and improve them'
date: '2017-07-27T22:00:00+00:00'
slug: dareboost-analyse-your-web-pages-performances-and-improve-them
categories:
  - Web Development
  - Performance
tags:
  - dareboost
  - performance
  - ghost
  - cloudinary
  - optimization
description: 'Using DareBoost to analyse and improve web page performance during a Ghost blog migration to version 1.0.2.'
---

With a few little steps you can really improve the performance of your web page.

## Overview

I recently migrated to the latest version of the [Ghost Blog](https://ghost.org) platform (v1.0.2 at the time of writing) and, during the migration, due to the huge effort of completely rewriting my blog theme, I decided to start from [Casper](https://github.com/TryGhost/Casper): the Ghost default theme, adding back some basic functionalities I need (such as Google Analytics, Disqus, and the CookieBar plugin). You can check the version I made here: [https://github.com/mmornati/Casper](https://github.com/mmornati/Casper)

During this migration I also decided to check my page web performance using [DareBoost](https://www.dareboost.com).

## Initial Results

On the first test I did locally (using [ngrok](https://ngrok.com/)) the result was not great:
![kepxbbm6sxghooj059at](/images/dareboost-analyse-your-web-pages-performances-and-improve-them/00-kepxbbm6sxghooj059at.png)

* The page size was really impressive (more than **2 MB**)
* Some resources were missing
* A couple of images were loaded using **HTTP** instead of **HTTPS**
* Some security problems requiring HTTP header injection

In this first test, considering it was done locally on my laptop, I did not pay much attention to the page **full load** time because it could be related to my connection.

## Improvements

I then followed the list of improvements proposed by DareBoost in the generated report, and after a few iterations I got a pretty good final result.
![jrar8cqudtk8n0z6apvt](/images/dareboost-analyse-your-web-pages-performances-and-improve-them/01-jrar8cqudtk8n0z6apvt.png)

## Final Results

The home page size decreased to **947 KB**.
![l5dt9suulfpyf8wkimhe](/images/dareboost-analyse-your-web-pages-performances-and-improve-them/02-l5dt9suulfpyf8wkimhe.png)

Most of the work was done on Cloudinary, the service I use to store my blog images.
I will talk about the improvements to the plugin in another article, but thanks to [@aphe](https://github.com/aphe) who made a pull request to use the Cloudinary Image Manipulation API. Now, when uploading images, the version used on the webpage is a compressed version of the original (based on the configuration you set in the plugin). Stay tuned if you are interested in this part... but if you can not wait, the information is available on [this](https://github.com/mmornati/ghost-cloudinary-store/tree/update_ghost_1.0.0) GitHub repository.
