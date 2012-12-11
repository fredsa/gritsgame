#!/bin/bash

echo
cat "$(dirname $0)/../shared/pairing-key.json"
echo -e "\n\nPress [ENTER] to use the above pairing key or [CTRL-C] to abort: \c"
read
