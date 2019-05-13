#!/bin/sh
service dbus restart
service avahi-daemon restart
ps -aux | grep avahi
ps -aux | grep dbus
npm start
