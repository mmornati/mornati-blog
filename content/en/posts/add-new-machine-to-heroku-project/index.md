---
title: Add new machine to Heroku project
date: '2012-05-10T22:00:00+00:00'
slug: add-new-machine-to-heroku-project
---



If, like me, you used to work on many computers, you should reconfigure anything to allow all your machines. Today I was stucked on heroku repository clone (problem with ssh key on my work laptop).

To add new machine to your heroku account (after heroku package installation, using gem for example), you should just use
<pre><code> mmornati@notebook projects$ heroku keys:add

Found existing public key: /home/mmornati/.ssh/id_rsa.pub
Uploading SSH public key /home/mmornati/.ssh/id_rsa.pub</code></pre>
And, if everything worked well, you should have access to your repository:
<pre><code> mmornati@notebook projects$ git clone git@heroku.com:mmornatibot.git
Cloning into 'mmornatibot'...
remote: Counting objects: 226, done.
remote: Compressing objects: 100% (219/219), done.
remote: Total 226 (delta 41), reused 141 (delta 2)
Receiving objects: 100% (226/226), 95.28 KiB | 50 KiB/s, done.
Resolving deltas: 100% (41/41), done.</code></pre>
