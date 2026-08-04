@echo off
setlocal
set "GAME=%~dp0index.html"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" (
  start "" "%EDGE%" --app="file:///%GAME:\=/%" --start-maximized
) else (
  start "" "%GAME%"
)
endlocal
