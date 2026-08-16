---
title: Samsung set "Scan to PC" button for Mac OSX
date: '2012-10-11T22:00:00+00:00'
slug: samsung-set-scan-to-pc-button-for-mac-osx
---



After many and many, many, ... tests, I finally got a working configuration for my MultiFunction Samsung Printer (SCX 3405W) with "Scan to PC" button.
This button allow a direct scan to a configured computer (Mac or Windows, even if the config in Windows is really simple and automatic) from your printer: you can remain on your printer (scanner), change as many document as you want, and go back to your computer just in the end with all documents saved in the desired format.

First of all you need to install "Samsung Easy Printer Manager" software on your Mac, start it, and go to <strong>Advanced Mode</strong>.
<p style="text-align: center;"><a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641153/Schermata-2012-10-12-alle-22_33_12_fhcgcj.png" target="_blank">![](/images/samsung-set-scan-to-pc-button-for-mac-osx/00-Schermata-2012-10-12-alle-22_33_12_fhcgcj.png)</a></p>
[warning]

If you can't reach this window (program crash when you click on the button) like me at the beginning, you should remove it using the Uninstall.sh script included in the downloaded ZIP.
Type, in a terminal:
<pre><code>>sh Uninstall.sh</code></pre>
[/warning]

Here you a have to select a folder where you want to put the scanned documents. But, in any manual I found information that images are sent using the samba protocol. This means you should allow sharing on that folder in read/write mode!!
<p style="text-align: center;"><a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641150/Schermata-2012-10-12-alle-22_33_41_jjbilp.png" target="_blank">![](/images/samsung-set-scan-to-pc-button-for-mac-osx/01-Schermata-2012-10-12-alle-22_33_41_jjbilp.png)</a></p>
Then you have just to select "Enable" radio button at the top of the advanced windows in Easy Printer Manager and click save (if you want,  before saving you can change all other parameters you want).
When you click save you have a window asking you for an ID to use to identify the computer. With my computer (Italian language with French Keyboard) when I tried to type anything in the textbox I got a message saying that the input was not allowed (?!!?).
Here again I finally found that you can just add and use the USA keyboard layout and you can type your ID!
<p style="text-align: center;"><a href="https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641214/Schermata-2012-10-12-alle-22_31_15_qdl215.png" target="_blank">![](/images/samsung-set-scan-to-pc-button-for-mac-osx/02-Schermata-2012-10-12-alle-22_31_15_qdl215.png)</a></p>
If all worked well you should have a popup message saying that all parameters were correctly saved! Then you can go to your printer, click on "Scan to" button and magically found your PDF/JPEG/... on the selected folder!

That's all!

[gallery link="file" columns="4"]
