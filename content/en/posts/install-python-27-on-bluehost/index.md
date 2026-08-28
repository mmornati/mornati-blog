---
title: Install Python 2.7 on BlueHost
categories:
- linux-sysadmin
- programming
date: '2011-11-29T23:00:00+00:00'
slug: install-python-27-on-bluehost
tags:
  - python
  - bluehost
  - shared-hosting
  - compilation
  - installation
  - python27
description: Step-by-step guide to building and installing Python 2.7 on a BlueHost shared hosting account from source.
---

## Introduction

After I [discovered Python 2.6 was available on BlueHost](/2011/08/31/bluehost-com-and-python-2-6/), they removed it from the default installation. Fortunately it's really simple to build Python from sources and install it (and naturally, the good thing is that all required packages to build Python are installed on BlueHost servers).

Here are the steps to follow to build and install the python version you prefer (tested with Python 2.6 and 2.7.x).

## Downloading Python

```bash
wget http://www.python.org/ftp/python/2.7.2/Python-2.7.2.tgz
tar xzvf Python-2.7.2.tgz
```

and, just a note, the package creates a Python subfolder :)

## Building and Installing

After this, we can configure and install it.

```bash
cd Python-2.7.2
./configure --prefix=/home2/mornatin/python272 --enable-unicode=ucs4
make
make install
```

Change the Python version in this example and the installation directory with what you prefer. Naturally, considering you are on shared host (if you have a dedicated server you can install python using your distribution package system), you have access only to your home folder, so the target directory must be inside your home.

If all worked well, at the end of this procedure Python will be correctly installed in your system and you can start using it. To test it, simply try to start the binary file:

```bash
/home2/mornatin/python272/bin/python
```

## Configuration

One thing I suggest, if you don't want to override the default Python and/or want to install a different version, is to rename the **python** binary with something different. For example:

```bash
mv /home2/mornatin/python272/bin/python /home2/mornatin/python272/bin/python27
```

After this step you can add the python **bin** folder to your **PATH** and use it everywhere:

```bash
export PATH=/home2/mornatin/python272/bin:$PATH
```

## Usage

All configured and you can start working with your new python version. An important thing to remember is that, if you haven't configured Python 2.7 as the default, when you want to install a new module in it, you should invoke the correct binary file. Following this installation example:

```bash
python27 setup.py install
```
&nbsp;
