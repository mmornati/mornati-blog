---
title: 'Migrate from Wordpress to Ghost: How-To'
categories:
- web-dev-blogging
date: '2014-02-07T23:00:00+00:00'
slug: migrate-from-wordpress-to-ghost-how-to
tags:
  - wordpress
  - ghost
  - migration
  - disqus
  - cloudinary
description: "A step-by-step guide to migrating your blog from WordPress to Ghost, covering comments migration with Disqus and image migration with Cloudinary."
---

As I said in my [previous post](/2014/02/08/completed-blog-migration-from-wordpress-to-ghost/), I recently decided to migrate my blog to something new and different.
Even if [Ghost](https://ghost.org) is still at the beginning of the dev, it already has all necessary basic functionalities for a blog platform.

I want to share with you a Step-By-Step guide for migration (supposing you have already installed the Ghost platform).

First of all, we need to prepare the migration:

* Ghost does not actually have an integrated comment system. You should use an external service.
* Ghost allows you to integrate images in your posts, but it doesn't really have an image library. Migrate this way could be really long...

## Comments
To manage comments a good service actually is [Disqus](http://disqus.com), and you can import all your wordpress comments automatically.
You have two different ways to do this:

* Install the [Disqus plugin](http://wordpress.org/plugins/disqus-comment-system/) on your blog, configure it with your disqus account information, and click on the export button. It seems a good system, but I tested it 3 times and only exported me 3 comments to disqus and I didn't understand why.
* The second method (the one I finally used) consists into the export of the whole wordpress database using the provided admin function: Tools -> Export

![Export Data](/images/migrate-from-wordpress-to-ghost-how-to/00-jr6rbkhc2olh5mybbr4f.png)

And import then this file to Disqus to have all your comments migrated:

![Disqus import](/images/migrate-from-wordpress-to-ghost-how-to/01-jjjvmlwtpr0bbw8kgfvz.png)

## Images
For images you have many differents alternatives to manage a media library: Google Picasa, Flickr, directly on your WebServer, FTP, ...
The real problem behind this migration is that you have to edit all your posts to put the new correct address for any image... and it could be a huge work!!
The service I chose, that is the one suggested by Ghost too, is [Cloudinary](http://cloudinary.com). The reason I chose it is you have a Wordpress [plugin](http://wordpress.org/plugins/cloudinary-image-management-and-manipulation-in-the-cloud-cdn/) you can use to export the whole media library, and the plugin also changes all the images links into posts!

## Migration
Now you are ready to migrate to your new blog. There's a [plugin](http://wordpress.org/plugins/ghost/) that export all posts in a format you can directly re-import into Ghost.
You just need to click on the Export button on the plugin page to download the export file to your PC.

![Ghost plugin](/images/migrate-from-wordpress-to-ghost-how-to/02-qijvs62xotvndxnffbxz.png)

Going to debug page of Ghost blog: http://yourblog.net/ghost/debug
you can use the previously exported file to recreate your blog here.

That's all.