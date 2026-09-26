---
title: 'Jev in Home Assistant, Take Two: History, Feedback, and Why I Didn''t Go Local'
categories:
- smart-home
tags:
- home-assistant
- smart-home
- automation
- ai
- llm
- jev
- laya
- openrouter
date: '2026-09-26T15:50:00.000000+00:00'
draft: false
slug: jev-home-assistant-history-feedback-and-the-local-model-question
translationKey: jev-home-assistant-history-feedback
cover: cover.jpg
showHero: true
description: A Mastodon comment asked why not feed Jev's context to a small local model instead. Here is why an N100 mini PC with 16 GB of RAM can't carry that, why swapping models wouldn't have fixed the real problem anyway, and what I built instead - compact history, a broken-sensor safety net, per-decision shadow/active modes, and a feedback loop that scores Jev against my own rules. With the real numbers from the first days in production.
summary: The fix for "Jev has no memory" was never a different model. It was giving Jev a memory. Here is the history script, the feedback loop, and what the live scoreboard already disagrees about.
---

My [previous post](/jev-home-assistant-letting-a-decision-model-judge-my-automations/) covered how I plugged **Jev**, TypeSafe's decision model, into Home Assistant to answer the "is this normal?" question my threshold-based automations can't: is the sump pump running long because it rained, or because the float is stuck; is the water flowing because of a shower, or a leak. The rule always computes its own answer, Jev only advises, and everything started in shadow mode so I could read the disagreements before trusting it.

That post got a comment on Mastodon that deserved more than a reply. Thanks to **OneClickClaw** for it:

> @mmornati Feed the last few hours of readings to a small local model, it gets the context.

Fair question. My prompts really were snapshots - humidity *now*, flow *now* - and a shower and a slow leak can look identical for a few seconds. This post is what I did about it, and it isn't what the comment suggested. I looked hard at running something locally, decided against it, and found that the actual gap had nothing to do with which model answers the question.

## Why not a small local model, on my hardware

The house I described the last time still runs on the same box I've mentioned before on this blog: an **N100 mini PC, 4 cores, 16 GB of RAM, no GPU**. It's already carrying Home Assistant Core, the recorder database, Zigbee2MQTT, and everything else HAOS runs alongside it. There's no spare accelerator sitting idle, and no second box I'd want to dedicate just for this.

