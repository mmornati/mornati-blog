---
title: Samsung Set "Scan to PC" Button for Mac OSX
date: '2012-10-11T22:00:00+00:00'
slug: samsung-set-scan-to-pc-button-for-mac-osx
tags:
- samsung
- scanner
- mac
- osx
- samba
categories:
- hardware
description: Step-by-step guide to configure the "Scan to PC" button on Samsung SCX-3405W multifunction printer for Mac OSX using Samba sharing.
---

After many, many, many tests, I finally got a working configuration for my MultiFunction Samsung Printer (SCX 3405W) with the "Scan to PC" button.
This button allows a direct scan to a configured computer (Mac or Windows, even if the config in Windows is really simple and automatic) from your printer: you can remain on your printer (scanner), change as many documents as you want, and go back to your computer just at the end with all documents saved in the desired format.

## Install Samsung Easy Printer Manager

First of all, you need to install the "Samsung Easy Printer Manager" software on your Mac, start it, and go to **Advanced Mode**.

[![](/images/samsung-set-scan-to-pc-button-for-mac-osx/00-Schermata-2012-10-12-alle-22_33_12_fhcgcj.png)](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641153/Schermata-2012-10-12-alle-22_33_12_fhcgcj.png)

[warning]

If you can't reach this window (program crashes when you click the button), like me at the beginning, you should remove it using the Uninstall.sh script included in the downloaded ZIP.
Type in a terminal:

```sh
> sh Uninstall.sh
```

[/warning]

## Configure the Shared Folder

Here you have to select a folder where you want to put the scanned documents. In any manual I found, information indicates that images are sent using the Samba protocol. This means you should allow sharing on that folder in read/write mode!

[![](/images/samsung-set-scan-to-pc-button-for-mac-osx/01-Schermata-2012-10-12-alle-22_33_41_jjbilp.png)](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641150/Schermata-2012-10-12-alle-22_33_41_jjbilp.png)

Then you just have to select the "Enable" radio button at the top of the advanced window in Easy Printer Manager and click Save (if you want, before saving you can change all other parameters).

## Enter the Computer ID

When you click Save, you get a window asking you for an ID to use to identify the computer. On my computer (Italian language with French Keyboard), when I tried to type anything in the textbox, I got a message saying that the input was not allowed (?!!?).
Here again, I finally found that you can just add and use the USA keyboard layout to type your ID!

[![](/images/samsung-set-scan-to-pc-button-for-mac-osx/02-Schermata-2012-10-12-alle-22_31_15_qdl215.png)](https://res.cloudinary.com/blog-mornati-net/image/upload/v1391641214/Schermata-2012-10-12-alle-22_31_15_qdl215.png)

## Done!

If all worked well, you should have a popup message saying that all parameters were correctly saved! Then you can go to your printer, click on the "Scan to" button and magically find your PDF/JPEG/... files in the selected folder!

That's all!

[gallery link="file" columns="4"]