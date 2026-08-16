---
title: 'XChat2 script: post to Twitter'
date: '2011-10-04T22:00:00+00:00'
slug: xchat2-script-post-to-twitter
categories:
  - Development
  - IRC
  - Scripting
tags:
  - xchat
  - irc
  - twitter
  - python
  - script
  - notification
  - dm
description: >-
  Forward IRC private messages to Twitter DM using a simple XChat Python script.
---

## Introduction

If you have an XChat instance running on a server 24 hours a day and you access it once a day (or less like me), you might miss a lot of private messages (or Direct Messages using IRC naming) that you won't see for days. So, to receive a notification for any Direct Message (both for main chat and private one), you can add to your XChat a simple script to forward any message to another service (like Email, Twitter, Facebook or what you prefer). Here I'll show a script to send a message privately to you on Twitter.

## The Script

```python
 # XChat Twitter DM notify plugin
# Copyright (C) 2011 Marco Mornati <ilmorna@gmail.com>
#
#   This library is free software; you can redistribute it and/or modify it
#   under the terms of the GNU Lesser General Public License as published by the
#   Free Software Foundation; either version 3 of the License, or (at your
#   option) any later version.
#
#   This library is distributed in the hope that it will be useful, but WITHOUT
#   ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
#   FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
#   for more details.
#
# This script will check any chat message to you in your xchat (in DirectMessage are or in main chat directed to you)
# and will send a direct message to the configured twitter account.
# To use it you need to create a new application in your twitter account to retrieve consumer_key, secrets and access information
# Your application should naturally has read and write access to your twitter account
#

__module_name__ = "twitternotify"
__module_version__ = "0.1"
__module_description__ = "Notify direct messages to twitter"

import os
import twitter
pid = os.getpid()

import xchat
xchat.prnt(__module_description__ + " loaded")

def send_dm_twitter(word):
    api = twitter.Api(consumer_key='yourkey', consumer_secret='yoursecret', access_token_key='acctoken', access_token_secret='accsecret')
    credentials = api.VerifyCredentials()
    if credentials:
        print "Logged as %s" % credentials.name

    status = api.PostDirectMessage('twitter_nick', '%s: %s' % (word[0], word[1]))
    print status.created_at

def focus_cb(word, word_eol, userdata):
    send_dm_twitter(word)
    return xchat.EAT_NONE

def highlight_cb(word, word_eol, userdata):
    send_dm_twitter(word)
    return xchat.EAT_NONE

def private_cb(word, word_eol, userdata):
    send_dm_twitter(word)
    return xchat.EAT_NONE

xchat.hook_print("Focus Tab", focus_cb)
xchat.hook_print("Channel Action Hilight", highlight_cb)
xchat.hook_print("Channel Msg Hilight", highlight_cb)
xchat.hook_print("Private Message", private_cb)
xchat.hook_print("Private Message to Dialog", private_cb)
```

## Setup Instructions

The only things you have to do are:

- Create a new application in your Twitter account (going to the [OAuth](https://developer.twitter.com/) page). All keys and secrets must be substituted where you initialize your Twitter Api (`twitter.Api` line in the script). One thing to remember is the application you are creating must have **read and write** access to your account.
- Change the target username (in the script it is **twitter_nick**). For example, if you want to receive a private message to your Twitter account when a Direct Message is sent to you in XChat, here you have to put your Twitter username.
- Install the script in your XChat (usually `$HOME/.xchat2` folder). You can also test the script just by loading it using the menu option *Load plugin or script*.

## Testing

That's all. If all worked well, you can test sending a private message to you on IRC and you should receive a private message on Twitter :D Let me know if you have any better idea to do the same thing, or if you have problem and/or fix on the proposed script.
