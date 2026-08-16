---
title: Create Git repository on shared host
date: '2011-09-14T22:00:00+00:00'
slug: create-git-repository-on-shared-host
---



After the <a href="http://blog.mornati.net/2011/08/29/host-personale/">installation</a> of git on my <a href="http://www.bluehost.com">bluehost</a> account I tried to figure out a good way to create and access to my git repository. Even if I thought the Apache bridge was the best way to access to git files, I found that on bluehost, the best and fastest way is directly using the ssh protocol.
So here explained the method I choose to create and use a private git repository on my shared account.

First of all, to simplify the repository creation process I added to <em>.bashrc</em> file a new function:
<pre><code> newgit()
{
   if [ -z $1 ]; then
       echo "usage: $FUNCNAME project-name.git"
   else
       gitdir="/home2/mornatin/repositories/$1"
       mkdir $gitdir
       pushd $gitdir
       git --bare init
       git --bare update-server-info
       cp hooks/post-update.sample hooks/post-update
       chmod a+x hooks/post-update
       touch git-daemon-export-ok
       popd
   fi
}</code></pre>
The operations to execute every time (and done automatically by the previous function) are:
<ul>
	<li>create the project folder</li>
	<li>initialize a git bare repository</li>
	<li>update-server-info to update your git config file</li>
	<li>enable the default post-update hook</li>
	<li>create a file to enable the export of the bare repository</li>
</ul>
Now to create your repository you can simply run on the server:
<pre><code> newgit test.git</code></pre>
and a test.git repository is created in your default location (defined in the bashrc function).
To test it you can simply try to clone repository on your "development" machine:
<pre><code> mmornati-macbook:~ mmornati$ git clone ssh://mornatin@mornati.net/~/repositories/test.git</code></pre>
Errors? If the response is no.... DONE! :)

The only things to remember is that the first commit on your project (test.git in this example), requires the specification of branch you want to work with, so you need to run commands like the following:
<pre><code> touch README
git add .
git commit -m "Init repo"
git push -u origin master</code></pre>
The important thing is just the line with push. After this first commit/push you can work normally using <em>git pull</em> and <em>git push</em> and all your files will be sent on <em>master</em> branch of your repository.
