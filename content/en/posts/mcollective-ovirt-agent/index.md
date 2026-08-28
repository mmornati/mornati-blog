---
title: 'MCollective oVirt Agent'
categories:
- devops
date: '2012-10-08T22:00:00+00:00'
slug: mcollective-ovirt-agent
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

Copy the agent file to your MCollective agent directory:

```bash
sudo cp ovirt.rb /usr/libexec/mcollective/mcollective/agent/
```

Or if you're using the plugin directory:

```bash
sudo cp ovirt.rb /etc/puppetlabs/mcollective/plugins/
```

## Available Actions

The agent provides the following actions:

- **vm_list** — list all virtual machines in your oVirt farm
- **vm_status** — get the status of a specific VM
- **vm_start** — start a virtual machine
- **vm_stop** — stop a virtual machine
- **vm_create** — create a new virtual machine from a template
- **host_list** — list all hypervisor hosts

## Usage Examples

List all VMs:

```bash
mc-ovirt vm_list
```

Start a specific VM:

```bash
mc-ovirt vm_start vmname=my-vm
```

## Integration with KermIT

This agent is also fully integrated with [KermIT](http://www.kermit.fr), our web UI for MCollective, providing a graphical interface for managing your oVirt resources without needing to use the command line.