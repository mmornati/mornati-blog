---
title: 'Cannot shutdown MacOSX: try changing TimeMachine settings'
date: '2013-01-14T23:00:00+00:00'
slug: cannot-shutdown-macosx-try-changing-timemachine-settings
categories:
  - macOS
  - Troubleshooting
tags:
  - mac
  - timemachine
  - shutdown
  - troubleshooting
description: If your Mac won't shut down and gets stuck on the grey circular icon, your Time Machine settings might be the cause. Check your backup disk connection to fix it.
---

## Overview

If you have shutdown problems on your Mac — it never shuts down and it's stuck on the grey circular icon — the culprit might be your Time Machine settings.

I just discovered that my MacBook had problems connecting to the network Time Machine disk (it's not the Time Capsule but a Buffalo NAS)... No backups were being executed, sometimes the system was unusable and couldn't shut down or restart (I had to force the shutdown with the power button).

Well, I don't exactly know the reasons behind the missing connection to the disk, but after resetting my Time Machine settings, everything was back to normal.

So if you have some strange problems with your Mac, check your latest backup and try to force a new one by hand; if it cannot find or connect to your disk... you've found the culprit! :)