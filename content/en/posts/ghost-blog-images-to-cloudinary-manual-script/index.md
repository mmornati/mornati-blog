---
title: 'Ghost blog images to Cloudinary: Manual Script'
date: '2014-10-10T22:00:00+00:00'
slug: ghost-blog-images-to-cloudinary-manual-script
categories: [Blogging, Web Development, DevOps]
---



![Ghost blog](/images/ghost-blog-images-to-cloudinary-manual-script/00-rj6uue3adzm4ukh2cpsi.png)

I recently discovered this project on the net: https://github.com/jeffdonthemic/ghost-cli

It allows you to make some "offline" operation on your Ghostblog. "Offline" just because there is not a real interaction with your blog; to use the script you need to export all your blog posts into a file which will be used for all operations.

I then decided to make some changes to allow an easy way to upload ghost local images to cloudinary and I also updated the script to use the latest Ghost 0.5.2 version.
You can find the forked version on my github: https://github.com/mmornati/ghost-cli

The two commands I added are:

* checkcloud: to get the list of blog posts containings local images
* cloudid <post>: to upload all post's images to cloudinary and update the (offline) post.

Before you begin you need to dump all blog posts (with your latest extracted file):

<pre class="language-bash command-line" data-user="marco" data-host="server"><code class="language-bash">bin/ghost dump</code></pre>

You can now check all posts with "local" images:
<pre class="language-bash command-line" data-user="marco" data-host="server" data-output="2-4"><code class="language-bash">bin/ghost checkcloud
C:/Users/mmornati/Documents/projects/ghost-cli/pages/288.md: 1 
C:/Users/mmornati/Documents/projects/ghost-cli/pages/289.md: 3</code></pre>


Then, for any post, you can replace all local images with a cloudinary version, which will be automatic uploaded:
<pre class="language-bash command-line" data-user="root" data-host="server" data-output="2-15"><code class="language-bash">bin/ghost cloudit 289.md
Uploading to Cloudinary: http://blog.mornati.net//content/images/2014/Feb/visited_pages_per_day.png
Uploading to Cloudinary: http://blog.mornati.net//content/images/2014/Feb/load_kb.png
Uploading to Cloudinary: http://blog.mornati.net//content/images/2014/Feb/load_time_ms.png
Cloudinary URL: https://res.cloudinary.com/blog-mornati-net/image/upload/v1413061309/gu1njp3kqzhagvyqdcao.png
Replacing...
C:\Users\mmornati\Documents\projects\ghost-cli\pages\289.md
Cloudinary URL: https://res.cloudinary.com/blog-mornati-net/image/upload/v1413061309/tex7fjgv2cajxqmuwuhm.png
Replacing...
C:\Users\mmornati\Documents\projects\ghost-cli\pages\289.md
Cloudinary URL: https://res.cloudinary.com/blog-mornati-net/image/upload/v1413061309/lovod5mxdhqtkyvgri47.png
Replacing...
C:\Users\mmornati\Documents\projects\ghost-cli\pages\289.md
</code></pre>

And now you just need to update your blog post with the new content: all your images will be on cloudinary.

In the next version I'll make the update automatic. 
The target is: new post, upload all images to cloadinary, update post into the blog.
I prefer not to modify Ghost code (it will be easy to add the automatic upload to cloadinary) because they already have this feature in the dev roadmap and because I'd like to be able to update Ghost easily when a new version is released.

