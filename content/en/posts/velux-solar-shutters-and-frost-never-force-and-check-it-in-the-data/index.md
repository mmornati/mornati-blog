---
title: "Velux solar shutters and frost: never force, close before, open after"
categories:
- smart-home
tags:
- home-assistant
- velux
- cover
- frost
- automation
- homekit
- ai
- prompt
date: '2026-12-03T06:00:00.000000+00:00'
draft: false
slug: velux-solar-shutters-and-frost-never-force-and-check-it-in-the-data
translationKey: velux-solar-shutters-and-frost
cover: cover.jpg
showHero: true
keyfigure: '17 closings without a single jam over 4 frosty evenings'
description: "One evening in November, three of my Velux solar roller shutters refused to close: the side rails were frozen. Velux says never force them. Home Assistant can't see the jam, so I taught it to recognise one, to close before the frost and to open after it. Five days of real data, what works, what doesn't work yet, and a recipe to give your AI assistant so you can do the same at home."
summary: "Three rules for solar roof shutters in winter: close once at nightfall when frost is coming, postpone the morning opening, never retry a shutter that refused. The numbers from 23 to 28 November: 17 closings without a single refusal, 14 successful postponed openings, 3 refusals, all on the north slope. And why I no longer publish my YAML, but a recipe for the AI instead."
---

On the evening of 23 November, at 20:42, the house closed the bedroom shutters like it does every evening. On the roof, it was −1.2 °C. **One shutter closed. The other three made noise for twenty-five seconds, then went back exactly where they were: wide open.**

I did what everybody does. I tried again. Four times, between 20:44 and 21:00. Four more refusals.

It was the worst thing I could do.

## What Velux says

My five roof windows have Velux solar roller shutters (the SSL range): a small panel, a battery, a motor, no wires. They are driven by the VELUX ACTIVE gateway, which Home Assistant sees through HomeKit.

On frost, the manufacturer is clear, and so is the manual:

*   after a damp spell (rain, fog, or simply the air of a bedroom being aired), **condensation settles on the side rails and the slats, then freezes**;
*   the motor has an **overload protection**: if it feels abnormal resistance, it stops so it doesn't damage the mechanism ([SSL shutter manual](https://www.bauhaus.ch/product-documents/velux_ssl_fr.pdf));
*   you must **never force it**, and you wait for the thaw. At best, Velux support suggests opening the window a little so the warmth of the room helps a bit.

The ice can be in the rails and in the top casing without being visible from outside. And according to a reseller's fact sheet, the motor stays locked for about ten minutes after a refusal: my four retries had no chance, they only wore out the mechanism.

The battery had nothing to do with it. The shutters had moved normally after several grey days, and they all refused on exactly the first evening of frost.

## What Home Assistant doesn't see

The Velux app shows "blocked". Home Assistant gets nothing. I checked what the gateway publishes over HomeKit for each shutter: the target position, the current position, and the movement state. No fault, no obstacle detected.

But the refusal leaves a **very clear signature** in the history:

| | Real closing | Refusal |
|---|---|---|
| State | `closing` → `closed` | `closing` → `open` |
| Position | 100 → 34 → 0 | 100 → 100 |
| Duration | 13 seconds | 20 to 60 seconds |

A shutter that starts, then comes back to where it was without having moved more than 10%, is a blocked shutter. That is the whole detector. Replayed over ten days of history, it found the 7 refusals of 23 November without a single false alarm on the 55 other movements.

## Three rules

**1. Close before the frost, only once.** As soon as it is dark outside (no light is lost), if frost is coming: 2 °C or less, or 5 °C or less with a forecast low of 0 °C during the night. One command, once per evening, and nothing more.

**2. Postpone the morning opening.** At 7:15 on school days, it is still freezing. The opening is not sent, it is put on hold. It goes out only once, later, when it is above 1 °C, or from 0 °C if the sun is out. At 15:00, if nothing was possible, the wait is dropped and I get a message: the shutters stay closed.

**3. Never retry.** Every movement is watched. A refusal triggers an alert ("probably frost, do not retry"), and the shutter is marked as blocked for 12 hours: no automation will send it a command. If someone retries it by hand within ten minutes, a second message reminds them why it is better to wait.

What about humidity? Physically, it matters: no water, no ice. But at my place, in November, it sits between 85 and 96% **every evening**, including the ones where everything closes without trouble. It tells nothing apart. So it is logged with every movement, along with the dew point, but it is not part of the rule. Temperature decides.

