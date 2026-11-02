@echo off
cd /d "%~dp0"
start /b "" node "%~dp0bin\buggraph.js" pop --detach

