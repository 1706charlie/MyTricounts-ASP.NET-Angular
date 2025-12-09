@echo off

cd /d "%~dp0"
echo Le script s'exécute dans : %cd% 

call env.bat
start "" /min pg_ctl stop -D ..\..\data -w -m fast
