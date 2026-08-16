---
title: GitHub pull and certificate verification failed....
date: '2011-08-31T22:00:00+00:00'
slug: github-pull-and-certificate-verification-failed
---



I put these tips here because every time I need to pull a project from GitHub, where I'm not a contributor, I've a certificates problem and I always dismembered the solution :D
<pre><code> [root@centos564 ~]# git clone https://github.com/onelogin/python-saml.git
Cloning into python-saml...
error: SSL certificate problem, verify that the CA cert is OK. Details:
error:14090086:SSL routines:SSL3_GET_SERVER_CERTIFICATE:certificate verify failed while accessing https://github.com/onelogin/python-saml.git/info/refs

fatal: HTTP request failed</code></pre>
The solution, without install of certificate somewhere on the local machine, is:
<pre><code> [root@centos564 ~]# env GIT_SSL_NO_VERIFY=true git clone https://github.com/onelogin/python-saml.git
Cloning into python-saml...
remote: Counting objects: 27, done.
remote: Compressing objects: 100% (24/24), done.
remote: Total 27 (delta 3), reused 25 (delta 1)
Unpacking objects: 100% (27/27), done.</code></pre>