In the router post that started this whole thing, I benchmarked **Laya**, an open-weights model built for exactly this kind of typed decision, and the numbers already answered the question I'd be asking now: on an Apple GPU it's fast, but on a Raspberry-class CPU - which an N100 is closer to than to a GPU box - expect **1.5 to 3 seconds per call**. My decisions fire every 5 minutes for the VMC alone, several of them run in parallel (`mode: parallel` on purpose, so a flapping trigger doesn't queue behind a slow one), and some share the box with the Zigbee coordinator that's supposed to react to a button press in real time. A few seconds of CPU contention, six times an hour, forever, is not a rounding error on 4 cores - it's a tax on the thing the box actually has to do.

And that's for a model *designed* to be small. Loading even a distilled general-purpose LLM (a small Llama or Qwen) adds a few gigabytes of RAM just sitting there, on a machine where 16 GB is the whole budget, not a headroom number. The maths from the last post already said it plainly: **local only makes sense on its own hardware**, and buying a second mini PC to save $3 a year is not a serious trade.

## The part that would have been wrong even with better hardware

Here's the thing I only realised while checking the numbers: **the local-model idea assumes the problem was Jev's intelligence. It wasn't.** Jev has a 32k-token context window and I was using about 565 tokens of it. The ceiling was never the model - it was that I was only ever sending it *the current value*. A small local model with a 512-token window would have hit the same wall faster, not solved it.

So the fix wasn't to swap Jev for something else. It was to stop starving it.

## What I built instead

Five additions, all inside the existing shadow/active pattern, none of it changing which model answers the question.

### 1. Compact history, not raw readings

A new shared script, `script.jev_history`, calls Home Assistant's own `recorder.get_statistics` and resamples it into short series a model can read at a glance - one value per step, plus min, max, and the largest rise or drop with when it happened:

```yaml
- action: script.jev_history
  data:
    sensors:
      water flow L/min: sensor.water_monitor_general_water_flow_l_min
      upstairs bathroom humidity %: sensor.temperature_sensor_salle_bain_etage_humidity_2
      parents' bathroom humidity %: sensor.temperature_sensor_salle_bain_parents_humidity_2
      kitchen humidity %: sensor.temperature_sensor_cuisine_humidity_2
    hours: 3
    every: 15
```

That's about 40 tokens per sensor instead of hundreds of noisy raw states, and it's exactly what tells a shower from a leak: a shower is 8-12 L/min for ten minutes with bathroom humidity climbing *during* that window; a leak is a low, flat flow for hours with nothing else moving. `jev_history` now runs ahead of all six decisions - pump, water, temperature drop, shutters, VMC, laundry.

Alongside it, a 24-hour rolling `sensor.house_timeline` keeps the last 25 house events ("washing machine started", "someone arrived home", "VMC set to Vitesse 2") without naming who or where, so a decision can also see *what just happened*, not only *what the numbers look like*.

### 2. A humidity baseline, because "high" is relative

A room that always reads 72% isn't steaming at 72%, and blowing outdoor air through it doesn't dry anything if the outdoor air holds more water than the room does. Two new pieces close that gap: a `statistics` sensor tracking each wet room's own 24-hour median, and a template that turns temperature and relative humidity into **absolute humidity in g/m³** - the number that actually tells you whether ventilating helps. The VMC decision now gets both, alongside the raw percentages.

### 3. A safety net for the exact bug the last post found

The previous post's nicest accidental discovery was that two humidity sensors had been stuck at 0% for who knows how long, quietly feeding both the old rule and Jev a wrong number. That shouldn't have to wait for a blog post to be noticed, so there's now a shared `sensor_health.jinja`: every sensor a decision depends on gets checked for being missing, unavailable, out of a plausible range, or silent for too long. When one is broken, Jev is told explicitly which values aren't real ("unreliable sensors: highest living-room humidity (implausible value)"), its answer is never trusted for that call, and a `safe_answer` (usually "keep doing what you were doing") wins over the rule too - because the rule is reading the same broken sensor and has no idea it's lying.

### 4. One mode switch per decision, not one for the whole house

`input_select.jev_mode` used to be a single switch for six very different questions. It's now `input_select.jev_mode_vmc`, `_eau`, `_pompe`, `_temperature`, `_volets`, `_linge`, each defaulting to `global` (follow the main switch) but able to go active or off on its own. That turned out to matter faster than I expected - see the numbers below.

### 5. A feedback loop, so I don't have to eyeball the logbook forever

Every time Jev and the rule disagree, a phone notification can now ask "who was right?", with two buttons. The answer fires an event, which lands on a new `sensor.jev_scoreboard`: per decision, how many times Jev was asked, how often it disagreed with the rule, and who the feedback said was right, plus the token cost. A Sunday-evening automation reads the scoreboard, posts a weekly summary, and resets the count for the next week. I also wrote up a short review process (`docs/jev-weekly-review.md`) for reading the shadow logbook, the scoreboard, and the history around each disagreement, and turning that into a pull request - the same shape of session that built the feature in the first place, pointed at reviewing it instead.

None of this required a different model, a second machine, or leaving the shadow pattern. It required sending Jev the facts a person would actually use to judge the same situation.

## What the house is actually saying, right now

I pulled this straight from the live instance while writing this section, so it's what's really happening, not an estimate.

**Today (26 September, checked mid-afternoon UTC):** 267 Jev calls, 205,974 input tokens, **$0.0087** so far. Over the trailing week, the daily average is about 116 calls and a median cost around **$0.0027/day** - a slow day and a busy day can differ by a lot, which is expected once the VMC only asks when something actually changed rather than on a fixed timer.

The scoreboard is only hours old (I reset it when this shipped), and it's already telling a useful story:

| Decision | Asked | Disagreed with the rule | Jev's confidence |
| --- | --- | --- | --- |
| VMC (choice of 3 speeds) | 14 | **14** (100%) | 0.34 - 0.76, always below the 0.6 bar that would let it act |
| Shutters (yes/no) | 78 | **0** (0%) | consistently confident |

Pulled straight from the shadow logbook over the last 24 hours, that's not a fluke - every one of about 115 VMC calls disagreed with the rule, always at a confidence too low to matter even in active mode, while every one of the shutter calls agreed with it. Two decisions, wired the same way, behaving completely differently. That's exactly why the per-decision switch exists: **the shutters could go active today** with nothing left to check; **the VMC clearly can't yet**, and now I have a scoreboard instead of a gut feeling telling me so. My guess, to verify next: the VMC's own rule already reacts to short humidity spikes with hysteresis, so a lot of what looks like "disagreement" is Jev and the rule picking different speeds during the same transient rather than either one being wrong - which is precisely the kind of thing the weekly review process exists to dig into once there's a full week of feedback answers to read.

## Worth trying next

Two things I haven't done yet, both natural next steps from what's already in place:

- **Calibrate the VMC with its own history.** HA-Jev's `jev.calibrate` action compares a probability sensor's past values against what actually happened and suggests a threshold. With a growing scoreboard and logbook, the VMC decision finally has enough of its own data to be tuned on, instead of relying on Jev's general-purpose calibration.
- **Feed Laya the same history, in shadow, for free.** The local-model idea wasn't wrong to want context - it was solving the wrong layer. Now that `jev_history` produces a small, resampled JSON series for every decision, it's also exactly what a 512-token local model would need, and cheap to try: log a third column next to Jev and the rule, no phone notifications, just numbers to compare in a few weeks.

If you're running Jev or a similar decision model in your own automations, I'd like to know whether you found the same thing - that the missing piece was memory, not intelligence. Tell me in the comments, or reply on Mastodon like the last one.
