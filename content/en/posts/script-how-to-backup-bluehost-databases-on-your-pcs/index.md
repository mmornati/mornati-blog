---
title: 'Script: How to backup Bluehost databases on your PCs'
categories:
- linux-sysadmin
- devops
date: '2013-06-30T22:00:00+00:00'
slug: script-how-to-backup-bluehost-databases-on-your-pcs
tags:
  - bluehost
  - mysql
  - backup
  - bash
  - ssh
  - database
description: A simple bash script to backup your Bluehost MySQL databases to your local machine via SSH, with email notification and cron integration.
---

If you are a backup maniac like me, you like to have multiple ways (and on different locations) to backup all your data.

Even if on Bluehost I have some other services making backups of my data, I also created a script executed by my home computer every night to extract MySQL databases to a local NAS.

## Overview

The script makes an SSH connection to your Bluehost account, executes mysqldump, and directly downloads the compressed result (no space is required on your Bluehost account to execute the backup). Then it sends an email with the script log to a provided account.

It's important to say that you naturally need an **SSH connection** to your Bluehost account, and you also should copy your home PC SSH public key to your Bluehost account to allow **key authentication** (no password required for connection).

## The Script

```bash
#!/bin/bash
LOGFILE=/tmp/bluehost_backup.log
EXPECTED_ARGUMENTS=4
exec 6>&1           # Link file descriptor #6 with the standard output
exec > $LOGFILE     # stdout sent to $LOGFILE

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
ssh -C user@mornati.net "mysqldump --opt --compress --all-databases -u $1 --password='$2' | gzip -9 -c" > $FILE_NAME
sudo mv ./$FILE_NAME $3
echo "Backup Completed: $(date +"%d/%m/%Y %H:%M:%S")!"

mail -s "Bluehost Backup Report" $DEST_MAIL < $LOGFILE

exec 1>&6 6>&-      # Restore stdout and close file descriptor #6.
rm -f $LOGFILE
echo "Backup Completed!"
exit 0
```

## Usage

To execute the script you should run something like:

```bash
./backup_bluehost_db.sh mornatin 'yourpassword' /mnt/nasbackup/bluehost youremail@mornati.net
```

## Automation

Adding this execution line to your crontab gives you a complete Bluehost backup service!

If you have any problem displaying the script in your browser, the source is available on [GitHub](https://github.com/mmornati/linux-scripts/blob/master/backup_bluehost_db.sh).
