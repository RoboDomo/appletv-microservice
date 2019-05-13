FROM node:8
ENV TZ=America/Los_Angeles
ENV NODE_ENV development
RUN apt-get -y update 
RUN apt-get -y upgrade 
RUN apt-get -y install build-essential neovim avahi-daemon avahi-discover libnss-mdns libavahi-compat-libdnssd-dev
RUN npm install forever -g
RUN useradd --user-group --create-home --shell /bin/false app
ENV HOME=/home/app
WORKDIR /home/app
COPY . /home/app
RUN cd $HOME && rm -rf node_modules
RUN cd $HOME && npm install
RUN sed -i "s/#enable-dbus=yes/enable-dbus=no/g" /etc/avahi/avahi-daemon.conf
CMD ./entry.sh
