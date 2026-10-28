#!/bin/bash

# Exit on any error, unset variable, or failed pipeline.
set -euo pipefail

ENV="prod"
DIR="${DIR:-$HOME/iex-dashboard}"

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
