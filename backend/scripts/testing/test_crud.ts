const API_URL = 'http://127.0.0.1:5000/api/resource-center';

const testPayloads: Record<string, any> = {
  'region-state': { regionalGrid: 'TEST GRID', regionCode: 'TG', regionName: 'Test Region', stateName: 'Test State', stateCode: 99, stateOrUt: 'state' },
  'discom-list': { code: 'TEST_DISCOM', legalName: 'Test Legal Name', stateCode: 99, discomType: 'Gov' },
  'ists-charges': { state: 'Test State', date: 202606, istsLossPercent: 1.2345 },
  'iex-fees': { month: 202611, exchangeFees: 12.3456, exchangeFeesGst: 1.23, nldcApplicationFees: 10, nldcSchedulingFees: null, sldcSchedulingFees: null, otherFixCharges: 5 },
  'prolt-margin': { month: 202612, customerId: 'TEST_CUST', tradingMargin: 1.5, tradingMarginGst: 0.1, proltMargin: 2.5, proltMarginGst: 0.2 },
  'ctu-charges': { stateCode: 99, state: 'Test State', month: 202612, ctuChargesRsPerKwh: 1.5, dsmChargesRsPerKwh: 0.5 },
  'stu-charges': { stateCode: 99, state: 'Test State', category: 'Ind', subCategory: 'Sub', voltageLevel: 'High', month: 202612, stuChargesRsPerKwh: 2.5, demandCharges: 100, percentFppaCharges: null, additionalCharges: null, crossSubsidy: null, distributionWheelingChargesRsPerKwh: null, stuLossPercent: null, distributionWheelingLossPercent: null },
  'state-tariff': { stateCode: 99, month: 202612, state: 'Test State', category: 'Ind', subCategory: 'Sub', voltageLevel: 'High', tod: 'Morning', todName: 'AM', season: 'Summer', todStartHour: '06:00', todEndHour: '12:00', baseEnergyCharges: 5.5, todRate: 1.2, energyCharges: 6.7 }
};

async function run() {
  const tables = Object.keys(testPayloads);
  let passed = 0;
  let failed = 0;

  for (const table of tables) {
    console.log(`\n--- Testing ${table} ---`);
    let createdId = null;

    try {
      // 1. Create
      const payload = testPayloads[table];
      const createRes = await fetch(`${API_URL}/${table}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.message);
      console.log(`CREATE: ${createRes.status} - ${createData.message}`);
      createdId = createData.data.id;
      
      // 2. Update
      // Find a string field to append _UPDATED to
      let updateKey = Object.keys(payload).find(k => typeof payload[k] === 'string' && k !== 'stateOrUt' && k !== 'date' && k !== 'tod');
      if (!updateKey) updateKey = Object.keys(payload).find(k => k !== 'month' && k !== 'date' && k !== 'id') || Object.keys(payload)[0];

      const updatePayload = { ...payload, [updateKey]: payload[updateKey] + (typeof payload[updateKey] === 'string' ? '_UPDATED' : 1) };
      const updateRes = await fetch(`${API_URL}/${table}/${createdId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatePayload) });
      const updateData = await updateRes.json();
      if (!updateRes.ok) throw new Error(updateData.message);
      console.log(`UPDATE: ${updateRes.status} - ${updateData.message}`);

      // 3. Delete
      const deleteRes = await fetch(`${API_URL}/${table}/${createdId}`, { method: 'DELETE' });
      const deleteData = await deleteRes.json();
      if (!deleteRes.ok) throw new Error(deleteData.message);
      console.log(`DELETE: ${deleteRes.status} - ${deleteData.message}`);
      
      passed++;
    } catch (e: any) {
      console.error(`FAILED on ${table}:`, e.message);
      failed++;
    }
  }

  console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
}

run();
