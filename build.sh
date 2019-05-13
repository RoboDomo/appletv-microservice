#!/bin/sh

sudo rm -rf .config
docker build --no-cache -t robodomo/appletv-microservice .
