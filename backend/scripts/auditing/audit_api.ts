const API_URL = 'http://127.0.0.1:5000/api/resource-center';

async function verify(name: string, p: Promise<any>, expectedStatus: number, expectedMessageSubstr?: string) {
  let status = 0;
  let data: any = {};
  try {
    const res = await p;
    status = res.status;
    data = await res.json();
  } catch (e: any) {
    console.error(`Fetch failed for ${name}:`, e.message);
    return;
  }

  const passStatus = status === expectedStatus;
  const passMsg = expectedMessageSubstr ? (data.message && data.message.includes(expectedMessageSubstr)) : true;

  if (passStatus && passMsg) {
    console.log(`✅ PASS: ${name} (Status: ${status}, Message: "${data.message}")`);
  } else {
    console.log(`❌ FAIL: ${name}. Expected ${expectedStatus} and message ~"${expectedMessageSubstr}", got ${status} and "${data.message}"`);
  }
}

async function run() {
  console.log('--- DELIVERABLE 4: Validation Coverage Audit ---');

  // 1. Invalid Enum
  await verify('Enum rejection (abc)', fetch(`${API_URL}/region-state`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ regionalGrid: 'G', regionCode: 'R', regionName: 'N', stateName: 'S', stateCode: 1, stateOrUt: 'abc' })
  }), 400, "must be 'state' or 'ut'");

  // 2. Invalid Numbers
  await verify('Number rejection (NaN)', fetch(`${API_URL}/iex-fees`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month: 'NaN', exchangeFees: 1 })
  }), 400, 'finite number');
  
  await verify('Number rejection (Infinity)', fetch(`${API_URL}/iex-fees`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month: 'Infinity', exchangeFees: 1 })
  }), 400, 'finite number');

  // 3. Invalid IDs
  await verify('ID rejection (0)', fetch(`${API_URL}/region-state/0`, { method: 'DELETE' }), 400, 'Invalid ID format');
  await verify('ID rejection (-1)', fetch(`${API_URL}/region-state/-1`, { method: 'DELETE' }), 400, 'Invalid ID format');
  await verify('ID rejection (abc)', fetch(`${API_URL}/region-state/abc`, { method: 'DELETE' }), 400, 'Invalid ID format');

  // 4. Empty Required Fields
  await verify('Empty field rejection ("")', fetch(`${API_URL}/region-state`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ regionalGrid: 'G', regionCode: 'R', regionName: 'N', stateName: '', stateCode: 1, stateOrUt: 'state' })
  }), 400, 'stateName is required');

  console.log('\n--- DELIVERABLE 7: Concurrency Verification ---');
  // Create a record, delete it, try to update it
  const createRes = await fetch(`${API_URL}/discom-list`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'CONCURRENCY_TEST', legalName: 'C_Test', stateCode: 1 })
  });
  const created = await createRes.json();
  const id = created.data.id;

  // Delete it (Admin B)
  await fetch(`${API_URL}/discom-list/${id}`, { method: 'DELETE' });

  // Update it (Admin A)
  await verify('Concurrency Update (404)', fetch(`${API_URL}/discom-list/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'CONCURRENCY_UPD', legalName: 'C_Test', stateCode: 1 })
  }), 404, 'Record not found');

  console.log('\n--- DELIVERABLE 8: Security Verification ---');
  // 1. SQL Injection
  await verify('SQL Injection Attempt', fetch(`${API_URL}/region-state`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ regionalGrid: "'; DROP TABLE region_state;", regionCode: 'R', regionName: 'N', stateName: 'S', stateCode: 1, stateOrUt: 'state' })
  }), 201, 'Record created successfully');

  // 2. Script Injection
  await verify('XSS Injection Attempt', fetch(`${API_URL}/region-state`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ regionalGrid: "<script>alert(1)</script>", regionCode: 'R', regionName: 'N', stateName: 'S2', stateCode: 1, stateOrUt: 'state' })
  }), 201, 'Record created successfully');
}

run();
