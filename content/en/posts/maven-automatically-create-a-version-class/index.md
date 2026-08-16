---
title: 'Maven: automatically create a version Class'
date: '2013-06-20T22:00:00+00:00'
slug: maven-automatically-create-a-version-class
---



Using a Maven to build your Java project, you can easily create a static Class containing Version and Release of your project; for example, you can then access to this class to show the version, for example, on your main project page.
The important thing is that you don't need to maintain this class nor to commit it: any build will automatically regenerate, and then build, the class file.

Here the code to put in your maven pom.xml in the <em>&lt;build&gt; </em>tag:
<pre class="language-xml line-numbers"><code class="language-xml">&lt;plugin&gt;
&lt;groupId&gt;org.apache.maven.plugins&lt;/groupId&gt;
&lt;artifactId&gt;maven-antrun-plugin&lt;/artifactId&gt;
&lt;version&gt;1.3&lt;/version&gt;
&lt;executions&gt;
    &lt;execution&gt;
        &lt;goals&gt;
            &lt;goal&gt;run&lt;/goal&gt;
        &lt;/goals&gt;
        &lt;phase&gt;generate-sources&lt;/phase&gt;
        &lt;configuration&gt;
            &lt;tasks&gt;
                &lt;property name="src.dir" value="${project.build.sourceDirectory}" /&gt;
                &lt;property name="package.dir" value="net/mornati/configuration" /&gt;
                &lt;property name="package.name" value="net.mornati.configuration" /&gt;
                &lt;property name="buildtime" value="${maven.build.timestamp}" /&gt;

                &lt;echo file="${src.dir}/${package.dir}/Version.java" message="package ${package.name};${line.separator}" /&gt;
                &lt;echo file="${src.dir}/${package.dir}/Version.java" append="true" message="public final class Version {${line.separator}" /&gt;
                &lt;echo file="${src.dir}/${package.dir}/Version.java" append="true"
                      message=" public static String VERSION="${project.version}-${buildtime}";${line.separator}" /&gt;
                &lt;echo file="${src.dir}/${package.dir}/Version.java" append="true" message="}${line.separator}" /&gt;
                &lt;echo message="BUILD ${buildtime}" /&gt;
            &lt;/tasks&gt;
        &lt;/configuration&gt;
    &lt;/execution&gt;
&lt;/executions&gt;
&lt;/plugin&gt;</code></pre>
If necessary, with a maven property you can control the timestamp format used to inject the "release" in your version file:
<pre class="language-xml line-numbers"><code class="language-xml">&lt;properties&gt;
 &lt;maven.build.timestamp.format&gt;yyyyMMddHHmmss&lt;/maven.build.timestamp.format&gt;
&lt;/properties&gt;</code></pre>
The result is a <em>Version.java</em> file containing a public method named <em>VERSION</em> like this:
<pre class="language-java line-numbers"><code class="language-java">public static final String VERSION = "2.0.1-20130627220534567"</code></pre>
that are the <em>project version</em> specified in your project pom and the <em>build timestamp</em> with the provided format.

And then you can simply access to this property with a jsp/java/... file:
<pre class="language-html line-numbers"><code class="language-html"> &lt;tr&gt;
  &lt;td class="exp-footer"&gt;
    Mornati.net Project Version: &lt;b&gt;&lt;%= net.mornati.configuration.Version.VERSION %&gt;&lt;/b&gt;
  &lt;/td&gt;
&lt;/tr&gt;</code></pre>
A thing to know is that if you want to use the Version class inside another java class, your development IDE shows you an error before the first build (the file is not present), but normally build should even work without problem and, once your file is created, the error will not be shown anymore.

A good idea could be to add this file to <em>ignore</em> of your source repository. For git for example, put in your <em>.gitignore</em> file:
<pre class="language-git line-numbers"><code class="language-git">.svn
.idea
target
*.iml
*.iws
net/mornati/configuration/Version.java</code></pre>
