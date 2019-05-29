FROM node:8
ENV TZ=America/Los_Angeles
ENV NODE_ENV development
RUN apt-get -y update && apt-get -y install build-essential neovim avahi-utils avahi-daemon avahi-discover libnss-mdns libavahi-compat-libdnssd-dev yarn
ADD avahi-daemon.conf /etc/avahi/avahi-daemon.conf
ADD nsswitch.conf /etc/nsswitch.conf
RUN npm install forever -g
RUN useradd --user-group --create-home --shell /bin/false app
ENV HOME=/home/app
WORKDIR /home/app
COPY . /home/app
RUN cd $HOME && rm -rf node_modules && yarn install
RUN mkdir -p /var/run/dbus
VOLUME /var/run/dbus
#RUN sed -i "s/#enable-dbus=yes/enable-dbus=no/g" /etc/avahi/avahi-daemon.conf
CMD ./entry.sh
