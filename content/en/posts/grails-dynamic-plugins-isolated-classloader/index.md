---
title: Grails - Dynamic Plugins - Isolated Classloader
date: '2008-07-29T22:00:00+00:00'
slug: grails-dynamic-plugins-isolated-classloader
---



To prevent a possible jars conflict during dynamic plugin execution (what I was talking about in my previous post), I found a simple solution that I'm pasting for you here:
<pre><code> class DefaultPluginJob {
 static triggers = { }
 static cachedClassLoader = [:]
 def execute(context) {
   def libraryFolder = context.mergedJobDataMap.get("libraryFolder")
   if (!cachedClassLoader[context.mergedJobDataMap.get("jobName")]) {
   log.debug "Constructing class loader for ${context.mergedJobDataMap.get("jobName")}"
   def urls = [] libraryFolder?.eachFile { library -&gt;
     log.debug "Adding file ${library}"
     urls.add(library.toURL())
   } 
  cachedClassLoader[context.mergedJobDataMap.get("jobName")] = new URLClassLoader(urls as URL[], this.class.classLoader) }
  def file = context.mergedJobDataMap.get("scriptFile") Binding binding = new Binding(context.mergedJobDataMap);
  GroovyShell shell = new GroovyShell(cachedClassLoader[context.mergedJobDataMap.get("jobName")], binding);
  def scriptResult = shell.evaluate(file.text);
 }
}</code></pre>
A new URLClassLoader will be created for each script that need to be run from my job, and it will contain a copy of parent class loader and new jars needed for the script execution.

What you can find here is the current solution I'm using in my application: all classloaders are cached in a static map (thanks again to Sergey for suggestion ;)) and passed to GroovyShell for script exection. Using cache for classloader granted that I've only one classloader generation for each script (and not one for each job execution). You loose memory to get perfermance! ;)

Waiting for comments about this way to run a java web application! :)
