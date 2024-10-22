[![Build](https://github.com/DavesCodeMusings/monit-collector/actions/workflows/docker-image.yml/badge.svg?branch=main)](https://github.com/DavesCodeMusings/monit-collector/actions/workflows/docker-image.yml)

![screenshot](screenshots/monit-collector.png)

## What is it?
monit-collector is a tool to gather Monit statuses from multiple hosts and make the data available on a dashboard or through a REST API.

## How do I run it?
Docker Compose is the easiest way.

```
services:
    collector:
        image: davescodemusings/monit-collector
        container_name: monit_collector
        hostname: collector
        restart: unless-stopped
        ports:
          - 8008:8008
```

## Why?
I've got two home servers and an OPNSense firewall. (Like having two turntables and a microphone, though with far less street cred.) All three run [Monit](https://mmonit.com/monit/) to keep an eye on their services and file systems. I have Monit configured to send me email when things are running outside the norm, which is great. And each server has a Monit web page to show me the status if I want to have a quick look. I've been using this setup for years.

Then, I recently got it into my head to connect everything together using Home Assistant as the central monitoring and alerting tool. Monit speaks XML. Home Assistant, not so much. But, Home Assistant has a RESTful integration that does JSON. To use the integration, I needed an API. So I build an API. At its core, monit-collector takes data pushed from individual Monit instances and aggregates it into a single JSON object that's exposed as a REST API.

There's also an HTML dashboard, because why not?

## How?
In a nutshell, you fire up monit-collector and it listens on port 8008. Configure your Monit instances to point to this. (e.g. set mmonit http://monit:monit@192.168.1.100:8008/collector) and now you have a centralized place receiving Monit status.

Point a browser to port 8008 on that host and you'll see a dashboard of hosts and the status of the services Monit is watching.

Point a browser or REST API tool to /collector on that host and you'll see a JSON representation of all the hosts that have checked in so far.

Tack a host IP address after /collector (e.g. http://192.168.1.100:8008/collector/192.168.1.1) and you'll see just the status for the host with the given IP address.

Drill down further with a path like /collector/IP.AD.DR.ESS/services/service/sshd and you can see the state of an individual service (with the Monit convention of 0 meaning OK and anything else representing an error or degraded state.)

## What's the catch?
This is not M/Monit. It's not intended to replace M/Monit. There's no data retention. When you shut it down, everything collected is lost. There are no configuration parameters. There are no pretty graphs or trend analysis. All it does is take the XML information from Monit and make it available as JSON on a central host.
