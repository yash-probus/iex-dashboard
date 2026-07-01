# Deployment & Infrastructure

The IEX Dashboard is designed to be easily deployed on a Linux server (e.g., AWS EC2 Ubuntu) using Docker.

## Server Details
- **OS**: Ubuntu Linux
- **IP / Domain**: `13.203.106.159`
- **Docker Compose**: Used to orchestrate the containers.

## Architecture Structure
The codebase has two separate `docker-compose.yml` files (one in `/backend` and one in `/frontend`) to modularize the deployment.

### 1. Backend (`/backend/docker-compose.yml`)
Spins up the following containers:
- `iex-postgres`: The main PostgreSQL database container. Uses a persistent Docker volume (`postgres_data`) so that database data is not lost if the container shuts down. Exposes port `5432` internally.
- `iex-migrator`: A temporary utility container that waits for PostgreSQL to be ready, runs `npx prisma db push` to ensure the schema is up to date, and then gracefully exits.
- `iex-backend`: The main Node.js API server. It maps the server's external port `5001` (or `5000`) to the container's internal port `5000`.

### 2. Frontend (`/frontend/docker-compose.yml`)
Spins up the following containers:
- `iex-frontend`: The frontend is a static React application. The Dockerfile uses a multi-stage build: 
  1. It builds the production bundle using `vite build` (Node.js).
  2. It copies the output `/dist` folder into a lightweight `nginx:alpine` image.
  3. Nginx serves the static HTML/CSS/JS files and dynamically handles React Router's client-side routing (by redirecting 404s back to `index.html`).
  It maps the external port `8081` to the container's internal port `80`.

## Deployment Commands
When code is updated (e.g., merged to `main`), the deployment process on the server is simply:
```bash
# Deploy Backend
cd /home/ubuntu/iex-dashboard/backend
docker compose up -d --build

# Deploy Frontend
cd ../frontend
docker compose up -d --build
```

The `--build` flag ensures that any new `package.json` dependencies are installed and the TypeScript files are recompiled. The `-d` flag runs the containers in detached (background) mode.
