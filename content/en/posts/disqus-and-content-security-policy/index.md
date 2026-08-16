---
title: Disqus and Content Security Policy
date: '2017-07-27T22:00:00+00:00'
slug: disqus-and-content-security-policy
---



A little documentation allowing you to add the Content Security Policy and allowing Disqus to work properly.

To have a secured website, as it is [proposed by DareBoost](https://blog.mornati.net/dareboost/) if you make an analysis, you have to add some HTTP Headers with security policies.
One if this Header is the [Content Security Policy](https://content-security-policy.com/) (CSP) which allow you to block scripts, styles, medias, ... coming from an unknown website.
It is up to you to say to the reading browser if it should execute a script (or anything else) or not both for an external or internal/inline.

If you are using Disqus on your website, to allow the access to all the Disqus resources you have some url to configure here:
* https://disqus.com
* https://*.disqus.com
* https://*.disquscdn.com

I suggest the wildcards (the '*' character) because the CDN can change based on where you located and accessing the website and then because you have activated Disqus with the sub-domain associated to your account.
<pre class="language-html" data-output="2-74"><code class="language-html">&lt;meta http-equiv=&quot;Content-Security-Policy&quot; content=&quot;default-src 'self' 'unsafe-inline' www.google-analytics.com https://code.jquery.com https://disqus.com https://*.disqus.com https://*.disquscdn.com https://*.cloudinary.com http://www.gravatar.com;&quot;&gt;</code></pre>

Even with this configuration you should have an error on your browser:
![q29zhsjlb0oor3r5js7q](/images/disqus-and-content-security-policy/00-q29zhsjlb0oor3r5js7q.png)

This is raised out because the Disqus script is trying to make a javascript **eval** of a string retrieved from "do-not-where". And, as you may know, it is really dangerous to execute an eval of a variable coming from outside your script !

I make a little search on the NET and I found this one year old discussion

[https://disqus.com/home/discussion/channel-discussdisqus/csp_unsafe_eval/](https://disqus.com/home/discussion/channel-discussdisqus/csp_unsafe_eval/)

It seems the problem was already identified and they planned to removed the associated code (but after 1 year is still there).
In any case it seems related to a (maybe) useless feature: *This file is for link affiliation on your page*.

![ozzod6iwn357bf08g4ar](/images/disqus-and-content-security-policy/01-ozzod6iwn357bf08g4ar.png)

So actually I think we can keep the website secured and ignore the error raised by Disqus, which is working properly even with this error.
