#!/bin/bash
#
set -ue

backend=""

# match dev_appserver oauth2 default user_id
userID="0"

while [ $# -ge 1 ]
do
  arg="$1"
  shift
  if [ "$arg" == "-b" ]
  then
    backend=1
  else
    userID="$arg"
  fi
done

if [ "$backend" ]
then
  # matcher backend
  set -x
  curl --data-binary "{}" -H "Content-Type: application/json" "localhost:9100/find-game/$userID"
else
  # frontend
  set -x
  curl --data-binary "" "localhost:8080/login?userID=$userID"
  curl --data-binary "" "localhost:8080/grits/findGame?userID=$userID"
fi
