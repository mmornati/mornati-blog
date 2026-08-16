---
title: 'Script: How to backup Bluehost databases on your PCs'
date: '2013-06-30T22:00:00+00:00'
slug: script-how-to-backup-bluehost-databases-on-your-pcs
---



If you are a backup maniac like me, you like to have multiple ways (and on different locations) to backup all your data.
Even if on bluehost I've some other services making backups of my data, I've also created a script executed by my home computer every night to extract mysql databases to a local NAS.
<pre><code> #!/bin/bash
LOGFILE=/tmp/bluehost_backup.log
EXPECTED_ARGUMENTS=4
exec 6&gt;&amp;1           # Link file descriptor #6 with the standard output
exec &gt; $LOGFILE     # stdout sent to $LOGFILE

#Check script arguments
if [ $# -ne $EXPECTED_ARGUMENTS ]
then
    echo "No arguments supplied."
    echo "Script usage:"
    echo " $0 bluehost_db_username bluehost_db_password target_folder dest_mail"
    exit 1
fi
USERNAME=$1
PASSWORD=$2
OUTPUT_FOLDER=$3
DEST_MAIL=$4
FILE_NAME="bluehost_db_backup_$(date +"%d%m%Y").sql.gz"
echo "Starting Bluehost Backup: $(date +"%d/%m/%Y %H:%M:%S")"
echo "Backup All Bluehost DBs"
ssh -C user@mornati.net "mysqldump --opt --compress --all-databases -u $1 --password='$2' | gzip -9 -c" &gt; $FILE_NAME
sudo mv ./$FILE_NAME $3
echo "Backup Completed: $(date +"%d/%m/%Y %H:%M:%S")!"

mail -s "Bluehost Backup Report" $DEST_MAIL &lt; $LOGFILE

exec 1&gt;&amp;6 6&gt;&amp;-      # Restore stdout and close file descriptor #6.
rm -f $LOGFILE
echo "Backup Completed!"
exit 0</code></pre>
The script make an ssh connection to your Bluehost account, execute the mysqldump and directly download the compressed result (no space is required on your Bluehost account to execute the backup). Then it will send to a provided account, an email with the script log information.

It's important to say that you naturally need an <strong>ssh connection</strong> to your Bluehost account, and you also should copy your home pc ssh public key to Bluehost account to allow <strong>key authentication</strong> (no password required for connection).

To execute the script you should run something like:
<pre><code> ./backup_bluehost_db.sh mornatin 'yourpassword' /mnt/nasbackup/bluehost youremail@mornati.net</code></pre>
Adding this execution line to your crontab, provides you a complete bluehost backup service!

If you have any problem displaying the script in your browser, the source is available on <a href="https://github.com/mmornati/linux-scripts/blob/master/backup_bluehost_db.sh">GitHub</a>.
