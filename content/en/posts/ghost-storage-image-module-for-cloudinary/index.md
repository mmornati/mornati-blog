---
title: 'Ghost: storage image module for Cloudinary'
date: '2016-08-31T22:00:00+00:00'
slug: ghost-storage-image-module-for-cloudinary
---



Since the version **0.6.x** of [Ghost](https://ghost.org/) blog platform it is possible to customize, adding a module, the management of post images.
By default all the images are uploaded into the server **content** folder, this means, for example, that you need (lot of) space on your server and you have to backup the content folder to be sure to be able to restore everything.

With the **storage** feature, you can add a module to manage images on an external service, such as Cloudinary, Amazon S3, Google Drive, ...

![Config.js](/images/ghost-storage-image-module-for-cloudinary/00-r6qyz86q3mhfmaw7qnmo.png)

The "problem" is that Ghost is going faster adding every day new features, improving the code and coming out with new versions. All this modules, maintained by "non ghost devs", are often outdated and sometimes broken if your version of ghost is newer than the one used to create the module.

As I'm using Cloudinary since a couple of years now I added to my blog the Cloudinary storage module... and **updated it for the 0.10.x version of Ghost**. You can download this version from my [GitHub repo](https://github.com/mmornati/ghost-cloudinary-store). Original Author: *Seth Brasile* 

![Cloudinary](/images/ghost-storage-image-module-for-cloudinary/01-raknhb3xn4od8aakm2fx.jpg)

The module is really simple: all the images you upload to your blog will be sent to Cloudinary and the result url is stored into the article.

![CloudinaryUpload](/images/ghost-storage-image-module-for-cloudinary/02-v5avpzrwvrnnmvndphod.png)

<pre class="language-javascript line-numbers"><code class="language-javascript">var Promise = require('bluebird');
var cloudinary = require('cloudinary');
var util = require('util');

baseStore = require('../../../core/server/storage/base');

// TODO: Add support for private_cdn
// TODO: Add support for secure_distribution
// TODO: Add support for cname
// TODO: Add support for cdn_subdomain
// https://cloudinary.com/documentation/node_additional_topics#configuration_options

function CloudinaryStore(config) {
    baseStore.call(this);
    this.config = config || {};
    cloudinary.config(config);
}

util.inherits(CloudinaryStore, baseStore);

CloudinaryStore.prototype.save = function(image) {
  var secure = this.config.secure || false;

  return new Promise(function(resolve) {
    cloudinary.uploader.upload(image.path, function(result) {
      resolve(secure ? result.secure_url : result.url);
    });
  });
};

CloudinaryStore.prototype.delete = function(image) {

  return new Promise(function(resolve) {
    cloudinary.uploader.destroy('zombie', function(result) {
      resolve(result)
    });
  });
};

CloudinaryStore.prototype.exists = function(filename) {
  return new Promise(function(resolve) {
    if (cloudinary.image(filename, { })) {
        resolve(true);
    } else {
        resolve(false);
    }
  });

}

CloudinaryStore.prototype.serve = function() {
  return function (req, res, next) {
    next();
  };
};

module.exports = CloudinaryStore;
</code></pre>

If you want to test it and if you find anything which is not working or anything we can improve/add, spot out a message and I'll work on it :)
