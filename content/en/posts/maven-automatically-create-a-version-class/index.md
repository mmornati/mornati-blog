---
title: 'Maven: automatically create a version Class'
date: '2013-06-20T22:00:00+00:00'
slug: maven-automatically-create-a-version-class
categories:
  - Java
  - Maven
  - Development
tags:
  - maven
  - java
  - build
  - version
  - automation
description: 'Automatically generate a static Version.java class with Maven using the antrun-plugin, including project version and build timestamp, without manual maintenance.'
---

## Overview

Using Maven to build your Java project, you can easily create a static class containing the version and release of your project; for example, you can then access to this class to show the version, for example, on your main project page.
The important thing is that you don't need to maintain this class nor to commit it: any build will automatically regenerate, and then build, the class file.

## Maven Configuration

Here is the code to put in your maven pom.xml in the `<build>` tag:

```xml
<plugin>
<groupId>org.apache.maven.plugins</groupId>
<artifactId>maven-antrun-plugin</artifactId>
<version>1.3</version>
<executions>
    <execution>
        <goals>
            <goal>run</goal>
        </goals>
        <phase>generate-sources</phase>
        <configuration>
            <tasks>
                <property name="src.dir" value="${project.build.sourceDirectory}" />
                <property name="package.dir" value="net/mornati/configuration" />
                <property name="package.name" value="net.mornati.configuration" />
                <property name="buildtime" value="${maven.build.timestamp}" />

                <echo file="${src.dir}/${package.dir}/Version.java" message="package ${package.name};${line.separator}" />
                <echo file="${src.dir}/${package.dir}/Version.java" append="true" message="public final class Version {${line.separator}" />
                <echo file="${src.dir}/${package.dir}/Version.java" append="true"
                      message=" public static String VERSION="${project.version}-${buildtime}";${line.separator}" />
                <echo file="${src.dir}/${package.dir}/Version.java" append="true" message="}${line.separator}" />
                <echo message="BUILD ${buildtime}" />
            </tasks>
        </configuration>
    </execution>
</executions>
</plugin>
```

## Timestamp Format

If necessary, with a maven property you can control the timestamp format used to inject the "release" in your version file:

```xml
<properties>
 <maven.build.timestamp.format>yyyyMMddHHmmss</maven.build.timestamp.format>
</properties>
```

## Usage

The result is a *Version.java* file containing a public method named *VERSION* like this:

```java
public static final String VERSION = "2.0.1-20130627220534567"
```

That combines the project version specified in your project pom and the build timestamp with the provided format.

And then you can simply access to this property with a jsp/java/... file:

```html
 <tr>
  <td class="exp-footer">
    Mornati.net Project Version: <b><%= net.mornati.configuration.Version.VERSION %></b>
  </td>
</tr>
```

A thing to know is that if you want to use the Version class inside another java class, your IDE will show an error before the first build (the file is not present), but normally build should even work without problem and, once your file is created, the error will not be shown anymore.

## Version Control

A good idea could be to add this file to *ignore* of your source repository. For git for example, put in your *.gitignore* file:

```git
.svn
.idea
target
*.iml
*.iws
net/mornati/configuration/Version.java
```