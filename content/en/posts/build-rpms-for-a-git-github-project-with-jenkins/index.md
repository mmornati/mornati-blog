---
title: Build RPMs for a Git (Github) project with Jenkins
categories:
- devops
tags:
- jenkins
- rpm
- github
- git
description: Build RPMs directly inside a Jenkins Free Style job using a shell build step, without a Makefile — with automatic git-based release detection.
date: '2021-09-13T22:00:00+00:00'
slug: build-rpms-for-a-git-github-project-with-jenkins
---

## Overview

[Earlier](http://blog.mornati.net/2011/09/14/build-rpms-using-jenkinshudson/) we showed a way to build RPMs with Jenkins using a Makefile. Now we will show a Jenkins based build (without creating a Makefile).

## Jenkins Job Configuration

You can directly create a new Job in your Jenkins using the **Free Style** creation method and adding a **shell** build step. Inside the text area you can put something like this:

```bash
testrel=$(/usr/bin/git diff HEAD~1 | awk '/[\t ]*\+[\t ]*Release/ {
print "NEWREL"; exit 0 }')
if [ "$testrel" != "NEWREL" ]; then
    echo "There is no new release in the rpm spec files - do not rebuild."
    exit 0
fi
rm -rf rpmbuild ${JOB_NAME}.tar.gz
mkdir -p rpmbuild/{BUILD,RPMS,SOURCES/${JOB_NAME},SPECS,SRPMS}
tar --exclude-vcs --exclude='rpmbuild' -cp * | (cd
rpmbuild/SOURCES/${JOB_NAME} ; tar xp)
cd ${WORKSPACE}/rpmbuild/SOURCES
tar -cvzf ${JOB_NAME}.tar.gz ${JOB_NAME}
cd ${WORKSPACE}
cp misc/specs/*.spec rpmbuild/SPECS/
sed -i "s/^[\t ]*Source0:.*/Source0: ${JOB_NAME}.tar.gz/g" rpmbuild/SPECS/*.spec
sed -i "s/^[\t ]*%setup[\t ]\+-n[\t ]\+.*/%setup -n ${JOB_NAME}/g"
rpmbuild/SPECS/*.spec
rpmbuild --define "_topdir %(pwd)/rpmbuild" -ba rpmbuild/SPECS/*.spec
```

## How It Works

The first line of the script checks the git log to see if *Release* has changed inside the spec file (that should be naturally committed as resources of your project); the project will only be built if you modified Release inside the spec.

After that, the process is similar to the Makefile approach: creation of tar.gz source archive, creation of rpm-build directories, build rpm.

You can choose to put your build code entirely inside Jenkins or create a Makefile and link your build process with your project (changes that require build process changes won't impact the Jenkins configuration).