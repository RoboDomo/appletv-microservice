#!/bin/sh
#sed -i "s/#enable-dbus=yes/enable-dbus=no/g" /etc/avahi/avahi-daemon.conf
service dbus restart
service avahi-daemon restart
ps -aux | grep avahi
ps -aux | grep dbus
npm start
