#!/bin/bash
#
set -ue

APP_DIR="$(dirname $0)/.."

DIRTY_SUFFIX="$( (git diff --exit-code --quiet --cached && git diff --exit-code --quiet) || echo "-dirty" )"
GIT_VERSION="$( git log -1 --format=%H )$DIRTY_SUFFIX"

if [ $( echo "$*" | egrep -- '-V'\|'--version=' >/dev/null; echo $? ) != 0 ]
then
  echo "ERROR: Must explicitly specify either '-V <version>' or '--version <version>'"
  echo
  echo "Suggest:"
  echo
  echo "  $0 -V $GIT_VERSION"
  echo
  exit 1
fi

$(dirname $0)/check-pairing-key.sh

echo -e "\n*** Rolling back any pending updates (just in case) ***\n"
appcfg.py --oauth2 $* rollback $APP_DIR

echo -e "\n*** DEPLOYING FRONTENDS ***\n"
appcfg.py --oauth2 $* update $APP_DIR

echo -e "\n*** DEPLOYING BACKENDS ***\n"
appcfg.py --oauth2 backends $APP_DIR update


echo -e "\n*** CHANGE DEFAULT VERSION ***\n"
cat <<EOD
#########################################################################
 ACTION REQUIRED

 Please change the default app version to:
  $GIT_VERSION
 using the App Engine admin console:
   https://appengine.google.com/deployment?&app_id=s~gritsgame

#########################################################################
EOD
