---
title: 'Fiki: the file based Wiki'
date: '2013-09-09T22:00:00+00:00'
slug: fiki-the-file-based-wiki
---



In the IT work we always need to keep and share information, but right now, any thing we tested for this was abandoned after some week of usage.
The problem is normally we have to work on the technical stuffs, then write the customer documentation and, normally, during these processes we have to write important information on the internal wiki (how to connect to customer servers, common problems, ...).

For this reason a <a href="https://github.com/llicour/" target="_blank">colleague of mine</a> creates a "ruby builder" (<em>rake</em>) to compile an <a href="http://www.methods.co.nz/asciidoc/" target="_blank">asciidoc</a> document into a PDF document, html page or <a href="http://www.w3.org/Talks/Tools/Slidy2/#(1)" target="_blank">slidy</a> page: <strong><a href="https://github.com/llicour/raskiidoc" target="_blank">raskiidoc</a>.</strong> In this way we can easily create a single document and then use it as customer documentation, information for internal wiki and, if needed, slides for a training/presentation. Following the "write once use many" we should reach our goal! (at least I hope so ;)).

After this the problem was: how we can publish all html pages (with a little bit of security) without having to "cut &amp; paste" into a wiki or any other manual operation. That the reason for the FiKi (File Based Wiki).
The usage is really simple, you just need to configure the security (actually we have created ldap and file authentication) and the data directory (where you want to store the html files) and then FiKi will display all available contents.
In the data folder you should create a folder for any arguments you want to add to the wiki, and inside the argument folder you can push all html/pdf files created using raskiidoc. Easy, isn't it? :)

To complete the CID (Continuos Integration Documentation) we created jobs in <a href="http://jenkins-ci.org" target="_blank">jenkins</a> to automatically download the latest doc version from our git repository, build it and push the result into the fiki data folder!
We just need to modify the asciidoc, push it and customer doc (pdf) and wiki pages are automatically updated. SO we are sure to read always the latest information on the wiki!

We realized two little videos to shown the base functions of FiKi

http://youtu.be/o_-KKtCQss0

and how you can create and customize new arguments

http://youtu.be/xWY3H4A7P0g

&nbsp;

&nbsp;

&nbsp;
