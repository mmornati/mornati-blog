---
title: Generate a simple tree-menu in Grails
date: 2008-07-21T22:00:00+00:00
slug: generate-a-simple-tree-menu-in-grails
draft: false
categories: [Grails, Web Development]
tags: [grails, groovy, tree-menu, recursion, gsp]
---

This is one of the many posts you can find online about generating tree menus using JavaScript or Java. What I want to illustrate here is a method that uses **recursion** on both the back-end (Java/Groovy code that generates the tree structure) and front-end (a GSP template that renders itself recursively).

The starting point is that our page is not a "simple" page but is written using **Grails templates**. Templates are Grails' way to structure your front-end code and provide a highly reusable mechanism that you can call simply using a defined taglib.

## Backend: Building the Tree Structure

Here's an extraction from my program code. In the original version, the data structure is not a simple `Map` but a complex object, allowing me to perform checks like verifying if a node with a given name already exists.

The goal of this code is to add a `Machine` object to each tree tag in the provided list.

```groovy
class TreeMenu {
    def addNode = { nodeElement, machine, tagList ->
        def nodes = [:]
        nodes[machine.hostName] = machine
        def newList = tagList - nodeElement
        newList?.each { currentTag ->
            nodes[currentTag.name] = addNode(currentTag, machine, newList)
        }
        nodes
    }
}
```

### Parameters Explanation

- **`nodeElement`**: The current node where I want to place my machine
- **`machine`**: The object I want to include in my tree
- **`tagList`**: The list of all tree nodes where my machine will be placed

### Example Usage

Given:
- `machine`: `"TryMachine"`
- `tagList`: `["A", "B"]`

Calling:
```groovy
TreeMenu.addNode("Root", machine, tagList)
```

Would produce a tree structure like:

```
Root
├── A
│   └── TryMachine
├── B
│   └── TryMachine
└── TryMachine
```

## Frontend: Displaying the Tree

The extraordinary feature offered by Grails is the ability to use **recursion on the front-end**, allowing you to create pages without inserting Java code - all using default Grails taglibs.

Here's an example from my code:

```html
<g:each in="${nodes}" var="element">
    <g:if test="${element.value instanceof Machine}">
        ${element.name}
    </g:if>
    <g:else>
        <g:machineList template="/templates/machineTree" data="${element}"/>
    </g:else>
</g:each>
```

In your page, where you want to display your tree, you can simply call the template:

```html
<g:machineList template="/templates/machineTree" data="${treeData}"/>
```

## Conclusion

This is just a simple example. You can make improvements to this code by:
- Adding JavaScript functions to expand/collapse tree nodes
- Supporting other types of objects
- Enhancing the visual representation

*Note: This was an early experiment, and I wasn't entirely sure all modifications I made to create this post would work perfectly!*
