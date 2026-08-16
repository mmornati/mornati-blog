---
title: Optimize Ghost for SEO - Page Title
date: '2014-02-08T23:00:00+00:00'
slug: optimize-ghost-for-seo-page-title
---



The Ghost blogging platform does not actually have plugins (and maybe will always be this way).
A thing I missing after migration is the SEO optimization for any blog post... so I stated making it by myself.

First step: change page title to respect SEO "rules". The title of any post page should also have the blog name suffix:

<pre class="language-html"><code class="language-html">&lt;title&gt;Post title | Blog name&lt;title&gt;
</code></pre>

To accomplish this in Ghost you can proceed into two different ways:

* Personalise the *default.hbs* file in your theme
<pre class="language-html"><code class="language-html">&lt;title&gt;{{meta_title}} | {{@blog.title}}&lt;/title&gt;</code></pre>

* Change the Ghost core to provides the *meta_title* variable with the correct value, allowing you to change theme without losing SEO customisations. Edit the file **core/server/helpers/index.js** around the line 395.
Following the complete code of my meta_title function:

<pre class="language-javascript"><code class="language-javascript">coreHelpers.meta_title = function (options) {
    /*jslint unparam:true*/
    var title = "",
        blog;

    if (_.isString(this.relativeUrl)) {
        if (!this.relativeUrl || this.relativeUrl === '/' || this.relativeUrl === '' || this.relativeUrl.match(/\/page/)) {
            blog = config.theme();
            title = blog.title;
        } else if (this.post) {
            <b>blog = config.theme();
            title = this.post.title + ' | ' + blog.title;</b>
        }
    }

    return filters.doFilter('meta_title', title).then(function (title) {
        title = title || "";
        return new hbs.handlebars.SafeString(title.trim());
    });
};
</code></pre>

In bold the code I changed.

Restart your NodeJS server and enjoy your first SEO optimization.
