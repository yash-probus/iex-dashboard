"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const weather_service_1 = require("../src/services/weather.service");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Triggering hourly forecast sync...');
    await weather_service_1.WeatherEngine.updateHourlyForecast();
    console.log('Done!');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
