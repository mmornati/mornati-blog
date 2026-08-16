---
title: Install Hubot as IRC channel bot
date: '2011-12-20T23:00:00+00:00'
slug: install-hubot-as-irc-channel-bot
---



Recently GitHub has released sources about two "internal" projects: <a href="https://github.com/github/hubot">hubot</a> and <a href="https://github.com/github/janky">janky</a>. So it's time to start using them (or just testing them to imagine a future usage).

After some tests and research I find a proper way to install hubot and use it as IRC bot, but I decide to report the complete procedure here because all the guides I found on the net was outdated or not complete (missing always some important step). The best one the guide me on the right way is the one you can find <a href="http://martinciu.com/2011/11/deploying-hubot-to-heroku-like-a-boss.html">here</a>, but I report the instructions also on this blog post.

First of all you need to install hubot dependencies on your "build" machine (for me a Fedora 16).
<strong></strong>

<strong>Node.js
</strong>The fast way to install node (or at least my preferred way to install stuffs) on your Fedora is the one described on this <a href="https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager">page</a>
<pre><code> sudo yum localinstall --nogpgcheck http://nodejs.tchol.org/repocfg/fedora/nodejs-stable-release.noarch.rpm
sudo yum install nodejs</code></pre>
and then the <strong>npm</strong> (node package manager)
<pre><code> sudo yum install npm</code></pre>
Has reported on this <a href="https://github.com/github/hubot/issues/102">Hubot ticket</a> could you have a problem installing npm that does not install the required coffe script. To do this, as reported, you should run:
<pre><code> npm install -g coffee-script</code></pre>
Thanks to <strong>Hardy</strong> for this fix!

<strong>Heroku
</strong>To make a first faster test on node.js apps the <a href="http://www.heroku.com/">Heroku</a> service is the best one. You can install on your machine the heroku command that hep you to interact with your account (naturally you need to create an account on heroku, free for a basic service like hubot).
<pre><code> gem install heroku</code></pre>
To accomplished this step you the required dependencies are: <strong>ruby</strong> and <strong>ruby gem </strong>(on fedora 16 packages are rubygems-1.8.10-1.fc16.noarch and ruby-1.8.7.352-1.fc16)

Now you are ready to start working on Hubot. Knowing we are real geeks we will work with the master version (directly from github latest sources :))
<pre><code> git clone git://github.com/github/hubot.git
cd hubot
npm install
bin/hubot --create ../kermitbot</code></pre>
With these commands you will download sources (git package is required on your machine), install all node required packages (defined in <strong>package.json</strong> file) and, with the first line, you will say that you want to create a hubot clone to put in ../kermitbot directory.
By now all things should be done in your "kermitbot" directory (we will work directly on our personalized hubot).

<strong>Install IRC dependency
</strong>The best way to test a bot (without creating other chat accounts or buying anything strange) is using an irc channel: easy to create, completely free, so... way not? :)
To do this, the next step is to add to our bot a dependency to node irc module.
<pre><code> vi package.json

#in the dependencies area of this file your should have
  "dependencies": {
    "hubot": "2.0.7",
    "hubot-scripts": "2.0.2",
    "optparse": "1.0.3",
    "hubot-irc": "0.0.6"
  }</code></pre>
The important line (the one you should add to your package file) is the <strong>hubot-irc </strong>with the version you want to use.

Now all should be ready for a first commit on heroku and the first test
<pre><code> git init .
git add .
git commit -m "My Hubot initial commit"</code></pre>
Then create a repository on your heroku account with
<pre><code> heroku create kermitbot --stack cedar</code></pre>
And push your bot to heroku
<pre><code> git push heroku master</code></pre>
<em>master</em> should be used for the first commit (to create the master branch on your git repository) and then you can push without specifying it.
After the commit you should see in your console the heroku log saying that your nodejs app is being configured and all necessary dependencies will be installed.

<strong>Configuring your Hubot
</strong>Now, always using heroku command to interact with your account, you can specify some variables that are required to configure your bot. In this case the variables are for irc modules saying the irc server and channel and your bot username:
<pre><code> heroku config:add HUBOT_IRC_NICK="kermitbot"

heroku config:add HUBOT_IRC_ROOMS="#kermit-webui"

heroku config:add HUBOT_IRC_SERVER="irc.freenode.net"</code></pre>
You app should be automatically started, but in case you can run a command to start it
<pre><code> heroku ps:scale app=1</code></pre>
You can check status for your app looking to the process or reading the app log
<pre><code> heroku logs
heroku ps</code></pre>
If all works well, accessing to your channel (#kermit-webui in this example) you should see your bot connected to your account.
<strong>NB </strong>if you select a really generic name for your bot (like hubot), maybe you see something different connected to your channel, like <em>hubot7<strong>, </strong></em>this because username on irc server must be unique, so it will change the hubot name until it can find a free one.

<strong>Configure startup option
</strong>To startup your hubot with the irc module enable you have to modify <strong>Procfile</strong> file <del>putting</del> replacing the <em>app</em> line with:
<pre><code> app: bin/hubot -a irc</code></pre>
After this mod you should push it to heroku to make it available

<strong>Testing your Hubot
</strong>Now you have installed your bot you can start interacting with it (if you follow this example without adding other modules you will have just some basic operation). To do this, in your channel you can write:
<pre><code>  hubot help
   tweet - Returns a link to a tweet about
   is a badass guitarist - assign a role to a user
   is not a badass guitarist - remove a role from a user
  animate me   - The same thing as `image me`, except adds a few
  convert me  to  - Convert expression to given units.
  help - Displays all of the help commands that Hubot knows about.
  help  - Displays all help commands that match .
  image me     - The Original. Queries Google Images for  and
  map me  - Returns a map view of the area returned by `query`.
  math me  - Calculate the given expression.
  mustache me  - Searches Google Images for the specified query and
  mustache me    - Adds a mustache to the specified URL.
  pug bomb N - get N pugs
  pug me - Receive a pug
  ship it - Display a motivation squirrel
  show storage - Display the contents that are persisted in redis</code></pre>
That will produce an help list with any available command. To execute command you can write (in main chat or with a direct message): <strong>hubot command parameters</strong> so, for example to show you a place on a google map you can make a query like
<pre><code> hubot map me redhat headquarter</code></pre>
That will show you the map url.

Easy, isn't it? :D

<strong>Problems
</strong>Just to point out a possible problem, if you have modules that required redis (key, value store) you should have a pay account on heroku and so you will have an error accessing redis in your log. To use it with basic modules and on irc you can ignore this error.

<strong>Change hubot name
</strong>Your hubot answer just when you call it by name, and by default the name is naturally <em>hubot</em>. You can change this name modifying <strong>Procfile</strong> with this info:
<pre><code> app: bin/hubot -a irc --name kermitbot --enable-slash</code></pre>
(@<strong>Deprecated</strong>: The <em>--enable-slash</em> property allow you to talk to your bot just using a / and not with the full name.)
As reported on the <a href="https://github.com/github/hubot/pull/148">Hubot trac</a>, the --enable-slash is deprecated in the latest version of hubot, you should replace it by <em>--alias</em>

&nbsp;
<pre><code> app: bin/hubot -a irc --name kermitbot --alias '/'</code></pre>
<pre><code> /mustache me kermit webui</code></pre>
