#!/usr/bin/env bash

docker run \
    --net=host \
    -v $PWD:/home/app \
    -v /home/app/node_modules \
    -v /var/run/dbus:/var/run/dbus \
    -d \
    --rm \
    --name="appletv-microservice" \
    robodomo/appletv-microservice
