#!/bin/bash

# Exit on any error, unset variable, or failed pipeline.
set -euo pipefail

ENV="${1:-}"

if [ "$ENV" == "prod" ]; then
    DIR="/mnt/storage/iex-dashboard-new"
elif [ "$ENV" == "dev" ]; then
    DIR="$HOME/iex-dashboard"
else
    echo "Usage: ./deploy.sh [prod|dev]"
    echo "Example: ./deploy.sh prod"
    exit 1
fi

echo "========================================="
echo " Deploying to $ENV environment..."
echo " Directory: $DIR"
echo "========================================="

cd "$DIR"

echo "-> Pulling latest code from GitHub..."
git pull --ff-only origin main

echo "-> Rebuilding backend..."
cd backend
docker compose up -d --build iex-backend

echo "-> Rebuilding frontend..."
cd ../frontend
docker compose up -d --build iex-frontend

echo "========================================="
echo " $ENV deployment complete!"
echo "========================================="
