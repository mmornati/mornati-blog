---
title: Aggiornamento Firmware Dell da Linux
date: '2009-12-07T23:00:00+00:00'
slug: aggiornamento-firmware-dell-da-linux
url: /it/aggiornamento-firmware-dell-da-linux/
aliases:
- /aggiornamento-firmware-dell-da-linux
---



Da buon maniaco degli aggiornamenti, nel passaggio dalla F11 alla F12 ho voluto provare anche a dare una ritoccatina al BIOS del PC, visto che usavo la versione A08 ed era stata rilasciata da un po' la A10.

Andando sul sito di Dell per l'aggiornamento, viene ovviamente proposto un simpatico EXE che dovrebbe fare tutto da solo; peccato che su linux il simpatico file EXE non serva assolutamente a niente. Quindi, come già fatto in passato, mi preparo a creare un disco di avvio che mi permetta di aggirare "l'ostacolo" linux e dare nuova vita al mio BIOS.
Fortuna vuole, che durante la ricerca dei tool che mi permettessero di creare tale disco di avvio, mi imbatto in tutt'altro che mi semplifica la vita: il pacchetto <span style="font-weight: bold;">firmware-addon-dell</span> (questo è il nome nei repository fedora, ma immagino che ci sia qualcosa di simile anche per le altre distribuzioni).
<pre><code> yum install firmware-addon-dell</code></pre>
<pre><code> =====================================================
Package Arch Version Repository Size
=====================================================
Installing:
firmware-addon-dell i686 2.1.2-5.3.fc12 fedora 50 k
Installing for dependencies:
firmware-tools noarch 2.1.5-2.1.fc12 fedora 141 k
libsmbios i686 2.2.16-3.1.fc12 fedora 205 k
python-smbios i686 2.2.16-3.1.fc12 fedora 58 k
redhat-rpm-config noarch 9.0.3-18.fc12 fedora 53 k
smbios-utils i686 2.2.16-3.1.fc12 fedora 13 k
smbios-utils-bin i686 2.2.16-3.1.fc12 fedora 38 k
smbios-utils-python i686 2.2.16-3.1.fc12 fedora 52 k</code></pre>
Questa è la lista di tutto quello che vi verrà installato.Finita l'installazione parto in quarta per provare ad eseguire l'aggiornamento che mi ero prefisso.
<pre><code> [root@mmornati ~]# update_firmware

Running system inventory...

Searching storage directory for available BIOS updates...
Checking System BIOS for Latitude D620 - a08
Did not find a newer package to install that meets all installation checks.

This system does not appear to have any updates available.
No action necessary.</code></pre>
La cosa mi lascia ovviamente perplesso! So, dalle informazioni prese dal sito Dell, che esiste il firmware A10, ma questo tool mi dice che non c'è niente per il mio PC! Sarà che non funziona niente?
Mi leggo il man del tool e scopro che in realtà è necessario agganciare dei repository al programma per fare in modo che possa scaricarsi i firmware corretti.
<pre><code> wget -q -O - http://linux.dell.com/repo/community/bootstrap.cgi | bashyum -y install $(bootstrap_firmware)</code></pre>
Questi sono i comandi da lanciare per "installare" i repository dell.
<pre><code> [root@mmornati ~]# wget -q -O - http://linux.dell.com/repo/community/bootstrap.cgi | bash
Downloading GPG key: http://linux.dell.com/repo/community/RPM-GPG-KEY-dell
Importing key into RPM.
Downloading GPG key: http://linux.dell.com/repo/community/RPM-GPG-KEY-libsmbios
Importing key into RPM.
Downloading GPG key: http://linux.dell.com/repo/community/mirrors.cgi?osname=f12&amp;basearch=i386&amp;redirpath=/repodata/repomd.xml.key
Installing dell-firmware-repository-1-4.noarch.rpm
Done!
Dependencies Resolved
======================================================
Package Arch Version Repository Size
======================================================</code></pre>
Chissà che versione sarà il mio PC?! :D

A questo punto è sufficiente lanciare il comando di aggiornamento e riavviare il PC per avviare la procedura di aggiornamento vera e propria (il flashing del bios sulla eeprom).
<pre><code> [root@mmornati ~]# update_firmware --yes

Running system inventory...

Searching storage directory for available BIOS updates...
Checking System BIOS for Latitude D620 - a08
Available: system_bios(ven_0x1028_dev_0x01c2) - a10
Found Update: system_bios(ven_0x1028_dev_0x01c2) - a10

Found firmware which needs to be updated.

Running updates...
 100% Installing system_bios(ven_0x1028_dev_0x01c2) - a10
Done: Update complete. You must perform a warm reboot for the update to take effect.</code></pre>
Assicuro che funziona tutto quanto alla perfezione, infatti ora mi ritrovo con un bel bios A10 sul mio Dell D620!
