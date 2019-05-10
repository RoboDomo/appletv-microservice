#!/usr/bin/env bash

docker run \
    --net=host \
    -d \
    --rm \
    --name="appletv-microservice" \
    robodomo/appletv-microservice