## Five days of real data

{{< chart >}}
type: 'line',
data: {
  labels: ["23 11h", "23 12h", "23 13h", "23 14h", "23 15h", "23 16h", "23 17h", "23 18h", "23 19h", "23 20h", "23 21h", "23 22h", "23 23h", "24 00h", "24 01h", "24 02h", "24 03h", "24 04h", "24 05h", "24 06h", "24 07h", "24 08h", "24 09h", "24 10h", "24 11h", "24 12h", "24 13h", "24 14h", "24 15h", "24 16h", "24 17h", "24 18h", "24 19h", "24 20h", "24 21h", "24 22h", "24 23h", "25 00h", "25 01h", "25 02h", "25 03h", "25 04h", "25 05h", "25 06h", "25 07h", "25 08h", "25 09h", "25 10h", "25 11h", "25 12h", "25 13h", "25 14h", "25 15h", "25 16h", "25 17h", "25 18h", "25 19h", "25 20h", "25 21h", "25 22h", "25 23h", "26 00h", "26 01h", "26 02h", "26 03h", "26 04h", "26 05h", "26 06h", "26 07h", "26 08h", "26 09h", "26 10h", "26 11h", "26 12h", "26 13h", "26 14h", "26 15h", "26 16h", "26 17h", "26 18h", "26 19h", "26 20h", "26 21h", "26 22h", "26 23h", "27 00h", "27 01h", "27 02h", "27 03h", "27 04h", "27 05h", "27 06h", "27 07h", "27 08h", "27 09h", "27 10h", "27 11h", "27 12h", "27 13h", "27 14h", "27 15h", "27 16h", "27 17h", "27 18h", "27 19h", "27 20h", "27 21h", "27 22h", "27 23h", "28 00h", "28 01h", "28 02h", "28 03h", "28 04h", "28 05h", "28 06h", "28 07h", "28 08h", "28 09h"],
  datasets: [
    { label: "Outdoor temperature (°C)", data: [2.8, 4.1, 5.0, 5.8, 4.6, 3.0, 1.4, 0.2, -0.5, -1.2, -1.5, -1.8, -1.9, -2.4, -2.6, -2.7, -2.9, -2.9, -3.1, -3.1, -2.9, -2.9, -2.5, -0.9, 0.8, 2.4, 3.9, 5.2, 4.3, 2.9, 1.7, 1.0, 0.5, 0.1, -0.3, -0.7, -0.9, -1.0, -1.1, -1.1, -1.2, -1.5, -1.8, -1.7, -1.8, -1.6, -1.6, -0.5, 1.4, 1.9, 1.6, 1.4, 1.5, 1.3, 1.1, 1.1, 1.1, 1.4, 1.3, 1.4, 1.3, 1.2, 1.0, 0.8, 0.6, -0.3, -1.1, -1.6, -1.9, -2.2, -2.3, -1.1, 0.2, 1.3, 2.3, 3.0, 1.9, 0.3, -0.9, -1.4, -1.7, -2.2, -2.7, -3.1, -2.6, -1.8, -1.2, -1.0, -0.9, -0.9, -2.3, -3.2, -3.7, -4.0, -4.0, -1.8, 0.7, 2.6, 3.8, 4.5, 3.3, 1.6, 0.0, -1.4, -1.6, -1.8, -2.2, -2.9, -3.1, -2.6, -2.2, -2.1, -2.3, -2.4, -3.2, -3.2, -3.0, -2.8, -2.4], borderColor: '#2b46d6', backgroundColor: '#2b46d6', pointRadius: 0, borderWidth: 2, tension: 0.3 },
    { label: "Closed fine", data: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 2.0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 1.2, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, -0.5, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.9, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], showLine: false, pointStyle: 'triangle', rotation: 180, pointRadius: 8, borderColor: '#15171c', backgroundColor: '#7fe3cf' },
    { label: "Opened fine", data: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.4, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, -2.5], showLine: false, pointStyle: 'triangle', pointRadius: 8, borderColor: '#15171c', backgroundColor: '#ffe14a' },
    { label: "Refused (shutter blocked)", data: [null, null, null, null, null, null, null, null, null, -1.2, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.1, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, -2.5], showLine: false, pointStyle: 'crossRot', pointRadius: 9, borderWidth: 3, borderColor: '#e4002b', backgroundColor: '#e4002b' }
  ]
},
options: {
  scales: { x: { ticks: { maxTicksLimit: 12 } }, y: { suggestedMin: -5, suggestedMax: 6 } },
  plugins: { legend: { labels: { usePointStyle: true } } }
}
{{< /chart >}}

