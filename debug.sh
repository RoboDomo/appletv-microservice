#!/usr/bin/env bash

# run container without making it a daemon - useful to see logging output
docker run \
    --net=host \
    -v $PWD:/home/app \
    -v /home/app/node_modules \
    --rm \
    --name="appletv-microservice" \
    robodomo/appletv-microservice
