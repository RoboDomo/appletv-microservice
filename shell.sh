#!/usr/bin/env bash

docker run \
  -it  \
  -v $PWD:/home/app \
  -v /home/app/node_modules \
  --rm \
  --name appletv-microservice \
  robodomo/appletv-microservice \
  /bin/bash
