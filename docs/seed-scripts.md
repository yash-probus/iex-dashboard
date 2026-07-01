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


