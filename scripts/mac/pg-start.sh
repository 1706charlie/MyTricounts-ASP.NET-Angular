#!/bin/bash

cd $(dirname "$0")
echo "Le script s'exécute dans : $(pwd)"

pg_ctl-17 restart -D ../../data -w -m fast