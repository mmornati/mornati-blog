---
title: What are symbolic operations?
date: '2008-07-23T22:00:00+00:00'
slug: what-are-symbolic-operations
---



As official guide illustrates, symbolic administrator can create function users could do, simply adding new operations. An operation is an object built using func module, method and parameters.<br /><br />What administrator has to do to add a new operation is:<br /><ul><li>Assign a name that will be shown to users</li><li>Select a func operation, selecting module and method over that module. i.e. module: command, method: run</li><li>Add some optional parameters to complete the operation. For example if he has coded the operation over module command with method run, he need to decide which linux command function he want to execute.</li><li>Add some optional parameters that will be ask to user before operation run. To make completely dynamic the operation coding, in fact, something need to be added during the execution by the user. For example, administrator could decide that for a specific group of users, must be created an operation to make able the execution of all linux command. So he has to code an operation over "command run" and the add a parameter named "Command to run" that users will complete before operation running.</li></ul><br />Authority assignment is the last operation he has to do to shown new operation to the user. In fact, all symbolic operations, machines and scripts are shown only to users that are enabled to use.<br /><br />At runtime this operation will be completed with machine hostname (the one where user click before operation selection), the (optional) parameters that user must complete and all is stored in a table with "ready state" attached. Will be symbolic engine to select ready operation and call func for the execution.
