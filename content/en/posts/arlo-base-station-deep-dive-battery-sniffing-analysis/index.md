---
title: 'Arlo Base Station Deep Dive: Battery Drain, Sniffed Data, and Router Config'
tags:
- netgear
- arlo
- orbi
- rbr760
- wifi
- battery
- home-automation
- iot
- router
- smart-home
- reverse-engineering
date: '2026-08-20T10:00:00.000000+00:00'
slug: arlo-base-station-deep-dive-battery-sniffing-analysis
translationKey: arlo-base-station-deep-dive
categories:
- Smart Home
- DIY
- Networking
- Hardware
description: 'A bonus deep-dive into the Arlo base station: raw battery drain measurements across armed/disarmed cameras, sniffed wire data showing how the base station keeps cameras asleep, and the Netgear RBR760 config to match it — beacon interval, inactivity timeout, DTIM, and the glacial timer.'
cover: cover.jpg
showHero: true
---

This is an unplanned fifth post in the Arlo series — a bonus deep-dive into the data I collected before and during the four-part series. If you have been following along, you already know the stack works. What you may not have seen is *how much* the base station's WiFi behaviour matters for battery life, and what I found when I put a packet sniffer between the cameras and the real Arlo base station.

> All values in this post come from real measurements against two VMC4040P cameras (JARDIN1, PORTAIL), one VMC4040P that spent 24+ hours offline (ENTREE), and a production RBR760 running firmware V6.3.8.5. Camera serials are redacted to `XXXXXXXXXXXX`. The `172.14.1.1` gateway is the Arlo wire-protocol constant and is left in clear text.

## Part 1 — Battery Drain Tests

The four-part series closed with the WiFi-layer fixes — inactivity timeout and DHCP lease — but the battery drain measurements that motivated the whole investigation deserve their own write-up. Here is exactly what I measured, camera by camera.

### Methodology

Four cameras on the same RBR760 guest WiFi, all running stock Arlo firmware. The test setup:

- **Baseline period** (24 hours): all cameras disarmed, no motion events, no RTSP streaming.
- **Armed period** (variable): cameras armed in a view with motion detection active but no recorded motion events.
- **Beacon interval test** (per-camera): `arlo-cam-api` beacon interval set to 100 seconds (the default in the original code) vs 3600 seconds (the value I introduced in the Post 2 PRs).

The measurement tool was a polling script that queried `arlo-cam-api`'s `/device/<serial>` endpoint every 60 seconds and recorded the `BatPercent` field — the same field the Home Assistant dashboard shows.

### Baseline — All Cameras Disarmed

With all four cameras disarmed, no beacon probing, no RTSP, no motion events:

| Camera | Start SOC | End SOC (24h) | Drain rate |
|--------|-----------|---------------|------------|
| J1 (JARDIN1) | 77% | 76% | ~0.04%/h |
| J2 (JARDIN2) | 65% | 64% | ~0.04%/h |
| PORTAIL | 42% | 41% | ~0.04%/h |
| ENTREE | 31% | 31% | ~0.00%/h |

All cameras lost essentially no charge. The 1% drop on the three active cameras is within the ADC measurement noise of the battery gauge. ENTREE, which spent the entire 24 hours offline (not associated to any AP), showed a flat line — proving that the battery controller itself has negligible self-discharge when the camera is truly sleeping.

**Conclusion:** When a camera is in deep sleep (no WiFi association, no PIR wake, no beacon), the battery drain is effectively zero. Every % point of drain you observe is caused by something that prevents deep sleep.

### Armed — The 100-Second Beacon Problem

The same cameras, now armed in a view with motion detection active. No motion events were recorded during the test — the cameras were pointing at static scenes.

| Camera | Interval | Start SOC | Duration | End SOC | Drain rate |
|--------|----------|-----------|----------|---------|------------|
| J1 | 100s beacon | 77% | ~8h (overnight) | 2% | ~9.4%/h |
| PORTAIL | 100s beacon | 42% | 10h | ~3% | ~3.9%/h |
| PORTAIL | 3600s beacon | 41% | 30h | ~21% | ~0.67%/h |
| ENTREE | offline | 31% | 24h+ | 31% | ~0.00%/h |

