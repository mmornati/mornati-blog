---
title: 'How I built gphoto2proton to migrate 354GB of Google Photos to Proton '
tags:
- migration
- self-hosted
- open-source
- google-photos
- proton
categories: [Development, Open Source, Migration]
date: '2026-08-01T18:04:49.167000+00:00'
slug: how-i-built-gphoto2proton-to-migrate-354gb-of-google-photos-to-proton
description: How I built a script to migrate 354GB from Google Photos to Proton. Why
  Drive and Photos are different APIs, and the two tools I needed to bridge them
---
If you're reading this, you're probably in the same boat I was: a happy Proton subscriber who wants to leave Google Photos behind, but can't find a straightforward migration path, especially if you're not on Windows.

The official Proton desktop apps handle photo upload natively on Windows, but on macOS and Linux you're left with the `proton-drive` CLI and documentation that doesn't tell you half of what you need to know. After spending days going down rabbit holes, I built [gphoto2proton](https://github.com/mmornati/gphoto2proton) (with Claude's help), and learned some hard lessons about Proton's architecture along the way.

## The Pain Point

Google Takeout gives you your photos as a set of multi-gigabyte `.tgz` archives. Each archive contains your media files alongside JSON sidecar files with metadata (capture date, GPS location, description) and `album.json` files describing your album structure.

If you're on Windows, the Proton Drive desktop app just works: it uploads to both Drive and Photos. But on other platforms, you're missing features. Album creation, in particular, has no official API or tooling. The `proton-drive` CLI (v0.7.0, released July 31, 2026) has `photo upload` and `album create` subcommands in its source code, but neither the CLI's README nor Proton's official support page mentions them. They show up in `proton-drive --help`, but you'd have to know to look.

## The Architecture Problem: Drive ≠ Photos

Here's the first thing nobody tells you: **Proton Drive and Proton Photos are not the same thing**.

They share a backend (your files end up in the same encrypted storage, though based on what I can see through the Drive API, even the encrypted storage is different between the two services), but they're accessed through completely different APIs:

*   **Proton Drive** uses the standard Drive API: files go to "My Files", manageable through the SDK, the CLI's `filesystem` commands, or third-party bridges like rclone.
    
*   **Proton Photos** has a separate API at `photos-api.proton.me` (undocumented): the photo timeline and albums live in a protected volume that regular Drive API calls can't touch.
    

This distinction matters because uploading a photo to your Drive folder does **not** make it appear in your Photos timeline. Two completely different operations.

## Approach 1: The Go Binary - Cross-Platform but Compromised

My first attempt was a Go CLI binary that could run on macOS, Linux, and Windows. It used the [rclone/Proton-API-Bridge](https://github.com/rclone/Proton-API-Bridge) library: a third-party SDK that wraps Proton's Drive API with the necessary encryption and authentication.

The approach was elegant on paper:

1.  **Streaming reader**: read `.tgz` archives directly without extracting to disk (saving 80GB+ of temporary space per archive)
    
2.  **EXIF restoration**: pipe each file through `exiftool` to embed the original `photoTakenTime.timestamp` from Google's JSON sidecar
    
3.  **Upload to Drive**: via the Proton-API-Bridge SDK, files land in a `gphoto2proton` folder under My Files
    
4.  **Album creation**: via direct HTTP calls to the undocumented `photos-api.proton.me/photos/v1/albums` endpoint
    

The Go binary works well and is still the best option if you need cross-platform support. But it has a fundamental limitation: photos end up in your Drive folder, not in the Photos timeline. You can see them in the Photos web app (Proton does scan Drive for photos), but they don't get the full timeline treatment, correct dates, album association, etc.

The album creation via the undocumented Photos API is also fragile. It's reverse-engineered from web traffic, there's no contract or changelog, and it could break at any Proton update.

## Approach 2: The Bash Script - Do It Right

After wrestling with the Go approach, I discovered that the official `proton-drive` CLI (from [ProtonDriveApps/sdk](https://github.com/ProtonDriveApps/sdk)) has undocumented `photo` and `album` subcommands that talk directly to the Photos API through Proton's own code.

This led to a second, completely different approach: a bash script that wraps the CLI and handles the full pipeline:

1.  **Extract**: `tar xzf` one archive at a time
    
2.  **Apply capture dates**: for videos, the CLI falls back to filesystem mtime, so the script reads `photoTakenTime.timestamp` from the JSON sidecar and sets it via `touch -t`
    
3.  **Upload**: `proton-drive photo upload -c skip` uploads directly to the Photos timeline (deduplicating by content hash)
    
4.  **Verify**: re-run upload (should transfer 0) + check every SHA1 is in the timeline
    
5.  **Albums**: `proton-drive album create` + `album add-photo` recreates albums with photos in batches of 200
    
6.  **Validate**: confirm every expected photo exists in each album on the server
    
7.  **Cleanup**: remove extracted files, mark archive done
    

This approach puts photos exactly where they should be: in the Photos timeline with working albums. The downsides:

*   **Linux only** - the script uses `flock`, GNU `stat`, and assumes `pass` for credentials
    
*   **Disk-heavy** - extracts each 50GB archive to ~80GB on disk before uploading
    
*   **Slower** - no streaming; extract-wait-upload-wait-cleanup cycle per archive
    

## Why Two Approaches?

Because Proton's architecture forced my hand. The Go binary is the right tool if:

*   You're on macOS or Windows
    
*   You want streaming (no disk extraction)
    
*   You're OK with photos in Drive (not the Photos timeline)
    

The bash script wins if:

*   You're on Linux (or can spin up a Linux box)
    
*   You want photos in the Photos timeline with working albums
    
*   You have enough disk space for temporary extraction
    

I use both: the Go binary for a quick cross-platform option, the bash script for the "proper" import to Photos.

## The Tool

The project is [gphoto2proton](https://github.com/mmornati/gphoto2proton), open-source (MIT). It includes:

*   A Go CLI binary with streaming archive reading, EXIF restoration, SQLite-based resume safety, and 126 passing tests
    
*   A bash script for full Photos timeline import via the `proton-drive` CLI
    
*   Full documentation at [gphoto2proton.mornati.net](https://mmornati.github.io/gphoto2proton/)
    
*   Homebrew formula for easy macOS/Linux install (`brew install gphoto2proton`)
    

The migration is not trivial — ~354GB across 9 archives — but the result is worth it: all photos in Proton Photos with albums intact, dates correct, and no Google account needed.

## Script execution sample

If you follow the documentation, you will be ready to go in few minutes. I put here the bash script output to let you see what it allows for you. I think this saves me days (weeks?) in manual operations.

```bash
TAKEOUT_DIR=/media/12tb/photos ~/gphoto2proton/gphoto2proton-import.sh
[19:26:09] gphoto2proton-import: takeout=/media/12tb/photos work=/home/mmornati/gphoto2proton/work logs=/home/mmornati/gphoto2proton/logs state=/home/mmornati/gphoto2proton/state
[19:26:09] CLI=proton-drive credentials_store=pass
[19:26:10] authentication OK (store: pass)
[19:26:10] disk space OK: avail=309352MB, need~=104448MB
[19:26:10] skipping takeout-20260729T191209Z-001.tgz (already done)
[19:26:10]
[19:26:10] ==== takeout-20260729T191210Z-1-001.tgz (1/8) ====
[19:26:10] extraction exists, resuming ...
[19:26:10] stripping macOS metadata junk (._*, .DS_Store) ...
[19:26:10] applying original capture dates from sidecar JSON ...
[19:28:35] applied capture dates from sidecar JSON to 16562 files
[19:28:35] building manifest (sha1sum of all media files) ...
[19:28:39]   sha1sum progress: 500 files hashed
total 26956
drwxrwxr-x  6 mmornati mmornati     4096 août   1 09:26 ./
[19:28:39]   sha1sum progress: 500 files hashed
[19:28:44]   sha1sum progress: 1000 files hashed
[19:28:49]   sha1sum progress: 1500 files hashed
[19:28:54]   sha1sum progress: 2000 files hashed
[19:28:57]   sha1sum progress: 2500 files hashed
[19:29:02]   sha1sum progress: 3000 files hashed
[19:29:08]   sha1sum progress: 3500 files hashed
[19:29:13]   sha1sum progress: 4000 files hashed
[19:29:18]   sha1sum progress: 4500 files hashed
[19:29:32]   sha1sum progress: 5000 files hashed
[19:29:36]   sha1sum progress: 5500 files hashed
[19:29:41]   sha1sum progress: 6000 files hashed
[19:29:46]   sha1sum progress: 6500 files hashed
[19:29:52]   sha1sum progress: 7000 files hashed
[19:29:57]   sha1sum progress: 7500 files hashed
[19:30:02]   sha1sum progress: 8000 files hashed
[19:30:07]   sha1sum progress: 8500 files hashed
[19:30:17]   sha1sum progress: 9000 files hashed
[19:30:22]   sha1sum progress: 9500 files hashed
[19:30:28]   sha1sum progress: 10000 files hashed
[19:30:32]   sha1sum progress: 10500 files hashed
[19:30:39]   sha1sum progress: 11000 files hashed
[19:30:44]   sha1sum progress: 11500 files hashed
[19:30:50]   sha1sum progress: 12000 files hashed
[19:30:57]   sha1sum progress: 12500 files hashed
[19:31:03]   sha1sum progress: 13000 files hashed
[19:31:08]   sha1sum progress: 13500 files hashed
[19:31:13]   sha1sum progress: 14000 files hashed
[19:31:18]   sha1sum progress: 14500 files hashed
[19:31:23]   sha1sum progress: 15000 files hashed
[19:31:29]   sha1sum progress: 15500 files hashed
[19:31:34]   sha1sum progress: 16000 files hashed
[19:31:40]   sha1sum progress: 16500 files hashed
[19:31:45]   sha1sum progress: 17000 files hashed
[19:31:47]   sha1sum complete: 17236 files
[19:31:47] expected media: 17236 files (17197 unique)
[19:31:47] uploading (conflict strategy: skip) ...
```

## Lessons Learned

1.  **Proton's API surface is fragmented**: Drive and Photos are different systems with different APIs. Don't assume uploading to one gets you the other.
    
2.  **The CLI has undocumented features**: the `proton-drive` CLI's README and Proton's official support page only document `filesystem` commands, but `proton-drive --help` reveals full `photo upload`, `photo timeline`, `album create`, and `album add-photo` support. They just aren't documented in the written docs yet.
    
3.  **Windows has the best migration story**: Proton's official Windows app handles everything from backup to album creation. On other platforms, you need custom tooling.
    
4.  **Undocumented APIs are a trap**: my first approach relied on reverse-engineering `photos-api.proton.me`, which works today but has no stability guarantee. The CLI approach is more future-proof since it's Proton's own code.
    

The code is at [github.com/mmornati/gphoto2proton](https://github.com/mmornati/gphoto2proton). If you've been sitting on a Google Takeout export wondering how to get it into Proton, hopefully this saves you some time.
