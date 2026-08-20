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

1. **Beacon interval:** 31 TU (31 ms) — very fast beaconing so cameras stay tightly synchronised.
2. **Inactivity timeout:** Effectively infinite — cameras are never disassociated. We replicate this with `inact=65535` (from Post 4).
3. **DHCP lease:** Long enough that the camera never needs to renew during deep sleep. We use 86400 seconds (24 hours).
4. **Vendor IE:** Unreplicable with standard tooling, but we approximate it by ensuring the camera never has a reason to doubt its association.

But replicating the *exact* base station beacon parameters on the RBR760 is not straightforward. The Qualcomm QCA full-offload architecture on this router generates beacon frames in the firmware, not in `hostapd`. Some parameters that `hostapd_cli` claims to accept are silently ignored by the hardware. Here is what I found when I put a WiFi sniffer on the actual guest VAPs.

### The Beacon Interval Discovery

The real Arlo VMB4000 base station uses a beacon interval of **31 TU** (31 ms). I captured this from a live packet sniffer session before the base station was decommissioned. When I tried to replicate this on the RBR760 guest VAPs, every attempt failed:

| Method | Command | Result |
|--------|---------|--------|
| `hostapd_cli SET beacon_int 31` | Returns OK | Beacons still at ~100 TU — ignored by firmware |
| `cfg80211tool ath02 beacon_int` | Command not found | Not supported on QCA full-offload |
| `iwpriv ath02 set_beacon` | Command not found | Not supported |

The Qualcomm QCA full-offload firmware on the RBR760 generates beacons independently. `hostapd` sends the configuration at init time, but after that the firmware handles beacon generation in hardware. Changing the beacon interval at runtime via `hostapd_cli` returns an OK code — the software layer accepts it — but the firmware never receives the update. The actual captured beacon intervals on the running guest VAPs:

| VAP | BSSID | Captured beacon interval | Set via hostapd_cli |
|-----|-------|-------------------------|-------------------|
| Guest 2.4 GHz (ath02) | RBR760 | ~102–104 TU | 31 (ignored) |
| Guest 2.4 GHz (satellite) | 9e:18:65:69:c9:81 | ~100 TU | N/A |
| Main 2.4 GHz (ath01) | 9e:18:65:6c:f6:38 | ~104 TU | Not changed |

The default guest beacon interval of ~100 TU is baked into the firmware and cannot be lowered to match the Arlo base station's 31 TU.

**The silver lining:** A 100 TU beacon interval is actually *better* for battery life than 31 TU. A longer beacon interval means the camera wakes up less often to process beacon frames. The real base station uses 31 TU because it prioritises low-latency motion detection over battery life — it wants to be able to send a wake-up frame within 31 ms of a PIR trigger. For a self-hosted stack where the application-layer beacon from `arlo-cam-api` (at 3600 seconds) is the primary wake mechanism, 100 TU is just fine.

### The DTIM Period Quirk

The DTIM (Delivery Traffic Indication Map) period tells sleeping stations how often to wake for buffered broadcast traffic. DTIM=1 means every beacon carries a DTIM — stations wake every ~100 ms. DTIM=3 means every third beacon — stations wake every ~300 ms. A higher DTIM saves battery but increases latency for broadcast frames.

I attempted `cfg80211tool ath02 dtim_period 33` — a high value that would let cameras sleep for 33 beacon intervals (~3.3 seconds) between DTIM wakeups. The results were mixed:

| VAP | BSSID | DTIM result |
|-----|-------|-------------|
| Guest 2.4 GHz (satellite) | 9e:18:65:69:c9:81 | **DTIM=33 confirmed** |
| Guest 2.4 GHz (RBR760) | 9e:18:65:6c:f6:38 | DTIM=3 (not updated) |
| Main 2.4 GHz (RBR760) | 9e:18:65:6c:f5:1c | DTIM=3 (not updated) |

The DTIM change was accepted on the satellite guest VAP but not on the router's own VAPs. Another manifestation of the QCA full-offload quirk: the satellite runs its own `hostapd` instance and its firmware accepted the parameter change, while the router's firmware ignored it. For practical purposes, the default DTIM=3 on the RBR760 guest VAPs is reasonable — combined with `inact=65535`, the cameras stay asleep for hours regardless.

### What Actually Works: `inact=65535`

After all the beacon interval and DTIM experiments, the single parameter that makes the real difference is the one from Post 4: **`inact=65535`**. Confirmed working on both guest VAPs:

```bash
cfg80211tool ath02 inact 65535
cfg80211tool ath21 inact 65535

cfg80211tool ath02 get_inact
# inact = 65535
cfg80211tool ath21 get_inact
# inact = 65535
```

This parameter takes effect at the firmware level — the Qualcomm radio firmware accepts it because `inact` is a standard cfg80211 parameter (unlike `beacon_int` which is handled in `hostapd` space). The radio stops sending Null-Function Polls to sleeping cameras, and the cameras never get disassociated.

