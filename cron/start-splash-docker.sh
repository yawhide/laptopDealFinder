#!/bin/bash

docker-machine ip default > splash-docker-ip.txt
docker run -p 5023:5023 -p 8050:8050 -p 8051:8051 scrapinghub/splash
rm splash-docker-ip.txt
