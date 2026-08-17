---
title: 'Replacing the Arlo Base Station with a Netgear Orbi Router'
tags:
- netgear
- arlo
- orbi
- rbr760
- base-station
- home-automation
- iot
- router
- mesh-wifi
- smart-home
date: '2026-08-17T10:00:00.000000+00:00'
slug: replacing-arlo-base-station-with-a-netgear-orbi-router
translationKey: arlo-base-station-replacement
categories:
- Smart Home
- DIY
- Networking
- Hardware
description: 'How I replaced the proprietary Arlo base station with a telnet-rooted Netgear Orbi RBR760 mesh router so my cameras could use the existing mesh WiFi, eliminating dead spots and Arlo subscription fees.'
cover: cover.jpg
showHero: true
---

Three years ago, I moved into a house where the previous owner had left a single Arlo base station in the office upstairs and three Pro 4 cameras scattered around the garden. The Arlo app worked, the cloud was free during the trial period, and the system dutifully mailed me snapshots when the postman walked past the gate. Then the trial expired, the battery in *Camera Jardin 2* died in four days, and the camera in the corner of the garden refused to connect more than half the time — its WiFi signal came from the office base station through two brick walls and a metal shutter. Sound familiar?

This post is the first in a three-part series documenting what I did about it. In it, I will only cover the **networking layer**: how to make a Netgear Orbi RBR760 (the mesh router I already owned) impersonate the Arlo base station well enough that the cameras connect, register, and stream — without the Arlo cloud and without the dodgy USB WiFi adapter that the rest of the internet recommends. The companion repository at [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) holds every config file mentioned here.

> **A note on redaction.** Throughout this post, router admin passwords, real camera serial numbers, MAC addresses, and a few production LAN IPs have been redacted to placeholders like `<your_router_password>`, `XXXXXXXXXXXX`, `XX:XX:XX:XX:XX:XX`, and `192.168.1.x`. The only "magic" IP I deliberately leave in clear text is `172.14.1.1` — that value is part of the Arlo wire protocol itself and ships in every camera's firmware. If you were an Arlo engineer in 2014, you would recognise it on sight.

## The Problem

Arlo cameras connect exclusively to the Arlo base station's own WiFi network — they do **not** connect to your home WiFi. The base station creates a dedicated 2.4 GHz network (SSID like `NETGEAR99` or `ARLO_VMB_XXXXXXXXX`) that cameras use for all communication. This is by design: Arlo own the firmware on both ends and the base station is a thin protocol converter that pretends to be "the cloud" on your local network.

If you have a single Arlo base station in a corner of your house, cameras at the far end get poor signal and drop connections. Your Orbi mesh (router + two satellites) covers the whole house beautifully, but the cameras can't use it — they only ever see the Arlo SSID, and they will only ever talk to the box that broadcast it.

The vendor's answer to this is "buy a second base station". The open-source answer is "replace both the WiFi and the protocol box with things you already own". The rest of this post is the open-source answer, with all the LAN plumbing spelled out.

## The Trick

This is not actually a hack — it is a documented quirk of how Arlo designed their cameras to find a base station. When an Arlo camera boots and joins its known WiFi SSID, it does not get a DNS name and it does not ARP for a host called `basestation`. It does something much simpler:

> **DHCP option 3 tells it what the gateway IP is, and it opens a raw TCP connection to that IP on port 4000.** No DNS, no mDNS, no protocol negotiation.

If that connection succeeds, the camera assumes the gateway *is* the base station. Once the base station replies in the right wire format, registration is complete and the camera goes to sleep waiting for events.

The exact value of the gateway doesn't matter — what matters is *that the value the DHCP server hands out is also an IP the camera can reach*. In a default Arlo setup the base station is the gateway of its own little subnet (usually `192.168.1.1` for the older boxes or RFC1918 subnets for newer ones), so everything just happens to work. The well-known `172.14.1.1` value is Arlo's "this is what we use" choice; my setup reproduces it because the cameras were originally paired against a base station that used it, and changing it mid-flight causes all sorts of unregister/re-register churn.

Once you accept that single premise, the rest is just ordinary Linux router plumbing:

1. Broadcast an SSID the cameras already know.
2. Hand out the gateway IP they expect via DHCP option 3.
3. On the router, DNAT that gateway IP:4000 to a small Linux box running the base-station emulator.
4. Make it survive a reboot.

Everything below is one of those four steps plus the inevitable debugging.

