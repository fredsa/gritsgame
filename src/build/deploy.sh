#!/bin/bash
#
set -ue

APP_DIR="$(dirname $0)/.."

$(dirname $0)/check-pairing-key.sh                                              

echo -e "\n*** Rolling back any pending updates (just in case) ***\n"
appcfg.py --oauth2 $* rollback $APP_DIR

echo -e "\n*** DEPLOYING FRONTENDS ***\n"
appcfg.py --oauth2 $* update $APP_DIR

echo -e "\n*** DEPLOYING BACKENDS ***\n"
appcfg.py --oauth2 backends $APP_DIR update

