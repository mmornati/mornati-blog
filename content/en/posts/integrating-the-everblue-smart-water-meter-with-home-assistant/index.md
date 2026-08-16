---
title: Integrating the Everblue Smart Water Meter with Home Assistant
canonical: https://github.com/hallard/everblu-meters-pi
tags:
- smart-home
- home-assistant
- water-meter
date: '2024-04-30T09:23:58.877000+00:00'
slug: integrating-the-everblue-smart-water-meter-with-home-assistant
description: Track water usage efficiently by integrating Everblue Smart Water Meter
  with Home Assistant. Step-by-step guide for meticulous monitoring and control
---



Welcome to a detailed guide where I share my experience with one of the most challenging projects I’ve tackled using HomeAssistant: integrating the Everblue smart water meter. This guide will walk you through the entire process, step by step.

### **Introduction**

In France, many homes are now equipped with the [Everblue water meter](https://www.itron.com/fr/solutions/product-catalog/everblu-cyble-enhanced). Water companies favor these devices because they facilitate remote readings, bypassing the need for physical access to properties, which can be challenging if homeowners are unavailable. What makes Everblue particularly interesting is its connectivity feature, which allows technicians to access water usage data wirelessly, avoiding incorrect billing due to missed readings. However, one must note that due to regulatory limits on wireless transmissions, these devices only operate during working hours on weekdays.

### **Why Integrate Everblue with Home Assistant?**

As someone who enjoys automating every possible aspect of my home, integrating Everblue with Home Assistant allows me to monitor and control water usage meticulously. This setup helps answer questions like, "How much water does a shower use?" or "What’s the consumption when running the washing machine?" By incorporating Everblue into the Home Assistant energy dashboard, you can track these metrics over time, optimizing your water usage and understanding your consumption patterns. For this project, you will need:

* A Raspberry Pi (any model will do; I used an old RPi Rev B)
    
* A CC1101 wireless module, which operates at the 433Mhz frequency—commonly used in various household devices
    

This journey began with decrypting the communication protocol of the Everblue meter, thanks to a group of French enthusiasts who laid the groundwork. You can explore their original research [here](https://github.com/neutrinus/everblu-meters) (note: the content is in French). Several subsequent projects have built on this, utilizing platforms like Raspberry Pi, ESP8266, and ESP32.

### **Step-by-Step Integration Process**

After experimenting with different versions, I settled on a Raspberry Pi-based fork that best suited my goals. The process is straightforward if you follow the instructions outlined in the [GitHub project readme](https://github.com/hallard/everblu-meters-pi)[:](https://github.com/hallard/everblu-meters-pi)

1. Enable SPI via `raspi-config`.
    
2. Install WiringPi and libmosquitto-dev.
    
3. Configure meter and MQTT settings in the code.
    
4. Compile and run the code to start receiving data.
    
5. Set up a crontab to automate the reading process once a day.
    

Make sure to adjust the device frequency as necessary, as slight deviations from the standard 433Mhz are possible. If the device is not initially detected, you may need to attempt multiple scans.

```bash
./everblu_meters 0
```

If at the end of scan process the reported frequency is 0, this means device was not found. You may have to test several time before to have the device working frequency. When working you will have a message like the following one:

```json
{ 
	"date":"Sat Jul 15 13:06:04 2023", 
	"frequency":"433.8000", 
	"min":"433.7900", 
	"max":"433.8100"
}
```

Once everything is well configured you can complete scheduling the EverBlue meter read once per day to prevent the device battery drain and, remember: working hours only!

On my side I create a simple crontab:

```bash
crontab -e
```

With the following content:

```bash
0 10 * * 1-5 /home/mmornati/everblu-meters-pi/everblu_meters 433.7560 >> /tmp/everblu.log 2>&1
```

This will be executed every week day at 10 a.m. and writing execution logs in the `/tmp/everblu.log` file let me check if everything is ok.

The file content

```bash
CC1101 Verion : 0x0014
CC1101 found OK!
Base MQTT topic is now everblu/cyble-23-0199454-pi
Connected to MQTT broker (almost)
Trying to query Cyble at 433.7560MHz
Reading data...MQTT : Subscribed OK (mid: 1): 2
Consumption   : 222583 Liters
Battery left  : 166 Months
Read counter  : 160 times
Working hours : from 06H to 18H
Local Time    : Fri Apr 26 10:00:09 2024
RSSI  /  LQI  : -48dBm  /  -128
CC1101 Verion : 0x0014
CC1101 found OK!
Base MQTT topic is now everblu/cyble-23-0199454-pi
Connected to MQTT broker (almost)
Trying to query Cyble at 433.7560MHz
Reading data...MQTT : Subscribed OK (mid: 1): 2
Consumption   : 223486 Liters
Battery left  : 166 Months
Read counter  : 161 times
Working hours : from 06H to 18H
Local Time    : Mon Apr 29 10:00:09 2024
RSSI  /  LQI  : -48dBm  /  -128
```

**The interesting thing** in the information returned by the everblue meter you have the working hours of your device helping you for the schedule \`from 06H to 18H\`

### **Displaying Information in Home Assistant**

The final step involves creating sensors within Home Assistant to display the data from the MQTT topics:

```yaml
sensor:
  - name: "water_meter_consumption"
    state_topic: "everblu/cyble-23-0199454-pi/json"
    unique_id: "water_meter_consumption"
    value_template: "{{ value_json.liters }}"
    unit_of_measurement: "L"
    device_class: water
    state_class: total_increasing
  - name: "water_meter_last_read"
    state_topic: "everblu/cyble-23-0199454-pi/json"
    unique_id: "water_meter_last_read"
    value_template: "{{ value_json.ts }}"
    device_class: timestamp
```

These sensors will now appear in your Energy Dashboard, allowing you to monitor water usage effectively.

![](/images/integrating-the-everblue-smart-water-meter-with-home-assistant/00-9dfd9559-95cf-4b7c-8e55-075ae0d3dc49.png)

  

### **Common Issues**

Occasionally, the script may fail to detect the Everblue meter. I’ve modified the script to retry several times before giving up, which resolves the issue most of the time. If problems persist, they're usually resolved the following day.

![](/images/integrating-the-everblue-smart-water-meter-with-home-assistant/01-126ac512-d8a4-43e4-9ac5-33243213165f.png)

Replace the line 323 with the following code:

```cpp
int i=0; 
do { 
    printf("Reading data..."); 
    meter_data = get_meter_data(); 
    i++; 
    sleep(5); 
} while (i<10 && !meter_data.ok);
```

### **Conclusion**

While the journey to integrate the Everblue meter with Home Assistant was fraught with challenges, particularly with the initial ESP32 attempts, the final setup using a Raspberry Pi proved successful. This integration not only enhances my understanding of household water consumption but also demonstrates the power of home automation in managing resources efficiently.

I hope this guide helps you streamline your own smart water meter integration. If you encounter any issues or have questions, feel free to reach out or comment below.
