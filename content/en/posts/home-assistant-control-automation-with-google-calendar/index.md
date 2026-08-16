---
title: 'Home Assistant: control automation with Google Calendar'
tags:
- automation
- google-calendar
- home-assistant
date: '2022-12-29T09:52:46.706000+00:00'
slug: home-assistant-control-automation-with-google-calendar
---



Automations in [Home Assistant](https://www.home-assistant.io/) are very powerful allowing us to control anything in our home and, in this way, help reduce cost and consumption.

To simplify the management I decided to use events to trigger `input_boolean` flags, and then use the boolean value to trigger what was needed. In this case, if I want to add events I don't need to change a lot of automation because the boolean value is making an abstraction layer.

## Holidays Flag

I'll try to drive you to my solution using an example. What about if you want to adapt your home automation on holiday? Following what I said just before, I added a holidays flag

![](/images/home-assistant-control-automation-with-google-calendar/00-3c04ae4e-c939-4d5f-9e58-316701ed2257.png)

This flag is then used in automation I want to change when I'm not at home for a "long period". For example the water heater:

![](/images/home-assistant-control-automation-with-google-calendar/01-33e89fe3-7da2-483f-b86c-a1645f1658c6.png)

It is started during the night **but only** if the holiday flag is off.

## Control the flag

And now, how to know if I'm on holiday or not? A simple way to control it, as it is a flag, is switching it manually. But, in 2022, who is still doing manual things? 😂  
In Home Assistant there is a [Google Calendar integration](https://www.home-assistant.io/integrations/google/) that allows you to download all the events from one, or more, calendars in a google account. Each of these events became a home assistant event... and then the rest is everything you already know 😎

When installing the integration you can add it a read or read/write access to the calendars. In some cases, you would like to create new events from home assistant (Did not use it on my side already).

![](/images/home-assistant-control-automation-with-google-calendar/02-ce6e66da-7f08-4ca3-ae3d-281a4d1fc3f2.png)

Once connected you can see the list of calendars you are managing in your google account, each of them is giving an `entity` in home assistant

![](/images/home-assistant-control-automation-with-google-calendar/03-bf3dbc40-651b-4146-a714-8530053e8934.png)

Oh, what's that `homeautomation` calendar? 🤩 I created it to separate my personal events, from the ones I would like to use to control the automation. But it is not necessary to do it in this way.

From now on, you can create `contition` or `trigger` in automation script based on what happens on the calendar entity.

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

Create your calendar event, and then let the home automate 😎  
Once synchronized with Home Assistant, the `calendar.homeautomation` entity will give you the information about the first detected event:

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

  
As I have a separate calendar to control the automation, the holidays putting in this one can be different from the real holidays days. In the example with the water heater, I would like to start back all the automation the day before I come back home.
