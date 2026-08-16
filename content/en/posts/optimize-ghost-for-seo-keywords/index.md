---
title: Optimize Ghost for SEO - Keywords
date: '2014-02-08T23:00:00+00:00'
slug: optimize-ghost-for-seo-keywords
---



The usage of meta *keywords* is today maybe not too useful: Google says that robots does not take care to this meta anymore.
But, in the SEO rules, and in the SEO Wordpress plugin too, this meta information is always set.

I decided to add it on my blog. This update requires a Ghost core change.

Edit the **core/server/helpers/index.js** file and add the following functions (it does not exist), after the *meta_description* one:

<pre class="language-javascript"><code class="language-javascript">coreHelpers.meta_keywords = function (options) {
    /*jslint unparam:true*/
    var keywords,
        blog;

    if (_.isString(this.relativeUrl)) {
        if (!this.relativeUrl || this.relativeUrl === '/' || this.relativeUrl === '' || this.relativeUrl.match(/\/page/)) {
            blog = config.theme();
            keywords = '';
        } else {
            keywords="";
            if (this.post && this.post.tags) {
                this.post.tags.forEach(function(value) {
                    if (!keywords=="") {
                        keywords+=",";
                    }
                    keywords+=value.name;
                });
            }
        }
    }
    return filters.doFilter('meta_keywords', keywords).then(function (keywords) {
        keywords = keywords || "";
        return new hbs.handlebars.SafeString(keywords.trim());
    });
};</code></pre>

This function, when you are on a post page, will check for post tags and create the meta keywords with them.

In the same file, at the end into the **registerHelpers** function, add the following line where you want (for example after the *meta_title* line):

<pre class="language-javascript"><code class="language-javascript">registerAsyncThemeHelper('meta_keywords', coreHelpers.meta_keywords);</code></pre>

Save the file.

You just need to use now your keywords meta into your theme.
TO do this, open the **default.hbs** file, and, after the *meta_description* line, add:

<pre class="language-html"><code class="language-html">&lt;meta name="keywords" content="{{meta_keywords}}" /&gt;</code></pre>

Save, restart the NodeJS server and enjoy your new SEO functionality.

![SEO Keywords](/images/optimize-ghost-for-seo-keywords/00-vp9xarfud0azpsmfxrel.png)
