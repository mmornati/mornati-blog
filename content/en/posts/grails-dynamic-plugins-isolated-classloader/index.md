---
title: Grails - Dynamic Plugins - Isolated Classloader
date: '2008-07-29T22:00:00+00:00'
slug: grails-dynamic-plugins-isolated-classloader
categories:
  - Grails
  - Groovy
  - Web Development
  - Java
tags:
  - grails
  - groovy
  - plugins
  - classloader
  - dynamic loading
  - java
  - quartz
  - opensymbolic
description: Solve JAR conflicts in Grails dynamic plugin loading by using isolated URLClassLoader for each plugin. This follow-up post shows how to create a separate classloader per plugin to avoid dependency conflicts while maintaining performance through caching.
---

In my [previous post](/posts/grails-dynamic-plugins-for-your-applications) about dynamic plugins in Grails, I mentioned the challenge of preventing JAR conflicts during plugin execution. I've found a simple yet effective solution using isolated classloaders.

## The Problem

When dynamically loading plugins at runtime, adding all plugin JAR files to the root classloader can cause conflicts between different versions of the same library. This approach doesn't scale well in a multi-plugin environment.

## The Solution: Isolated ClassLoaders

The solution is to create a dedicated `URLClassLoader` for each plugin, containing only the JARs that plugin needs. This isolates each plugin's dependencies from others and from the main application.

Here's the implementation:

```groovy
class DefaultPluginJob {
    static triggers = { }
    static cachedClassLoader = [:]

    def execute(context) {
        def libraryFolder = context.mergedJobDataMap.get("libraryFolder")
        
        if (!cachedClassLoader[context.mergedJobDataMap.get("jobName")]) {
            log.debug "Constructing class loader for ${context.mergedJobDataMap.get("jobName")}"
            
            def urls = []
            libraryFolder?.eachFile { library ->
                log.debug "Adding file ${library}"
                urls.add(library.toURL())
            }
            
            cachedClassLoader[context.mergedJobDataMap.get("jobName")] = 
                new URLClassLoader(urls as URL[], this.class.classLoader)
        }
        
        def file = context.mergedJobDataMap.get("scriptFile")
        Binding binding = new Binding(context.mergedJobDataMap)
        GroovyShell shell = new GroovyShell(
            cachedClassLoader[context.mergedJobDataMap.get("jobName")], 
            binding
        )
        def scriptResult = shell.evaluate(file.text)
    }
}
```

## How It Works

1. **Isolated ClassLoader Creation**: For each plugin (identified by `jobName`), a new `URLClassLoader` is created containing only the JAR files from that plugin's `libraryFolder`.

2. **Parent ClassLoader**: Each plugin's classloader has the parent classloader set to the current class's classloader, allowing access to application classes while keeping plugin dependencies isolated.

3. **ClassLoader Caching**: ClassLoaders are cached in a static map to avoid recreating them for each job execution. This trades memory for performance - you use more memory to store classloaders, but gain significant performance by reusing them.

4. **GroovyShell Integration**: The isolated classloader is passed to `GroovyShell`, which uses it to execute the plugin script with the correct classpath.

## Implementation Notes

This is the solution I'm currently using in production. The classloader caching approach (suggested by Sergey) ensures that each plugin gets its own classloader only once, rather than creating a new one for every job execution.

The trade-off is clear: you use more memory to maintain cached classloaders, but you gain better performance. In most cases, this is a worthwhile exchange.

## Conclusion

This approach effectively solves the JAR conflict problem while maintaining good performance through caching. Each plugin runs with its own isolated classpath, preventing version conflicts between different plugins.

I'm interested to hear your thoughts on this approach to running Java web applications with dynamic plugin support!
