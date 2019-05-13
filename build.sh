#!/bin/sh

sudo rm -rf .config .forever
docker build --no-cache -t robodomo/appletv-microservice .
