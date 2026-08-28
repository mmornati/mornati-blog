---
title: Personalize your bash with GIT/SVN and colors
categories:
- linux-sysadmin
date: '2013-11-10T23:00:00+00:00'
slug: personalize-your-bash-with-gitsvn-and-colors
tags:
  - bash
  - git
  - svn
  - terminal
  - prompt
  - linux
description: Customize your bash prompt to show Git branch and SVN repository information with colored output.
---

## Overview

If you work every day on a Linux shell and need to manage projects using Git or SVN version control systems, it could be useful to see information about them directly in your bash prompt.

You can easily do that with some changes to the **/etc/bashrc** file of your Linux.

## Configuration

Go to the end of that file and add the following lines:

```bash
parse_git_branch() {
  git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/(git::\1)/'
}
parse_svn_branch() {
  parse_svn_url | sed -e 's#^'"$(parse_svn_repository_root)"'##g' | awk -F / '{print "(svn::"$1 "/" $2 ")"}'
}
parse_svn_url() {
  svn info 2>/dev/null | grep -e '^URL*' | sed -e 's#^URL: *\(.*\)#\1#g '
}
parse_svn_repository_root() {
  svn info 2>/dev/null | grep -e '^Repository Root:*' | sed -e 's#^Repository Root: *\(.*\)#\1/#g '
}

# vim:ts=4:sw=4
# Colors in Terminal
if [ $USER = root ]; then
        PS1='\[\033[1;31m\][\u@\h \W]\$\[\033[0m\] '
else
        #PS1='\[\033[01;32m\]\u@\h\[\033[00m\] \[\033[01;34m\]\W\[\033[00m\]\[\033[1;32m\]\$\[\033[m\] '
        PS1="\[\033[01;32m\]\u@\h\[\033[00m\] \[\033[01;34m\]\W\[\033[00m\]\[\033[1;32m\]\[\033[31m\]$(parse_git_branch)$(parse_svn_branch)\[\033[00m\]\[\033[1;32m\]\$\[\033[m\] "
```

We've added some Bash functions to call git and svn commands and retrieve information about your version control status. Then we override the **PS1** variable, which Bash uses to customize the prompt, adding colors (red for root user) and calling the defined functions.

## Usage

The result, when you enter a repository folder, is the following (for a git project):

```bash
mmornati@desktop raskiidoc(git::master)$
```

This indicates the repository type (*git*) and the current branch name (*master*).

[![Schermata 2013-11-11 alle 22.54.07](/images/personalize-your-bash-with-gitsvn-and-colors/00-Schermata-2013-11-11-alle-22_54_07_unzcjv.png)](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641030/Schermata-2013-11-11-alle-22_54_07_unzcjv.png)
[![Schermata 2013-11-11 alle 22.54.38](/images/personalize-your-bash-with-gitsvn-and-colors/01-Schermata-2013-11-11-alle-22_54_38_uph4k5.png)](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641029/Schermata-2013-11-11-alle-22_54_38_uph4k5.png)