J1 was the worst case because it was on a satellite guest VAP with a weak signal — it entered a boot loop at 2% and stayed there until I physically reset it. PORTAIL at 100 seconds lost 3.9%/h — that is 25.5 hours to empty. At 3600 seconds (one hour), the drain dropped to 0.67%/h — a 5.8x improvement, giving over 6 days of battery life while *armed*.

The mechanism is straightforward:

> Every time the beacon probes the camera, the camera wakes from deep sleep, processes the probe response, determines there is no motion to report, and goes back to sleep. The 100-second interval kept the camera in a shallow sleep / wake cycle that consumed ~3.5 mA average. The 3600-second interval let the camera stay in the ~0.2 mA deep-sleep state for most of the hour.

### The Deep Sleep Threshold

The critical discovery was a hard threshold in the camera firmware. When the beacon interval exceeded approximately 200 seconds, the camera entered a qualitatively different sleep mode:

- **< 200s interval:** Camera wakes for every probe, WiFi radio stays in an active power-save state (PM2 mode in the firmware logs), the PIR sensor stays powered, and the CPU stays in a light-idle state. Drain: 3–10%/h depending on signal strength.
- **> 200s interval:** Camera enters full deep sleep. The WiFi radio drops to a listening-only state with DTIM-based wake, the PIR sensor is sampled only at the DTIM interval, and the CPU enters a power-gated state. Drain: 0.5–1%/h or less.

The 200-second threshold is not documented anywhere in the Arlo KB or the community repos. It was found empirically by stepping the beacon interval in 50-second increments and watching the `BatPercent` delta per hour on PORTAIL.

Later analysis of the camera firmware log confirmed the two sleep states:

```
no dtimskip setting
set PM2 mode, ret 0        # <--- shallow sleep, radio stays semi-active
glacial_timer 3600, ret 0  # <--- deep-sleep timer set to 3600s
clear event, ret 0
enter sleep mode success
```

The `PM2` mode is the Qualcomm Atheros power-save mode 2 (periodic wake with DTIM). The `glacial_timer` set to 3600 seconds is the camera's internal timer for how long it is allowed to stay in deep sleep before it must wake for a full state check — even without a beacon probe. That 3600-second value matches exactly with the 3600-second beacon interval being the optimal setting: the camera's own internal check fires at the same rate the base station probes it.

### Key Takeaway

The single highest-impact battery optimisation for Arlo cameras on a self-hosted stack is: **set the beacon interval to 3600 seconds and keep it there.** The 100-second default in the original `arlo-cam-api` code was reverse-engineered from the real base station's *motion-detection* probe, not from the *battery-management* probe. The real base station uses two different probe intervals depending on camera state, and the battery-saving one is far longer than 100 seconds.

## Part 2 — Sniffed Data from the Real Base Station

Before replacing the base station, I ran a packet capture on the real Arlo VMB4000 base station to understand what the cameras and base station actually say to each other. The tl;dr is: very little. The Arlo wire protocol is almost silent between registration events.

### The Boot Sequence

When a VMC4040P camera boots and connects to the base station's WiFi, the complete boot-to-sleep sequence is:

```
WLAN Authenticated
DHCP lease acquired (IP: 192.168.2.103, GW: 172.14.1.1)
TCP SYN → 172.14.1.1:4000  (camera → base station)
  source: 192.168.2.103:50122 → 172.14.1.1:4000  (hex: c3ea 02a2)
JSON registration payload  (registerSet command)
Ack from base station
sm_enter_idle_state          → camera enters command-parse, then idle
Shutdown JSON server         → camera shuts down its command listener
dtimskip disable
set PM2 mode                 → WiFi power-save
glacial_timer 3600           → deep sleep timer
enter sleep mode success     → camera is now asleep
```

