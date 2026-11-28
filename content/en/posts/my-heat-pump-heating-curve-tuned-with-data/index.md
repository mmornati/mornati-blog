---
title: "My Heat Pump's Heating Curve, Tuned with Data"
categories:
- smart-home
tags:
- home-assistant
- hitachi
- heat-pump
- csnet
- underfloor-heating
- claude
- energy
date: '2026-11-28T18:00:00.000000+00:00'
draft: false
slug: my-heat-pump-heating-curve-tuned-with-data
translationKey: heat-pump-heating-curve
cover: cover.jpg
showHero: true
keyfigure: '60 → 50 °C at −10 °C outside'
description: "Three weeks after putting my heat pump's circuits the right way round, the house finally heats properly. What was left was finding the right water temperature. How a heating curve works, which Home Assistant signals tell you the water is too hot, what we changed (and what it gave), and why we can probably go lower still. First post in a series of three."
summary: "A heating curve explained simply, the signals that show the water is too hot (valve opening time, how fast rooms heat up, overshooting the set point), the four November changes with their numbers, and the method to go lower. First episode of the series \"My heat pump, the right way round\"."
projects:
- hitachi-csnet
---

Three weeks ago I told the story of how [Claude and I found out that my heat pump's two circuits had been swapped for five years](/five-years-of-swapped-circuits-my-heat-pump-reviewed-with-claude/). The ground floor underfloor heating was controlled by the upstairs thermostat, the radiators were getting 25 °C water, and the mixing valve that "didn't work in auto" was obeying the wrong circuit. Once the configuration was put right, the house finally heated the way it should.

But fixing the circuits was only the first step. With a heat pump, every extra degree of water costs you efficiency, and now that I had clean data I wanted to know **what water temperature was just enough**. That's what this short series is about:

1.  **The heating curve, tuned with data** (this post): how a heating curve works, which signals tell you the water is too hot, what we changed.
2.  **One valve per room, and a heat pump that only listens to demand**: the Home Assistant automations that control each upstairs bedroom and drive the heat pump, with how often the valves move and what that costs in batteries.
3.  **The verdict, one year on**: comfort and consumption compared with last winter, at comparable outdoor temperatures. That one will have to wait for a few weeks of real cold, so I compare like with like.

## The heating curve, in two minutes

A heat pump doesn't make heat: it **moves** it from the outside air into the heating water. The bigger the gap between the two, the harder it works for each kWh of heat. That's why you always want the coldest water you can get away with: the figure often quoted is **2 to 3% of efficiency (COP) gained per degree of water less**.

But a house loses more heat when it's cold outside. The **heating curve** (*OTC* at Hitachi) links the two: it gives the water temperature to produce for a given outdoor temperature. When it's mild the water can be lukewarm; when it freezes you need hotter water.

On my Yutaki each circuit has its own curve, and it comes in two forms:

*   **by points**: two points (for example "50 °C water when it's −10 °C" and "21 °C water when it's +20 °C"), a straight line between them, and a flat section beyond;
*   **by curve**: a straight line starting from 20 °C water at 20 °C outside, rising by a **slope** (0.2 to 2.2) for every degree the outdoor temperature drops. With a slope of 0.6 you ask for 32 °C water when it's 0 °C.

Both can be shifted up or down as a whole (*offset*), and the heat pump adds **room compensation**: when the thermostat's room is below its set point, it pushes the water a bit higher. We measured the effect on 17 Nov: **about 2 °C more water per degree of set point** (set point 17-18 °C → water at 32-33 °C, 19 °C → 36 °C, 20 °C → 37 °C).

One last point changes everything in a house with two circuits: **there's only one compressor**. The heat pump produces water for whichever circuit asks for the hottest, and the floor (C2) then cools its own down by mixing it with its return, through its three-way valve. In my house it's therefore the **upstairs radiators (C1) that set the water temperature for the whole house**. The floor only needs about 31 °C at 0 °C outside. Every extra degree the radiators ask for is a degree the heat pump produces for nothing.

![The heating curves of my two circuits: the radiator curve before 14 Nov (60 °C at −10 °C), the one after (50 °C at −10 °C), the floor curve (slope 0.6), and the actual water set points from 22 to 27 Nov, sitting on the new radiator curve](/images/heat-pump-heating-curve/heating-curves-en.webp)

The green dots are the heat pump's actual water set points, averaged per day, during the cold spell at the end of November: they follow the radiator curve almost to the degree. That curve really is the one in charge.

A practical detail: CSNet tells you which *type* of curve each circuit uses, but not its values. Since version 2.14 of the [CSNet integration](https://github.com/mmornati/home-assistant-csnet-home), you can copy the values from the controller into the options, and Home Assistant then shows, for each circuit, the water temperature the curve is asking for right now. That's what lets you see on a chart whether the heat pump is following its curve or whether something else is pushing it.

## The signals that tell you the water is too hot

Nobody tells you "your heating curve is too high". But a well-instrumented house shows it in several ways, and it's by cross-checking these signals that we made progress.

**1. Valve opening time.** Since 11 Nov every upstairs radiator has a connected valve that regulates on its room's sensor (more on that in the next post). If the rooms hold their set point while the valves are closed most of the time, every minute of opening brings in a lot of heat: the water is hotter than it needs to be. From 12 to 14 Nov the bedroom valves were open only **6 to 13% of the time**.

**2. Short heating bursts that overshoot the set point.** When a valve opens, a bedroom gains half a degree in a quarter of an hour, then keeps climbing after it closes, because the radiator stays hot. The result: a sawtooth of nearly a degree around the set point. With cooler water the openings are longer and the temperature steadier.

**3. How fast each room heats up.** Home Assistant now records every heating episode (start, duration, temperature at the start and at the end, outdoor temperature) and derives a median heating rate per room. Today: **2.4 °C/h for one bedroom, 1.3 °C/h for the other, 0.9 °C/h for the library**. The slowest room sets the lower limit: if the water gets too cold, it's the one that won't reach its set point in the morning.

**4. Morning preheat time.** The bedrooms go from 18 °C at night to 19 °C at wake-up. With a 90-minute preheat they get there in about an hour. There's still headroom.

**5. The gap between what the floor asks for and what the heat pump produces.** At the end of November, at 0 °C outside, the heat pump was producing 40 °C water for a floor that asked for 31. The whole difference was for the radiators.

## What we changed, in order

Four changes in two weeks. The chart below places them against the outdoor temperature, the heat pump's water set point and its COP for each day (heat produced divided by the electricity measured by the heat pump's meter).

![November 2026 day by day: outdoor temperature, heat pump water set point and daily COP, with the four changes: circuits put right (11 Nov), radiator curve from 60 to 50 °C (14 Nov), Home Assistant drives the heat pump (16 Nov), margin from 1 to 0.5 °C (25 Nov)](/images/heat-pump-heating-curve/november-timeline-en.webp)

| Date | Change | Why |
|---|---|---|
| 11 Nov | Circulation pump: fixed 100% speed → ΔT control | Flow too high, supply/return difference of 1 to 2 °C instead of 5. Standby consumption went from about 240 W to 130 W. |
| 11 Nov | Circuits put the right way round | See [the previous post](/five-years-of-swapped-circuits-my-heat-pump-reviewed-with-claude/). Water goes up by about 12 °C at the same outdoor temperature: the radiators finally get enough to heat. |
| 14 Nov | Radiator curve: **60 → 50 °C at −10 °C** (21 °C at +20 °C unchanged) | Valves open 6 to 13% of the time, library at 21 °C for a set point of 19. |
| 16 Nov | Home Assistant drives the upstairs CSNet set point | The wall thermostat was calling for heat all night while every valve was closed. |
| 25 Nov | Heat pump margin: **1 → 0.5 °C** | The valves were heating 3 to 5 h a day, but the heat pump stayed in demand for 15 to 17 h. |

On 11 Nov the water set point jumps all at once: that's the price of radiators that finally heat. On the 14th the new curve brings it back down by 4 to 5 °C. From the 21st it's the cold that pushes it back up, following the new curve.

What stands out on the COP line is above all the **outdoor temperature**: a little over 3 at 9-10 °C outside (17-20 Nov), around 2.2 at 0 °C. To isolate the effect of a change you have to compare days at the same temperature. 14 and 22 Nov both averaged 2.2 °C outside:

| | 14 Nov (curve at 60 °C) | 22 Nov (curve at 50 °C) |
|---|---|---|
| Average water set point | 38.6 °C | 37.7 °C |
| Daily COP | 2.12 | 2.28 (+7.5%) |
| Heat pump electricity | 53.0 kWh | 46.0 kWh (−13%) |
| Upstairs (average) | 20.1 °C | 18.5 °C |
| Ground floor (average) | 19.3 °C | 19.5 °C |

This table needs reading honestly. The gap in water set point is smaller than the curve would suggest (0.9 °C), because on the 14th Home Assistant wasn't yet driving the thermostat set point and room compensation was kicking in. And a good part of the 13% comes from the fact that **upstairs was overheating on the 14th**: 20.1 °C on average, with the library at 21 °C. On the 22nd upstairs is at its set point, with nights at 18 °C. That's exactly the point: stop producing heat nobody asked for.

For the 25 Nov margin change I have **no measurable effect yet**: the average water set point went from 40.3 °C on the 24th to 39.7 °C on the 25th, then 40.2 and 40.1 °C the following days, with a bit colder outside each day. At that scale the day-to-day noise wins. We'll see over several weeks.

## How low can we go?

The best indicator is still the first one: how long do the valves heat each day?

![Hours per day each room's valves spend heating, from 13 to 27 Nov: 2 to 5 hours for the bedrooms until the 21st, then 4 to 6 hours once it freezes; the library goes up to 9 hours](/images/heat-pump-heating-curve/valve-hours-en.webp)

Even during the coldest week (around 0 °C on average, −3 °C at night), the bedroom valves only heat **4 to 6 hours a day**. The library goes up to 8-9 hours, but it's also the room that heats up the slowest, and its valve never closes completely (it keeps 10% open so the water always has somewhere to circulate). In other words, the radiators stay closed three quarters of the time while it's freezing outside. 40 °C water is still hotter than it needs to be.

The method I'm going to follow, rather than one big jump:

1.  **Lower the cold point of the radiator curve by 2 to 3 °C at a time** (50 → 47 °C at −10 °C, then maybe 45 °C), leaving the +20 °C point as it is.
2.  **Wait at least a week**, to get both cold and mild days.
3.  **Watch three numbers**: the valves' heating hours (they'll go up, that's the idea), the slowest bedroom at wake-up (it has to reach 19 °C within the 90-minute preheat), and the COP at the same outdoor temperature.
4.  **Stop when the slowest room starts falling behind** on frosty mornings, and go back up one step.

The goal isn't valves open all the time: you need to keep headroom for very cold mornings and for recovering after a night at 18 °C. But 4 hours out of 24 at 0 °C is clearly too little. The results of these tests will be in the third post.

There's also a flaw the heating curve won't fix on its own: the compressor starts **2 to 3 times an hour** for cycles of 8 to 13 minutes. The heat pump (20 kW) is oversized for a house that needs 5 to 6 kW on average when it freezes. Cooler water stretches the cycles a little, but that's a topic for another day.

## What I take away

A heating curve isn't something you set once and for all from the installer's table. The one on my radiators (60 °C at −10 °C) had been there since installation and nobody had ever questioned it: with the circuits swapped, it was useless anyway.

What changed is having **signals that answer the question**: valves that tell you how long they heat, sensors that measure how fast each room warms up, a meter that gives the daily COP. With that, tuning the heating curve is no longer a matter of feel ("it's a bit chilly tonight"), it's a loop: lower it, measure, keep it or roll back.

## How it was done

Several Claude Code sessions with Opus 5.5, spread over two weeks, in the CSNet integration repository and in my Home Assistant configuration repository. Claude read Home Assistant's history (through OpenObserve, which receives all of HA's events and metrics, and through a read-only copy of the recorder database for long-term statistics), computed the valve opening times and the daily COPs, proposed each change with the numbers that justified it, and wrote the automations and sensors (heating rate, heat pump set point, heating curve in the integration). The settings on the heat pump itself I changed by hand on the controller, photographing every screen first. This post was written in a separate session, from that data and the notes from those sessions; the charts were generated from the same data.
