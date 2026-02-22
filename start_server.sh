#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python3 server.py &
SERVER_PID=$!
sleep 1
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://127.0.0.1:4173/chat.html" >/dev/null 2>&1 || true
elif command -v open >/dev/null 2>&1; then
  open "http://127.0.0.1:4173/chat.html" || true
fi
wait "$SERVER_PID"