| | When | Outside | Result |
|---|---|---|---|
| 23 Nov, usual closing | 20:42 | −1.2 °C | **3 shutters out of 4 refuse**, then 4 retries refused |
| 24 to 27 Nov, closing before the frost | 16:50 to 17:10 | −0.5 to 2.0 °C | **17 closings, 0 refusals** |
| 24 to 27 Nov, postponed opening | 11:00 to 11:20 | 0.0 to 0.4 °C | 14 openings, **2 refusals** |
| 28 Nov, opening by hand | 9:23 | −2.5 °C | 4 openings, **1 refusal** |

In the evening, the problem is gone. The nights still went down to −4.5 °C, but the shutters had already been down for hours.

In the morning, it is less clear-cut, and that is the interesting part.

## The morning of 28 November

Saturday, no school, no automatic opening at 7:15. At 9:23, someone opens the five shutters by hand. It is −2.5 °C. By my rule, that is three and a half degrees too early.

**Four shutters open without a fuss. The fifth refuses.** The alert arrives within a minute, nobody retries it, and it stayed closed.

Put next to the two refusals of the week, a pattern appears:

*   the two openings refused under the automation happened at **0.1 °C**, just above my "sun" threshold;
*   the **three opening refusals come from the same two shutters**, the ones on the north-north-east slope, opposite the solar panels. In the morning, they don't see the sun;
*   the shutters on the sunny slope opened at −2.5 °C.

My rule treats the five shutters the same way, with a light sensor placed on the sunny side. For the north slope, it says nothing. Air temperature is not enough: what matters is what the roof has received.

## The date that tells you where to look

What I like most about this automation is not the rule. It is the log.

Every shutter movement produces a dated event: which shutter, which direction, succeeded or refused, the temperature, the humidity, the dew point. **When a shutter jams, I don't have a vague memory ("I think it got stuck this week"), I have a date and a time.** And with a date, you know exactly where to look in the history: the light at that moment, the temperature one hour earlier, what the other shutters did in the same second.

That is how the three points in the previous section came out: not by thinking, but by rereading five days of events. And that is what lets me fix the scripts based on facts. The next changes are already under way: a more cautious opening threshold, a different condition for the north slope, and a question I haven't settled yet (should there be a second attempt, only one, much later, for a shutter that stayed closed?).

This log also feeds [Jev, the decision model](/jev-home-assistant-letting-a-decision-model-judge-my-automations/) that I query alongside my rules. For now it only observes: with a single evening of incident in memory, it can't know more than the rule does. We'll come back to it at the end of winter.

## Why I no longer publish my YAML

For years, I pasted the code of my automations into my posts, [like I did for shutters and heat](/homeassistant-close-cover-to-control-the-home-temperature-v2/). I don't do it anymore, and this one shows why: 470 lines, full of entity names that only exist at my place, thresholds tuned for my roof, a light sensor that looks at my terrace. Copying that wouldn't get you anywhere. You would have to rewrite everything.

What travels from one house to another is not the code. It is **the intent, the rules, the guardrails, and the cases that went wrong**. And today, an AI assistant is very good at writing a Home Assistant automation from that, especially if it can look at your devices.

So here is the recipe for this post. Give it to your assistant (Claude, ChatGPT, whichever one you use), ideally connected to your Home Assistant. It asks the assistant to start from your shutters and your sensors, not mine, and it includes my real cases as tests.

{{< ai-prompt >}}

Two tips. Let the assistant ask its questions before it writes anything, that is where your setup gets into the automation. And keep the log: it is what will tell you, three weeks from now, which threshold was wrong.

## How it was made

The automation was designed on the very evening of 23 November, in a Claude Code session on the repository of my Home Assistant configuration: reading the history of the previous ten days, researching what Velux says, a plan with four questions for me, then the code and a test that replays the real states. This post was written five days later, in another session, which reread the production history (the events of each movement, the temperatures hour by hour) to get the numbers above. That rereading is what brought out the north slope, and a third session is now fixing the rules. My part: the pointless retries of the first evening, the answers to the questions, and the orientation of the roof.
