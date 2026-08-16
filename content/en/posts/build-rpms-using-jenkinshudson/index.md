---
title: Build RPMs using Jenkins/Hudson
tags:
- jenkins
- rpm
- makefile
- ci
- hudson
categories:
- DevOps
- CI/CD
description: How to build RPM packages using Jenkins/Hudson CI with a Makefile, including source tarball creation, spec-file configuration, and automated upload to a yum repository.
date: '2021-09-13T22:00:00+00:00'
slug: build-rpms-using-jenkinshudson
---

## Overview

A continuous integration system like Jenkins, originally created for Java projects, can now be used for many build activities. You can, for example, find plugins for iOS project CI builds, Android platforms, Python projects, and more.

Here I'll show a way to use it to build **RPM**s in CI.

## The Makefile

First thing, for simplicity in the Jenkins build script, I suggest using a [Makefile](http://en.wikipedia.org/wiki/Make_(software)) for your project. Following an example created for the [OpenSymbolic](http://www.opensymbolic.com) and [Kermit](http://www.kermit.fr) projects.

```bash
TOPDIR = $(shell pwd)
DATE="date +%Y%m%d"
PROGRAMNAME=kermit-webui
RELEASE=0.0.3
TMPDIR=/tmp
BUILDDIR=build

all: rpms

manpage:

messages:

bumprelease:	

#setversion: 

build: clean
	echo $(TOPDIR)
	echo "- Create Changelog file"
	git shortlog > changelog.txt
	echo "- Create new $(TMPDIR)/$(BUILDDIR)"
	mkdir -p $(TMPDIR)/$(BUILDDIR)
	mkdir -p $(TMPDIR)/$(BUILDDIR)/$(PROGRAMNAME)
	echo "- Copy existing Kermit sources"
	rsync -raC --exclude .git . $(TMPDIR)/$(BUILDDIR)/$(PROGRAMNAME)
	echo "- Remove useless files"
	rm -Rf $(TMPDIR)/$(BUILDDIR)/$(PROGRAMNAME)/src/sqlite.db
#	echo "- Rename $(PROGRAMNAME) in $(PROGRAMNAME)-$(RELEASE)"
#	mv $(TMPDIR)/$(BUILDDIR)/$(PROGRAMNAME) $(TMPDIR)/$(BUILDDIR)/$(PROGRAMNAME)-$(RELEASE)
	echo "- Compressing $(PROGRAMNAME) directory"
	tar -czf $(PROGRAMNAME)-$(RELEASE).tar.gz -C $(TMPDIR)/$(BUILDDIR) $(PROGRAMNAME)/
	echo "- Moving source package in dist dir"
	mkdir -p ./dist
	mv $(PROGRAMNAME)-$(RELEASE).tar.gz ./dist

clean:
	-rm -rf dist/
	-rm -rf rpm-build/
	-rm -rf $(TMPDIR)/$(BUILDDIR)

clean_hard:

clean_harder:

clean_hardest: clean_rpms

install: build manpage

install_hard: clean_hard install

install_harder: clean_harder install

install_hardest: clean_harder clean_rpms rpms install_rpm restart

install_rpm:

restart:

recombuild: install_harder restart

clean_rpms:
	-rpm -e kermit-webui

sdist: messages

new-rpms: bumprelease rpms

pychecker:

pyflakes:

money: clean

async: install
	/sbin/service httpd restart

testit: clean

unittest:

rpms: build manpage sdist
	mkdir -p rpm-build
	cp dist/*.gz rpm-build/
	rpmbuild --define "_topdir %(pwd)/rpm-build" 
	--define "_builddir %{_topdir}" 
	--define "_rpmdir %{_topdir}" 
	--define "_srcrpmdir %{_topdir}" 
	--define '_rpmfilename %%{NAME}-%%{VERSION}-%%{RELEASE}.%%{ARCH}.rpm' 
	--define "_specdir %{_topdir}" 
	--define "_sourcedir  %{_topdir}" 
	--define "vendor Think" 
	-ba misc/specs/kermit-webui.spec
```

The important part is the one inside *build* where we create the source .tgz file (with the correct name) to use later, in the *rpms* part of the makefile, to create the RPM. There are different ways to create it and, maybe, this one is not the best you can create; later we'll see a different way to configure it without using a Makefile and by downloading sources from GitHub.

After creating the Makefile, you can try to compile your project simply running the *make* command in the folder where you have created the Makefile (usually the project root folder).

## Jenkins Configuration

Now we can configure a new project inside Jenkins, that should be a **free style project** with a build step with **execute shell** configuration.

[![image](/images/build-rpms-using-jenkinshudson/00-Schermata-09-2455819-alle-21_04_17_dc3jxp.png)](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641476/Schermata-09-2455819-alle-21_04_17_dc3jxp.png)

You can just put *make* and Jenkins will build the project. Here's an example that creates an RPM and will update a local yum repository that will be uploaded to a server via FTP at the end of the build step.

[![image](/images/build-rpms-using-jenkinshudson/01-Schermata-09-2455819-alle-21_09_12_vswstu.png)](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641475/Schermata-09-2455819-alle-21_09_12_vswstu.png)

## How It Works

Now you have a Jenkins setup that builds a new RPM after every commit (or once a day, depending on your build configuration) and uploads the new RPM on an online repository. Easy and it works :)