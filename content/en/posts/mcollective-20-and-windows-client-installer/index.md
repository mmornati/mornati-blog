---
title: MCollective 2.0 and Windows Client Installer
date: '2012-05-18T22:00:00+00:00'
slug: mcollective-20-and-windows-client-installer
---



With MCollective version <a href="http://puppetlabs.com/misc/download-options/">2.0</a> we have now support to control Windows Servers. The only thing you must take care is that you need to update all your infrastructure to mco 2.0 because you cannot control servers that have a different version installed.

This allow us to complete the support of our KermIT project, that is actually (we have many enhancements in development ;)) a web interface to control mcollective infrastructure adding windows support. The "problem" was that no windows package was available during our tests and, knowing that usual production environment servers could not have access to internet, this could cause installation problem.

For this reason we developed and create an installer for windows server using <a href="http://rake.rubyforge.org/">Rake</a> (make for ruby project) and <a href="http://www.jrsoftware.org/isinfo.php">Inno Setup</a> to create the final .exe setup file.

If you want to test it you can find the installer (and source for Rake file) <a href="http://repos.mornati.net/mcollective/">here</a>.

Enjoy and report us any problem.
