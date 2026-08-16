---
title: Put your crypted backups on the cloud
date: '2013-11-04T23:00:00+00:00'
slug: put-your-crypted-backups-on-the-cloud
---



Backups are importants to prevent file lose: image if tomorrow the disk with all the photos of your family will die. No more photos of your earlier life will be available... So... <strong>Backups are important</strong>.
But, it's important to keep your data secret. If you decide to use an online storage, and you need to put private data on it (important documents), it's better if no one can read them!

For this reason I'd like to propose you a script which backups your data, crypt them using the GPG system and upload then on Dropbox, or Hubic, or anything else you prefer.
In this example I show a connection to a remote system to backup files and databases (my WebServer with this blog).
<pre><code> <code>#!/bin/bash
LOGFILE=/tmp/vps_db_backup.log
EXPECTED_ARGUMENTS=4
exec 6&gt;&amp;1           # Link file descriptor #6 with the standard output
exec &gt; $LOGFILE     # stdout sent to $LOGFILE

#Check script arguments
if [ $# -ne $EXPECTED_ARGUMENTS ]
then
    exec 1&gt;&amp;6 6&gt;&amp;-
    echo "No arguments supplied."
    echo "Script usage:"
    echo " $0 db_username db_password target_folder dest_mail"
    exit 1
fi
USERNAME=$1
PASSWORD=$2
OUTPUT_FOLDER=$3
DEST_MAIL=$4
FILE_NAME="vps_db_backup_$(date +"%d%m%Y").sql.gz"
echo "Starting VPS Backup: $(date +"%d/%m/%Y %H:%M:%S")"
echo "Backup All VPS DBs"
ssh -C user@yourserver.net "mysqldump --opt --compress --all-databases -u $1 --password='$2' | gzip -9 -c" &gt; $FILE_NAME
echo "Copy Encrypeted backup files to Hubic"
gpg --passphrase-fd 3 --recipient gpg-email-account --encrypt $FILE_NAME 3&lt;gpgsecret
sudo mv $FILE_NAME.gpg /mnt/hubic/default/Backup/VPS/dbs
sudo mv $FILE_NAME $OUTPUT_FOLDER
echo "Backup Completed: $(date +"%d/%m/%Y %H:%M:%S")!"

mail -s "VPS Backup Report" $DEST_MAIL &lt; $LOGFILE

exec 1&gt;&amp;6 6&gt;&amp;-      # Restore stdout and close file descriptor #6.
#rm -f $LOGFILE
echo "Backup Completed!"
exit 0</code></pre>
Some important notes before you can really execute this script.
<ul>
	<li>You need a GPG key on you system to crypt the data. If you already have one you can important on the system if it's not already present:
<pre><code> <code>gpg --import yourgpgkeyfile</code></pre>
</li>
	<li>You need to share a public key with your server to allow ssh automatic connection. The easy way to this, after the creation of the keys
<pre><code> <code>ssh-copy-id user@yourserver.net</code></pre>
</li>
	<li>Create a file containing your gpg password. Here for example named <em>gpgsecret.</em>
<pre><code> <code>echo &gt; gpgsecret &lt;&lt; EOF
yourgpgpwd
EOF
chmod 400 gpgsecret</code></pre>
</li>
</ul>
Now you should be able to execute the script that will connect to your remote server, execute a backup of all databases, crypt backup using gpg, move it to Hubic folder (that could naturally be the Dropbox folder) and send an email with the log.
<pre><code> <code>./yourscript.sh mysql_user 'mysql_pwd' /destination_folder destination_email@server.net</code></pre>
Backup: done.
Secured: done.
