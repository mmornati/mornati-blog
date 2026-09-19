---
title: 'Preparing an Ultra-Trail with ai-running-coach: From Planning to the Finish Line'
categories:
- ai-coding-agents
tags:
- ai
- agents
- trail
- running
- garmin
- mcp
- ultra-trail
date: '2026-09-19T07:41:00.000000+00:00'
slug: preparing-an-ultra-trail-with-ai-running-coach
description: How I prepared the Ultra 110 km Trail Côte d'Opale with ai-running-coach, an open-source project of AI agents connected to Garmin — periodized training, nutrition, data analysis and race strategy.
---

On September 13, 2026, at 2:00 AM, I lined up at the start of the **Ultra 110 km Trail Côte d'Opale** in Wimereux, France. 15h26 later, I crossed the finish line. Between those two moments, there was more than just training: there were months of **planning, analysis and adjustments** — and a good part of that work was done with the help of AI agents.

In this article, I'll tell you how I used [ai-running-coach](https://github.com/mmornati/ai-running-coach), an open-source project I created, to prepare for this goal: the periodized training plan, nutrition, analysis of my Garmin data, and race strategy all the way to race day.

## The project: specialized AI agents, connected to Garmin

[ai-running-coach](https://github.com/mmornati/ai-running-coach) is a project **100% in French** that provides AI agents and skills to help runners prepare for a goal (race, trail, ultra) directly in their favorite IDE (Claude Code, OpenCode, Gemini CLI, Cursor, Windsurf).

The project is built around **4 specialized agents**:

| Agent | Role |
|:------|:-----|
| 🧠 **coach** | Plans periodized training, adjusts based on constraints (weather, health, personal life) |
| 🗺️ **course-strategist** | Analyzes courses (GPX), defines paces and race strategy |
| 🩺 **medical** | Analyzes health data (HRV, resting HR, sleep, readiness) and weather |
| 🥗 **nutritionist** | Builds training and race nutrition plans |

Plus **8 skills**: GPX analysis, course comparison, Garmin planning, weather, session analysis, etc. Access to **Garmin Connect** goes through `garmin-mcp`, with a whitelist of tools.

Installation is a single command:

```bash
git clone https://github.com/mmornati/ai-running-coach.git
cd ai-running-coach
./install.sh
```

The script automatically configures Garmin access, the working folders (`activities/`, `medical/`, `nutrition/`, `planning/`, `rapports/`, `resources/`) and the integration with your IDE.

All the work is done in **markdown, in French**, in a structured workspace. Every session, every report, every plan is a file you can re-read, version and share. That's exactly what I did for 4 months.

## The goal: the Ultra 110 km Trail Côte d'Opale

My goal was clear: **109.8 km, +1768 m of elevation gain, 2:00 AM start, along the Opal Coast** (sand, dunes, cliffs, wind). A demanding course, with time barriers to respect:

| Point | Km | Barrier |
|:------|:---|:--------|
| Châtelet | 42.4 | 09:00 |
| Hervelinghen | 77.6 | 14:30 |
| Cap Gris-Nez | 94.1 | 17:00 |
| Finish | 109.8 | 19:35 |

With the coach, we defined a **realistic target of 15h00** (average pace 8:12/km), an ambitious scenario at 12h49 and a safety scenario at 16h00. The heart rate rule was simple: **never above 140 bpm**, with a target of 116-133 bpm (Z2).

## The periodized training plan

The plan was built **period by period**, from June until race day, with constant adjustments based on my personal constraints, the weather and my health.

### The final phases (S1 → S5)

The last 5 weeks illustrate the logic well:

| Phase | Period | Content | Volume |
|:------|:-------|:--------|:-------|
| **S1** | Aug 10-16 | 48 km long run (Vicere-Mara-Sanprimo) | ~55 km |
| **S2** | Aug 17-23 | Maximum volume, dune runs | ~72 km |
| **S3** | Aug 24-30 | Mallorca vacation + **30-40 km PEAK** (nutrition test) | ~58 km |
| **S4** | Aug 31-Sep 6 | Taper -40% | ~42 km |
| **S5** | Sep 7-13 | Taper -60/-70% + race | ~30 km |

![Weekly volume per phase](/images/preparer-un-ultra-trail-avec-ai-running-coach/07-volume-entrainement.png)

### Adjustments along the way

What makes the difference is the ability to **adjust**. A few concrete examples:

- **Illness mid-June**: 14 days without training. The plan was rebalanced, without panic, by shifting the peaks.
- **Mallorca vacation (S3)**: the coach integrated the heat as a constraint, with shorter morning runs and afternoon walks.
- **Weather**: every long run was preceded by a weather analysis (via the dedicated skill), with adjusted start windows.
- **The 48 km run cut to 38 km**: on Aug 10, the planned 48 km long run was reduced to 38.5 km. Why? The recovery analysis (readiness, HRV) showed the body wasn't ready. Result: a 38.5 km / +1849 m run in 6h09 at 133 bpm — **9 bpm less than the same run in 2024**. Proof that listening to the data pays off.

### Not just running

The plan wasn't only running. The Garmin data shows real variety:

- **Trail**: the long runs (38.5 km Albavilla, 30.9 km Tournai, 30.5 km Tournai PEAK)
- **Hiking**: the Cinque Terre on vacation (10.4 km, 3h30) — easy volume
- **Walking**: Mallorca, active recovery
- **Indoor cycling**: 2 sessions in June-July
- **Strength training**: phase 3 strength circuit, light strength during taper

This variety is a real asset for an ultra: it maintains volume without hammering the joints.

## Nutrition: tested, then planned to the gram

Nutrition was a major focus. The approach: **test during training, then plan precisely for race day**.

### The Aug 30 test (peak run)

On Aug 30, during the 30.5 km peak run, I tested the full nutrition protocol: products, rotations, timing. That's what validated the plan for the race.

> 📸 **Screenshot to add**: Garmin Connect screenshot of the Aug 30 activity (summary: distance, elevation, HR, calories) to illustrate the nutrition test in real conditions.

### The race-day plan

The final nutrition plan (v3) was remarkably precise:

| Parameter | Value |
|:----------|:------|
| **Estimated expenditure** | ~8,500-9,500 kcal |
| **Targeted intake** | ~4,300-4,800 kcal (290-320 kcal/h) |
| **Carbohydrates** | 70-80 g/h (dual transporter: glucose + fructose) |
| **Hydration** | 500-750 ml/h, ~8.5-10 L total |
| **Sodium** | 500-700 mg/L (Aptonia Electrolytes) |
| **Total cost** | ~€81 |

The products were chosen with precision: **Baouw gels** (fructose), **Aptonia fruit pastes** (glucose), **Baouw savory purees** (sodium + anti-nausea), **crunchy bars** at the end of the race. All for ~1.9 kg of food in the pack.

One important point: the protocol was adapted to **minimize potassium intake** during the race (low-K protocol), with precise choices: Aptonia lemon electrolytes, pear-apple-mint compotes, bananas and dates banned from aid stations, replaced by oranges. This kind of detail is exactly what a nutritionist agent can track and verify.

> 📸 **Screenshot to add**: screenshot of the race-day nutrition plan document (products/quantities/timing table) generated by the nutritionist agent.

## Analyzing my condition via Garmin sync

Every morning, the **medical** agent analyzed my Garmin data: HRV, resting HR, sleep, readiness, ACWR, VO2max. These reports guided training decisions.

### The VO2max trend

![VO2max trend](/images/preparer-un-ultra-trail-avec-ai-running-coach/05-vo2max-tendance.png)

VO2max went from 51 to 53 ml/kg/min in August, then stabilized at 52 — a nice progression over the period.

### Race day: controlled cardio

On race day, the data analysis confirmed **impeccable heart rate management**:

> 📸 **Screenshot to add**: Garmin Connect screenshot of the "Heart Rate" screen of the Sep 13 activity (zone distribution) to illustrate the analysis.

![Heart rate zones distribution](/images/preparer-un-ultra-trail-avec-ai-running-coach/04-zones-cardiaques.png)

- **74.8% of the time in Z1+Z2** (≤133 bpm), 63% under 130 bpm
- **Average HR: 125 bpm** over 15h26
- **No cardiac drift**: the average HR decreases over the blocks (126 → 115 bpm), a sign of healthy management

![Average HR per 10 km block](/images/preparer-un-ultra-trail-avec-ai-running-coach/01-fc-par-10km.png)

## Race planning

### GPX analysis

For every important course, the **course-strategist** agent analyzed the GPX: distance, elevation gain, profile, slopes, terrain. One example: the evaluation of the Mont-de-l'Enclus course for the Aug 30 peak run — 35.6 km analyzed, verdict "too long", **cut recommended to 30-32 km**, with the exact cut point (km 30.1) and the return route. That level of detail is what makes the tool useful.

### The pace and aid station plan (D-1)

The day before, the final plan was ready: a per-segment table with target paces, realistic passages and barriers, plus a **self-assessment at each aid station** ("where should I be?").

| Segment | Km | Target pace | Realistic passage | Barrier |
|:--------|:---|:------------|:------------------|:--------|
| Start → Ausques | 26.7 | 7:52/km | 05:30 | — |
| Ausques → Châtelet | 15.7 | 7:58/km | 07:35 | 09:00 |
| Châtelet → Sangatte | 14.8 | 7:46/km | 09:30 | — |
| Sangatte → Hervelinghen | 20.4 | 8:05/km | 12:15 | 14:30 |
| Hervelinghen → Cap Gris-Nez | 16.5 | 8:11/km | 14:30 | 17:00 |
| Cap Gris-Nez → Finish | 15.7 | 9:33/km | 17:00 | 19:35 |

### Weather, until the day before

The weather was tracked from D-7 to D-1, with successive revalidations: D-3 (Open-Meteo, 🟠 12.8 mm rain) → D-2 (wttr.in, 🟡) → **eve (🟡 confirmed: dry start, 0.5 mm rain peak at 09:00, 43-44 km/h gusts in the morning)**. The final decision: light waterproof jacket, headlamp mandatory (4% moon), waterproof ziplocs for nutrition.

### Gear: 2 packs, a drop bag

The gear plan included a **drop bag at Hervelinghen** (km 77.6) with the second-half supplies, and a carried water capacity of **2.5 L** (2×500 ml flasks + 1×1.5 L flask) — all with existing gear, no purchase needed.

## Race day: forecast vs reality

The outcome is told by the forecast vs reality comparison:

> 📸 **Screenshot to add**: Garmin Connect screenshot of the Sep 13 activity (summary: 109.7 km, 15h26, +1992 m) to illustrate race day.

![Passage times: plan vs real](/images/preparer-un-ultra-trail-avec-ai-running-coach/06-prevision-vs-reel.png)

| | Time | Finish | Pace |
|:--|:--|:--|:--|
| 🚀 Ambitious | 12h49 | ~14:49 | 7:00/km |
| 🟡 **Realistic plan** | **15h00** | ~17:00 | 8:12/km |
| 📍 **REAL** | **15h26** | **17:26** | 8:27/km |
| 🟢 Safe | 16h00 | ~18:00 | 8:44/km |

**+26 minutes vs the target (+3%)** — judged a very solid execution. Why the gap?

1. **The course was harder than expected**: real elevation gain of **1992 m vs 1768 m** (+13%), ~10-15 min.
2. **Forced walking on the climbs** (km 50-51, 61, 74, 77).
3. **An isolated stomach issue** at km 48.6 (~3 min).
4. **Rain and gusts around 09:00** on the Châtelet → Sangatte segment.

But most importantly: **all barriers were passed with very large margins** (up to +2h09 at the finish), the cardio remained impeccable, and the **finale was solid**: last segment at -10 min vs plan, despite the last 3 km of dunes walked.

![Pace per 10 km block](/images/preparer-un-ultra-trail-avec-ai-running-coach/02-allure-par-10km.png)

## Recovery, tracked day by day

After the race, the medical agent kept tracking recovery:

![HRV: post-race drop and recovery](/images/preparer-un-ultra-trail-avec-ai-running-coach/03-hrv-recuperation.png)

- **D+1**: readiness 1/100, estimated recovery time 96h, collapsed HRV (30 ms), 5.1h sleep (score 28) — the body gave everything.
- **D+3**: still recovering, HRV progressively rising.
- **D+5**: readiness 61/100, 7.25h sleep (score 86), HRV 69 ms — **first easy jog confirmed**.

The HRR (heart rate recovery) of 7 bpm at the end of the race was the expected signal of a maximal effort — normal after 15h26 of effort.

## What I take away

Preparing for an ultra-trail is a job of **planning, listening and constant adjustment**. What ai-running-coach brought me:

1. **Structure**: every decision documented, every plan versioned, in markdown.
2. **Analysis discipline**: Garmin data (HRV, readiness, HR, VO2max) turned into concrete decisions.
3. **Surgical precision**: from the cut point of a GPX to the grams of carbs per hour.
4. **Peace of mind on race day**: when everything is planned and tested, all that's left is execution.

The result: **15h26 for 109.7 km and +1992 m**, controlled cardio, no barrier ever threatened, and a tracked, controlled recovery. I can't guarantee AI makes you an ultra finisher — but it can certainly help you get there.

The project is open-source and available on [GitHub](https://github.com/mmornati/ai-running-coach), with the [documentation](https://mmornati.github.io/ai-running-coach/) and a one-command install script. If you're preparing a trail or ultra goal, feel free to try it — and to contribute!