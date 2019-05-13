#!/usr/bin/env bash

  #-v /var/run/dbus:/var/run/dbus \
docker run \
  --net=host \
  -it  \
  --rm \
  --name appletv-microservice \
  -v $PWD:/home/app \
  -v /home/app/node_modules \
  -v $PWD/avahi-daemon.conf:/etc/avahi/avahi-daemon.conf \
  robodomo/appletv-microservice \
  /bin/bash
