@echo off
cd /d "D:\IDE Files"
for /d %%i in (*) do (
    if /i not "%%i"=="postgresql_14.exe" rd /s /q "%%i"
)
for %%i in (*) do (
    if /i not "%%i"=="postgresql_14.exe" del /f /q "%%i"
)
