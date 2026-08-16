---
title: 'Migrate from Wordpress to Ghost: How-To'
date: '2014-02-07T23:00:00+00:00'
slug: migrate-from-wordpress-to-ghost-how-to
---



As I said in my [previous post](http://blog.mornati.net/2014/02/08/completed-blog-migration-from-wordpress-to-ghost/), I recently decided to migrate my blog to something new and different.
Even if [Gost](https://ghost.org) is still at the beginning of the dev, it already has all necessary basic functionalities for a blog platform.

I want to share with you a Step-By-Step guide for migration (supposing you have already installed the Ghost platform).

First of all, we need to prepare the migration:

* Ghost does not actually have an integrated comment system. You should use an external service.
* Ghost allow you to integrate images in your posts, but it does not exactly has an image library. Migrate this way could be really long...

#### Comments
To manage comments a good service actually is [Disqus](http://disqus.com), and you can import all your wordpress comments automatically.
You have two differents way to do this:

* Install the [Disqus plugin](http://wordpress.org/plugins/disqus-comment-system/) on your blog, configure it with your disqus account information, and click on the export button. It seems a good system, but I tested it 3 times and only exported me 3 comments to disqus and I did'nt understand why.
* The second method (the one I finally used) consists into the export of the whole wordpress database using the provided admin function: Tools -> Export

![Export Data](/images/migrate-from-wordpress-to-ghost-how-to/00-jr6rbkhc2olh5mybbr4f.png)

And import then this file to Disqus to have all your comments migrated:

![Disqus import](/images/migrate-from-wordpress-to-ghost-how-to/01-jjjvmlwtpr0bbw8kgfvz.png)

#### Images
For images you have many differents alternatives to manage a media library: Google Picasa, Flickr, directly on your WebServer, FTP, ...
The real problem behind this migration is that you have to edit all your posts to put the new correct address for any image... and it could be a huge work!!
The service I choose, that is the one suggested by Ghost too, is [Cloudinary](http://cloudinary.com). The reason is you have a Wordpress [plugin](http://wordpress.org/plugins/cloudinary-image-management-and-manipulation-in-the-cloud-cdn/) you can use to export the whole media library, and the plugin also changes all the images links into posts!

#### Migrate
Now you are ready to migrate to your new blog. There is a [plugin](http://wordpress.org/plugins/ghost/) that export all posts in a format you can directly re-import into Ghost.
You just need to click on the Export button on the plugin page to download the export file to your PC.

![Ghost plugin](/images/migrate-from-wordpress-to-ghost-how-to/02-qijvs62xotvndxnffbxz.png)

Going to debug page of Ghost blog: http://yourblog.net/ghost/debug
you can use the previously exported file to recreate your blog here.

That's all.
