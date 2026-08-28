---
title: Grails - Dynamic Plugins for your applications
categories:
- programming
- web-dev-blogging
date: '2008-07-25T22:00:00+00:00'
slug: grails-dynamic-plugins-for-your-applications
tags:
  - grails
  - groovy
  - plugins
  - quartz
  - dynamic loading
  - java
  - opensymbolic
description: Learn how to dynamically load plugins at runtime in Grails applications, scan plugin folders, read configuration files, and schedule jobs using Quartz. This approach enables adding new features to your web application without redeployment.
---

The new functionality offered by Groovy/Grails enables you to write highly dynamic applications with the ability to add new features to your web application at runtime! This approach moves us away from traditional JEE standards where libraries, scripts, classes, and other resources must be bundled in your WAR file or provided by the application server.

I believe this traditional approach to development is outdated and could contribute to Java's decline. I'm being dramatic, I know, but there's a lot of confusion within Java, Java standards, and the various Java projects. It's time for a change! :)

## Introduction

This article explains how we're adding plugins (functions) to OpenSymbolic after application installation and, if desired, after web server startup (I'm not sure what JBoss will think about this... I'll run some tests when everything is ready).

Our goal was to create a way to add schedulable functions (Quartz Jobs) to our application, giving users the flexibility to choose which plugins they need and which they don't. In a future article, we'll explore the real-world usage in Symbolic.

## First Step: Dynamic Job Scheduling

**Question:** How can I add a Job dynamically to my scheduler?

**Answer:** At the moment, I can't! :(

**Solution:** I contacted [Sergey Nebolsin](http://www.linkedin.com/in/nebolsin), the Quartz plugin developer, explained my problem, and in **ONE NIGHT** (yes, ONE), he sent me the implementation.

**Lesson learned:** If I need something for the following day... I'll have to call Sergey!! :P (Really, thanks again for your work and help, Sergey!!)

## Second Step: Writing the Code

Let's see if I can actually implement what I'm thinking.

### Plugin Structure

All plugins are contained in a specific folder on the machine (configured in the application's configuration file):

```
/etc/symbolic/plugins
   -> /nagios_plugin
   -> /msn_plugin
   -> /dont_know_plugin
```

Each of these folders contains the necessary files. In my tests, each plugin has a configuration file and a script file.

### Plugin Service Implementation

With a simple script, I can scan these folders to find what I need:

```groovy
import org.codehaus.groovy.grails.commons.ConfigurationHolder

class PluginService {

   boolean transactional = false

   static CONFIG_FILE_EXT = 'conf'
   static SCRIPT_FILE_EXT = 'groovy'
   static LIB_FOLDER = 'lib'

   public void init() {
       // Scan Plugins Folder
       def pluginsFolder = ConfigurationHolder.config.plugin.folder
       log.debug "Scanning plugin folder: ${pluginsFolder}"
       
       if (pluginsFolder) {
           new File(pluginsFolder).eachDir { dir ->
               log.debug "Directory found: ${dir}"
               def dataMap = [:]
               
               // Read Plugin File and configure it
               dir.eachFile { file ->
                   if (file.isFile()) {
                       if (file.name.contains(CONFIG_FILE_EXT)) {
                           log.debug "File ${file.name} is the configuration file"
                           def pluginConfiguration = readConfigFile(file)
                           dataMap['pluginName'] = pluginConfiguration.get("job.name")
                           dataMap['cronString'] = pluginConfiguration.get("job.cron")
                       } else if (file.name.contains(SCRIPT_FILE_EXT)) {
                           log.debug "File ${file.name} is the script file"
                           dataMap['scriptFile'] = file
                       } else {
                           log.debug "File ${file.name} will be ignored!"
                       }
                   } else {
                       if (file.name.equals(LIB_FOLDER)) {
                           log.debug "Lib folder found... adding jars to classpath."
                       }
                   }
               }
               DefaultPluginJob.schedule(dataMap['cronString'], dataMap)
           }
       }
       else {
           logger.info "No plugins folder set. Nothing to load!"
       }
   }

   def readConfigFile = { file ->
       Properties prop = new Properties()
       if (file) {
           prop.load(new FileInputStream(file))
       }
       prop
   }
}
```

It's just a simple test... there are many improvements to make! ;)

### Default Plugin Job

The `DefaultPluginJob` class is a simple Quartz Job that you can create in the standard Grails way. With a new plugin release made by Sergey, it has some static methods that you can use to add your job to the Quartz scheduler!

Here's the Job code:

```groovy
import org.quartz.JobDataMap
import org.quartz.JobExecutionContext

class DefaultPluginJob {

   static triggers = { }

   def execute(context) {

       String instName = context.getJobDetail().getName()
       String instGroup = context.getJobDetail().getGroup()
       def file = context.mergedJobDataMap.get("scriptFile")

       Binding binding = new Binding()
       GroovyShell shell = new GroovyShell(binding)

       def scriptResult = shell.evaluate(file.text)

   }
}
```

It seems very simple, doesn't it? :)

## Third Step: Adding Libraries

To create a real extension of your application, you may need to add libraries used by your script. You can't include all existing Java libraries in your application because someone might create a plugin that uses those libraries! ;)

A simple solution we found is to add a `lib` sub-folder to your plugin folder where you can place all required libraries. The plugin server, while scanning folders, will add your JARs to the root class loader like this:

```groovy
this.class.classLoader.rootLoader.addURL(new URL("${file}"))
```

Now you can use all classes contained in your added JAR files! :D

## Future Considerations

What I need to solve now is a way to prevent JAR conflicts. Adding everything to the root class loader could cause problems for your application or other plugins.

I think a solution could be to write something inside your job that adds your library only to your job instances during (before) execution of the script!

If anyone has ideas about this... they're welcome! :P
