---
title: 'XChat2 script: post to Twitter'
date: '2011-10-04T22:00:00+00:00'
slug: xchat2-script-post-to-twitter-1
---



<p>If you have an XChat instance running on a server 24 hours a day and you access it once a day (or less like me), you should receive lot of private messages (or Direct Messages using IRC naming) that you will see after days. So, to allow you to directly receive a notify for any Direct Message (both for main chat and private one), you can add to your XChat a simple script to forward any message to another service (like EMail, Twitter, Facebook or what you prefer). Here I'll show a script to send a message privately to you on twitter.</p>
<pre><code> # XChat Twitter DM notify plugin
# Copyright (C) 2011 Marco Mornati &lt;ilmorna@gmail.com&gt;
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
xchat.hook_print("Private Message to Dialog", private_cb)</code></pre>
<p>The only things you have to do are:</p>
<ul>
<li>Create a new application in your twitter account (going to <a href="https://dev.twitter.com/apps">OAuth</a> page). All key and secrets must be substituted where you initialize your twitter Api (twitter.Api line on the scripts). A things to remember is the application you are creating must has <strong>read and write</strong> access to your account</li>
<li>Change the target ussername (in the script is <strong>twitter_nick</strong>). For example, you if you want to receive a private message to your twitter account when a DirectMessage is sent to you in xchat, here you have to put your twitter username.</li>
<li>Install script in your xchat (usually $HOME/.xchat2 folder). You can also test the script just loading id using the menu voice <em>Load plugin or script</em></li>
</ul>
<p>That's all. If all worked well, you can test sending a private message to you on IRC and you should receive a private message on twitter :D Let me know if you have any better idea to do the same thing, or if you have problem and/or fix on the proposed script.</p>
