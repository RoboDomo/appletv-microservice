#!/bin/sh

sudo rm -rf .config .forever .bash_history
docker build --no-cache -t robodomo/appletv-microservice .
