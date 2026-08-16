---
title: New Official update for the Cloudinary Ghost Storage plugin
date: '2017-09-16T22:00:00+00:00'
slug: new-official-update-for-the-cloudinary-ghost-storage-plugin
---



I took time to update and fix some little things I had in mind for the Cloudinary Ghost Storage plugin, but I just to tell you everything in the right order.

####[@sethbrasile](https://github.com/sethbrasile): where is the plugin creator?
No idea. I tried to reach him several times (and in several ways) in these latests months without success. Because the first version of the plugin was waiting for some pull requests to be fully compliant with Ghost 1.X.

I then check with the Ghost community if we could switch the link to the "official" plugin... and if someday [@sethbrasile](https://github.com/sethbrasile) will come back we can put it back.
So, right now, the link to the plugin you can find on the [Ghost Official Page](https://docs.ghost.org/v1/docs/using-a-custom-storage-module) is bringing to the [fork hosted on my github space](https://github.com/mmornati/ghost-cloudinary-store). And this version is **updated** and **fixed**!!

![Schermata-2017-09-17-alle-18.32.59.png](/images/new-official-update-for-the-cloudinary-ghost-storage-plugin/00-Schermata-2017-09-17-alle-18.32.59.png.png)

#### How can I install this version of the plugin?
This is the tricky part: as I wasn't able to get in touch with [@sethbrasile](https://github.com/sethbrasile) I cannot get access to the NPM library to deliver the new version.
So I decided, for the moment, to change the name of the npm lib. You can find the new version [here](https://www.npmjs.com/package/cloudinary-store); and naturally install it via npm:
<pre class="language-bash command-line" data-user="mmornati" data-host="macosx"><code class="language-bash">npm install cloudinary-store</code></pre>

On the repository you can find all the instructions to install it on your blog.

#### What are the news?
* The **exists** method to check if an image is already on cloudinary is now working correctly (the API we were using was not the correct one)
* There is a new configuration section to manage the file names. ![Schermata-2017-09-17-alle-18.43.06.png](/images/new-official-update-for-the-cloudinary-ghost-storage-plugin/01-Schermata-2017-09-17-alle-18.43.06.png.png)
You can check the available parameters directly on the Cloudinary API documentation: [https://cloudinary.com/documentation/image_upload_api_reference#upload](https://cloudinary.com/documentation/image_upload_api_reference#upload)
* During the upload we use the original filename and not the browser random one
* The manage of the file name allow to prevent duplicated images on your Cloudinary space. You can personalize this part with the Cloudinary API parameter (random name by cloudinary, base name + random part, only the original name, override or not in case of duplicated, ...)

You can get back to me, directly of with a github issue, if you have any ind of problem with the plugin.
