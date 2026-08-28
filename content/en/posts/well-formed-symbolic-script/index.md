---
title: Well-Formed Symbolic Script
categories:
- programming
date: '2008-07-21T22:00:00+00:00'
slug: well-formed-symbolic-script
tags:
  - symbolic
  - automation
  - scripting
  - python
  - groovy
  - bash
  - perl
  - xml-rpc
description: Learn how to create well-formed scripts for Symbolic with proper metadata tags, supported languages, XML-RPC communication, and parameter handling.
---

The first step to create a well-formed script is to add a series of metadata tags at the beginning of the script file within a "commented area". These tags allow Symbolic to recognize and adapt to your script.

## Supported Languages

You can write your own scripts using one of the four supported languages:

- **Groovy**
- **Python**
- **Bash**
- **Perl**

## Required Metadata Tags

The currently accepted tags are:

- `@Name`: The name for your script. This is displayed to users for your saved script.
- `@Author`: Name and references of the script's author.
- `@Type`: The type of your script. Valid values are: `python`, `groovy`, `bash`, `perl`
- `@Description`: A full description to inform users about what the script actually does.

Adding these four simple tags at the beginning of your script and copying your script into the Symbolic scripts folder makes the Symbolic application able to recognize the script so that users can run it.

## XML-RPC Communication

Symbolic exposes a service to which scripts can connect to get useful information (such as Symbolic certified machines) and to post execution results.

All user-runnable scripts are launched asynchronously: Symbolic does not wait for the answer from each executed script. Therefore, the only way to communicate the result to Symbolic is by calling it through the defined XML-RPC service.

Symbolic includes an implementation of an XML-RPC server that exposes a method to post results from scripts: `postInformation(result)`. In your scripts, you need to include lines of code that call the XML-RPC server to post the result information.

## Script Parameters

When Symbolic calls a script, it provides the following parameters:

- `-a`: Asynchronous execution. The caller will not wait for the script's answer, so the result must be posted through the XML-RPC server.
- `-p processID`: The Symbolic identification of the running script.
- `-s serverAddress`: The XML-RPC server address.

For example, if you have a Python script, Symbolic will call it using something like:

```bash
python script.py -a -p 10 -s http://localhost:8080/symbolic/api/xmlrpc
```

You need to parse these parameters inside your script if you want to communicate with Symbolic.

## Expected Response Format

The response that Symbolic expects must be formatted as a dictionary/map with the following information:

```python
{"process_id": SYMBOLIC_PROC_ID, "status": process_status, "response": some_information}
```

- `process_id`: The process ID provided during Symbolic script invocation.
- `status`: The result of your script/process (`0`: Success, `1`: Error)
- `response`: What you want to return. It is best to provide something human-readable as it will be shown to the user without any kind of parsing.

## Authentication

The Symbolic XML-RPC server is secured with password protection. When you create an instance of an XML-RPC client in your script, you need to provide Basic Authentication with a username and password, or you will receive an "access forbidden" error from Symbolic.

By default, there is a user that scripts can use to connect to the server:

```
username: externalscript
password: externalscript
```

Symbolic administrators can change this information or create additional script-enabled accounts. These accounts must have an associated custom script authority (like the default created during installation) or root authority. However, it is recommended not to use root authority to enable scripts to communicate with Symbolic for security reasons.
