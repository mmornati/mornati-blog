---
title: "OneAll Social Plugin for WordPress"
categories:
- web-dev-blogging
date: '2012-07-10T22:00:00+00:00'
slug: oneall-social-plugin-for-wordpress
tags:
  - wordpress
  - openid
  - social-login
  - oneall
  - plugin
description: "Review of the OneAll Social Login plugin for WordPress — installation, configuration, and social network integration for single sign-on."
---

Looking for a good OpenID plugin for WordPress for my company website (eh yes, we are using WordPress also for our business website ;)) I found this [OneAll Social](http://wordpress.org/extend/plugins/oa-social-login/) plugin. And, even if you need to register with an external website that will manage all login requests for you (connections are encrypted, so don't worry for your security, or not? :S) I definitely love it! You can find and test it also on this website.

## Installation

After the plugin installation (I think you know how to install plugins in WordPress?) you have a *Social Login* menu on the left bar in the admin area. Here you can find a link to get access to the external website and create an account there:

[![](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641244/Screenshot-from-2012-07-11-170309_j9us9d.png)](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641244/Screenshot-from-2012-07-11-170309_j9us9d.png)

Then you will get some keys to paste into the API Settings box on this page and (almost) all is done. In the settings area you can decide where you want to show the social buttons, which social networks you want to use, and some other settings always about authentication.

## Social Network Configuration

But I said *almost* ready to use, because in fact, each social network needs its own configuration to allow an external application to use it. But don't worry — on the OneAll website you just have to select the social network you want to configure and you have a step-by-step guide with a complete video that brings you to the correct configuration.

[![](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641240/Screenshot-from-2012-07-11-170413_qcm09i.png)](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641240/Screenshot-from-2012-07-11-170413_qcm09i.png)

[![](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641239/Screenshot-from-2012-07-11-170436_mtdbfx.png)](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641239/Screenshot-from-2012-07-11-170436_mtdbfx.png)

## Testing

If all worked well — but I don't know how you could make errors with the detailed documentation provided by OneAll Social — you can log out from your WordPress website, and on the login page you should see buttons for all the selected social networks.

[![](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641334/Screenshot-from-2012-07-11-170048_cqnotr.png)](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641334/Screenshot-from-2012-07-11-170048_cqnotr.png)

## User Recognition

An important thing to note is that users on WordPress are recognized using their email address (or better, associations from the OpenID response and username and email fields). This means that maybe, when you test a login, you will be logged in as a new user on your blog. But if you used the same email address everywhere, you can use whatever you want and you will be logged in as the right user :)

Enjoy your new login :)