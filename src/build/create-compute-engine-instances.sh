#!/bin/bash
#
set -ue
#set -v

# constants
PROJECT=568961353999
STARTUP_SCRIPT="$(dirname $0)/instance-startup-script.sh"

# select US zone that's not about to go under maintenance 
ZONES=$(
  gcutil listzones \
    --project=google \
    --filter='status eq UP' \
    --filter='name eq us-.*' \
    --format=csv \
  | cut -d, -f1,5 \
  | sed 's/\(.*\),\(.*\)/\2,\1/' \
  | sort -n \
  | tail -1 \
  | cut -d, -f2
)

# select the most recent gcel-* image
IMAGE=projects/google/global/images/$(
  gcutil listimages \
    --project=google \
    --filter 'description ne .*DEPRECATED.*' \
    --filter 'name eq gcel-.*' \
    --format=names \
  | sort -n \
  | tail -1)

# select the smallest machinetype
MACHINE_TYPE=$(
  gcutil listmachinetypes \
    --project=google \
    --filter 'guestCpus eq 1' \
    --format=names \
  | sort -n \
  | head -1
)


$(dirname $0)/check-pairing-key.sh

# remember project_id
gcutil getproject --cache_flag_values --project=$PROJECT

# create firewall rules
gcutil addfirewall http      --allowed="tcp:http"  --description "Incoming http allowed"       || true
gcutil addfirewall http8080  --allowed="tcp:8080"  --description "Incoming http 8080 allowed"  || true
gcutil addfirewall httpadmin --allowed="tcp:12345" --description "Incoming http 12345 allowed" || true

# list instance options
gcutil listzones
gcutil listmachinetypes

# create instance(s)
for zone in $ZONES
do
  instance=grits-$zone
  gcutil addinstance $instance \
    --zone=$zone \
    --image=$IMAGE \
    --machine_type=$MACHINE_TYPE \
    --wait_until_running \
    --metadata_from_file=startup-script:$STARTUP_SCRIPT
  cat <<EOD

-----------------------------------------------------------------

  To monitor instance progress, run:

     $ gcutil ssh $instance tail -f /var/log/google.log

-----------------------------------------------------------------
EOD
done

