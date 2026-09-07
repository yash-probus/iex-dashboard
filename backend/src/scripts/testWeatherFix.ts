import { WeatherEngine } from '../services/weather.service';

async function main() {
  try {
    console.log("Testing updateDailyHistorical...");
    await WeatherEngine.updateDailyHistorical();
    
    console.log("Testing updateDailyForecastSummary...");
    await WeatherEngine.updateDailyForecastSummary();
    
    console.log("Test completed successfully.");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

main().then(() => process.exit(0));
