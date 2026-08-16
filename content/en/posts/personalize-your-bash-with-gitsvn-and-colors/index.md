---
title: Personalize your bash with GIT/SVN and colors
date: '2013-11-10T23:00:00+00:00'
slug: personalize-your-bash-with-gitsvn-and-colors
---



If you work everyday on a Linux shell and need to manage projects on GIT or SVN code control systems, could be useful to get informations about them directly on your bash.

You can easily do that with some changes into <strong>/etc/bashrc</strong> file of your Linux.
Go to the end of that file and add the followings lines:
<pre><code> <code>parse_git_branch() {
  git branch 2&gt; /dev/null | sed -e '/^[^*]/d' -e 's/* (.*)/(git::1)/'
}
parse_svn_branch() {
  parse_svn_url | sed -e 's#^'"$(parse_svn_repository_root)"'##g' | awk -F / '{print "(svn::"$1 "/" $2 ")"}'
}
parse_svn_url() {
  svn info 2&gt;/dev/null | grep -e '^URL*' | sed -e 's#^URL: *(.*)#1#g '
}
parse_svn_repository_root() {
  svn info 2&gt;/dev/null | grep -e '^Repository Root:*' | sed -e 's#^Repository Root: *(.*)#1/#g '
}

# vim:ts=4:sw=4
# Colors in Terminal
if [ $USER = root ]; then
        PS1='[33[1;31m][u@h W]$[33[0m] '
else
        #PS1='[33[01;32m]u@h[33[00m] [33[01;34m]W[33[00m][33[1;32m]$[33[m] '
        PS1="[33[01;32m]u@h[33[00m] [33[01;34m]W[33[00m][33[1;32m][33[31m]$(parse_git_branch)$(parse_svn_branch)[33[00m][33[1;32m]$[33[m] "</code></pre>
We have added some Bash functions to call git and svn commands and retrieve informations about your code control.
Then we override the <strong>PS1</strong> variable, used by Bash program to personalize the prompt, adding colors (red for root user) and calling defined functions.
The result, when you enter into a repository folder, is the following (for a git project):
<pre><code> <code>mmornati@desktop raskiidoc(git::master)$</code></pre>
Indicating the repository type (<em>git</em>) and the name of the current branch (<em>master</em>).

<a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641030/Schermata-2013-11-11-alle-22_54_07_unzcjv.png">![Schermata 2013-11-11 alle 22.54.07](/images/personalize-your-bash-with-gitsvn-and-colors/00-Schermata-2013-11-11-alle-22_54_07_unzcjv.png)</a> <a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641029/Schermata-2013-11-11-alle-22_54_38_uph4k5.png">![Schermata 2013-11-11 alle 22.54.38](/images/personalize-your-bash-with-gitsvn-and-colors/01-Schermata-2013-11-11-alle-22_54_38_uph4k5.png)</a>
