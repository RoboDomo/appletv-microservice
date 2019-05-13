#!/usr/bin/env bash

# run container without making it a daemon - useful to see logging output
    #-v /var/run/dbus/system_bus_docket:/var/run/dbus/system_bus_socket \
    #-v /var/run/dbus:/var/run/dbus \
docker run \
    --net=host \
    -v $PWD:/home/app \
    -v /home/app/node_modules \
    -v $PWD/avahi-daemon.conf:/etc/avahi/avahi-daemon.conf \
    --rm \
    --name="appletv-microservice" \
    robodomo/appletv-microservice
