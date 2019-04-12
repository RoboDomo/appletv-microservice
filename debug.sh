#!/usr/bin/env bash

# run container without making it a daemon - useful to see logging output
docker run \
    -v /home/mschwartz/github/RoboDomo/appletv-microservice:/home/app \
    -v node_modules \
    --rm \
    --name="appletv-microservice" \
    robodomo/appletv-microservice
