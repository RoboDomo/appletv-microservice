#!/bin/sh

sudo rm -rf .config
docker build -t robodomo/appletv-microservice .
