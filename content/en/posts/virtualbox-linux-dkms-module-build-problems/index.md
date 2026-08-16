---
title: 'VirtualBox Linux: DKMS module build problems'
date: '2011-11-28T23:00:00+00:00'
slug: virtualbox-linux-dkms-module-build-problems
categories:
  - Virtualization
  - Linux
  - System Administration
tags:
  - virtualbox
  - linux
  - dkms
  - kernel
  - module
  - kvm
  - fedora
description: >-
  A quick-and-dirty fix for a VirtualBox DKMS kernel module build failure
  caused by a missing asm/amd_iommu.h header in newer Linux kernels.
---

## Introduction

After not using VirtualBox for a while, the virtualization system I use just to host my Windows virtual machines (all other machines are on KVM), I discovered I couldn't build the DKMS kernel module and so there was no way to start my Windows virtual machine. Not a big problem, I know :) But sometimes I need to test web applications or build procedures on a Windows environment.

## The Problem

After some tests I discovered in the build log file the real problem with the VirtualBox build procedure:

```c
fatal error: asm/amd_iommu.h: No such file or directory
compilation terminated.
```

so, it couldn't find the kernel asm/amd module. And the problem is exactly that in the latest version of the kernel this module is removed (or renamed, not sure exactly), but VirtualBox still wants to use it.

## The Solution

So a quick-and-dirty solution I found is to copy this module from the previous version of kernel. For me it was:

```bash
[root@mmornati 2.6.41.1-1.fc15.x86_64]# cp /usr/src/kernels/2.6.40.4-5.fc15.x86_64/arch/x86/include/asm/amd_iommu.h /usr/src/kernels/2.6.41.1-1.fc15.x86_64/arch/x86/include/asm/
```

After this I built the VirtualBox module without problem (`/etc/init.d/vboxdrv setup`) and started up my virtual machine.