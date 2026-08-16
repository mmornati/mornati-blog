---
title: 'Chrome on iOS 6: After Tests'
date: '2012-10-22T22:00:00+00:00'
slug: chrome-on-ios-6-after-tests
categories:
  - Chrome
  - iOS
  - Browsers
tags:
  - chrome
  - ios6
  - safari
  - mobile-browser
  - browser-comparison
description: After a comment on my previous post revealed Chrome on iOS isn't real Chrome, I ran tests to compare rendering, JavaScript, and the value of cross-device bookmark sync.
---

After the [comment](http://blog.mornati.net/2012/10/20/google-chrome-for-ios/comment-page-1/#comment-3699) I received on my [previous](http://blog.mornati.net/2012/10/20/google-chrome-for-ios/) post — Chrome on iOS is not really Chrome — I tried to investigate and run some tests on the device.

![Screenshot of browser detection](http://blog.mornati.net/wp-content/uploads/2012/10/20121022-214552.jpg)

## Browser Identification

The browser is identified, using different JavaScript libraries you can find on the net, as **Safari unknown version** and on the [site](http://detectmobilebrowsers.com/mobile) reported in the photo as **Mozilla/5.0** with a Safari WebKit. So, as the user comment reported, it's not really *THE* Chrome.

But (I like to put a "but" somewhere ;))... what of the real Chrome are we losing?

- **The render engine**: on iOS devices Chrome uses the Safari one. So any HTML page is rendered in the "Safari style" and not with the Chrome one. But Safari is not Internet Explorer, so for me it's ok ;), and it is as fast as Chrome to load pages (on the same Mac).
- **The JavaScript engine**: I think the Chrome one is the fastest we can find on the market. So it could be considered a big difference from the original Chrome. But, once again, is this really important on your mobile device? And is the Safari engine really that bad for you?

## So What's the Benefit?

For me the great feature of having a "fake" Chrome on my iOS device is I can have all my bookmarks and preferences automatically imported. So I can check something in the evening and bookmark it to have it ready on my desktop the next work day. I was using some other tools, but the simple bookmark is the fastest one.