---
title: 'Home Assistant: control automation with Google Calendar'
categories:
- smart-home
tags:
- automation
- google-calendar
- home-assistant
description: 'Use Google Calendar events to control Home Assistant automations — set holiday flags, trigger input_booleans, and let your home respond to your schedule.'
date: '2022-12-29T09:52:46.706000+00:00'
slug: home-assistant-control-automation-with-google-calendar
---


Automations in [Home Assistant](https://www.home-assistant.io/) are very powerful, allowing us to control anything in our home and reduce cost and consumption.

To simplify management, I decided to use events to trigger `input_boolean` flags, and then use those booleans to trigger automations. This way, adding events doesn't require changing many automations because the boolean provides an abstraction layer.

## Holidays Flag

Let me walk you through my solution with an example. What about if you want to adapt your home automation on holiday? Following what I said just before, I added a holiday flag

![](/images/home-assistant-control-automation-with-google-calendar/00-3c04ae4e-c939-4d5f-9e58-316701ed2257.png)

This flag is then used in automations I want to change when I'm away for an extended period. For example the water heater:

![](/images/home-assistant-control-automation-with-google-calendar/01-33e89fe3-7da2-483f-b86c-a1645f1658c6.png)

It runs during the night, but only if the holiday flag is off.

## Control the flag

So how do I know if I'm on holiday? A simple way is to switch it manually. But who still does things manually? 😂  
In Home Assistant there is a [Google Calendar integration](https://www.home-assistant.io/integrations/google/) that lets you download events from one or more Google calendars. Each event becomes a Home Assistant event... and the rest is what you already know 😎

When installing the integration, you can give it read or read/write access to the calendars. You might want to create events from Home Assistant (I haven't used that yet).

![](/images/home-assistant-control-automation-with-google-calendar/02-ce6e66da-7f08-4ca3-ae3d-281a4d1fc3f2.png)

Once connected, you can see your Google calendars, each becoming an `entity` in Home Assistant

![](/images/home-assistant-control-automation-with-google-calendar/03-bf3dbc40-651b-4146-a714-8530053e8934.png)

Oh, what's that `homeautomation` calendar? 🤩 I created it to separate personal events from automation-control events. But it is not necessary to do it in this way.

From now on, you can create conditions or triggers based on calendar events.

```yaml
- alias: Calendar Holidays Event
  id: calendar_holidays_event
  trigger:
    - platform: calendar
      event: start
      entity_id: calendar.homeautomation
    - platform: calendar
      event: end
      entity_id: calendar.homeautomation
  condition:
    - condition: template
      value_template: "{{ 'Holidays' in trigger.calendar_event.summary }}"
  action:
    - if:
        - "{{ trigger.event == 'start' }}"
      then:
        - service: input_boolean.turn_on
          entity_id: input_boolean.vacation
      else:
        - service: input_boolean.turn_off
          entity_id: input_boolean.vacation
  mode: queued
```

In this example, the automation is triggered by the `start` and `end` calendar events, but filtered only for events with a title starting with `Holidays`.

![](/images/home-assistant-control-automation-with-google-calendar/04-fb589f8e-4852-4153-b381-d4357da3df13.png)

Create your calendar event and let the home automate 😎  
Once synced, the `calendar.homeautomation` entity will show information about the upcoming event:

```yaml
message: Holidays
all_day: true
start_time: '2023-02-11 00:00:00'
end_time: '2023-02-18 00:00:00'
location: ''
description: ''
offset_reached: false
friendly_name: Homeautomation
```

  
Since I have a separate calendar for automation control, the holidays in this one can differ from my actual holiday days. In the water heater example, I'd want the automation to resume the day before I return home.
