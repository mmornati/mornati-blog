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
  - content-security-policy
  - javascript
description: How to configure Content Security Policy to allow Disqus to work properly
---

## Overview

Here's how to configure the Content Security Policy and allowing Disqus to work properly.

To have a secured website, as it is [proposed by DareBoost](https://blog.mornati.net/dareboost/) if you make an analysis, you have to add some HTTP Headers with security policies.
One of these headers is the [Content Security Policy](https://content-security-policy.com/) (CSP) which allows you to block scripts, styles, medias, ... coming from an unknown website.
It tells the browser if it should execute a script (or anything else) or not both for an external or internal/inline.

## CSP Configuration

If you are using Disqus on your website, to allow the access to all the Disqus resources you need to configure these URLs:
* https://disqus.com
* https://*.disqus.com
* https://*.disquscdn.com

I suggest the wildcards (the '*' character) because the CDN can change based on where you located and accessing the website and then because you have activated Disqus with the sub-domain associated to your account.

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' www.google-analytics.com https://code.jquery.com https://disqus.com https://*.disqus.com https://*.disquscdn.com https://*.cloudinary.com http://www.gravatar.com;">
```

Even with this configuration you should have an error on your browser:
![q29zhsjlb0oor3r5js7q](/images/disqus-and-content-security-policy/00-q29zhsjlb0oor3r5js7q.png)

## The Eval Issue

This happens because the Disqus script is trying to make a JavaScript **eval** of a string from an unknown source. And, as you may know, it's really dangerous to execute an eval of a variable coming from outside your script!

I searched online and I found this one year old discussion

[https://disqus.com/home/discussion/channel-discussdisqus/csp_unsafe_eval/](https://disqus.com/home/discussion/channel-discussdisqus/csp_unsafe_eval/)

It seems the problem was already identified and they planned to remove the associated code (but after 1 year is still there).
In any case it seems related to a (maybe) useless feature: *This file is for link affiliation on your page*.

![ozzod6iwn357bf08g4ar](/images/disqus-and-content-security-policy/01-ozzod6iwn357bf08g4ar.png)

## Conclusion

So actually I think we can keep the website secured and ignore the error raised by Disqus, which is working properly even with this error.
