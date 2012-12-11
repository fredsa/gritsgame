#!/bin/bash
#
set -ue

echo -e "\n*** Rolling back any pending updates (just in case) ***\n"
appcfg.py --oauth2 $* rollback .

echo -e "\n*** DEPLOYING FRONTENDS ***\n"
appcfg.py --oauth2 $* update .

echo -e "\n*** DEPLOYING BACKENDS ***\n"
appcfg.py --oauth2 backends . update

