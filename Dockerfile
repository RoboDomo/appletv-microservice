FROM node:8
ENV TZ=America/Los_Angeles
ENV NODE_ENV development
RUN apt-get -y update 
RUN apt-get -y upgrade 
RUN apt-get -y install neovim libsodium-dev avahi-daemon avahi-discover libnss-mdns libavahi-compat-libdnssd-dev
RUN npm install forever -g
RUN useradd --user-group --create-home --shell /bin/false app
ENV HOME=/home/app
WORKDIR /home/app
COPY . /home/app
RUN cd $HOME && npm install
CMD service dbus start && service avahi-daemon start && npm start
