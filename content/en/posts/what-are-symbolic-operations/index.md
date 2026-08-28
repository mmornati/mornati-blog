---
title: What are symbolic operations?
categories:
- programming
date: '2008-07-23T22:00:00+00:00'
slug: what-are-symbolic-operations
tags:
  - symbolic
  - operations
  - func
  - administration
description: A guide explaining what Symbolic operations are and how administrators can create new operations using the func module.
---

As the official guide illustrates, Symbolic administrators can create new functions that users can perform by simply adding new operations. An operation is an object built using the func module, method, and parameters.

## Adding New Operations

To add a new operation, an administrator needs to perform the following steps:

- Assign a name that will be displayed to users
- Select a func operation by choosing the module and method for that module, for example:
  ```
  module: command
  method: run
  ```
- Add optional parameters to complete the operation. For example, if the administrator has created an operation using the `command` module with the `run` method, they need to decide which Linux command function they want to execute
- Add optional parameters that will be requested from the user before the operation runs. To make the operation coding completely dynamic, some information needs to be provided by the user during execution. For example, an administrator might decide that for a specific group of users, an operation should be created to enable the execution of all Linux commands. In this case, they would create an operation using `command run` and then add a parameter named "Command to run" that users will complete before the operation executes

## Authority Assignment

The final step an administrator needs to perform is assigning authority to show the new operation to users. In fact, all Symbolic operations, machines, and scripts are displayed only to users who are authorized to use them.

## Runtime Behavior

At runtime, the operation will be completed with the machine hostname (the one where the user clicked before selecting the operation), the optional parameters that the user must provide, and everything is stored in a table with a "ready state" attached. The Symbolic engine will then select the ready operation and call func for execution.
