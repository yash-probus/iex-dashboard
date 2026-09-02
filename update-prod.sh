#!/bin/bash

echo "=========================================="
echo "  IEX Dashboard - PROD Update Script"
echo "=========================================="

# 1. Ensure we are in the correct directory (the script should be run from the root of the project)
# But just in case, let's cd to the directory where the script is located
cd "$(dirname "$0")"

echo "➡️ Pulling latest code from GitHub..."
git reset --hard
git clean -fd
git pull origin main

echo "➡️ Rebuilding Frontend Container..."
cd frontend
docker compose build iex-frontend
docker compose up -d iex-frontend
cd ..

echo "➡️ Rebuilding Backend Container..."
cd backend
docker compose build iex-backend
docker compose up -d iex-backend

echo "➡️ Clearing Redis Cache..."
docker compose exec iex-redis redis-cli flushall
cd ..

echo "✅ Update Complete! Your PROD server is now running the latest code."
