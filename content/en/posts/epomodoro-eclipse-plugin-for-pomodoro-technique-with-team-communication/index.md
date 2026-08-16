---
title: 'ePomodoro: Eclipse Plugin for Pomodoro Technique with Team Communication'
date: '2012-02-25T23:00:00+00:00'
slug: epomodoro-eclipse-plugin-for-pomodoro-technique-with-team-communication
categories:
  - Eclipse
  - Java
  - Productivity
  - Tools
tags:
  - epomodoro
  - pomodoro
  - eclipse
  - plugin
  - jgroups
  - team
  - productivity
  - timer
description: 'An Eclipse plugin for team-aware Pomodoro timers using JGroups multicast communication.'
---

After I explained to my actual working team how they can be more productive using the [Pomodoro Technique](http://www.pomodorotechnique.com/), they spent some minutes looking for a utility to use a countdown clock.

## The Idea

Yes guys, we are geeks! Even if we can use anything else as timer, we always look for something cool to install on our PC :D
Someone asked me if there was anything for team work: a way to show the Pomodoro timer of the others in your team to know when you could talk with them. And, after minutes of search on the net without results, I decided to spend a couple of hours to create an example of the proposed Team Pomodoro :D

So, here you are: **[ePomodoro](https://github.com/mmornati/epomodoro)**! It's an Eclipse Plugin, so you can install it directly in your Eclipse environment (in the future I could create a stand alone application for all non-eclipse developers or non-developers ;))

## Features

In *Windows->Preferences* Menu you can change some plugin settings like: *Team Name* and *Pomodoro Timer*. Team Name allows different team in your society: you will get just messages from your team!

## Current Status

At the moment, even if it works (both as a countdown clock and team message), it's just a simple raw plugin to demonstrate how easy it is to create something like this using the **JGroups** library as message broadcaster.
I'll set aside some time to add cool functions to it in the next days.