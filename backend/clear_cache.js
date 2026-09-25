const { createClient } = require('redis');

async function clearCache() {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  await client.connect();
  const keys = await client.keys('market-decision-v2-*');
  if (keys.length > 0) {
    await client.del(keys);
    console.log(`Deleted ${keys.length} keys`);
  } else {
    console.log('No keys found');
  }
  await client.disconnect();
}
clearCache().catch(console.error);
