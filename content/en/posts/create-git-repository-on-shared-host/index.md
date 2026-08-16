---
title: Create Git repository on shared host
date: '2011-09-14T22:00:00+00:00'
slug: create-git-repository-on-shared-host
categories:
  - Development
  - Git
tags:
  - git
  - repository
  - shared-hosting
  - bluehost
  - ssh
  - version-control
description: How to set up and use a private Git repository on a shared Bluehost account using SSH and a handy bash function.
---

## Introduction

After the [installation](/2011/08/29/host-personale/) of git on my [bluehost](http://www.bluehost.com) account I looked for a good way to create and access my git repository. Although I initially thought the Apache bridge was the best way to access git files, I found that on bluehost, the best and fastest way is directly using the ssh protocol.
Below, I explain the method I chose to create and use a private git repository on my shared account.

## The Setup Function

First of all, to simplify the repository creation process I added to my _.bashrc_ file a new function:

```bash
newgit()
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
}
```

The operations executed every time (and done automatically by the previous function) are:

- create the project folder
- initialize a git bare repository
- update-server-info to update your git config file
- enable the default post-update hook
- create a file to enable the export of the bare repository

## Creating a Repository

Now to create your repository you can simply run on the server:

```bash
newgit test.git
```

and a `test.git` repository is created in your default location (defined in the bashrc function).
To test it you can simply try to clone the repository on your "development" machine:

```bash
mmornati-macbook:~ mmornati$ git clone ssh://mornatin@mornati.net/~/repositories/test.git
```

Errors? If the response is no... DONE! :)

## Your First Commit

The only thing to remember is that the first commit on your project (`test.git` in this example) requires specifying the branch you want to work with, so you need to run commands like the following:

```bash
touch README
git add .
git commit -m "Init repo"
git push -u origin master
```

The important thing is just the line with `push`. After this first commit/push you can work normally using `git pull` and `git push` and all your files will be sent on the `master` branch of your repository.