> **Sources for the trick.** The reverse-engineering is the work of [Meatballs1/arlo-cam-api](https://github.com/Meatballs1/arlo-cam-api) (the original), [brianschrameck/arlo-cam-api](https://github.com/brianschrameck/arlo-cam-api) (a maintained fork with proper packaging), and [frandallfarmer/arlo-open-base-station](https://github.com/frandallfarmer/arlo-open-base-station) (a full DIY base station with a web UI built on top of the same protocol core). The telnet-enable method comes from [bkerler/netgear_telnet](https://github.com/bkerler/netgear_telnet). The community discussion that finally made me try DHCP option 3 is on the [r/frigate_nvr](https://www.reddit.com/r/frigate_nvr/) subreddit, and the official Arlo KB article on the protocol is [here](https://kb.arlo.com/). I cite all of these again below as the relevant section comes up.

## What You Keep / What You Lose

A 2014-era Arlo system does a lot: cloud recording, activity zones, person/pet/vehicle detection, E911, geofencing, scheduling, two-way audio, push notifications, the mobile app. A 2026 self-hosted stack built on a generic router and a Raspberry Pi keeps the *useful* subset and discards the rest. The detailed comparison is straight from my deployment notes:

| Feature | Arlo cloud | This stack |
|---------|-----------|------------|
| Live RTSP stream | No (relay through Arlo servers) | Yes (port 554 direct) |
| Motion-based recording | Yes (5, 10, 30 s clips) | Yes (variable duration) |
| Local storage | No | Yes (on the server) |
| Cloud recording (CVR) | Yes (paid) | No (replaced by NVR of your choice) |
| Activity zones | Yes (paid) | No (use Frigate or external NVR) |
| Person/pet/vehicle AI | Yes (paid) | No (use Frigate with a Coral) |
| Two-way audio | Yes | Partial (experimental, not in this post) |
| E911 emergency call | Yes | No |
| Geofencing | Yes | No (script it from Home Assistant) |
| Arm/disarm scheduling | Yes | Yes (Home Assistant cron) |
| Push notifications | Yes (Arlo app) | Yes (Home Assistant Companion + ntfy) |
| Mobile app | Yes | No (use Home Assistant Companion) |
| Battery monitoring | Yes | Yes (REST API) |
| Web viewer | Yes | Yes (`arlo-viewer` from open-base-station) |
| HomeKit / HomeKit Secure Video | Yes | Yes (via Scrypted, see Post 3) |
| No subscription | No | Yes (free forever) |

In other words: every feature you can replicate locally is replicated locally. The ones that need a cloud — CVR, AI, E911, mobile-app polish — are dropped, and that is the point.

The next section is the one everyone asks about before they start.

## Battery Drain Analysis

If you search the internet for "Arlo Raspberry Pi base station", the first thing you read is "don't, the batteries die in days". That is true *and* it has almost nothing to do with the choice of router. There are two completely independent causes of battery drain, and confusng them is why 90% of the forum posts on this topic end with someone buying a PoE camera.

### Cause 1 — Continuous RTSP polling (the actual killer)

Arlo battery cameras are designed to sleep 99% of the time and wake only for motion events. Their average draw is in single-digit microamps, which is why a 2440 mAh cell lasts 3-6 months.

Continuous RTSP streaming keeps the WiFi radio, the video encoder, the PIR sensor, and the main CPU awake 24/7. The math:

- Normal operation: camera sleeps 2-5 hours, wakes for 5-10 s per event
- Continuous RTSP: battery drains in days/weeks instead of months

If you need 24/7 recording, Arlo battery cameras are the wrong hardware. Buy a PoE camera (Reolink, Dahua, Hikvision, Amcrest) for that. Arlo cameras are designed for event-based recording only. Mixing the two strategies is the #1 cause of "I made this work and the batteries died in 48 hours".

### Cause 2 — Bad WiFi hardware

The second cause is independent of any RTSP server and is the one that is fixable: the choice of WiFi AP. Specifically, the popular "use a USB WiFi adapter on your Raspberry Pi" approach.

If you used a consumer USB WiFi adapter (especially RTL8812AU chipsets like the Alfa AWUS036ACH) on the Raspberry Pi, the WiFi itself was dropping cameras every ~30 minutes. Each reconnect drains battery significantly.

| WiFi hardware | Camera registration interval | Battery impact |
|--------------|------------------------------|----------------|
| USB WiFi (RTL8812AU) | Every 30 minutes | High drain |
| TP-Link Omada EAP225 | Every 2-5 hours | Normal |
| Netgear Orbi RBR760 | **Expected: 2-5 hours** | **Normal** |

### Why the Orbi RBR760 is different

The Orbi RBR760 is a proper enterprise-grade mesh WiFi system, not a consumer USB adapter. It:

- Supports 802.11ax (WiFi 6) with proper power-save negotiation
- Has correct ShortPreamble, STBC, RIFS, and AMPDU capabilities
- Properly handles 802.11 power management for battery-powered clients
- Maintains stable WiFi connections during camera deep sleep

The Orbi's WiFi implementation is equivalent to or better than the Arlo base station's. Battery life should be comparable to the original Arlo setup.

### Expected battery life

| Camera model | With Arlo base station | With Orbi guest WiFi |
|-------------|----------------------|----------------------|
| Arlo Pro 2 | 3-6 months | 3-6 months (expected) |
| Arlo Pro 3 | 3-6 months | 3-6 months (expected) |
| Arlo Pro 4 | 3-6 months | 3-6 months (expected) |
| Arlo Ultra 2 | 2-4 months | 2-4 months (expected) |

### How to use cameras without draining the battery

| Approach | Battery impact | Notes |
|----------|---------------|-------|
| Event-based recording (arlo-cam-api) | Normal | Camera wakes on motion, records, sleeps |
| Manual snapshot via API | Low | One snapshot at a time |
| RTSP streaming (occasional) | Medium | Stream for 30-60 s, then disconnect |
| RTSP streaming (continuous) | **Very high** | Will drain battery in days — *never* do this |
| Frigate continuous recording | **Very high** | Will drain battery in days — *never* do this |
| Frigate + `go2rtc` (on-demand only) | Normal | Use `go2rtc` with `on_demand` config |

The MediaMTX configuration I introduce in Post 2 is configured for `sourceOnDemand: yes` with `sourceOnDemandCloseAfter: 1s` — the camera's RTSP port is only opened for the few seconds Home Assistant is rendering the picture-glance card, then closed again. That keeps the average draw close to the "normal" row.

## Prerequisites

Before you start, confirm what you have and what firmware you're running.

### Hardware

| Component | Required | Recommended |
|-----------|----------|-------------|
| Netgear Orbi RBR760 | Yes | Firmware V6.3.1.0 – V6.3.8.5 |
| Orbi satellites (RBS760) | Optional | For extended coverage |
| Linux server | Yes | Raspberry Pi 4 (2 GB+) or N100 mini PC |
| USB storage | Optional | For recordings (if using local storage) |
| Network cable | Yes | To connect server to Orbi LAN port |

### Software

| Software | Purpose |
|----------|---------|
| [bkerler/netgear_telnet](https://github.com/bkerler/netgear_telnet) | Enable telnet on RBR760 |
| [Meatballs1/arlo-cam-api](https://github.com/Meatballs1/arlo-cam-api) or [brianschrameck/arlo-cam-api](https://github.com/brianschrameck/arlo-cam-api) | Base station emulator |
| Python 3.7+ | Runtime for arlo-cam-api |
| ffmpeg | Snapshot grabber (Post 2) |
| nmap (optional) | Test which ports are open |
| telnet client | Anything that speaks RFC 854 |

### Firmware range tested

The whole write-up was developed against **RBR760 V6.3.8.5 (Chaos Calmer, `rtm-6.3.8.5+r49254`)**. The telnet-enable method works for V6.3.1.0 to V6.3.8.5 inclusive; anything outside that range and the ciphers in `bkerler/netgear_telnet` will likely need patching. **Do not upgrade to V7** — the protocol changed and I have not seen anyone get telnet back on V7.

### Network information to collect

Before starting, note down:

- **Arlo base station SSID** (e.g. `ARLO_VMB_XXXXXXXXX` or `NETGEAR99`)
- **Arlo base station gateway IP** (typically `172.14.1.1` or `192.168.1.1`)
- **Your RBR760 IP** (default: `<router-ip>`)
- **Your server MAC address** (for static DHCP lease)
- **Your RBR760 MAC address** (Advanced > Advanced Home > Router Information > MAC Address)

All of those will be pasted into various places in the next sections.

## Step 1 — Enable Telnet on RBR760

This is the only "hack" step and it is straightforward. The Orbi runs a customised OpenWrt under a Netgear web UI, and the firmware *does* include a telnet daemon — but the daemon is not started by default, and the password exchange the daemon uses to authenticate is encrypted with a per-router key that the public GUI never exposes.

[bkerler/netgear_telnet](https://github.com/bkerler/netgear_telnet) implements that exchange. It uses a known-plaintext attack against the router's auth flow that was published years ago and still works for current firmware.

### 1.1 Clone the tool

```bash
git clone https://github.com/bkerler/netgear_telnet.git
cd netgear_telnet
pip3 install pycryptodome
```

The tool needs `pycryptodome` because it implements the per-router AES exchange locally rather than asking the router to reveal the key.

### 1.2 Enable telnet

Get the router's br0 MAC from the GUI: **Advanced > Advanced Home > Router Information > MAC Address**. Then run:

```bash
python3 telnet-enable.py <router-ip> XX:XX:XX:XX:XX:XX admin 'your_router_password'
```

You should get a success message within a few seconds. If you get `auth failed`, double-check the MAC and the password — the password is the router admin password, not the WiFi PSK.

### 1.3 Disable auto-updates (critical!)

Telnet in **right now** and disable auto-firmware-updates. A firmware update will wipe telnet access and all your customisations, and you will not get them back without re-running the tool above — which may or may not still work against the new firmware.

```bash
telnet <router-ip>
# login: admin / your_router_password

nvram set orbi_auto_upgrade=0
nvram set auto_check_for_upgrade=0
nvram set auto_update=0
nvram commit

# Verify
nvram show | grep auto_
# orbi_auto_upgrade=0
# auto_check_for_upgrade=0
# auto_update=0
```

That commits to NVRAM and survives reboots. The same `nvram` set is mentioned in [gist.github.com/joshkitt](https://gist.github.com/joshkitt/a8dd1b7dcf6d66a2cf58a5ce117a1547) which is the most-cited community reference for this trick.

### 1.4 Verify telnet access

```bash
telnet <router-ip>
# You should see a root shell prompt (#)
```

The prompt you get is **root**, not `admin`. The router runs telnetd as root, which is part of why "do not run `passwd`" is a hard rule (see Troubleshooting). If you ever run `passwd` on the RBR760, the password is reset to something the telnet-enable tool can't compute, and the only fix is a factory reset via the rear button.

> **One more thing:** telnet does not survive a router reboot. After every power-cycle you have to re-run `telnet-enable.py` before you can telnet back in. Post 3 will show you a `@reboot` cron job on the server that does exactly that.

## Step 2 — Capture the Arlo SSID and PSK

You need to know the *exact* SSID and WPA-PSK the cameras are currently using. The cleanest way is to ask them — Arlo base stations speak WPS, and the same WPS protocol can be coaxed into revealing the PSK by pretending to be another Arlo box.

### Method A — WPS capture on the original Arlo base station (recommended)

On a Linux machine with a WiFi card (e.g. your Raspberry Pi):

```bash
# Build a wpa_supplicant config that claims to be an Arlo WPS enrollee
cat > /tmp/wpa.conf << 'EOF'
ctrl_interface=/var/run/wpa_supplicant
ctrl_interface_group=0
update_config=1
device_name=NTGRDEV
manufacturer=broadcom
EOF

# Stop NetworkManager so it doesn't fight us for the radio
sudo systemctl stop NetworkManager

# Connect to the Arlo base station's SSID with that enrollee profile
sudo wpa_supplicant -t -Dwext -i wlan0 -c /tmp/wpa.conf

# In another terminal:
sudo iwconfig wlan0 essid ARLO_VMB_XXXXXXXXX
sudo wpa_cli -i wlan0 wps_pbc
# Now press the Sync button on the Arlo base station
```

If successful, the WPA-PSK appears in `/tmp/wpa.conf` after a few seconds. The `device_name=NTGRDEV` and `manufacturer=broadcom` lines are not random — Arlo base stations identify themselves as Netgear (NTGRDEV is the Netgear WPS enrollee device name) and they use Broadcom WPS internally. Spoofing both is what makes the Arlo box willing to talk to us.

### Method B — Read the label on the Arlo base station

If you have physical access to the Arlo base station, the SSID and password are printed on the white sticker on the bottom. They look like:

```
SSID:     ARLO_VMB_1914361817
Password: a-bunch-of-random-chars
```

### Method C — Note the SSID from the Arlo app

If the Arlo app is still working, the SSID is in **Settings > My Devices > [base station] > WiFi Settings**. The PSK can be exported from some firmware revisions but not all, so Method A is the only universally reliable approach.

### What you need at the end

Write these down exactly — case-sensitive, no leading/trailing whitespace:

```bash
ARLO_SSID="ARLO_VMB_XXXXXXXXX"   # <- exact, case-sensitive
ARLO_PASSWORD="<as printed>"     # <- exact, case-sensitive
```

The cameras will refuse to roam if either value differs from what they had stored. I learned this the hard way after a typo on one character cost me a wasted hour of "why is the camera still seeing the old SSID in its scan list?".

## Step 3 — Configure the Orbi Guest Network

Now the fun begins. We are going to clone the Arlo SSID onto the Orbi's guest WiFi so that the cameras see two networks with the same name and (we hope) prefer ours.

The Orbi's guest network is special: it has its own bridge (`br-guest`), its own subnet (`192.168.2.0/24` by default), its own DHCP server (`dni_guest_udhcpd`, not dnsmasq), and its own firewall zone with `forward=REJECT`. All of those constraints exist for security reasons in the residential firmware, and we are going to wrestle with each of them in turn over the next few sections.

### 3.1 Telnet into the router

```bash
telnet <router-ip>
# login: admin / your_router_password
```

You should be at a root shell. If you can't get in, go back to Step 1.

### 3.2 Read the current guest SSIDs

```bash
uci get wireless.Guest2.ssid
uci get wireless.Guest5.ssid
```

`Guest2` is the 2.4 GHz guest VAP, `Guest5` is the 5 GHz guest VAP. (Note: `Guest5` does not actually exist as a VAP on RBR760 firmware — it is referenced in UCI but only 2.4 GHz is broadcast. Arlo cameras are 2.4 GHz only so this is fine, but it explains why some forum posts tell you to set both keys.)

### 3.3 Set them to match the Arlo base station

```bash
uci set wireless.Guest2.ssid='ARLO_VMB_XXXXXXXXX'
uci set wireless.Guest5.ssid='ARLO_VMB_XXXXXXXXX'

# Set the same password as the Arlo base station
uci set wireless.Guest2.key='your_arlo_password'
uci set wireless.Guest5.key='your_arlo_password'

uci commit wireless
wifi
```

The `wifi` reload at the end brings the new SSID up. You should see `ath02` reappear in `iw dev` output within a few seconds.

### 3.4 Verify the guest network is broadcasting

```bash
iw dev ath02 info  # Guest 2.4GHz interface (ath02)
iw dev ath21 info  # Guest 5GHz interface (ath21, may not exist)
```

Expected output for `ath02`:

```
Interface ath02
    ifindex 14
    wdev 0x...
    addr XX:XX:XX:XX:XX:XX
    type monitor
    wiphy 1
    channel 1 (2412 MHz), width: 40 MHz
    SSID: ARLO_VMB_XXXXXXXXX
```

A phone or laptop should also see `ARLO_VMB_XXXXXXXXX` in the WiFi list now (without the "Guest" suffix, because the SSID is exactly the Arlo one).

### 3.5 Find the guest network bridge

```bash
brctl show
ip addr show br-guest
```

On RBR760 the guest bridge is `br-guest`, and its IP is `192.168.2.1/24` by default. That IP is where the Orbi's guest DHCP server hands out — and it is *not* the value the cameras will end up using, as the next section explains.

## Step 4 — DHCP and DNAT on RBR760

If the rest of this post were a normal OpenWrt tutorial, this section would be a single `uci set` and an `/etc/init.d/dnsmasq restart`. It is not. Three things make the Orbi firmware different from stock OpenWrt, and each one of them can silently break camera registration if you don't know to look for it.

### 4.1 The `dni_guest_udhcpd` proprietary daemon (UCI is ignored)

On stock OpenWrt, the guest network is just another interface with a `dhcp` section in `/etc/config/dhcp`. On the RBR760 the guest DHCP is **not** served by `dnsmasq`. It is served by a Netgear-proprietary userspace daemon called `dni_guest_udhcpd`, and that daemon reads its config from `/tmp/dni_udhcpd_guest.conf` (not from UCI).

The practical consequence is dramatic and is the single largest source of "I followed the guide and the cameras won't register" complaints on the Orbi subreddit:

> **Anything you put in `uci set dhcp.lan.dhcp_option='3,...'` or `uci set dhcp.guest.dhcp_option='3,...'` is silently ignored for the guest network.** UCI and `dnsmasq` are decoupled from the guest DHCP path entirely.

The official workaround is to write the option directly into the proprietary daemon's config file and restart it. I'll show the full script in §4.5 — the relevant excerpt is:

```bash
# Guest DHCP config is NOT /etc/config/dhcp — it's /tmp/dni_udhcpd_guest.conf
# which is read by /sbin/dni_guest_udhcpd (a Netgear proprietary daemon).
# Modifying UCI here is futile; you must rewrite the config file.

cat /tmp/dni_udhcpd_guest.conf
# Default content:
#   interface br-guest
#   start 192.168.2.100
#   end 192.168.2.254
#   option router 192.168.2.1   <-- must change to 172.14.1.1
#   option dns 192.168.2.1      <-- must change to 1.1.1.1
#   option lease 86400
#   ...
```

> **A note on persistence.** `/tmp/dni_udhcpd_guest.conf` lives in `tmpfs`, so it gets regenerated on every boot. The trick in §4.5 is to overwrite it from a startup script that runs *after* the Netgear init script that regenerates it. That is why our script is named `S99arlo` (start order 99) and not `S40arlo` (start order 40 would race the Netgear init).

You can also tell the UCI level to stop trying to manage guest DHCP:

```bash
uci set dhcp.guest=dhcp
uci set dhcp.guest.ignore='1'
uci commit
```

That is belt-and-braces — UCI was already ignoring the guest pool, but this stops UCI from logging warnings every time dnsmasq is reloaded.

### 4.2 The `172.14.1.1/24` virtual gateway trick (only DHCP option 3 matters)

The Arlo camera doesn't actually care what the gateway IP "is" — it cares that the IP it received via DHCP option 3 is one it can open a TCP connection to on port 4000. That sounds easy, but on the Orbi firmware the guest bridge has its own IP (`192.168.2.1`) and you can't just change it: changing the bridge IP would also change which address appears in the guest DHCP server's `option router` line (still the wrong daemon, but the value still matters), and would break every other guest client that had already learned the old gateway via ARP.

The trick is to add a **second IP** to the guest bridge as an alias, and tell the DHCP server that the second IP is the gateway:

```bash
# 1. Add the virtual gateway IP to the guest bridge
ip addr add 172.14.1.1/24 dev br-guest
```

Then rewrite the daemon's config to hand out the alias IP instead of the bridge IP:

```bash
# 2. Rewrite option router to 172.14.1.1
sed -i "s/option router .*/option router 172.14.1.1/" /tmp/dni_udhcpd_guest.conf

# 3. Rewrite option dns to a real public DNS
sed -i "s/option dns .*/option dns 1.1.1.1/" /tmp/dni_udhcpd_guest.conf

# 4. Add a secondary DNS if not already present
grep -q "1.0.0.1" /tmp/dni_udhcpd_guest.conf || \
    echo "option dns 1.0.0.1" >> /tmp/dni_udhcpd_guest.conf

# 5. Restart the proprietary daemon
kill -9 $(cat /var/run/dni_udhcpd_guest.pid 2>/dev/null) 2>/dev/null
/sbin/dni_guest_udhcpd /tmp/dni_udhcpd_guest.conf
```

> **Why the bridge alias.** When a camera leases an IP from the daemon and gets `option router 172.14.1.1`, the camera ARPs for `172.14.1.1` on the guest bridge. Because `172.14.1.1/24` is configured as an alias on `br-guest`, the bridge answers the ARP with the router's own MAC — the camera's frame is delivered to the router, where our DNAT (next section) catches it. The camera does not need (and does not check) that `172.14.1.1` is also a real, internet-reachable host. It just needs an IP that responds to the SYN it sends to port 4000.

The result is that the camera's registration frame is delivered to the Orbi, the Orbi rewrites the destination to the server, the server replies, and the connection is established. From the camera's perspective the gateway is "the base station" — which is exactly what it wants.

### 4.3 The ODM firewall quirk (`-I FORWARD 1`)

On a stock OpenWrt the `FORWARD` chain is the only thing that gates inter-zone traffic, and a couple of `iptables -A FORWARD -j ACCEPT` lines is all you need. The RBR760 has a second firewall layer in front: the Netgear ODM proprietary chains (`ODM_FORWARD`, `ODM_FORWARD_TOP`, etc.) are inserted *above* the user `FORWARD` chain at boot, and they implement a strict guest-to-LAN isolation (`forward=REJECT`) that even survives `uci` rule changes.

If you do this — which is the natural thing to do:

```bash
# WRONG: rule ends up at the bottom of FORWARD, after ODM_FORWARD
iptables -A FORWARD -i br-guest -d 192.168.1.X -j ACCEPT
```

the rule is added at the bottom of `FORWARD`, which means the ODM `REJECT` rule above it runs first and drops the frame. The connection times out, the camera goes to sleep, and you spend the next hour wondering why your DNAT test from `wget` works but the camera never connects.

The fix is to insert the user rule *above* the ODM chain, at position 1 of the FORWARD chain:

```bash
# CORRECT: inserted at the top, before any ODM chain runs
iptables -I FORWARD 1 -i br-guest -d 192.168.1.X -j ACCEPT
iptables -I FORWARD 1 -i br-lan -o br-guest -s 192.168.1.X -j ACCEPT
iptables -I FORWARD 1 -i br-lan -o br-guest -d 192.168.2.0/24 -j ACCEPT
```

Verify with `iptables -L FORWARD -n -v --line-numbers` — the user rules must be at lines 1-3, and `ODM_FORWARD_TOP` must appear at line 4 or later. If the order is reversed, the camera will not register.

### 4.4 Do NOT use SNAT on the camera → server path (hairpin loop)

This is the second most common mistake in the community write-ups. The instinct comes from generic "camera behind a router" tutorials where the author adds both `DNAT` and `SNAT` for symmetry. For Arlo that instinct is exactly backwards.

Consider what happens if you naively add SNAT to the camera → server traffic:

```bash
# DO NOT DO THIS
iptables -t nat -A POSTROUTING -s 192.168.2.0/24 -d 192.168.1.X \
    -p tcp --dport 4000 -j SNAT --to-source 172.14.1.1
```

The camera sends a SYN from `192.168.2.4` to `172.14.1.1:4000`. The DNAT rewrites the destination to the server (`192.168.1.X:4000`). The frame hits `POSTROUTING` and the SNAT rewrites the source to `172.14.1.1` (a local router IP). The server gets a SYN that *appears* to come from `172.14.1.1:randport`. The server's TCP stack sends the SYN-ACK to `172.14.1.1:randport` — which is the **router's own IP**. The router accepts the SYN-ACK locally as a packet destined for itself, never forwards it out, and the connection just sits in `SYN_RECV` until the camera gives up.

The symptom is unmistakable:

```bash
cat /proc/net/nf_conntrack | grep 4000
# SYN_RECV src=192.168.2.2 dst=192.168.1.X sport=RAND dport=4000
```

That single line is what everyone chasing "the cameras connect to WiFi but never register" sees in the conntrack table. The fix is:

```bash
# Remove the bad rule
iptables -t nat -D POSTROUTING -s 192.168.2.0/24 -d 192.168.1.X \
    -p tcp --dport 4000 -j SNAT --to-source 172.14.1.1

# Flush stale conntrack entries
conntrack -D -p tcp --dport 4000
```

> **The asymmetry:** There is *one* direction where SNAT **is** required, and that's the reverse path: server → camera (e.g. `arm` and `pirled` REST calls). Arlo cameras have an internal firewall that only accepts connections from the gateway IP, so without SNAT those endpoints always return `{"result": false}`. The S99 script (next section) handles that — but the camera → server path **must never** be SNATted.

### 4.5 The full `S99arlo` script (link + excerpt)

The complete, idempotent, Netgear-quirk-handling startup script is at [`rbr760/S99arlo`](https://github.com/mmornati/arlo-base-station/blob/main/rbr760/S99arlo) in the companion repo. It is 60 lines, including comments. The three non-obvious bits are excerpted below.

```bash
#!/bin/sh /etc/rc.common
START=99   # run AFTER all Netgear init scripts that touch dni_guest_udhcpd

start() {
    GUEST_BR="br-guest"
    SERVER="192.168.1.X"        # your server's LAN IP
    GATEWAY="172.14.1.1"        # Arlo wire-protocol constant — DO NOT change

    # 1. Idempotent alias-IP add (already there? skip silently)
    ip addr add ${GATEWAY}/24 dev ${GUEST_BR} 2>/dev/null || true

    # 2. Rewrite the proprietary daemon's config (NOT UCI — see §4.1)
    sed -i "s/option router .*/option router ${GATEWAY}/" \
        /tmp/dni_udhcpd_guest.conf 2>/dev/null
    sed -i "s/option dns .*/option dns 1.1.1.1/" \
        /tmp/dni_udhcpd_guest.conf 2>/dev/null
    grep -q "1.0.0.1" /tmp/dni_udhcpd_guest.conf \
        || echo "option dns 1.0.0.1" >> /tmp/dni_udhcpd_guest.conf

    # 3. Restart dni_guest_udhcpd (it will read the new config now)
    if [ -f /var/run/dni_udhcpd_guest.pid ]; then
        kill -9 $(cat /var/run/dni_udhcpd_guest.pid) 2>/dev/null
    fi
    /sbin/dni_guest_udhcpd /tmp/dni_udhcpd_guest.conf

    # 4. DNAT — camera → server (the only NAT we need on this path)
    iptables -t nat -A PREROUTING -i ${GUEST_BR} -p tcp --dport 4000 \
        -j DNAT --to-destination ${SERVER}:4000
    iptables -t nat -A PREROUTING -i ${GUEST_BR} -p tcp --dport 4100 \
        -j DNAT --to-destination ${SERVER}:4100

    # 5. SNAT — server → cameras (so cameras accept arm/pirled from "gateway" IP).
    #    NOTE: this is the OPPOSITE direction from the hairpin loop above.
    #    Without this, cameras return {"result": false} on /arm and /pirled.
    iptables -t nat -A POSTROUTING -s ${SERVER} -d 192.168.2.0/24 \
        -j SNAT --to-source ${GATEWAY}

    # 6. FORWARD rules — INSERT at position 1, BEFORE the ODM chains (§4.3)
    iptables -I FORWARD 1 -i ${GUEST_BR} -d ${SERVER} -j ACCEPT
    iptables -I FORWARD 1 -i br-lan -o ${GUEST_BR} -s ${SERVER} -j ACCEPT
    iptables -I FORWARD 1 -i br-lan -o ${GUEST_BR} -d 192.168.2.0/24 -j ACCEPT
}

stop() {
    :
}
```

The script goes in `/etc/rc.d/S99arlo` and is invoked at every boot. To make it executable and run it once:

```bash
chmod +x /etc/rc.d/S99arlo
/etc/rc.d/S99arlo start
```

A full walkthrough of every line lives at [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station); the script file is the canonical source.

### 4.6 Verify the rules

```bash
# DNAT should show 2 lines (one per port)
iptables -t nat -L PREROUTING -n -v | grep -E "4000|4100"

# FORWARD rules should be lines 1-3 (BEFORE ODM chains)
iptables -L FORWARD -n -v --line-numbers | head -10

# Virtual IP should be present on br-guest
ip addr show br-guest | grep 172.14

# Guest DHCP should have option router = 172.14.1.1
cat /tmp/dni_udhcpd_guest.conf | grep -E "router|dns"

# POSTROUTING should have exactly ONE SNAT rule (server → cameras)
iptables -t nat -L POSTROUTING -n -v
```

If the FORWARD rules are not at lines 1-3, re-run with `iptables -I FORWARD 1 ...` (not `-A`). If the SNAT is missing or has `-d ${SERVER}` instead of `-d 192.168.2.0/24`, your arm/pirled REST calls will return `false`.

## Step 5 — Install arlo-cam-api on the Server

The networking layer is the focus of *this* post. The `arlo-cam-api` installation is the focus of *Post 2* — for context I'll show the minimum that has to be running before the cameras can register.

The Debian package dependencies on the server:

```bash
sudo apt update
sudo apt install -y python3-pip python3-venv git ffmpeg
```

Then clone and install:

```bash
git clone https://github.com/brianschrameck/arlo-cam-api.git
cd arlo-cam-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Minimum `requirements.txt`:

```text
Flask==1.1.4
pycryptodome
requests
```

Then run it:

```bash
python server.py
# * Running on http://0.0.0.0:4000
# * REST API on http://0.0.0.0:5000
```

To make it survive reboots we use a systemd unit:

```ini
# /etc/systemd/system/arlo-cam-api.service
[Unit]
Description=Arlo Camera API Server
After=network.target

[Service]
Type=simple
User=arlo
WorkingDirectory=/home/arlo/arlo-cam-api
ExecStart=/home/arlo/arlo-cam-api/venv/bin/python server.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable arlo-cam-api
sudo systemctl start arlo-cam-api
sudo systemctl status arlo-cam-api
```

The full Post 2 covers: patched `server.py` to fix the auto-register-on-restart bug, the two-endpoint `arlo-snapshot` motion handler, and the Docker Compose layout. For this post the important thing is that:

- Port 4000 is bound and listening on the server's LAN IP
- The server can reach the camera subnet (192.168.2.0/24) via the Orbi FORWARD rules
- The Server returns a valid Arlo registration ack to any SYN on port 4000

If you want to test the end-to-end before touching the cameras, do this from the server:

```bash
# Confirm arlo-cam-api is up
curl http://192.168.1.X:5000/device

# Confirm DNAT is reachable from the router itself
ssh root@<router-ip> 'curl http://192.168.1.X:5000/status'

# Confirm a camera-shape request from a phone on the guest WiFi
# (after at least one camera has registered)
curl -X POST http://192.168.1.X:5000/device/XXXXXXXXXXXX/arm \
     -H "Content-Type: application/json" \
     -d '{"arm": true}'
```

If `device` returns `[]` you are not registered yet. Proceed to Step 6.

## Step 6 — Pair the Cameras

> **Critical Orbi gotcha — WPS does not work on guest VAPs.**
>
> The RBR760 firmware is a customised OpenWrt that runs Netgear's proprietary `hostapd` and ODM firewall. **WPS Push Button Configuration (PBC) does NOT work on the guest VAPs (`ath02`/`ath21`)** — the `wps_pbc` command returns `FAIL`. WPS only works on the main VAPs (`ath0`/`ath1`/`ath2`). This means the "press WPS on the Orbi and on the camera" workflow that works for normal routers will silently no-op here.

The workaround is to use the original Arlo base station for WPS pairing, then power it off and let the cameras reconnect to the Orbi guest network (which has the *same* SSID and PSK).

### 6.1 Pair using the original Arlo base station (required)

For each camera:

1. **Power on** your original Arlo base station
2. **Factory reset** each camera (press and hold the Sync button for 10-15 s until the LED blinks amber, then release). The amber-blink means the camera is in pairing mode.
3. Press **Sync on the base station** (within 2 minutes).
4. The camera pairs, LED turns blue briefly, then blinks.
5. The camera associates with the base station's SSID (`ARLO_VMB_XXXXXXXXX`) and PSK.
6. **Power off** the original base station (unplug it).

### 6.2 Cameras reconnect to the Orbi guest network

After the base station is off, the cameras will:

1. Lose connection within 30-60 s.
2. Scan for WiFi networks with SSID `ARLO_VMB_XXXXXXXXX`.
3. Find the Orbi guest network broadcasting that SSID (same name, same PSK).
4. Associate automatically.
5. Get an IP via DHCP from `dni_guest_udhcpd` (e.g. `192.168.2.2`, `192.168.2.3`).
6. Receive `option router 172.14.1.1` via DHCP option 3.
7. Open a TCP connection to `172.14.1.1:4000`.
8. The DNAT rule rewrites the destination to `192.168.1.X:4000`.
9. `arlo-cam-api` answers in the Arlo protocol and registration completes.

This process takes 1-5 minutes per camera. All three of mine came back online within two minutes — none of them needed a second WPS attempt once the base station was unplugged.

### 6.3 Verify the connection

On the RBR760:

```bash
# Check the DHCP leases file — the cameras' IPs will appear here
cat /tmp/dni_udhcpd_guest.leases
# 192.168.2.2 XX:XX:XX:XX:XX:XX XXXXXXXXXXXX *
# 192.168.2.3 XX:XX:XX:XX:XX:XX XXXXXXXXXXXX *
# 192.168.2.4 XX:XX:XX:XX:XX:XX XXXXXXXXXXXX *

# Or check ARP on the guest bridge
arp -n -i br-guest
```

On the server, confirm `arlo-cam-api` has registered them:

```bash
curl http://localhost:5000/device | python -m json.tool
```

Expected output:

```json
[
  {
    "friendly_name": "XXXXXXXXXXXX",
    "hostname": "VMC4040P-XXXXX",
    "ip": "192.168.2.2",
    "serial_number": "XXXXXXXXXXXX"
  },
  ...
]
```

If `device` returns `[]` after 5 minutes, the most likely cause is the SNAT-from-camera-direction bug from §4.4. Check `conntrack` for `SYN_RECV` and tear down.

## Step 7 — Make Everything Persistent

> **One universal gotcha.** UCI changes (`uci commit`) survive reboots (they are stored in the writable overlay). NVRAM changes (`nvram commit`) survive reboots. `/etc/rc.d/` scripts survive reboots. **But telnet does not** — it is wiped on every reboot, and you have to re-run `telnet-enable.py` to get it back. There is no way around this without re-imaging the router.

The persistence checklist:

| Item | Method | Survives reboot? |
|------|--------|------------------|
| Telnet access | Re-run `telnet-enable.py` | No |
| Guest SSID | UCI commit (`uci commit wireless`) | Yes |
| Guest DHCP override | `/etc/rc.d/S99arlo` (`START=99`) | Yes (idempotent over tmpfs) |
| Virtual gateway IP | `/etc/rc.d/S99arlo` | Yes |
| iptables DNAT/SNAT | `/etc/rc.d/S99arlo` | Yes |
| Auto-update disabled | NVRAM commit (`nvram commit`) | Yes |
| Server-side `arlo-cam-api` | systemd service (`arlo-cam-api.service`) | Yes |
| Recordings on disk | Persistent mount | Yes |

### 7.1 Create a telnet re-enable script on the server

```bash
#!/bin/bash
# /home/arlo/re-enable-telnet.sh
# Run this AFTER every RBR760 reboot.

cd /home/arlo/netgear_telnet
python3 telnet-enable.py <router-ip> XX:XX:XX:XX:XX:XX admin 'your_router_password'
```

Wire it into cron:

```bash
crontab -e
# Add this line:
@reboot sleep 30 && /home/arlo/re-enable-telnet.sh >> /tmp/arlo-telnet.log 2>&1
```

The 30-second sleep is because the Orbi takes a while to come up after a reboot; the script will retry indefinitely.

### 7.2 Verify the S99 script on the router

After every reboot, once you telnet back in:

```bash
ls -la /etc/rc.d/S99arlo
# -rwxr-xr-x 1 root root 1234 Jul 17 10:00 S99arlo

# Check it has no syntax errors
sh -n /etc/rc.d/S99arlo

# Run it manually to be sure
/etc/rc.d/S99arlo start

# Re-check the resulting iptables + IP + DHCP state
iptables -t nat -L PREROUTING -n -v | grep -E "4000|4100"
ip addr show br-guest | grep 172.14
```

If the rules are missing after a reboot but `S99arlo` is in `/etc/rc.d/`, then it is racing the Netgear init. Increase the start number (e.g. `S99arlo` → `S98arlo` is wrong direction; you want it after Netgear scripts, so try `S99arlo` then `S991arlo`).

### 7.3 What is lost on firmware update (everything)

This bears repeating: **a Netgear firmware update wipes everything we have done**. The SSID changes back, the DHCP daemon resets, the iptables chains clear, the NVRAM commits remain (good) but the guest SSID key is reset to the Netgear default.

After any firmware update:

1. Re-enable telnet (it may not work against the new firmware).
2. Re-run all the Step 3 commands.
3. Re-place `/etc/rc.d/S99arlo` and `chmod +x` it.
4. Re-run `/etc/rc.d/S99arlo start`.

If the new firmware is V7, you are stuck — the telnet-enable tool is not known to work against V7 and the forum posts from 2024 don't have a working method. Stay on V6.3.x.

## Step 8 — Optional Telnet Tweaks

Once you have working cameras you will probably want to tweak a few other settings on the RBR760 that the GUI doesn't expose. The complete list lives in my companion repo at [arlo-base-station/docs/lessons-learned.md](https://github.com/mmornati/arlo-base-station/blob/main/docs/lessons-learned.md); the three I use most:

### 8.1 Disable DNS hijack

The RBR760 is hardcoded to hand out its own IP (<router-ip>) as DNS via DHCP on the *main* LAN. That breaks split-horizon DNS and makes Pi-hole impossible. Fix via the undocumented UCI knob:

```bash
uci get network.globals.dns_hijack_enable
uci set network.globals.dns_hijack_enable='0'
uci commit
```

### 8.2 Force real DNS via DHCP option 6 (LAN, not guest)

```bash
uci delete dhcp.@dnsmasq[0].dhcp_option 2>/dev/null
uci add_list dhcp.@dnsmasq[0].dhcp_option='6,1.1.1.1'
uci add_list dhcp.@dnsmasq[0].dhcp_option='6,1.0.0.1'
uci commit
/etc/init.d/dnsmasq restart
cat /tmp/etc/dnsmasq.conf | grep dhcp-option
```

This affects the main LAN only — guest DHCP is still `dni_guest_udhcpd` and gets its own treatment in `S99arlo`.

### 8.3 Add a static DHCP lease for the server

```bash
uci add dhcp host
uci set dhcp.@host[-1].name='ARLO-SERVER'
uci set dhcp.@host[-1].mac='XX:XX:XX:XX:XX:XX'  # server MAC
uci set dhcp.@host[-1].ip='192.168.1.X'
uci commit
/etc/init.d/dnsmasq restart
```

Even though the server is on a wired connection and the lease technically isn't required, having a stable server IP makes the iptables DNAT rules survive MAC rotations (e.g. you swap the Pi for an N100).

## Troubleshooting

The networking layer has its own seven-flavours-of-pain catalog. Post 3 will collect these across all three posts in the series; the network-specific ones are below.

### 1. Cameras connect to WiFi but never register (SYN_RECV)

```bash
cat /proc/net/nf_conntrack | grep 4000
# SYN_RECV src=192.168.2.2 dst=192.168.1.X sport=RAND dport=4000
```

**Cause A — SNAT from the wrong direction is causing a hairpin loop.** Remove the bad rule:

```bash
iptables -t nat -D POSTROUTING -d 192.168.1.X -p tcp --dport 4000 \
    -j SNAT --to-source 172.14.1.1 2>/dev/null
conntrack -D -p tcp --dport 4000
```

**Cause B — FORWARD rules are at the bottom of the chain, after ODM.** Re-insert:

```bash
iptables -I FORWARD 1 -i br-guest -d 192.168.1.X -j ACCEPT
iptables -I FORWARD 1 -i br-lan -o br-guest -s 192.168.1.X -j ACCEPT
iptables -I FORWARD 1 -i br-lan -o br-guest -d 192.168.2.0/24 -j ACCEPT
```

### 2. WPS pairing fails on the guest VAP

`hostapd_cli wps_pbc` on `ath02` returns `FAIL`. This is by design on the RBR760 firmware. Use the original Arlo base station for pairing (Step 6) and power it off afterwards.

### 3. Guest network was disabled in the UI

This sometimes happens after firmware updates. Re-enable:

```bash
uci set wireless.Guest2.disabled='0'
uci set wireless.Guest5.disabled='0'
uci commit wireless
wifi
```

### 4. iptables rules lost after reboot

Verify the script is in the right place and executable:

```bash
ls -la /etc/rc.d/S99arlo
sh -n /etc/rc.d/S99arlo
# No output = OK
```

If the script runs manually but isn't picked up at boot, it is racing the Netgear init. Rename it to a higher start number:

```bash
mv /etc/rc.d/S99arlo /etc/rc.d/S991arlo
```

`S991` is a higher start number than `S99`-range Netgear scripts and reliably runs last.

### 5. Guest DHCP not handing out 172.14.1.1 as the gateway

```bash
cat /tmp/dni_udhcpd_guest.conf | grep -E "router|dns"
```

If `option router` is still `192.168.2.1`, the script either didn't run or ran before the daemon regenerated the config:

```bash
# Force a regeneration and restart
kill -9 $(cat /var/run/dni_udhcpd_guest.pid)
/sbin/dni_guest_udhcpd /tmp/dni_udhcpd_guest.conf
```

Then re-run `/etc/rc.d/S99arlo start`. If the daemon regenerates the config with `192.168.2.1` immediately, you need to `sed` it inside the `S99` script *after* the daemon regenerates — that is exactly what the snippet in §4.5 does.

### 6. "passwd" command on telnet disabled my access

Don't run `passwd` on the RBR760 — it locks telnet permanently on V6.3.6.x and above. The only fix is a factory reset via the rear button (paperclip for 10 s while powered on). You will lose every other configuration you have ever made on the router.

### 7. Telnet has stopped working but the router is up

```bash
# Maybe your server-side cron job hasn't run yet (after a router reboot)
/home/arlo/re-enable-telnet.sh

# Maybe a Netgear firmware was auto-pushed (you forgot to disable updates?)
nvram show | grep auto_
# If any of these is 1 you have been bitten
```

If `auto_check_for_upgrade` is `1`, set it back to `0` and check what version you are now running:

```bash
nvram get orbi_fw_version
# If this is V7 you are stuck
```

That is the seven-pattern debugging set. The full troubleshooting matrix (including the device-side quirks I list in Post 2) is in [the companion repo's troubleshooting section](https://github.com/mmornati/arlo-base-station/blob/main/docs/troubleshooting.md).

## What's Next

This post covered the part that has the worst "if you don't know, you cannot Google it" curve: making the router look like a base station. The remaining layers are more conventional:

- **Post 2** — the services stack on the server. `arlo-cam-api`, the patched `server.py` for the auto-register-on-restart bug, the `arlo-snapshot` motion handler, MediaMTX as the on-demand RTSP relay, and the three patches I sent upstream as PR #1 to `brianschrameck/arlo-cam-api`.
- **Post 3** — Home Assistant integration via REST sensors, Generic Camera entities (still + stream), the Lovelace dashboard using `camera_view: auto`, Tailscale for remote access, and Scrypted if you want HomeKit.

> **A note on staging.** The full code and configs are at [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station). The PR for the first batch of files (including `rbr760/S99arlo` from §4.5) is open at the time of writing.

---

*This is post 1 of 3 in the Arlo series. Post 2 covers the services stack + upstream PRs. Post 3 covers the Home Assistant integration.*

*Continue reading → [Post 2 — Services & upstream PRs](/self-hosting-arlo-cam-api-patches-and-improvements/) and [Post 3 — Home Assistant integration](/integrating-self-hosted-arlo-with-home-assistant/).*
