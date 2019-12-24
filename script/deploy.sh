#!/bin/bash

# scp -r www admin src/* root@192.168.90.1:/opt/iobroker/node_modules/iobroker.homeoverview/
scp -r admin src/* root@192.168.90.1:/opt/iobroker/node_modules/iobroker.homeoverview/
ssh -l root -t 192.168.90.1 'cd /opt/iobroker; iobroker upload homeoverview'