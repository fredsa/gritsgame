#!/bin/bash
#
set -ue

set -x

curl -H "Content-Type: application/json" "http://localhost:12345/log"
