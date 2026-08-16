---
title: 'MCollective oVirt Agent'
date: '2012-10-08T22:00:00+00:00'
slug: mcollective-ovirt-agent
categories:
  - DevOps
  - System Administration
  - Tools
  - Virtualization
tags:
  - mcollective
  - ovirt
  - kermit
  - virtualization
  - ruby
  - puppet
description: >-
  A first working version of an oVirt agent for MCollective, enabling centralized
  control of your virtual farm through simple commands.
---

## Overview

After some days of testing we produced a first **working** version of an [oVirt](http://www.ovirt.org/) agent for [MCollective](http://docs.puppetlabs.com/mcollective/).

You can find the source code on GitHub: [https://github.com/thinkfr/mcoplugins/blob/master/ovirt.rb](https://github.com/thinkfr/mcoplugins/blob/master/ovirt.rb)

What we wanted wasn't a complete export of all oVirt functions (if you want to configure it in "expert" mode, it's better to use the oVirt console), but rather to expose the main functions so you can centralize control of your virtual farm.

## Installation

To use it you just need to put **ovirt.rb** and **ovirt.ddl** on your oVirt machine (where you have the oVirt SDK installed; it does not need to be on the hypervisor itself), in `/usr/libexec/mcollective/mcollective/agent`.

Install the following gem dependencies:

- **rbovirt** (>= 0.0.12), the oVirt Ruby API we used as the basis for this module
- **inifile**

## Configuration

Then you should configure the parameters to connect to your oVirt server API. To do this you need to create a file at `/etc/kermit/kermit.cfg` (why is the file named [KermIT](http://www.kermit.fr)? Simply because in a few days you will see the oVirt integration in the KermIT webconsole ;)).

```ini
[oVirt]
username=admin@internal
password=Password
api_url=https://server.hostname.net/api
```

And now you are ready to run some tests :)

## Demo

http://youtu.be/ThwLVH5cm_Q

You can find the HD demo video of the agent here: [oVirt MCollective Agent](http://www.mornati.net/video_kermit/video/test_ovirt_mco_agent.webm) (webm format)

## Available Actions

The currently supported agent actions (listed in the [DDL file](https://github.com/thinkfr/mcoplugins/blob/master/ovirt.ddl)) are:

- **get_api_version** — get the oVirt installed API version
- **list_vms** — list all defined virtual machines (started or not)
- **vm_details** — show the details of the specified VM
- **get_clusters** — get the list of defined clusters in the oVirt farm
- **get_templates** — get the list of defined templates
- **get_storagedomains** — get the list of storage domains
- **start_vm** — start the specified virtual machine
- **stop_vm** — stop the provided virtual machine
- **create_vm** — create a new virtual machine
- **add_network** — add a new network to a VM
- **add_storage** — add new storage to a VM

Updates will come out shortly with, as I said, a complete integration in the KermIT project.