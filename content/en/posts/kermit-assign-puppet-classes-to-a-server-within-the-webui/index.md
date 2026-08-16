---
title: 'KermIT: assign puppet classes to a server within the webui'
date: '2012-07-19T22:00:00+00:00'
slug: kermit-assign-puppet-classes-to-a-server-within-the-webui
---



These days we are working, on the <a href="http://www.kermit.fr">KermIT</a>'s master branch, adding some new interersting features (and refactoring lot of our code).
Here a video that shows how you can provision the servers, changing the assigned <a href="http://puppetlabs.com/puppet/puppet-open-source/">puppet</a> classes directly within the KermIT web interface.

[video src="http://www.mornati.net/video_kermit/video/Kermit-Edit_Puppet_Classes_with_Hiera_backend.mp4" width="100%"]

What you should have is the puppet master configured to use <a href="http://projects.puppetlabs.com/projects/hiera/">Hiera</a>, that allow you to define the puppet site.pp, not in a statically way, but importing definitions using Hiera. Here my dev file:
<pre><code> node default {
    include sudo
}

node centos6 inherits default {
    hiera_include('centos6.mmornati.lan', '')
}

node puppet inherits default {
    hiera_include($hostame, '')
}</code></pre>
What will happen when puppet read this file, is a call to hiera to get information using the machine hostname (or the static string 'centos6.mmornati.lan').

To increase the scalability of our infrastructure, KermIT and Hiera store the puppet configuration into a <a href="http://redis.io/">Redis</a> database. So, when you change server information using KermIT, all stuffs are simply stored into Redis db, and, next time puppet agent is fired, it will read the latest configuration from database.

At the moment we don't have a KermIT development RPM, but you can test all these features getting the code directly from <a href="https://github.com/thinkfr/kermit-webui">github</a> (branch master).
On KermIT website <a href="http://www.kermit.fr/kermit/blog/2012/07/01/puppet-hiera/">an article</a> explains, step by step, how you can install hiera on your system.
<p style="text-align: center;"><a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641230/kermit-hiera_nrksjg.png" target="_blank">![](/images/kermit-assign-puppet-classes-to-a-server-within-the-webui/00-kermit-hiera_nrksjg.png)</a></p>
