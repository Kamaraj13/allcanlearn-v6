#!/bin/bash
# deploy.sh — pull latest code and restart the app on the Ubuntu server
# Run this from: /home/vikki/Desktop/roundtable/allcanlearn-v6

set -e

echo "==> Pulling latest code..."
git stash 2>/dev/null || true
git pull origin main

echo "==> Installing / updating Python packages..."
venv/bin/python3 -m pip install -r requirements.txt --quiet

echo "==> Restarting service..."
sudo systemctl restart allcanlearn

echo "==> Status:"
sudo systemctl status allcanlearn --no-pager -l
