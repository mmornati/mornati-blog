---
title: OpenVPN on Google WiFi via OpenWRT
tags:
- openvpn
- openwrt
- google-wifi
date: '2022-11-28T20:44:52.631000+00:00'
slug: openvpn-on-google-wifi-via-openwrt
---



In 2022 the OpenWrt community released a version compatible with Google WiFi devices: https://openwrt.org/toh/google/wifi
It is not possible to get out from the default Google firmware and benefit of a quite good device, adding a lot of functionalities!

![image.png](/images/openvpn-on-google-wifi-via-openwrt/00-xq8kzkK06.png)

I will not go through how you can configure it within this blog post, as you can find a ton of tutorials online to make the configuration. But I will be, for sure available if you have any problem.

## OpenVPN
One of the good features I love on OpenWRT is the way to secure all my network forcing the usage of a VPN.

![image.png](/images/openvpn-on-google-wifi-via-openwrt/01-gRWVOMGJ8.png)

For this, you just have to configure the OpenVPN client by uploading the related `ovpn` file (or configuring everything manually), and then, by default, once connected the whole WiFi traffic is forwarded to the `tun0` device.
If you have a good VPN (allowing a decent bandwidth) you don't have any other setting for this part. If, like me, the global VPN speed is not always so good (~20Mbit/sec vs 300 😱), never mind the server I'm using, you may want to select which devices you want to redirect to the VPN and which other you don't want.

### Configuring to now use VPN by default
If like me you prefer to select only which devices you want to protect and which others you want to leave "as usual" you can change the OpenVPN configuration to not push the `tun0` as the default gateway. For this you just have to add within your OpenVPN configuration file, the following option:
```
pull-filter ignore redirect-gateway
```
You should have something like this

![image.png](/images/openvpn-on-google-wifi-via-openwrt/02-u26lduMl6.png)

Restarting the OpenVPN service on your Google Wifi and all devices will keep your router/ISP Box as the default gateway.

### Routing selected devices through VPN
To be able to select the device you want to send through VPN or not (it is working even if you keep the VPN as the default gateway and you want to exclude some devices) you have to install and configure the *Policy Base Routing* package.
```
opkg update
opkg install pbr luci-app-pbr
```

![image.png](/images/openvpn-on-google-wifi-via-openwrt/03-3Mg6vUzG6.png)

Once installed you will have a new Policy Routing menu where you can configure everything needed.

![image.png](/images/openvpn-on-google-wifi-via-openwrt/04-PWnqQYALw.png)

To select the gateway for desired local network devices, you can add new policies defining the local IP address or the device hostname with a `prerouting` rules and the target interface to use as default gateway.

![image.png](/images/openvpn-on-google-wifi-via-openwrt/05-1X3iHvwYc.png)

In this screenshot the GoogleTV and the MacBookPro are forwarded to the VPN (by default all the devices on my network are not using the VPN).

### Specific Video Streaming configuration
If like in my example, you are forwarding devices with **non-vpn friendly services** (Netflix, amazon prime, ...) you can create some custom policies defining the target address and interface.

For Netflix, the pbr service is already having a configuration you can simply activate (**NB** in my case I needed to activate even the AWS one to get it working).

![image.png](/images/openvpn-on-google-wifi-via-openwrt/06-g7qB7DDNn.png)

For other services you can add a policy like the following one:

![image.png](/images/openvpn-on-google-wifi-via-openwrt/07-VE-_t_Bfu.png)

### How to test / debug
For Netflix is easy to know if the traffic is forwarded to the correct interface: the service is (mostly) not working if it is going through the VPN.
But, what about other URLs?

There are several ways to debug your connection. The simple one if using `traceroute` and `traceroute6`.

```
$ traceroute www.google.fr
traceroute to www.google.fr (216.239.38.120), 64 hops max, 52 byte packets
 1  openwrt (192.168.86.1)  4.853 ms  6.957 ms  7.892 ms
 2  10.200.0.1 (10.200.0.1)  13.255 ms  12.262 ms  13.713 ms
 3  51.255.71.253 (51.255.71.253)  13.344 ms^C
```
The `10.200.0.1` is my `tun0` public IP address. This means the traffic is redirected via the VPN.

If I'm doing the same with Netflix, I excluded from the VPN:

```
$ traceroute netflix.com
traceroute: Warning: netflix.com has multiple addresses; using 54.155.246.232
traceroute to netflix.com (54.155.246.232), 64 hops max, 52 byte packets
 1  openwrt (192.168.86.1)  5.686 ms  5.109 ms  3.737 ms
 2  192.168.1.1 (192.168.1.1)  4.605 ms  7.768 ms  5.949 ms
 3  80.10.233.201 (80.10.233.201)  8.701 ms  8.956 ms  8.694 ms
```
The traffic is going through my ISP Box having the 192.168.1.1 address.


I can now surf on the web in a very secure way!! 😎
