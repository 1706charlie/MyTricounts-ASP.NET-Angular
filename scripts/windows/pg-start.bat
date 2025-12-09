@echo off

cd /d "%~dp0"
echo Le script s'exécute dans : %cd% 

call env.bat

if not exist "..\..\data" (
    call pg-init.bat
) else (
    start "" /min pg_ctl restart -D ..\..\data -w -m fast -o "-c log_min_messages=info -c log_statement=all"
)
