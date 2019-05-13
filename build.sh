#!/bin/sh

sudo rm -rf .config .forever .bash_history .local
docker build --no-cache -t robodomo/appletv-microservice .
