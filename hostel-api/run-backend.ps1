# Run from this script's directory (hostel-api)
Set-Location $PSScriptRoot
if (Test-Path ".\mvnw.cmd") { .\mvnw.cmd spring-boot:run }
else { mvn spring-boot:run }
