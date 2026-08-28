---
title: Bluehost.com and Python 2.6
categories:
- linux-sysadmin
- programming
date: 2011-08-30T22:00:00+00:00
slug: bluehostcom-and-python-26
tags:
  - bluehost
  - python
  - python26
  - hosting
  - webhosting
description: How to use Python 2.6 on BlueHost when 2.4 is the default version
---

I found Python 2.6 installed on [BlueHost](https://www.bluehost.com), but it's not enabled by default. That means if you simply run a `python` command, you will get version 2.4:

```bash
user@mornati.net [~]# python
Python 2.4.3 (#1, May  5 2011, 16:39:10)
[GCC 4.1.2 20080704 (Red Hat 4.1.2-50)] on linux2
Type "help", "copyright", "credits" or "license" for more information.
>>>
```

However, BlueHost also has Python 2.6 available (ok, not 2.7 or 3.0, but at least a step ahead :)).

You can find it by running:

```bash
user@mornati.net [~]# whereis python
python: /bin/python /bin/python.orig /bin/python2.6-config /bin/python2.4 /bin/python2.6 /usr/bin/python /usr/bin/python.orig /usr/bin/python2.6-config /usr/bin/python2.4 /usr/bin/python2.6 /sbin/python /sbin/python.orig /sbin/python2.6-config /sbin/python2.4 /sbin/python2.6 /usr/sbin/python /usr/sbin/python.orig /usr/sbin/python2.6-config /usr/sbin/python2.4 /usr/sbin/python2.6 /lib/python2.4 /lib/python2.3 /lib/python2.6 /usr/lib/python2.4 /usr/lib/python2.3 /usr/lib/python2.6 /usr/include/python2.4 /usr/include/python2.6 /usr/share/man/man1/python.1.gz
```

So `/bin/python2.6` is the command you need to run:

```bash
user@mornati.net [~]# python2.6
Python 2.6 (r26:66714, Apr  1 2009, 20:44:00)
[GCC 4.1.2 20080704 (Red Hat 4.1.2-44)] on linux2
Type "help", "copyright", "credits" or "license" for more information.
>>>
```

## Using Python 2.6 by Default

To use Python 2.6 by default without having to type the `python2.6` command, edit your `.bashrc` file and add this line at the end:

```bash
alias python="python2.6"
```

And... enjoy!
