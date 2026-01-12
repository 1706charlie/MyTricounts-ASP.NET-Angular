@echo off

cd /d "%~dp0"
echo Le script s'exécute dans : %cd% 

call env.bat

set DB_NAME="prid-2526-f03"

pg_ctl stop -D ..\..\data -w -m fast

rmdir /S/Q ..\..\data
mkdir ..\..\data
initdb -D ..\..\data

start "" /min pg_ctl -D ..\..\data start -o "-c log_min_messages=info -c log_statement=all"

ping 127.0.0.1 -n 3 > nul

createuser -s postgres

REM psql -U postgres -c "create role authenticator noinherit login password 'mysecretpassword';create role anon nologin;create role authenticated nologin;"
psql -U postgres -c "alter user postgres password 'dummy123'"

psql -U postgres -c "ALTER DATABASE template0 SET timezone = 'Europe/Brussels';"

createdb -T template0 %DB_NAME%
