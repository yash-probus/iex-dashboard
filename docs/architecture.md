# IEX Dashboard Architecture Overview

The IEX Dashboard is a full-stack web application designed for visualizing, exporting, and managing real-time and historical energy analytics, weather forecasts, and power market data.

## Tech Stack
- **Frontend**: React (with Vite), TypeScript, Material UI (MUI), Recharts (for charting), and React Router for navigation.
- **Backend**: Node.js, Express, TypeScript.
- **Database**: PostgreSQL.
- **ORM**: Prisma Client.
- **Infrastructure**: Docker and Docker Compose (containerized deployment).

## System Components

### 1. Frontend (`/frontend`)
The frontend is a React Single Page Application (SPA) that provides two main views:
- **Admin Dashboard**: Secure area where administrators can upload IEX market data (DAM, GDAM, RTM) via Excel files, manage datasets, and view upload histories.
- **Database Analytics**: Public-facing views that visualize State-Wise Demand, and Weather analytics through tables and charts, with CSV export capabilities.

### 2. Backend (`/backend`)
The backend provides RESTful APIs for the frontend. It is structured into modules:
- **Auth Module**: Handles JWT-based authentication for admins.
- **Database Module**: Handles fetching analytics data (Weather, Demand) and formatting CSV exports.
- **Market Data Module**: Handles the complex parsing of uploaded Excel sheets and saving the interval records.
- **Services (Background Jobs)**:
  - `cron.service.ts`: Initializes scheduled background jobs (using `node-cron`).
  - `scraper.service.ts`: Scrapes live power demand data from government portals.
  - `weather.service.ts`: Fetches weather forecasts from external APIs and interpolates data.

### 3. Database (`iex-postgres`)
A PostgreSQL instance running inside a Docker container. It is structured using two schemas:
- `prolt_energy`: Contains legacy pricing/tariff structures and state/region mappings.
- `public`: Contains the live and historical analytics tables (WeatherForecast, StateDemandData, DamRecord, etc.).

## Communication Flow
1. **User Request**: The user interacts with the UI (e.g., selects a date on the Database page).
2. **API Call**: Axios sends an HTTP request to the Express backend (`/api/database/weather`).
3. **Database Query**: The Express controller uses Prisma to fetch the relevant rows from PostgreSQL.
4. **Response**: The JSON data is sent back and rendered onto the MUI tables or Recharts.

## Background Data Ingestion
Unlike standard CRUD apps, this application relies heavily on background automated processes to ensure the dashboard always has the latest live data. These are covered in detail in `data-pipelines.md`.
