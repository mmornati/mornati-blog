---
title: MCollective oVirt Agent
date: '2012-10-08T22:00:00+00:00'
slug: mcollective-ovirt-agent
---



After some days of tests we produces a first <strong>working<em> </em></strong>version of <a href="http://www.ovirt.org/">oVirt</a> agent for <a href="http://docs.puppetlabs.com/mcollective/">MCollective</a>.

You can find sources of agent on github: <a href="https://github.com/thinkfr/mcoplugins/blob/master/ovirt.rb">https://github.com/thinkfr/mcoplugins/blob/master/ovirt.rb</a>

What we want to do wasn't a complete export of all oVirt functions (if you want to configure it in "expert" mode, it's better to use the oVirt console), but export all the main functions to let you to centralize the control of your virtual farm.

To use it you just need to put <strong>ovirt.rv</strong> and <strong>ovirt.ddl</strong> file on your ovirt machine (where you have installed the ovirt sdk, and it's not necessary to put it directly on the hypervisor), in <em>/usr/libexec/mcollective/mcollective/agent</em>.
Install some gem dependencies: <strong>rbovirt</strong> (&gt;= 0.0.12) that is the oVirt Ruby API we used as the based of this module and <strong>inifile</strong>.

Then you shoud to configure parameters to connect to your oVirt server API. To do this you need to create a file in <em>/etc/kermit/kermit.cfg </em>(why the file is named <a href="http://www.kermit.fr">KermIT</a>? Simply because if few days you will see the oVirt integration in the KermIT webconsole ;)).
<pre><code> [oVirt]
username=admin@internal
password=Password
api_url=https://server.hostname.net/api</code></pre>
And now you are ready to make some tests :)

http://youtu.be/ThwLVH5cm_Q

You can find a the HD demo video of the agent here: <a href="http://www.mornati.net/video_kermit/video/test_ovirt_mco_agent.webm">oVIrt MCollective Agent</a> (webm format)

The actual allowed agent actions, that you can find listed into <a href="https://github.com/thinkfr/mcoplugins/blob/master/ovirt.ddl">ddl</a> file, are:
<ul>
	<li><strong>get_api_version</strong>: get the oVirt installed API version</li>
	<li><strong>list_vms</strong>: list all defined virtual machines (started up or not)</li>
	<li><strong>vm_details</strong>: show the details of the specified VM</li>
	<li><strong>get_clusters</strong>: get liste of defined clusters in the oVirt farm</li>
	<li><strong>get_templates</strong>: get list of defined templates</li>
	<li><strong>get_storagedomains</strong>: get list of storage domains</li>
	<li><strong>start_vm</strong>: start the specified virtual machine</li>
	<li><strong>stop_vm</strong>: stop the provided virtual machine</li>
	<li><strong>create_vm</strong>: create a new virtual machine</li>
	<li><strong>add_network</strong>: add a new network to a vm</li>
	<li><strong>add_storage</strong>: add a new storage to a vm</li>
</ul>
Updates will sort out shortly with, as I said, a complete integration in the KermIT project.
