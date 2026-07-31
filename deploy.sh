#!/bin/bash

# Exit on any error
set -e

ENV=$1

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

cd $DIR

echo "-> Pulling latest code from GitHub..."
git pull origin main

echo "-> Rebuilding backend..."
cd backend
docker compose up --build -d

echo "-> Rebuilding frontend..."
cd ../frontend
docker compose up --build -d

echo "========================================="
echo " $ENV deployment complete!"
echo "========================================="
