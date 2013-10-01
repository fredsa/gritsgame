#!/bin/bash
#
set -ue
#set -v

# constants
PROJECT=gritsgame
STARTUP_SCRIPT="$(dirname $0)/instance-startup-script.sh"

# select US zone that's not about to go under maintenance 
ZONE=$(
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
ZONE=us-central1-a

# select the most recent debian-* image
IMAGE=$(
  gcutil listimages \
    --project=google \
    --filter 'description ne .*DEPRECATED.*' \
    --filter 'name eq debian-.*' \
    --format=names \
  | sort -n \
  | tail -1)

# select the smallest machinetype
MACHINE_TYPE=$(
  gcutil listmachinetypes \
    --project=google \
    --filter 'guestCpus eq 1' \
    --format=names \
    --zone=$ZONE \
  | sort -n \
  | head -1
)


$(dirname $0)/check-pairing-key.sh

# show project
gcutil --project=$PROJECT getproject

# create firewall rules
gcutil --project=$PROJECT addfirewall http      --allowed="tcp:http"  --description "Incoming http allowed"       || true
gcutil --project=$PROJECT addfirewall http8080  --allowed="tcp:8080"  --description "Incoming http 8080 allowed"  || true
gcutil --project=$PROJECT addfirewall httpadmin --allowed="tcp:12345" --description "Incoming http 12345 allowed" || true

# create instance
instance=grits-$ZONE
gcutil --project=$PROJECT \
  addinstance $instance \
  --zone=$ZONE \
  --image=$IMAGE \
  --persistent_boot_disk=true \
  --machine_type=$MACHINE_TYPE \
  --wait_until_running \
  --metadata_from_file=startup-script:$STARTUP_SCRIPT
cat <<EOD

-----------------------------------------------------------------

  To monitor instance progress, run:

     $ gcutil --project=$PROJECT ssh $instance tail -f /var/log/google.log

-----------------------------------------------------------------
EOD
