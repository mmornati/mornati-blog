---
title: Wordpress Online Backup
date: '2012-07-10T22:00:00+00:00'
slug: wordpress-online-backup
---



The first rule for a correct backup is to store your backup file(s) on a different server than the one you are backupping. So, even if you can find many wordpress backup plugin opensource, many of those just execute backup in a folder of the same server where you have wordpress installed. So you just remember to download these files on your local computer to have something safe.

But, after a little browsing inside all the wordpress plugin I also found some others interesting way to execute your backup (to DropBox, to GDrive, ...), but what I chose in the end is <a href="http://wordpress.org/extend/plugins/wponlinebackup/"><strong>Online Backup</strong></a>. The reason is that, even if it's a free plugin has many power features!

After the installation you have an <em>Online Backup</em> link inside Tools menu in your admin area.
<p style="text-align: center;"><a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641237/Screenshot-from-2012-07-11-173208_jxxbtg.png" target="_blank">![](/images/wordpress-online-backup/00-Screenshot-from-2012-07-11-173208_jxxbtg.png)</a></p>
You have just some little steps to configure it: define a schedule for you backup, choosing if you want a full or an incremental backup (the incremental is available just if you select Online backup), setup you online account (optional), define the encryption method and password (optional) and that's all.
Yes, we need to create another account for a free online service, but why not? We give our personal information to any kind of supermarket and we almost have nothing back (just a bit of spam).
The link for the account registration is directly proposed by plugin and you will have (with the free account) 100mb to use to backup your wordpress (or more than one) blog.
<p style="text-align: center;"><a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641236/Screenshot-from-2012-07-11-173300_hmyneq.png" target="_blank">![](/images/wordpress-online-backup/01-Screenshot-from-2012-07-11-173300_hmyneq.png)</a></p>
And now you can test a manual backup (using the link in the <em>backup </em>menu) to check if all your settings are good. If you will have any kind of problem you can login into Wordpress Online Backup website, give your encryption password and download your full backup (files + database). The backup will not offer a wordpress migration too, but I tested it by hand today, you can edit your sql file and replace all http address in the file with the new one, and wordpress will works without problems!! :)

Take care of your blog, keep it backupped :D

[gallery link="file" columns="4"]
