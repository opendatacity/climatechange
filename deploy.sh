#!/bin/bash

set -e

tar -zcvf nasa.tar.gz research/*
scp nasa.tar.gz malteburkhardt@nyx.opendatacity.de:~/

ssh malteburkhardt@nyx.opendatacity.de <<'ENDSSH'
#commands to run on remote host
sudo tar -zxvf nasa.tar.gz research/
sudo cp -r research/* /var/www/labs.opendatacity.de/climatechange
sudo chown opendatacity:opendatacity /var/www/labs.opendatacity.de/climatechange -R
rm nasa.tar.gz
ENDSSH
