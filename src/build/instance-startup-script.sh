#!/bin/bash

set -e
set -x

is_compute=$(grep Google /sys/firmware/dmi/entries/1-0/raw)
if [ -z "$is_compute" ]
then
  echo "ERROR: Unable to detect a Google Compute Engine Instance"
  exit 1
fi

# make sure O/S is patched and up to date
#apt-get update
#apt-get -y upgrade

# a place to run our code
[ -d /grits ] || mkdir /grits
cd /grits

# choose one way to install Node
if [ true ]
then
  # package based node installion option

  # install packages
  apt-get -y install nodejs npm g++
else
  # DIY based node installation option

  # install build tools
  apt-get -y install g++ libssl-dev make

  # download and extract Node.js
  NODE_VERSION=v0.6.18
  NODE_TAR_GZ=node-$NODE_VERSION.tar.gz
  NODE_DIR=node-$NODE_VERSION
  [ -f $NODE_TAR_GZ ] || wget http://nodejs.org/dist/$NODE_VERSION/$NODE_TAR_GZ
  [ -d $NODE_DIR ] || tar xvfz $NODE_TAR_GZ

  # install node
  node --version || (
    cd $NODE_DIR;
    ./configure
    make
    make install
  )
fi


# install git
git --version || apt-get -y install git

# get the latest grits source from git
[ -d gritsgame ] && (cd gritsgame; git pull) || git clone https://code.google.com/p/gritsgame/

# this is where it all happens
GAME_DIR=gritsgame/src

# install npm modules
[ -d $GAME_DIR/node_modules ] || (cd $GAME_DIR; npm install socket.io express)

# run the game server
while [ true ]
do
  (cd $GAME_DIR;
   NODE_ENV=production node games-server/main.js
  )
  sleep 30
done

