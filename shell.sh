#!/usr/bin/env bash

docker run \
  --net=host \
  -it  \
  --rm \
  --name appletv-microservice \
  -v /var/run/dbus/system_bus_docket:/var/run/dbus/system_bus_socket \
  robodomo/appletv-microservice \
  /bin/bash
