---
title: 'VirtualBox Linux: DKMS module build problems'
date: '2011-11-28T23:00:00+00:00'
slug: virtualbox-linux-dkms-module-build-problems
---



After a while I didn't use VirtualBox, the virtualization system I use just to host my Windows virtual machines (all others machines are on KVM), I discovered that I cannot build the DKMS kernel module and so no way to start my Windows virtual machine. Not a big problem, I know :) But sometimes I need to test web application or build procedure on Windows environment.

After some tests I discovered in the build log file the real problem about the VirtualBox build procedure:
<pre><code> fatal error: asm/amd_iommu.h: No such file or directory
compilation terminated.</code></pre>
so, it cannot find the kernel asm/amd module. And the problem is exactly that in the latests version of the kernel this module is removed (or renamed, not sure exactly), but VirtualBox want to use it.

So a quick-and-dirt solution I found is to copy this module from the previous version of kernel. For me it was:
<pre><code> [root@mmornati 2.6.41.1-1.fc15.x86_64]# cp /usr/src/kernels/2.6.40.4-5.fc15.x86_64/arch/x86/include/asm/amd_iommu.h /usr/src/kernels/2.6.41.1-1.fc15.x86_64/arch/x86/include/asm/</code></pre>
After this I build the VirtualBox module without problem (<strong>/etc/init.d/vboxdrv setup</strong>) and started up my virtual machine.