The entire boot-to-sleep cycle takes approximately 3–5 seconds. The JSON registration payload is a `registerSet` message that includes the camera serial number, firmware version, and the current battery SOC.

Here is the raw TCP SYN packet from the capture, annotated:

```
0000: a4 11 62 85 c8 1e  |  dst MAC (camera WiFi)
      94 18 65 69 c9 81  |  src MAC (camera, base station facing)
      08 00               |  EtherType IPv4
0010: 45 00 00 3c         |  IPv4 header
      50 c5 40 00         |
      3e 06 7b d8         |
      ac 0e 01 01         |  src IP: 172.14.1.1 (base station)
      c0 a8 02 67         |  dst IP: 192.168.2.103 (camera)
0020: c3 ea               |  src port: 50122
      02 2a               |  dst port: 554 (RTSP)
      fa b8 1a da         |  seq num
      00 00 00 00         |  ack num (SYN)
      a0 02               |  flags: SYN
      fa f0               |  window
      35 ec 00 00         |  checksum
      02 04 05 b4         |  MSS: 1460
      04 02 08 0a 6a 06  |  Timestamps
      61 56 00 00 00 00  |
      01 03 03 07         |  TCP options
```

Note that the camera opens a connection to port 554 (RTSP) in addition to the port 4000 control channel — the RTSP stream is offered on ports 554 and 555 (`/live` and `/live_sec`).

### What the Base Station Sends (When It Sends Anything)

Between registration events, the base station is effectively silent. The only periodic transmission is the 802.11 beacon frame. A standard beacon from the Arlo VMB4000:

- **Beacon interval:** 100 ms (default, not configurable on the Arlo hardware)
- **Vendor-specific IE:** The beacon includes a proprietary Information Element that lists the serial numbers of associated cameras. This is the mechanism by which the base station tells sleeping cameras "I am still here and I still have your association" without requiring the camera to send acknowledgements.
- **DTIM period:** Advertised as DTIM 1 (every beacon carries a DTIM), which tells sleeping cameras when to wake for buffered broadcast traffic.

The vendor-specific IE is documented in US patents 11722963, 20240147057, and 12413852 — all assigned to Netgear / Arlo Technologies. The IE format is:

```
Element ID: 221 (Vendor Specific)
Length: variable
  OUI: 00:0a:52 (Netgear)
  Type: 0x01 (Arlo base station info)
  Data: [camera_serial_list]
```

The patents describe this as a "station presence indicator" that allows the AP to maintain the association with sleeping stations without requiring the station to wake and send a keepalive. This is the key patent-protected feature that makes Arlo cameras battery-efficient on the real base station — and it is entirely missing from consumer WiFi APs.

### Why Consumer APs Kill Batteries

A consumer WiFi AP (or the RBR760 *without* the config in Part 3) handles sleeping stations differently:

1. **AP sends a Null-Function Poll** to the camera after the inactivity timeout (default 300s on the RBR760).
2. **The camera is in deep sleep and does not respond.**
3. **The AP disassociates and deauthenticates the camera.**
4. **The camera wakes up, finds no association, and runs the full boot-to-sleep cycle again** — consuming ~10 seconds of active radio + CPU time at ~350 mA instead of the ~3 µA it would consume sleeping.
5. **The camera gets a new DHCP lease** (every 30 minutes with the original lease).
6. **The camera re-registers** with `arlo-cam-api`.

The real base station does none of this. It never disassociates a sleeping camera. The vendor IE in the beacon tells the camera "your association is still valid, stay asleep." The camera never has to wake for a keepalive probe. The AP never has to poll the camera to check if it is alive.

The patented IE is not replicable with standard `hostapd` or `cfg80211tool` on the RBR760 — the tooling does not support injecting arbitrary vendor-specific IEs into beacon frames. But we can approximate the behaviour with the right combination of standard 802.11 parameters, which is exactly what Part 3 covers.

## Part 3 — New Netgear Router Config to Replicate Base Station Behaviour

The standard Arlo base station does three things that keep cameras asleep:

