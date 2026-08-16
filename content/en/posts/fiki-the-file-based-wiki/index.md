---
title: 'Fiki: the file based Wiki'
date: '2013-09-09T22:00:00+00:00'
slug: fiki-the-file-based-wiki
categories:
  - Documentation
  - DevOps
  - Tools
tags:
  - wiki
  - asciidoc
  - ruby
  - jenkins
  - documentation
  - fiki
description: 'FiKi is a file-based wiki that automatically publishes AsciiDoc documents as HTML pages, integrated with Jenkins CI for continuous documentation delivery.'
---

## Overview

In IT, we always need to keep and share information, but right now, everything we tested for this was abandoned after some week of usage.

## The Problem

The problem is normally we have to work on the technical stuff, then write the customer documentation and, normally, during these processes we have to write important information on the internal wiki (how to connect to customer servers, common problems, ...).

For this reason a [colleague of mine](https://github.com/llicour/) created a Ruby builder (*rake*) to compile an [asciidoc](http://www.methods.co.nz/asciidoc/) document into a PDF document, html page or [slidy](http://www.w3.org/Talks/Tools/Slidy2/#(1)) page: **[raskiidoc](https://github.com/llicour/raskiidoc).** In this way we can easily create a single document and then use it as customer documentation, information for internal wiki and, if needed, slides for a training/presentation. Following the "write once, use many" we should reach our goal! (at least I hope so ;)).

## FiKi

After this the problem was: how we could publish all HTML pages (with a little bit of security) without having to "cut & paste" into a wiki or any other manual operation. That's the reason for FiKi (File Based Wiki).

The usage is really simple, you just need to configure security (actually we have created ldap and file authentication) and the data directory (where you want to store the html files) and then FiKi will display all available content.

In the data folder you should create a folder for each category you want to add to the wiki, and inside the category folder you can push all html/pdf files created using raskiidoc. Easy, isn't it? :)

## Continuous Integration

To complete the CID (Continuous Integration Documentation) we created jobs in [jenkins](http://jenkins-ci.org) to automatically download the latest doc version from our git repository, build it and push the result into the fiki data folder!
We just need to modify the asciidoc, push it and customer doc (pdf) and wiki pages are automatically updated. So we're sure to read always the latest information on the wiki!

## Demo Videos

We created two short videos to show the base functions of FiKi

[![FiKi base functions](http://img.youtube.com/vi/o_-KKtCQss0/0.jpg)](http://youtu.be/o_-KKtCQss0)

and how you can create and customize new arguments

[![FiKi create and customize arguments](http://img.youtube.com/vi/xWY3H4A7P0g/0.jpg)](http://youtu.be/xWY3H4A7P0g)