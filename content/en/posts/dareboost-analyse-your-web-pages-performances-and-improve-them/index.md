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
description: 'Using DareBoost to audit and improve web page performance during a Ghost blog migration to version 1.0.2.'
---

With just a few steps you can really improve the performances of your web page.

## Overview

I recently migrated to the latest version of [Ghost Blog](https://ghost.org) platform (v1.0.2 at the moment I'm writing this article) and, during the migration, due to a huge amount of work to completely rewrite my blog theme, I decided to start by modifying [Casper](https://github.com/TryGhost/Casper): the Ghost default theme adding back some basic functionalities I need (such as Google Analytics, Disqus and the CookieBar plugin). You can check the version I made here: [https://github.com/mmornati/Casper](https://github.com/mmornati/Casper)

Performing this migration I also decided to check my web page's performance using [DareBoost](https://www.dareboost.com).

## Initial Results

On the first test I did locally (using [ngrok](https://ngrok.com/)) the result was not so cool:
![kepxbbm6sxghooj059at](/images/dareboost-analyse-your-web-pages-performances-and-improve-them/00-kepxbbm6sxghooj059at.png)

* The page size was quite large (more than **2 Mb**)
* Some resources were missing
* A couple of images were loaded using the **http** instead of **https**
* Some security problems requiring HTTP Headers injections

In this first test, considering it was done locally on my laptop, I didn't take care a lot to the page **fully load** time because it could be related to my connection.

## Improvements

I then just followed the list of improvements proposed by DareBoost in the generated report and with few iterations I got a pretty good final result.
![jrar8cqudtk8n0z6apvt](/images/dareboost-analyse-your-web-pages-performances-and-improve-them/01-jrar8cqudtk8n0z6apvt.png)

The home page size decrease to **947Kb**.
![l5dt9suulfpyf8wkimhe](/images/dareboost-analyse-your-web-pages-performances-and-improve-them/02-l5dt9suulfpyf8wkimhe.png)

## Final Results

Most of the work was done on Cloudinary, which is the service I'm using to store my blog images.
I will talk about the improvements to the plugin in another article, but, thanks to [@aphe](https://github.com/aphe) which made a pullrequest to use the Cloudinary Image Manipulation API, now when we are uploading images the version used on the webpage is a compressed version of the original (based on the configuration you put on the plugin). Stay tuned if you are interested on this part... but if you can't wait, the information are on [this](https://github.com/mmornati/ghost-cloudinary-store/tree/update_ghost_1.0.0) github repository
