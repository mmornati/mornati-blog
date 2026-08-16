---
title: 'RaspberryPI: Motion and Noise detection'
date: '2013-07-05T22:00:00+00:00'
slug: raspberrypi-motion-and-noise-detection
categories:
  - Raspberry Pi
  - Security
  - DIY
tags:
  - raspberrypi
  - motion
  - noise-detection
  - security
  - ruby
  - webcam
description: 'Use your Raspberry Pi as a home security system with motion and noise detection scripts that send email alerts.'
---

The summer holidays are coming and with them the fear of being robbed.
Even if I've an home alarm I'd like to be sure than nothing is happening in the house (watching films we learnt that is really easy to deactivate an house alarm :P), so I found another use for my RaspberryPi (but it could be any other computer with an USB and a linux operating system installed or booted with a live distribution).
I can tell you that it's really useful for keeping an eye on your children :D
## Noise Detection
To detect the noise in the house (on a linux OS) a good solution is to use some linux command that allows you to record sound and then analyze the track: **arecord** and **sox**.
I created a little Ruby [script](https://github.com/mmornati/ruby-noise-detection/blob/master/noise_detection.rb) (that I found some months ago on the net, but I completed and improved it later) that record for *n* seconds using the computer/webcam microphone and send you an email if the recorded noise threshold is greater than the set value.

You can check the script usage guide with the *-h* parameter
```bash
./noise_detection.rb -h
Usage: noise_detection.rb -m ID [options]
    -m, --microphone SOUND_CARD_ID   REQUIRED: Set microphone id
    -s, --sample SECONDS             Sample duration
    -n, --threshold NOISE_THRESHOLD  Set Activation noise Threshold. EX. 0.1
    -e, --email DEST_EMAIL           Alert destination email
    -v, --[no-]verbose               Run verbosely
    -d, --detect                     Detect your sound cards
    -t, --test SOUND_CARD_ID         Test soundcard with the given id
```
If you execute the script with the *-d* parameter it will list the available sound cards that you can use to test or to run the script (you just need to get the sound card id)
```bash
./noise_detection.rb -d
Detecting your soundcard...
 0 [ALSA           ]: BRCM bcm2835 ALSbcm2835 ALSA - bcm2835 ALSA
                      bcm2835 ALSA
 1 [U0x46d0x8d7    ]: USB-Audio - USB Device 0x46d:0x8d7
                      USB Device 0x46d:0x8d7 at usb-bcm2708_usb-1.2, full speed
```
For example, on my RaspberryPi I'm using the webcam Microphone (USB device), so I need to start this script with the id **1**.
You can even test your device to check if everything works using the *-t* parameter.
```bash
./noise_detection.rb -t 1 -v
Testing soundcard...
Samples read:             40000
Length (seconds):      5.000000
Scaled by:         2147483647.0
Maximum amplitude:     0.224640
Minimum amplitude:    -0.993805
Midline amplitude:    -0.384583
Mean    norm:          0.002984
Mean    amplitude:    -0.002957
RMS     amplitude:     0.006520
Maximum delta:         0.991394
Minimum delta:         0.000000
Mean    delta:         0.000688
RMS     delta:         0.006875
Rough   frequency:         1342
Volume adjustment:        1.006
```
The test is also important for determining your standard noise threshold. If you don't want to receive an email every minute, it's better to set a good threshold for your environment (for example, since the value will be different if you live in an apartment in the center of Paris or in a wooden house in the Death Valley).
In my test the Maximun amplitude is **0.22464**.

Now we know the soundcard id and the threshold of our environment, so we can start the noise detection script. At the moment (if you check on github) I'm working on an init.d file to run the script as a service. But, even without it you can run the script in the background using, for example, the **nohup** command.
```bash
./noise_detection.rb -m 1 -n 0.30 -e test@mail.com -v
./noise_detection.rb:94: warning: already initialized constant THRESHOLD
Script parameters configurations:
SoundCard ID: 1
Sample Duration: 5
Output Format: S16_LE
Noise Threshold: 0.3
Record filename (overwritten): /tmp/noise.wav
Destination email: test@mail.com
0.228607
no sound
0.227264
no sound
```
If sound is detected the script will send you an email (on the provided email address) with the wav file in attachment (so you can check what kind of noise there is in your house).
The actual version of the script uses the localhost sendmail service, so you need to install it on your Raspberry Pi
## Motion Detection
Motion detection is really simple using the [motion](http://linux.die.net/man/1/motion) project. You just need to install and configure it.
For the installation on the raspberrypi you can, for example, follow this [guide](http://raspberry-blog.com/general/installing-webcam-on-raspberry-pi/). If you want to receive an email when motion is detected you need to add a configuration line in motion.conf file.
For example, something like:
```bash
on_event_start echo "Movement has been detected on: %d %m %Y. The time of the movement was: %H:%M (Hour:Minute). The Pictures have been uploaded to your FTP account." | mail -s "Home: Motion Detected!" test@mail.com
```
on_event_start means when motion is detected.

With these two services started on your raspberry pi you will be notified for any noise or movement in your house... or if your child is crying ;)
Next days I'll complete the noise detector init.d script and I'm also working on web interface to control the activation of the two services.