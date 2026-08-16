---
title: Build RPMs for a Git (Github) project with Jenkins
date: '2021-09-13T22:00:00+00:00'
slug: build-rpms-for-a-git-github-project-with-jenkins
---



<a href="http://blog.mornati.net/2011/09/14/build-rpms-using-jenkinshudson/">Here</a> we show a way to build RPMs with Jenkins using a Makefile. Now we will show a Jenkins based build (without create Makefle).

So, you can directly create a new Job in your Jenkins using the **Free Style** creation method and adding a **shell** build step. Inside the text area you can put something like this:
<pre class="language-bash"><code class="language-bash">testrel=$(/usr/bin/git diff HEAD~1 | awk '/[\t ]*\+[\t ]*Release/ {
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
rpmbuild --define "_topdir %(pwd)/rpmbuild" -ba rpmbuild/SPECS/*.spec</code></pre>
The first line of the script checks for git log to find if *Release* is changed inside the spec file (that should be naturally committed as resources of your project); the project will be built only if you modified the Release inside the spec!

After that the operation is like the one proposed in the Makefile: creation of tar.gz source archive, creation of rpm-build directories, build rpm.

So, you can choose to put your build code completely inside Jenkins or create a Makefile and link your build process with your project (changes in project that requires build process changes won't impact Jenkins configuration.
