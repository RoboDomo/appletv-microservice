# appletv-microservice
MQTT  microservice for Apple TV

This microservice implements an MQTT interface to one or more Apple TVs.

According to the docs at https://github.com/edc1591/node-appletv, only Apple TV v4 and beyond are supported.  If you
have a v3 Apple TV, you might test that it works and open an issue in this repo to let us know!

## Prerequisites

NOT SURE ABOUT THIS: REQUIRES NODE V9, due to mdns module not compiling with newer versions.  A better option than installing V9 is to use
docker.

VERSION 10 of NODEJS is REQUIRED!  Aything older or anything newer seems to break node_modules dependencies.

```
$ sudo apt-get install libsodium-dev avahi-daemon avahi-discover libnss-mdns libavahi-compat-libdnssd-dev
```

You will also need to run 
```$ ./node_mocdules/.bin/appletv pair
``` 
to get the creds: string that needs to be in your Config.js that is loaded into MongoDB.  See the config repository.

You will need to pair with each appletv in your network and add an entry for each in MongoDB.

## Docker build instructions
You can neatly package this microservice as a Docker container:

```
$ docker build -t appletv-microservice .
```

(There is a build.sh script that will do the build command for you)

## Docker run instructions

See explanation of environment variables below.

You will want to edit Config.js in the config repository.


To run it:

```
$ docker run \
    -d \
    --rm \
    --name="appletv-microservice" \
    -e "MQTT_HOST=mqtt://hostname" \
    -e "TOPIC_ROOT=appletv" \
    appletv-microservice
```

(There is a run.sh script that will do the run command for you)

To restart it:
```
$ docker restart appletv-micorservice
```

## Environment Variables

1. MQTT_HOST='mqtt://hostname'

This is the connection string for the client to connect to the host

2. TOPIC_ROOT='appletv'

MQTT topics will be published starting with TOPIC_ROOT, which is "appletv" by default.

For example:

_appletv/Hallway/status/setpoint 74

## Diagnosing Docker container
There is a handy shell.sh script that will give you a bash shell in a new instantiated container.

When you exit the shell, the container is stopped/removed.

You can also use the included debug.sh script which runs the container not as a daemon, so you can see the logging output in the console.

## DNS Issues
By default, Docker looks at the host's /etc/resolv.conf file for DNS servers for the containers.

In my setup, I have dnsmasq doing DHCP and DNS, on one of my computers, for my entire LAN.  When a system gets an IP from DHCP, it also gets the IP address of my dnsmasq host.

My /etc/resolv.conf file has one line in it:
```
nameserver 127.0.0.1
```

It is tricky for Docker to set up DNS in this situation without some help.  It does not
set the containers' DNS servers to the Docker host with name server 127.0.0.1 (e.g. to the docker bridge network).
If it did, you would have to set up your dnsmasq instance to listen on the host's IP address on the docker bridge, too.

There is a perfectly fine global setup for Docker that works as we want.  Simply add a /etc/docker/daemon.json file (or edit any existing one)
with this (my DNS host is 192.168.0.17, fix the "dns" below to point at yours):

```
{
    "dns": ["192.168.0.17", "8.8.8.8"]
}
```

And restart the docker service.

NOTE: you will need to do this on any machines on your LAN that act as Docker hosts!  In my case,
I have a development machine and production machine that both host microservices and the WWW site
containers.  I had to do this procedure on both.

See: https://robinwinslow.uk/2016/06/23/fix-docker-networking-dns/

## Automatically starting container on host reboot
TBD

## Error handling
Errors the microservice encounters are published to ${topic}/exception.
