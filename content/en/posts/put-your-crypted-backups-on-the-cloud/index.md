---
title: Put your crypted backups on the cloud
date: '2013-11-04T23:00:00+00:00'
slug: put-your-crypted-backups-on-the-cloud
categories:
  - Backup
  - Security
  - DevOps
tags:
  - backup
  - encryption
  - gpg
  - bash
  - cloud
  - hubic
  - dropbox
description: >-
  A script to securely back up your data, encrypt it with GPG, and upload it to
  cloud storage like Dropbox or Hubic.
---

## Overview

Backups are important to prevent file loss. Imagine if tomorrow the disk with all your family photos dies. No more photos of your earlier life will be available... So... **Backups are important**.

But, it's important to keep your data secret. If you decide to use an online storage service and need to store private data on it (important documents), it's better if no one else can read them!

For this reason I'd like to propose you a script which backs up your data, encrypts it using GPG, and uploads it to Dropbox, or Hubic, or anything else you prefer.

In this example, I'm connecting to a remote system to back up files and databases (my web server running this blog).

## The Script

```bash
#!/bin/bash
LOGFILE=/tmp/vps_db_backup.log
EXPECTED_ARGUMENTS=4
exec 6>&1           # Link file descriptor #6 with the standard output
exec > $LOGFILE     # stdout sent to $LOGFILE

#Check script arguments
if [ $# -ne $EXPECTED_ARGUMENTS ]
then
    exec 1>&6 6>&-
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
ssh -C user@yourserver.net "mysqldump --opt --compress --all-databases -u $1 --password='$2' | gzip -9 -c" > $FILE_NAME
echo "Copy Encrypeted backup files to Hubic"
gpg --passphrase-fd 3 --recipient gpg-email-account --encrypt $FILE_NAME 3<gpgsecret
sudo mv $FILE_NAME.gpg /mnt/hubic/default/Backup/VPS/dbs
sudo mv $FILE_NAME $OUTPUT_FOLDER
echo "Backup Completed: $(date +"%d/%m/%Y %H:%M:%S")!"

mail -s "VPS Backup Report" $DEST_MAIL < $LOGFILE

exec 1>&6 6>&-      # Restore stdout and close file descriptor #6.
#rm -f $LOGFILE
echo "Backup Completed!"
exit 0
```

## Prerequisites

Some important notes before you can really execute this script.

- You need a GPG key on your system to encrypt the data. If you already have one, you can import it if it's not already present:
  ```bash
  gpg --import yourgpgkeyfile
  ```

- You need to share a public key with your server to allow automatic SSH connections. The easy way to do this, after creating the keys, is:
  ```bash
  ssh-copy-id user@yourserver.net
  ```

- Create a file containing your GPG passphrase. Here for example named *gpgsecret*:
  ```bash
  echo > gpgsecret << EOF
  yourgpgpwd
  EOF
  chmod 400 gpgsecret
  ```

## Running the Script

Now you should be able to execute the script, which will connect to your remote server, back up all databases, encrypt the backup with GPG, move it to the Hubic folder (that could just as easily be the Dropbox folder), and send an email with the log.

```bash
./yourscript.sh mysql_user 'mysql_pwd' /destination_folder destination_email@server.net
```

Backup: done.
Secured: done.