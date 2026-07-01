# Data Pipelines & Automated Scraping

The IEX Dashboard relies on automated background processes to keep the database up to date without manual intervention.

## 1. Cron Scheduler (`cron.service.ts`)
When the Node.js server starts, `CronService.init()` is called. This service uses the `node-cron` library to schedule tasks.
- **Every 15 Minutes** (`*/15 * * * *`): Triggers the live state demand scraper.
- **Every Midnight** (`0 0 * * *`): Triggers the daily weather forecast sync.

## 2. Live Demand Scraper (`scraper.service.ts`)
The `VidyutPravahScraper` class is responsible for fetching live demand data from the Indian government's Vidyut Pravah portal.

### Workflow:
1. **Fetch State Prices**: Calls `https://vidyutpravah.in/PXDashboard/BindStatePricesFromJS` to get live pricing per state.
2. **Fetch State Demands**: Uses a region/slug mapping (e.g., `delhi`, `maharashtra`) to asynchronously fetch the HTML pages of all 30+ states in parallel.
3. **Regex Extraction**: Since the data is embedded in HTML `<span>` tags, regular expressions are used to cleanly extract the numerical MW values.
4. **Database Upsert**: The aggregated prices and demands are inserted into the `StateDemandData` table using a bulk `createMany` operation with `skipDuplicates: true`.

*Note: SSL certificate verification is explicitly bypassed (`rejectUnauthorized: false`) because government portals often have misconfigured or self-signed SSL certificates.*

## 3. Weather Forecast Sync (`weather.service.ts`)
The `WeatherEngine` class maintains exactly 30 days of weather data (yesterday, today, and 28 days of future forecast).

### Workflow:
1. **Fetch 16-Day Forecast**: Calls the free Open-Meteo API for New Delhi coordinates (Lat: 28.61, Lon: 77.20) to retrieve daily `temperature`, `windspeed`, `precipitation`, `sunshine_duration`, and `relative_humidity` for the next 16 days.
2. **Save Actuals & Short-term Forecast**: Upserts these 16 days directly into the `WeatherForecast` table.
3. **Extrapolate Remaining 14 Days**: The Open-Meteo free tier only provides 16 days of forecast. To fulfill the 30-day requirement, the engine takes the 16th day's data and extrapolates the next 14 days using statistical trend holding with slight random noise. This ensures the dashboard always has a full 30-day continuous dataset without API limit crashes.
4. **Boolean Flags**: Rows that are in the past or present day are marked with `isActual = true`, while future days are marked `isActual = false`.
