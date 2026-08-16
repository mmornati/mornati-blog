---
title: How to build MCollective Windows package
date: '2013-10-26T22:00:00+00:00'
slug: how-to-build-mcollective-windows-package
---



What I'm describing is surely not the best method to build a windows package... but it works and is scriptable (I.e. building it with Jenkins).

To proceed, you need to install the following tools on your Windows (build) machine:
* Ruby 1.8.7 or later
* Ruby binaries in your PATH environnement variable (rake, ruby and gem will be used)
* InnoSetup 5 (<a href="http://www.jrsoftware.org/isinfo.php">http://www.jrsoftware.org/isinfo.php</a>)

From my <a href="https://github.com/mmornati/mcollective-windows-builder">github repo</a> you can download the builder scripts which contains a <em>Rakefile</em> and <em>install_gems.bat</em>.
The <em>Rakefile</em> is the script you will then call to execute all the build tasks;<em> install_gems.bat</em> is a batch file packaged into the installer and it will be called in the <em>post installation</em> step to install all gems dependencies.
<h2>Configure Package Script</h2>
Before you can start the build script you should check in the downloaded Rakefile if all parameters are corrects for the build environment you are using.
<pre><code> <code># set constant values:
LIB_FOLDER = File.expand_path('./lib')
INSTALL_FOLDER = File.expand_path('./install')
ISCC = "C:/Programmi/Inno Setup 5/iscc.exe"
ISS_FILE = "#{INSTALL_FOLDER}/Setup.iss"

APP_TITLE = "Marionette Collective"
EXE_NAME = "mcollective"
EXE_BASENAME = "mcollective"
APP_VERSION = "2.3.2"</code></pre>
In particular you have to check the <em>ISCC</em> variable with the path to your InnoSetup binary file.
<h2>Prepare the installation environment</h2>
To build the desired version of mcollective you just need to download mcollective <em>tgz</em> sources from <a href="http://downloads.puppetlabs.com/mcollective/">http://downloads.puppetlabs.com/mcollective/, </a>extract the downloaded package into preferred location and copy the two previously described file in the sources dir.
<ul>
	<li>Rakefile sould be copied into sources root dir (i.e. C:projectsmcollective)</li>
	<li>install_gems.bat into <em>bin</em> subfolder (i.e. C:projectsmcollectivebin)</li>
</ul>
This one is, for exemple, my mco source dir

[caption id="attachment_889" align="aligncenter" width="150"]<a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641039/mco_root_sources_no4bjl.png">![Mcollective sources root folder](/images/how-to-build-mcollective-windows-package/00-mco_root_sources_no4bjl.png)</a> Mcollective sources root folder[/caption]

[caption id="attachment_888" align="aligncenter" width="150"]<a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641041/mco_bin_folder_mu0djh.png">![Mcollective Binary Folder](/images/how-to-build-mcollective-windows-package/01-mco_bin_folder_mu0djh.png)</a> Mcollective Binary Folder[/caption]

Now you are ready to create the installer package.
Open a Windows <em>CMD</em> console, move to mcollective sources folder and execute Rake:
<pre><code> <code>C:projectsmcollective-2.3.2&gt; rake</code></pre>
If the compilation worked well, you should have a sucessful message at the end:
<pre><code> <code>Successful compile (4,547 sec). Resulting Setup program filename is:
C:projectsmcollective-2.3.2installmcollective_Setup.exe</code></pre>
That means you have your installer file into the <em>install</em> subfolder.
<h2>Convert into MSI</h2>
Following procedure is surely not the best way to create an MSI windows package. Maybe in the future I'll try to convert the build script using the <a href="http://wixtoolset.org/">WIX toolset</a> project which creates directly a <em>real</em> MSI package.
Anyway... Using <a href="http://www.exemsi.com/inno-setup-and-msi">MSI Wrapper</a> you can select the Mcollective EXE installer created with InnoSetup and convert it into a simple MSI.On my github repo, into <em>exe2msi</em> subfolder you can find two pre-configured MSI Wrapper scripts to create a <em>Silent Installation MSI</em> or a <em>Normal MSI</em>.

All packages created with this method are available on <a href="http://repos.mornati.net/mcollective/">http://repos.mornati.net/mcollective/</a>
