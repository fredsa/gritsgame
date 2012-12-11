#!/bin/bash
#
set -ue

pairing_key=$( cat shared/pairing-key.json | sed -e 's/{"key": "//' -e 's/".*//' )
set -x
data='{ "userID": 823478923748932, "displayName": "fredsa", "game_name": "syXv", "player_game_key": "283473289478329" }'

curl --data-binary "$data" -H "Content-Type: application/json" "http://localhost:12345/add-players?p=$pairing_key"
