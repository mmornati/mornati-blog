---
title: GateOne, an HTML5 SSH shell on your browser
date: '2013-11-12T23:00:00+00:00'
slug: gateone-an-html5-ssh-shell-on-your-browser
---



Sometimes happens I work on networks which only allow HTTP and HTTPS connection. That means I can't connect to any external server using the SSH protocol, I can't connect on FTP servers, ...
A simple way to workaround this limitation, is to install a VPN service that you can reach using the standard HTTPS port; for exemple an OpenVPN server on 443 port.

Today I want to show you the "workaround 2.0": an SSH shell written in HTML5 you can use within any modern browser: <a href="https://github.com/liftoff/GateOne">GateOne</a>.
Following the instructions to install it on CentOS distribution (tested on CentOS6 but I think it should work with the same procedure on CentOS 5 too).

Install <a href="http://www.tornadoweb.org/en/stable/">Tornado</a> WebServer (the one used by default by GateOne)
<pre><code> <code>rpm -Uvh https://github.com/downloads/liftoff/GateOne/tornado-2.4-1.noarch.rpm</code></pre>
Now you can install GateOne using the provided RPM package, or building it using the latest sources:
<pre><code> <code>rpm -Uvh https://github.com/downloads/liftoff/GateOne/gateone-1.1-1.noarch.rpm</code></pre>
Even if into the RPM you have an init.d script to start gateone service, the first time you need to start it up manually using the .py file. This is just to allow GateOne to create all necessary files and SSL certificates:
<pre><code> <code>python /opt/gateone/gateone.py
[W 131113 22:19:49 terminal:181] Could not import the Python Imaging Library (PIL) so images will not be displayed in the terminal
[W 131113 22:19:49 gateone:2893] dtach command not found.  dtach support has been disabled.
[I 131113 22:19:49 gateone:2917] Connections to this server will be allowed from the following origins: 'http://localhost https://localhost http://127.0.0.1 https://127.0.0.1'
[I 131113 22:19:49 gateone:2305] Using google authentication
[I 131113 22:19:49 gateone:2404] Loaded plugins: bookmarks, convenience, example, help, logging, logging_plugin, mobile, notice, playback, ssh
[I 131113 22:19:49 gateone:3054] Listening on https://*:443/
[I 131113 22:19:49 gate one:3060] Process running with pid 11674</code></pre>
Now that all files are correctly generated you can stop GateOne pressing CTRL+C and configure it before starting up the server. On CentOS rpm package, the configuration file is located in <strong>/opt/gateone/server.conf</strong>. The important thing to configure is the property <strong>origins</strong>:
origins = "http://localhost;https://localhost;http://127.0.0.1;https://127.0.0.1;https://ssh.yourserver.com"
where you should specified all allowed "VirtualHost" to connect to your SSH shell.
In the previous setting a user cannot, for exemple, connect to the SSH HTML5 console using the public IP address of the sever (https://ip_add) but it is possible to connect using the server hostname or in local.
On the GateOne documentation you could find a description for any property in this file.

Now, if all is ok, you can startup the GateOne service and connect to your SSH console within the browser:
<pre><code> <code>/etc/init.d/gateone start
chkconfig gateone on</code></pre>
If you use a recent version of Firefox or Chrome you should be able to see the ssh prompt. Actually I see Safari does not work (due to an HTTP Sockets problem) and Internet Explorer... well, is Internet Explorer... Microsoft is still implementing CSS2, you should be able to use GateOne in 10 years. :)

There are some interesting features in GateOne. For example all SSH sessions are logged and recorded. You can use it to create documentation screencast like this one: <a href="http://www.mornati.net/GateOneDemo.html">http://www.mornati.net/GateOneDemo.html</a>
