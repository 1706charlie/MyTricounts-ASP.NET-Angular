#!/bin/bash

cd $(dirname "$0")
echo "Le script s'exécute dans : $(pwd)"

source $(dirname "$0")/env.sh

DB_NAME="prid-2526-f03"

if [ -f ../../data/postmaster.pid ]; then
	pg_ctl-17 -D ../../data stop
fi

if [ -d ../../data ]; then
	rm -rf ../../data
fi

mkdir ../../data
initdb-17 -D ../../data

pg_ctl-17 -D ../../data start

sleep 3

createuser-17 -s postgres

psql-17 -U postgres -c "
create role authenticator noinherit login password 'mysecretpassword';
create role anon nologin;
create role authenticated nologin;
"
psql-17 -U postgres -c "alter user postgres password 'dummy123'"

psql-17 -U postgres -c "ALTER DATABASE template0 SET timezone = 'Europe/Brussels';"

createdb-17 -T template0 "$DB_NAME"