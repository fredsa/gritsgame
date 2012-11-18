#!/bin/bash
#
set -ue

# make sure stuff is installed
[ ! -d 'node_modules' ] && npm install socket.io express

set -x
# run the game
node games-server/main.js $*
