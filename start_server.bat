@echo off
cd /d %~dp0
start "Zenith Lab" http://127.0.0.1:4173/chat.html
python3 server.py
