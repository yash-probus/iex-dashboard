# Database Schema & Structure

The PostgreSQL database uses the Prisma ORM. The schema is defined in `backend/prisma/schema.prisma`. 

## 1. Multiple Schemas
The database utilizes PostgreSQL's multi-schema feature:
- `@@schema("prolt_energy")`: A legacy schema that stores static, relatively unchanging configuration and pricing information (e.g., `RegionState`, `DiscomList`, `StateTariff`).
- `@@schema("public")`: The dynamic schema that stores all live-scraped analytics data, user data, and uploaded market datasets.

## 2. Core Tables (`public` schema)

### Analytics Data
- **`NppDemandData`**: Stores the All-India demand.
  - *Fields*: `date`, `timeStr`, `demandMet`, `hydro`, `wind`, `gas`, `solar`, `nuclear`, `thermal`.
  - *Index*: Unique composite key on `[date, timeStr]` to prevent duplicate interval data.
- **`StateDemandData`**: Stores individual state demand and live prices.
  - *Fields*: `stateName`, `date`, `timeStr`, `demand`, `unit`, `region`, `price`.
  - *Index*: Unique composite key on `[stateName, date, timeStr]`.
- **`WeatherForecast`**: Stores daily weather.
  - *Fields*: `date` (Unique), `maxTemp`, `minTemp`, `windSpeed`, `relativeHumidity`, `precipitationProb`, `precipitationSum`, `sunshineDuration`, `isActual`.

### Market Data (Admin Uploads)
- **`Dataset`**: Metadata about an uploaded Excel file.
  - *Fields*: `market` (DAM | GDAM | RTM), `deliveryDate`, `fileName`, `status`.
- **`DamRecord` / `GdamRecord` / `RtmRecord`**: Contains the interval-by-interval market clearing prices and volumes parsed from the Excel files. 
  - *Relationship*: Each record has a `datasetId` foreign key linking back to the `Dataset` table (`onDelete: Cascade` ensures clean deletions).

## 3. Database Updates (Migrations)
When the schema is changed in `schema.prisma`, the command `npx prisma db push` (or `npx prisma migrate dev`) is run. This generates the necessary SQL commands to alter tables, add new columns (such as adding `relativeHumidity` to the Weather table), and update the auto-generated Prisma Client inside `node_modules`.