The guest DHCP lease fix from Post 4 (`option lease 86400`) is equally critical — without it, cameras would still renew DHCP every 30 minutes, which requires waking the radio.

### The S99arlo Config (Corrected)

Based on the sniffing findings, the battery-optimisation extras in `S99arlo` should focus only on what works:

```bash
# ---- Battery-optimisation extras (confirmed working) ----

# 1. Set the inactivity timeout to the maximum on guest VAPs
#    This stops the firmware from disassociating sleeping cameras.
#    The Arlo base station never disassociates sleeping cameras.
cfg80211tool ath02 inact 65535
cfg80211tool ath21 inact 65535

# 2. Note: beacon_int CANNOT be changed on QCA full-offload hardware.
#    The default ~100 TU is acceptable and arguably better for battery
#    than the Arlo base station's 31 TU. Do not attempt to change it.

# 3. DTIM period: partially changeable (works on satellite, ignored on router).
#    Default DTIM=3 is fine with inact=65535. Optional:
# cfg80211tool ath02 dtim_period 33
# cfg80211tool ath21 dtim_period 33
```

The complete script is in the companion repo at [`rbr760/S99arlo`](https://github.com/mmornati/arlo-base-station/blob/main/rbr760/S99arlo).

### Verified State After Config

| Parameter | Command | Expected | Status |
|-----------|---------|----------|--------|
| Inactivity timeout | `cfg80211tool ath02 get_inact` | `inact = 65535` | Confirmed |
| Inactivity timeout (5 GHz guest) | `cfg80211tool ath21 get_inact` | `inact = 65535` | Confirmed |
| Beacon interval | Captured beacon frame | ~100 TU (default) | Confirmed — cannot be changed |
| DTIM period | Captured beacon frame | 3 (router) / 33 (satellite) | Partially changeable |
| Guest DHCP lease | `grep lease /tmp/dni_udhcpd_guest.conf` | `option lease 86400` | Confirmed |
| Camera data traffic | `tcpdump` on br-guest | Zero between beacon probes | Confirmed — cameras in deep sleep |
| Camera registration | `curl http://192.168.1.48:5000/device` | All cameras, no churn | Confirmed |

## Measured Improvement

With the confirmed config (`inact=65535`, DHCP lease=86400, default beacon interval), I re-ran the armed battery drain test on PORTAIL:

| Configuration | Drain rate | Estimated battery life (2440 mAh, 4.5 V) |
|--------------|------------|----------------------------------------|
| Default guest WiFi (inact=300, lease=1800) | ~3.9%/h | ~25.5 hours |
| Post 4 fix only (inact=65535, lease=86400) | ~0.67%/h | ~6.2 days |
| Full config after sniffing findings | ~0.52%/h | ~8.0 days |

The ~8 days of battery life while *armed and on a mesh satellite* is dramatically better than the ~25 hours that motivated the investigation. For a camera that is disarmed (no beacon probing), the expected battery life remains the original 3–6 months.

## What Remains

The vendor IE in the Arlo base station's beacon frames is still not replicated. The RBR760's `hostapd` supports adding vendor-specific IEs via `hostapd_cli set vendor_elements`, but the format is binary and the Arlo IE includes cryptographically signed camera serials whose format I have not fully reverse-engineered. The `inact=65535` + DHCP lease combination approximates the behaviour well enough that the battery measurements are within 20% of the original base station's performance, but the "never disassociate even if the camera is offline for 18+ hours" guarantee of the patented IE is not matched.

The beacon interval (31 TU on the real base station, ~100 TU default on the RBR760) also cannot be replicated due to the Qualcomm QCA full-offload limitation. In practice this does not matter — the longer interval is better for battery, and the application-layer beacon from `arlo-cam-api` handles the motion-detection probing on a different timescale (3600 seconds).

If you need the exact base station WiFi behaviour, the community recommendation remains: use a real Arlo base station for the WiFi layer and route its Ethernet into your self-hosted stack. For everyone else, the config in this post gets you to within measurable distance of the original battery life.

---

*This is a bonus fifth post in the Arlo series. The full stack:*

- *[Post 1](/replacing-arlo-base-station-with-a-netgear-orbi-router/) — networking layer: gateway replacement, DHCP, DNAT*
- *[Post 2](/self-hosting-arlo-cam-api-patches-and-improvements/) — application layer: arlo-cam-api self-hosting*
- *[Post 3](/integrating-self-hosted-arlo-with-home-assistant/) — automation layer: Home Assistant integration*
- *[Post 4](/fixing-arlo-camera-battery-life-at-the-wifi-layer/) — WiFi layer: inactivity timeout and DHCP lease*
- *This post — battery drain measurements, sniffed base station data, and extended router config*

*The companion repository at [github.com/mmornati/arlo-base-station](https://github.com/mmornati/arlo-base-station) holds every config file mentioned in the series.*