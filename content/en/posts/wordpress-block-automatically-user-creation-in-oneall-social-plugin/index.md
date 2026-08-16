---
title: 'WordPress: Block Automatic User Creation in OneAll Social Plugin'
date: '2012-07-10T22:00:00+00:00'
slug: wordpress-block-automatically-user-creation-in-oneall-social-plugin
tags:
- wordpress
- oneall
- social-login
- plugin
- security
description: 'How to disable automatic user registration in the OneAll social plugin for WordPress by adding a check for the users_can_register option.'
---

Today I tested the [OneAll social plugin](http://blog.mornati.net/2012/07/11/oneall-social-plugin-for-wordpress/). The only thing I noticed that I don't like too much (at least on my personal blog) is that there is no way to lock the automatic user registration. That means a user can, with a social account, create a user for my blog, and even if he has no right to accomplish operations on the blog... I don't want it!! :D

So I made a little fix in a plugin file, waiting for the official "fix" to this.

## The Fix

Edit **communication.php** file in **/wp-content/plugins/oa-social-login/includes** folder. Change the line **172** (just after the *New user* comment) with this:

```php
  if (!is_numeric ($user_id) && get_option('users_can_register'))
```

That means we just check the WordPress main option that allows user creation. So if you normally allow registration for your site nothing changes, but, as by default for WordPress, registrations are locked, the plugin will follow this setting!

Hope this could help someone! ;)