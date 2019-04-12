FROM node:9
ENV TZ=America/Los_Angeles
ENV NODE_ENV development
RUN apt-get update && apt-get -y install libavahi-compat-libdnssd-dev
RUN npm install forever -g
RUN useradd --user-group --create-home --shell /bin/false app
ENV HOME=/home/app
WORKDIR /home/app
COPY . /home/app
RUN cd $HOME && npm install
CMD ["npm", "start"]