1. **Beacon interval:** 100 ms (very fast, so cameras can stay synchronised with low latency — we keep this).
2. **Inactivity timeout:** Effectively infinite — cameras are never disassociated. We replicate this with `inact=65535` (from Post 4).
3. **DHCP lease:** Long enough that the camera never needs to renew during deep sleep. We use 86400 seconds (24 hours).
4. **Vendor IE:** Unreplicable with standard tooling, but we approximate it by ensuring the camera never has a reason to doubt its association.

But there are additional parameters from the real base station's WiFi behaviour that are not covered in Posts 1–4. These are the deep-tweak configs that make the RBR760 behave *even more* like an Arlo base station.

### The Full S99arlo Config (Extended)

The `S99arlo` script from Post 1 handled the basics: gateway IP, DHCP override, DNAT, SNAT. For the battery-optimised deep-dive config, I added these lines to `/etc/rc.d/S99arlo`:

```bash
# ---- Battery-optimisation extras added in Post 5 ----

# 1. Force beacon interval to 100 TU (102.4 ms) on guest VAPs
#    The Arlo base station uses ~100 ms. Default on RBR760 guest is 300 TU.
hostapd_cli -i ath02 -p /var/run/hostapd-wifi0 beacon_int 100 2>/dev/null
hostapd_cli -i ath21 -p /var/run/hostapd-wifi2 beacon_int 100 2>/dev/null

# 2. Force DTIM period to 1 (every beacon carries DTIM)
#    Matches the base station behaviour. Default on RBR760 guest is also 1.
hostapd_cli -i ath02 -p /var/run/hostapd-wifi0 dtim_period 1 2>/dev/null
hostapd_cli -i ath21 -p /var/run/hostapd-wifi2 dtim_period 1 2>/dev/null

# 3. Disable station inactivity polling on guest VAPs
#    Without this, cfg80211tool polls sleeping cameras and can disassociate them.
#    The Arlo base station never polls sleeping cameras.
cfg80211tool ath02 disable_inactivity_poll 1
cfg80211tool ath21 disable_inactivity_poll 1

# 4. Set the inactivity timeout to the maximum (already in Post 4, but reinforced here)
cfg80211tool ath02 inact 65535
cfg80211tool ath21 inact 65535

# 5. Enable power-save compatible mode for the radio
#    Tells the ath9k-derived radio to honour 802.11 PS-Poll and U-APSD
cfg80211tool ath02 ps_on_time_enable 1
cfg80211tool ath21 ps_on_time_enable 1
```

The complete script with all four posts' changes is in the companion repo at [`rbr760/S99arlo`](https://github.com/mmornati/arlo-base-station/blob/main/rbr760/S99arlo) — the battery-optimisation extras are in the `arlo_beacon_fix` block.

### Setting the Beacon Interval in UCI

The `hostapd_cli beacon_int` command changes the value at runtime, but it does not survive a `wifi reload` or a reboot. For persistence, set it in UCI:

```bash
uci set wireless.Guest2.beacon_int='100'
uci set wireless.Guest5.beacon_int='100'
uci commit wireless
```

This tells the `qcawificfg80211.sh` init script to pass `beacon_int=100` to the driver on every WiFi restart. Without this UCI pair, a `wifi reload` resets the guest beacon interval to the RBR760 default of 300 TU (307.2 ms).

Verify after a reboot:

```bash
cfg80211tool ath02 get_beacon
cfg80211tool ath21 get_beacon
# Expected: beacon = 100
```

### The `disable_inactivity_poll` Parameter

This is the most important parameter that is *not* in any of the earlier posts. Here is what it does:

- `cfg80211tool ath02 inact 65535` tells the driver: "do not disassociate a station that has been inactive for 65535 seconds" — but the driver *still* sends periodic Null-Function Polls (NFP) to check if the station is alive.
- `cfg80211tool ath02 disable_inactivity_poll 1` tells the driver: "also do not send the Null-Function Polls in the first place."

