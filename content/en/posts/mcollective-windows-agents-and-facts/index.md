---
title: 'MCollective: Windows agents and facts'
categories:
- devops
date: '2013-10-27T23:00:00+00:00'
slug: mcollective-windows-agents-and-facts
tags: [mcollective, windows, agents, facts, puppet, ruby]
description: Custom MCollective agents and facts for Windows Server, including DNS facts, Service control, and EventLog retrieval.
---

## Overview

I'm currently creating some agents and facts for MCollective running on Windows Server.
All agents are developed on a Windows XP machine and then tested and deployed on Windows Server 2003 and Windows Server 2008.

You can find all the sources on my GitHub repo: [https://github.com/mmornati/mcollective-windows](https://github.com/mmornati/mcollective-windows)

## Available Agents and Facts

In the README.md file, there's a description of facts and agents I created with a little usage doc.

Currently there are:

- **DNS Fact**: add DNS information on inventory response
- **Service Agent**: to show Windows services status and control them
- **EventLog Agent**: to get event log messages

## Usage

Enjoy, and if you will use them, let me know if you find any problems or bugs.