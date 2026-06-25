@echo off
cd /d "%~dp0"
echo Building and starting SmartHostel API...
mvn clean spring-boot:run
pause
