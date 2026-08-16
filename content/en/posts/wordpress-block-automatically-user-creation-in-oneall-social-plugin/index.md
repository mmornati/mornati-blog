---
title: 'Wordpress: Block automatically user creation in OneAll Social Plugin'
date: '2012-07-10T22:00:00+00:00'
slug: wordpress-block-automatically-user-creation-in-oneall-social-plugin
---



Today I tested the <a href="http://blog.mornati.net/2012/07/11/oneall-social-plugin-for-wordpress/">OneAll social plugin</a>. The only think I noticed that I don't like too much (at least on my personal blog) is that there is no way to lock the automatic user registration. That means a user can, with a social account, create a user for my blog, and, even if he has no right to accomplished operations on the blog... I don't want it!! :D

So I made a little fix in a plugin file, waiting for the official "fix" to this.
Edit <strong>communication.php</strong> file in <strong>/wp-content/plugins/oa-social-login/includes</strong> folder. And change the line <strong>172</strong> (before there is a comment <em>New user</em>) with this:
<pre><code>  if (!is_numeric ($user_id) &amp;&amp; get_option('users_can_register'))</code></pre>
That means we just check the wordpress main option that allow the user creation. So if you normally allow registration for your site nothing change, but, as by default for wordpress, registrations is locked, plugin will follow this setting!

Hope this could help someone! ;)
