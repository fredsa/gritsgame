#!/bin/bash
#
set -uex

dev_appserver.py --address 0.0.0.0 --skip_sdk_update_check --backends . $*
