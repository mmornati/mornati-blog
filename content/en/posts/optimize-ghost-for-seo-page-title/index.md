---
title: Optimize Ghost for SEO - Page Title
categories:
- web-dev-blogging
date: '2014-02-08T23:00:00+00:00'
slug: optimize-ghost-for-seo-page-title
tags:
  - ghost
  - seo
  - page-title
  - nodejs
  - blogging
description: 'How to optimize page titles in Ghost for better SEO by adding the blog name suffix, with two approaches: theme customization and core modification.'
---

The Ghost blogging platform doesn't currently have plugins (and maybe will always be that way).
Something I was missing after migration is the SEO optimization for any blog post... so I started making it by myself.

## Overview

First step: change page title to respect SEO "rules". The title of any post page should also have the blog name suffix:

```html
<title>Post title | Blog name<title>
```

To accomplish this in Ghost you can proceed into two different ways:

## Method 1: Theme Only

Personalise the *default.hbs* file in your theme

```html
<title>{{meta_title}} | {{@blog.title}}</title>
```

## Method 2: Core Modification

Change the Ghost core to provide the *meta_title* variable with the correct value, allowing you to change theme without losing SEO customisations. Edit the file **core/server/helpers/index.js** around the line 395.
Here's the complete code of my meta_title function:

```javascript
coreHelpers.meta_title = function (options) {
    /*jslint unparam:true*/
    var title = "",
        blog;

    if (_.isString(this.relativeUrl)) {
        if (!this.relativeUrl || this.relativeUrl === '/' || this.relativeUrl === '' || this.relativeUrl.match(/\/page/)) {
            blog = config.theme();
            title = blog.title;
        } else if (this.post) {
            **blog = config.theme();
            title = this.post.title + ' | ' + blog.title;**
        }
    }

    return filters.doFilter('meta_title', title).then(function (title) {
        title = title || "";
        return new hbs.handlebars.SafeString(title.trim());
    });
};
```

In bold the code I changed.

Restart your NodeJS server and enjoy your first SEO optimization.