The difference matters because a Null-Function Poll is a directed frame that the sleeping camera must receive and (optionally) respond to. On the Qualcomm Atheros chipset in the RBR760, sending an NFP to a sleeping station wakes the station's radio for at least one DTIM interval — which consumes battery. The Arlo base station never sends NFPs to sleeping cameras. `disable_inactivity_poll` replicates that behaviour.

To verify it is working:

```bash
cfg80211tool ath02 get_disable_inactivity_poll
# Expected: disable_inactivity_poll = 1
```

### Complete Verification Matrix

After applying all the battery-optimisation configs, the live state should match:

| Parameter | Command | Expected | Source |
|-----------|---------|----------|--------|
| Guest beacon interval | `cfg80211tool ath02 get_beacon` | `beacon = 100` | This post |
| Guest beacon interval (5 GHz) | `cfg80211tool ath21 get_beacon` | `beacon = 100` | This post |
| Inactivity timeout | `cfg80211tool ath02 get_inact` | `inact = 65535` | Post 4 |
| Inactivity poll disabled | `cfg80211tool ath02 get_disable_inactivity_poll` | `disable_inactivity_poll = 1` | This post |
| Power-save enabled | `cfg80211tool ath02 get_ps_on_time_enable` | `ps_on_time_enable = 1` | This post |
| DTIM period | `hostapd_cli -i ath02 -p /var/run/hostapd-wifi0 get dtim_period` | `DTIM period: 1` | This post |
| Guest DHCP lease | `grep lease /tmp/dni_udhcpd_guest.conf` | `option lease 86400` | Post 4 |
| Camera registration | `curl http://192.168.1.48:5000/device` | All cameras, no churn | Post 1 |

## Measured Improvement

With the full config from Part 3 (beacon interval = 100, inact = 65535, disable_inactivity_poll = 1, DHCP lease = 86400), I re-ran the armed battery drain test on PORTAIL:

| Configuration | Drain rate | Estimated battery life (2440 mAh, 4.5 V) |
|--------------|------------|----------------------------------------|
| Default guest WiFi (inact=300, lease=1800, poll=0) | ~3.9%/h | ~25.5 hours |
| Post 4 fix only (inact=65535, lease=86400) | ~0.67%/h | ~6.2 days |
| Full deep-dive config (+beacon=100, +poll=0) | ~0.52%/h | ~8.0 days |

The ~8 days of battery life while *armed and on a mesh satellite* is dramatically better than the ~25 hours that motivated the investigation. For a camera that is disarmed (no beacon probing), the expected battery life remains the original 3–6 months.

## What Remains

The vendor IE in the Arlo base station's beacon frames is still not replicated. The RBR760's `hostapd` supports adding vendor-specific IEs via `hostapd_cli set vendor_elements`, but the format is binary and the Arlo IE includes cryptographically signed camera serials whose format I have not fully reverse-engineered. The `disable_inactivity_poll` + long `inact` combination approximates the behaviour well enough that the battery measurements are within 20% of the original base station's performance, but the "never disassociate even if the camera is offline for 18+ hours" guarantee of the patented IE is not matched.

If you need that guarantee, the community recommendation remains: use a real Arlo base station for the WiFi layer and route its Ethernet into your self-hosted stack. For everyone else, the config in this post gets you to within measurable distance of the original battery life.

---

*This is a bonus fifth post in the Arlo series. The full stack:*

- *[Post 1](/replacing-arlo-base-station-with-a-netgear-orbi-router/) — networking layer: gateway replacement, DHCP, DNAT*
- *[Post 2](/self-hosting-arlo-cam-api-patches-and-improvements/) — application layer: arlo-cam-api self-hosting*
- *[Post 3](/integrating-self-hosted-arlo-with-home-assistant/) — automation layer: Home Assistant integration*
- *[Post 4](/fixing-arlo-camera-battery-life-at-the-wifi-layer/) — WiFi layer: inactivity timeout and DHCP lease*
- *This post — battery drain measurements, sniffed base station data, and extended router config*

*The companion repository at [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) holds every config file mentioned in the series.*