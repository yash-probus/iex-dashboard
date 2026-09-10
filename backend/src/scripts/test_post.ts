import axios from 'axios';

async function runPostTest() {
  const baseURL = 'http://localhost:8080/api/v1';
  
  const dummyEntry = {
    clientName: 'TEST CLIENT POST',
    industryName: 'TEST INDUSTRY POST',
    stateCode: 'UP',
    state: 'Uttar Pradesh', 
    discom: 'DVVNL',
    consumerCategory: 'HV-2',
    subCategory: 'Urban Schedule (Large & Heavy Power)',
    voltageLevel: '11',
    billedDemandKv: 1000,
    sanctionedLoadKw: 1000,
    powerFactor: 0.99,
    proltMargin: 0,
    traderMargin: 0,
    todConsumptions: {
      "Start Date": "01/08/2025",
      "End Date": "31/08/2025",
      "Season": "Summer",
      "Billing Month": "Aug-25",
      "05:00-10:00": 20000,
      "10:00-19:00": 50000,
      "19:00-03:00": 40000,
      "03:00-05:00": 10000,
      "_rawKvah": {
        "05:00-10:00": 20000,
        "10:00-19:00": 50000,
        "19:00-03:00": 40000,
        "03:00-05:00": 10000,
      }
    }
  };

  const dummyNewEntry = {
    ...dummyEntry,
    customSlots: [
      { startTime: '05:00', endTime: '10:00', effectivePrice: 0 },
      { startTime: '10:00', endTime: '19:00', effectivePrice: 0 },
      { startTime: '19:00', endTime: '03:00', effectivePrice: 0 },
      { startTime: '03:00', endTime: '05:00', effectivePrice: 0 },
    ]
  };

  try {
    console.log("Creating Old Calculator Entry...");
    const oldCreateRes = await axios.post(`${baseURL}/savings-calculator`, dummyEntry);
    const oldId = oldCreateRes.data.data.id;
    console.log("Old ID:", oldId);

    console.log("Creating New Calculator Entry...");
    const newCreateRes = await axios.post(`${baseURL}/savings-calculator-new`, dummyNewEntry);
    const newId = newCreateRes.data.data.id;
    console.log("New ID:", newId);

    console.log("\nCalculating Old Savings...");
    const oldCalcRes = await axios.post(`${baseURL}/savings-calculator/${oldId}/calculate`);
    const oldSummary = oldCalcRes.data.data.monthlyResults[0];
    console.log("Old Total Discom Cost:", oldSummary.totalBaselineCost);
    console.log("Old Total Savings:", oldSummary.totalSavings);

    console.log("\nCalculating New Savings...");
    const newCalcRes = await axios.post(`${baseURL}/savings-calculator-new/${newId}/calculate`);
    const newSummary = newCalcRes.data.data.monthlyResults[0];
    console.log("New Total Discom Cost:", newSummary.totalBaselineCost);
    console.log("New Total Savings:", newSummary.totalSavings);

    console.log("\nDifference in Savings:", Math.abs(oldSummary.totalSavings - newSummary.totalSavings));
    console.log("Difference in Discom Cost:", Math.abs(oldSummary.totalBaselineCost - newSummary.totalBaselineCost));

  } catch (error: any) {
    console.error("Error:", error.response?.data || error.message);
  }
}

runPostTest();
