---
title: 'Django: automatically import sub-modules urls'
date: '2012-11-06T23:00:00+00:00'
slug: django-automatically-import-sub-modules-urls
---



I recently refactor the <a href="http://www.kermit.fr">KermIT</a> project to get a completely dynamic project and have the ability to add plugins.

Here I'm going to show you how to check for "installed plugins" and automatically configure the urls.
<a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641141/plugins_v3emgj.png">![](/images/django-automatically-import-sub-modules-urls/00-plugins_v3emgj.png)</a>First of all you have to configure a Django app, named for example <strong>plugins</strong> and correctly link it up to your Django project. So add it to INSTALLED_APPS in the settings.py file and add it to global urls.py
<pre><code> urlpatterns = patterns('',

    (r'^plugins/', include('webui.plugins.urls')),

)</code></pre>
Then in the <strong>plugins</strong> app create a urls.py module like this one:
<pre><code> from django.conf.urls.defaults import patterns, include
import logging
from webui.plugins import utils

logger = logging.getLogger(__name__)

urlpatterns = patterns('',
)
installed_plugins = utils.installed_plugins_list()

for plugin in installed_plugins:
    try:
        urlpatterns += patterns('',
             (r"^%s/" % plugin, include("webui.plugins.%s.urls" % plugin)),
        )
    except:
        logger.debug ("Plugin %s does not provides urls" % plugin)</code></pre>
Where my utils.py is the following:
<pre><code> import os

def installed_plugins_list():
    path = os.path.dirname(__file__)
    installed_plugins = []
    for module in os.listdir(path):
        if os.path.isdir(path + '/' + module) == True:
            installed_plugins.append(module)
    return installed_plugins</code></pre>
How does it work?

Well, the utils module will list all packages inside the current one (the plugins in my example), then the urls.py module will just loop on this list and it try to include the submodule urls. If it works (no exception raised) all urls are imported using the plugin name (i.e. /plugins/puppet/*); if you have an exception (no urls configured for that plugin) you just have a log message.

Really easy, and I can assure it works! :)
