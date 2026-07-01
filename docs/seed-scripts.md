# Historical Data Seeding Scripts

Because live automated scrapers only collect data from the moment they are turned on, this project includes specialized "Seed Scripts" to backfill the database with historical data, allowing the charts and analytics to be immediately useful.

These scripts are located in `backend/scripts/` and `backend/src/scripts/`.

## 1. Weather Backfilling (`seed-weather.ts`)
This script safely populates the last 2 years of accurate historical weather data into the `WeatherForecast` table.

### Logic:
1. It queries the `archive-api.open-meteo.com` endpoint, which specializes in historical weather records (unlike the standard forecast API).
2. It loops from `2024-04-01` to `2026-06-30` (or dynamically generated past dates) and retrieves metrics including `maxTemp`, `minTemp`, `windSpeed`, `relativeHumidity`, `precipitationProb`, `precipitationSum`, and `sunshineDuration`.
3. It performs a bulk `upsert` on the database, inserting any missing rows and updating existing ones safely without duplication errors.
4. All seeded rows are marked as `isActual: true`.

## 2. NPP Demand Backfilling (`seedHistoricalNpp.ts`)
This script backfills the National Power Portal (NPP) All-India Demand data for a 2-year period in exactly 15-minute intervals. 

### Logic:
1. It simulates over 78,000 distinct timestamp rows (`365 days * 2 years * 96 blocks/day`).
2. **Algorithmic Simulation**: Since historical 15-min interval API data for the entire country is not freely available, the script simulates highly accurate seasonal and daily curves:
   - **Seasonal Curve**: The base demand shifts from 220,000 MW (winter) to 260,000 MW (summer).
   - **Daily Curve**: Demand multiplies by `1.15` during evening peaks (7 PM - 10 PM) and drops to `0.85` during night troughs (2 AM - 5 AM).
   - **Solar Curve**: Solar generation is only non-zero between 7 AM and 5 PM, peaking sharply at 12-1 PM.
   - **Random Noise**: Small localized random noise is added to `thermal`, `hydro`, `wind`, and `gas` generation to ensure the data mimics real-world erraticism.
3. **Batch Insertion**: To prevent crashing the PostgreSQL database or running out of memory, the script compiles arrays of 10,000 rows at a time and uses Prisma's `createMany` function to bulk insert the batches.
