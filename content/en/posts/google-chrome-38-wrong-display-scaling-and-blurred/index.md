---
title: 'Google Chrome 38: Wrong Display Scaling and blurred'
categories:
- programming
date: '2014-10-09T22:00:00+00:00'
slug: google-chrome-38-wrong-display-scaling-and-blurred
tags:
  - chrome
  - google-chrome
  - display
  - scaling
  - blur
  - windows
description: >-
  After updating to Chrome 38, I found websites were wrongly scaled and text was
  blurred. Testing across other browsers revealed the issue and the fix.
---

## Overview

Today I discovered my Google Chrome was automatically updated from version 37 to version 38... don't ask me automatically, I don't think I decided for this.

Anyway, after this update all websites I visited was wrong scaled with a strange blurred effect on some part of the text.

For example, in GMail, all was bigger than usual, like when you select 125% scaling and when I try to write into the Hangout window, the text was blurred and impossible to read.

I spent half of my day just trying to fix this problem and, because I've already have it in a previous version I was using in Linux, I already know it was a Chrome problem.

## The Problem

To check the real problem I just checked on a page I've created some years ago ([http://myip.mornati.net](http://myip.mornati.net)), to get the screen resolution from the browser.

NOTE: On my laptop I've a **1920x1080** screen.

**Chrome 38**
![Chrome 38](/images/google-chrome-38-wrong-display-scaling-and-blurred/00-ncm85ccqkcmlkjbdoonv.png)

What??? **1536x864** But... WHY??

## Browser Comparison

I then tested some other browsers (some = the browsers you can imagine)

**IE (yes IE too)**
![IE](/images/google-chrome-38-wrong-display-scaling-and-blurred/01-i3dotiibefapkwq33is9.png)

Ok... it's a strange number... but it's IE. Anyway, the screen resolution is more similar to the normal one I had before.

**Firefox**
![Firefox](/images/google-chrome-38-wrong-display-scaling-and-blurred/02-wyeii4mgvfexx6k3yov4.png)

Firefox has the same problem as Chrome... but, at least, all is correctly displayed at this resolution. You don't have blur effect which makes it impossible to use it.

## The Fix

I made a test to the Chrome's beta version; just because I didn't want to go back to the previous one if I cannot control the automatic update.

**Chrome 39**
![Chrome39](/images/google-chrome-38-wrong-display-scaling-and-blurred/03-a8qbyuhonoq2plfoppcm.png)

Yes... that is good and it is the value I had with the previous version.

I spent a day to get back to a correct screen resolution in my browser and to prevent blur effect to be able to use it!!

Why anytime Google releases a new Chrome's stable version there's something that wasn't correctly tested?

If you want to fix this problem... just change the chrome version without lose your time.