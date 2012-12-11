#!/bin/bash

# constants
PROJECT=568961353999
MACHINE_TYPE=n1-standard-1
STARTUP_SCRIPT="$(dirname $0)/instance-startup-script.sh"
ZONES=us-central1-a

$(dirname $0)/check-pairing-key.sh

# remember project_id
gcutil getproject --cache_flag_values --project=$PROJECT

# create firewall rules
gcutil addfirewall http      --allowed="tcp:http"  --description "Incoming http allowed"
gcutil addfirewall http8080  --allowed="tcp:8080"  --description "Incoming http 8080 allowed"
gcutil addfirewall httpadmin --allowed="tcp:12345" --description "Incoming http 12345 allowed"

# list instance options
gcutil listzones
gcutil listmachinetypes

# create instance(s)
for zone in $ZONES;
do
  instance=grits-$zone
  gcutil addinstance $instance \
    --zone=$zone \
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

