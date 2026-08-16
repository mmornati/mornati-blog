---
title: Mcollective 2.3.2 Windows Installer
date: '2013-10-24T22:00:00+00:00'
slug: mcollective-232-windows-installer
---



I recently get back working on <a href="http://docs.puppetlabs.com/mcollective/">MCollective</a> for windows for one of our customers and, after searches on google, I discovered that <a href="http://puppetlabs.com">Puppet Labs</a> apparently decided to release the MCollective package for windows only with Puppet Enterprise. Really strange things...

Anyway, MCollective is an opensource project, I need a package for windows to script installation in an easy way: I create the installation package. I love opensource :D
In the <a href="http://blog.mornati.net/2012/05/19/mcollective-2-0-and-windows-client-installer/">past</a> I've already created package for the 2.0.0 version, so I just retrieved the old script and repackage latest sources.

You can find windows packages here:
<a href="http://repos.mornati.net/mcollective/">http://repos.mornati.net/mcollective/</a>

You can install mcollective using the graphical wizard, but if you want to script it using, for example, puppet you need to skip the wizard and proceed with a silent installation.
<pre><code> mcollective_2_3_2_Setup.exe /VERYSILENT /LOG="mco_install.log" /DIR="C:\mcollective"</code></pre>
On the InnoSetup (the tool I used to package Mcollective) you can find a list of all available cli parameters: <a href="http://www.jrsoftware.org/ishelp/index.php?topic=setupcmdline">http://www.jrsoftware.org/ishelp/index.php?topic=setupcmdline
N</a>aturally to get it working, your server should have a Ruby version installed and have the binary folder into the PATH environment variable.

After you configured the <em>server.cfg</em> file with AMQP server and security information, you can startup the service. You can find it in the Windows Services tool and the service name is "The Marionette Collective".

Your windows machine is now in you mcollective network!
