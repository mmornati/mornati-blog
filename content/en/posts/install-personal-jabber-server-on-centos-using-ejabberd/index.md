---
title: Install personal Jabber Server on CentOS using ejabberd
date: '2014-03-30T22:00:00+00:00'
slug: install-personal-jabber-server-on-centos-using-ejabberd
---



Here a little doc to install a jabber server on CentOS machine.

### eJabberd Installation

On your server type, as root user:

<pre class="language-bash command-line" data-user="root" data-host="server"><code class="language-bash">yum -y install ejabberd
</code></pre>

Create an admin user for your server using the cli interface:

<pre class="language-bash command-line" data-user="root" data-host="server"><code class="language-bash">ejabberdctl register admin localhost yourpassword
</code></pre>

Give to created user admin privileges. To do this modify the **/etc/ejabberd/ejabberd.cfg**

<pre class="language-bash"><code class="language-bash">%% Admin user
{acl, admin, {user, "admin", "localhost"}}.

%% Hostname
{hosts, ["localhost"]}.
</code></pre>

Now you can start the server:

<pre class="language-bash command-line" data-user="root" data-host="server"><code class="language-bash">/etc/init.d/ejabberd start
</code></pre>

### Create a user

From now you can execute any setting operation directly via the web interface, but... I prefer the cut&paste way. So... to add a new via cli, you can execute:

<pre class="language-bash command-line" data-user="root" data-host="server"><code class="language-bash">ejabberdctl register username yourdomain userpassword
</code></pre>

changing *username*,*userpassword* and *yourdomain* with what you prefer.

By now you can connect using a jabber client to the configured server.
By default the configured server port is **5222**.

### Configure DNS

If you want to expose your server using an host/dns name, you should configure your dns server adding:

Doc DNS:

<pre class="language-bash"><code class="language-bash">_xmpp-client._tcp.example.net. TTL IN SRV priority weight port target
_xmpp-server._tcp.example.net. TTL IN SRV priority weight port target
_xmpp-client._tcp.example.net. 86400 IN SRV 5 0 5222 example.net. 
_xmpp-server._tcp.example.net. 86400 IN SRV 5 0 5269 example.net.
</code></pre>

Now you have an xmpp-server identified for your **example.net** domain.

Via: [Source](https://www.digitalocean.com/community/articles/how-to-install-ejabberd-xmpp-server-on-ubuntu">https://www.digitalocean.com/community/articles/how-to-install-ejabberd-xmpp-server-on-ubuntu "Source"), [Dns](http://wiki.xmpp.org/web/SRV_Records">http://wiki.xmpp.org/web/SRV_Records< "DNS")
