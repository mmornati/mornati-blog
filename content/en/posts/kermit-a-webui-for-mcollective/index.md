---
title: 'KermIT: a WebUI for MCollective'
date: '2012-01-28T23:00:00+00:00'
slug: kermit-a-webui-for-mcollective
---



Server control and provisioning is everyday more important due to server farms "growth". In reality today server farms are not too big, but using virtualization systems you can have many machines in a single server. So, the problem is (was!!) a way to create or recreate our virtual or physical machines and a simple way to control them.

To accomplished these operations you can find many products on the market, both open source and closed source. My preferred tools are: <a href="http://puppetlabs.com/">Puppet</a>, for the provisioning part, and <a href="http://docs.puppetlabs.com/mcollective/">Mcollective</a> for the control part. The thing I didn't love was that to use these tools you have to execute commands within the CLI (I love CLI tools, but it's difficult to sell products to our customers without anything cool to show. That the reason why Apple does a lot of money today: same thing that the others but with a cool interface ;))... anyway, for this reason we start thinking to an interface to help us use mcollective (and behind to use puppet too), and the implementation we propose is: <strong><a href="http://kermit.fr/">KermIT</a></strong>. A complete and customizable web interface to control and provision your servers.

<a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641450/Screenshot-3_pdiznj.png">![](/images/kermit-a-webui-for-mcollective/00-Screenshot-3_pdiznj.png)</a>

Kermit actually offers many functionalities and we are adding everyday something new. The actual version allow you to discover your mcollective "clients" (machines you can can control), on any machine, it will discover installed agent with all actions (the things you can execute on that machine) and propose you all these operations on the web interface with, if needed, a form to ask you parameters for the execution.

For example, if you want to execute a "<em>service httpd start</em>" operation, in kermit you just select the target server (or you can execute the commands on ALL servers at the same time), select the service agent with the start action, and the interface will propose a window asking you the service name. Nothing to configure, except mcollective with the proper certificates (you can find all instruction on Kermit <a href="http://www.kermit.fr/documentation/">documentation</a> or directly on mcollective documentation for the client configuration).

We also developed platforms to control (and customize) services execution. For example JBoss or PostgreSQL platforms allow you to execute a deploy operation, proposing you autofilled fields using the target server information (you don't have to fill up all fields by hand, but kermit will ask to the target server, for example, the list of available jboss instances).
A complete and customizable, within the web interface, ACL system for application security. You can protect any server, agent and operations using a single username or a group name, so you have the ability to allow critical operations just to administrator (i.e. a developer can deploy a new war in jboss but can't execute any other operation, and can operate just on development machines).

And many many others things...

[tube]http://www.youtube.com/watch?v=WMZodfLfzBw&amp;list=PLE6AD5E02BB4B773D&amp;index=4&amp;feature=plpp_video[/tube]

You can access to other videos on my <a href="http://www.youtube.com/playlist?list=PLE6AD5E02BB4B773D">YouTube page</a>.

We are actually updating and refactoring kermit after a complete tests on a hundreds servers farm... so stay tuned for any update (like the kermit website ;)). Naturally you can install, use and test it using provided RPM repositories (for EL5 at the moment but soon for EL6 too) or, if you prefer, using <a href="https://github.com/kermitfr/kermit-webui">sources</a>.

Any comment is welcome. :)

[gallery link="file" columns="4"]
