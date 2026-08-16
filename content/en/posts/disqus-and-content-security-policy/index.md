---
title: Disqus and Content Security Policy
date: '2017-07-27T22:00:00+00:00'
slug: disqus-and-content-security-policy
categories:
  - Web Development
  - Security
tags:
  - disqus
  - csp
  - security
  - http-headers
  - blogging
description: Here's how to configure Content Security Policy while keeping Disqus working properly.
---

## Overview

Here is how to configure Content Security Policy while keeping Disqus working.

To have a secured website, as [proposed by DareBoost](https://blog.mornati.net/dareboost/) when you run an analysis, you need to add some HTTP headers with security policies.
One of these headers is the [Content Security Policy](https://content-security-policy.com/) (CSP), which allows you to block scripts, styles, media, etc. coming from an unknown website.
You decide whether the browser should execute a script (or anything else) from external sources or inline code.

If you are using Disqus on your website, you need to allow access to all Disqus resources by configuring these URLs:
* https://disqus.com
* https://*.disqus.com
* https://*.disquscdn.com

I suggest using wildcards (the `*` character) because the CDN can change based on your location and because you have activated Disqus with the subdomain associated with your account.

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' www.google-analytics.com https://code.jquery.com https://disqus.com https://*.disqus.com https://*.disquscdn.com https://*.cloudinary.com http://www.gravatar.com;">
```

## CSP Configuration

Even with this configuration you will still see an error in your browser:
![q29zhsjlb0oor3r5js7q](/images/disqus-and-content-security-policy/00-q29zhsjlb0oor3r5js7q.png)

This happens because the Disqus script is trying to run a JavaScript **eval** on a string from an unknown source. And, as you may know, it is dangerous to execute an eval on a variable coming from outside your script!

## The Eval Issue

I searched online and I found this one year old discussion:

[https://disqus.com/home/discussion/channel-discussdisqus/csp_unsafe_eval/](https://disqus.com/home/discussion/channel-discussdisqus/csp_unsafe_eval/)

It seems the problem was already identified and they planned to remove the associated code (but after a year it is still there).
In any case it seems related to a (maybe) useless feature: *This file is for link affiliation on your page*.

![ozzod6iwn357bf08g4ar](/images/disqus-and-content-security-policy/01-ozzod6iwn357bf08g4ar.png)

## Conclusion

So for now I think we can keep the website secured and ignore the error raised by Disqus, which is working properly even with this error.