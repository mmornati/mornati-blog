---
title: 'MCollective: Windows agents and facts'
date: '2013-10-27T23:00:00+00:00'
slug: mcollective-windows-agents-and-facts
---



I'm actually creating some agents and facts for MCollective running on Windows Server.
All agents are developped on WindowsXP machine and then tested and deployed on Windows Server 2003 and Windows Server 2008.

You can find all the sources on my github repo: <a href="https://github.com/mmornati/mcollective-windows">https://github.com/mmornati/mcollective-windows</a>

On the README.md file there is a description of facts and agents I created with a little usage doc.
Actually there are:
<ul>
	<li>DNS Fact: add dns information on inventory response</li>
	<li>Service Agent: to show windows services status and control them</li>
	<li>EventLog Agent: to get event log messages</li>
</ul>
Enjoy, and if you will use them, let me know if you found any problem/bug.
