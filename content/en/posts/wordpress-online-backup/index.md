---
title: 'WordPress Online Backup'
date: '2012-07-10T22:00:00+00:00'
slug: wordpress-online-backup
categories: [WordPress, Backup]
tags:
  - wordpress
  - backup
  - online-backup
  - dropbox
  - plugin
description: How to set up an automated WordPress backup to a remote server using the Online Backup plugin, with optional encryption and incremental backups.
---

## The Problem with Local Backups

The first rule for a correct backup is to store your backup file(s) on a different server than the one you are backing up. So, even if you can find many WordPress backup plugins open-source, many of those just execute the backup in a folder of the same server where you have WordPress installed. So you just need to remember to download these files to your local computer to have something safe.

## Choosing the Right Plugin

But, after a little browsing inside all the WordPress plugins I also found some other interesting ways to execute your backup (to DropBox, to GDrive, ...), but what I chose in the end is [Online Backup](http://wordpress.org/extend/plugins/wponlinebackup/). The reason is that, even if it's a free plugin, it has many powerful features!

After the installation you have an *Online Backup* link inside the Tools menu in your admin area.

[![Online Backup menu](/images/wordpress-online-backup/00-Screenshot-from-2012-07-11-173208_jxxbtg.png)](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641237/Screenshot-from-2012-07-11-173208_jxxbtg.png)

## Configuration Steps

You have just a few simple steps to configure it: define a schedule for your backup, choose whether you want a full or an incremental backup (incremental is available only if you select Online backup), set up your online account (optional), define the encryption method and password (optional), and that's all.

Yes, we need to create another account for a free online service, but why not? We give our personal information to any kind of supermarket and we almost get nothing back (just a bit of spam).

The link for the account registration is directly proposed by the plugin and you will have (with the free account) 100 MB to use to back up your WordPress (or more than one) blog.

[![Online Backup registration](/images/wordpress-online-backup/01-Screenshot-from-2012-07-11-173300_hmyneq.png)](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641236/Screenshot-from-2012-07-11-173300_hmyneq.png)

## Testing Your Backup

And now you can test a manual backup (using the link in the *backup* menu) to check if all your settings are good. If you have any kind of problem, you can log in to the WordPress Online Backup website, give your encryption password, and download your full backup (files + database). The backup does not offer a WordPress migration either, but I tested it by hand today and you can edit your SQL file and replace all HTTP addresses in the file with the new one, and WordPress works without problems!! :)

Take care of your blog, keep it backed up :D