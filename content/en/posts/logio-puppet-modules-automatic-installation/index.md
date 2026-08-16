---
title: 'Logio Puppet Modules: automatic installation'
date: '2014-03-30T22:00:00+00:00'
slug: logio-puppet-modules-automatic-installation
categories:
  - DevOps
  - Configuration Management
tags:
  - puppet
  - logio
  - logging
  - devops
  - automation
description: 'A Puppet module for automatic installation of Logio server and harvester clients, with configuration examples for log streams.'
---

I created a puppet module allowing you to automatically install logio server and/or harvester (logio client).

https://github.com/mmornati/puppet-logio

As you can see into the readme file, the usage of this module is really simple.

## Server Installation

To install the server you just need to include on your node definition the module ''logio::server''. With an external node yaml classifier, for example, the configuration should be:

```yaml
---
classes:
   logio::server:
```

## Harvester (Client) Installation

To install a client you have the ''logio::harvester'' module. You can simply add this module on your node definition, with the server parameter pointing to your logio server ip address:

```yaml
---
classes:
   logio::harvester:
      logio_server: 127.0.0.1
```

## Add Logs And/or Streams

To add a new log for your servers you can modify the templates ''templates/harvester.conf.erb''. You can simply add a new log file path to the default stream (system) or create a new stream with logs for it.
Here's an example template including apache logs:

```puppet
exports.config = {
nodeName: "<%= fqdn %>",
  logStreams: {
    system: [
      "/var/log/messages",
      "/var/log/secure"
    ],
    apache: [
      "/var/log/httpd/access_log",
      "/var/log/httpd/error_log",
    ],
  },
  server: {
    host: '<%= logio_server %>',
    port: 28777
  }
}
```

You can then simply access to your installed logio server, pointing your browser to:

`http://logio.ip.address:28778`

where *logio.ip.address* the machine's address or dnsname of your logio server.
All harvester will then send new logs with a socket connection to your browser.