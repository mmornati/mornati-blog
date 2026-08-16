---
title: GitHub pull and certificate verification failed
date: '2011-08-31T22:00:00+00:00'
slug: github-pull-and-certificate-verification-failed
categories:
  - Development
  - Git
tags:
  - github
  - git
  - ssl
  - certificate
  - troubleshooting
description: How to resolve SSL certificate verification errors when pulling from GitHub repositories where you are not a contributor.
---

Every time I need to pull a project from GitHub where I'm not a contributor, I encounter SSL certificate verification issues and end up forgetting the solution. So I'm documenting it here for future reference.

## The Problem

When attempting to clone a repository, you may see the following error:

```bash
[root@centos564 ~]# git clone https://github.com/onelogin/python-saml.git
Cloning into python-saml...
error: SSL certificate problem, verify that the CA cert is OK. Details:
error:14090086:SSL routines:SSL3_GET_SERVER_CERTIFICATE:certificate verify failed while accessing https://github.com/onelogin/python-saml.git/info/refs

fatal: HTTP request failed
```

## The Solution

The solution, without installing certificates on your local machine, is to temporarily disable SSL verification:

```bash
[root@centos564 ~]# env GIT_SSL_NO_VERIFY=true git clone https://github.com/onelogin/python-saml.git
Cloning into python-saml...
remote: Counting objects: 27, done.
remote: Compressing objects: 100% (24/24), done.
remote: Total 27 (delta 3), reused 25 (delta 1)
Unpacking objects: 100% (27/27), done.
```

This environment variable bypasses SSL certificate verification for the duration of the command.
