import { fetchOverpassData } from './fetchData.mjs';
import { transformOverpassData } from './transformData.mjs';
import { upsertSites } from './db.mjs';

async function run() {
    console.log('Fetching data from Overpass...');
    const raw = await fetchOverpassData();

    console.log('Transforming data...');
    const transformed = transformOverpassData(raw);

    console.log('Importing into MongoDB...');
    await upsertSites(transformed);

    console.log('Done.');
}

run().catch(err => {
    console.error('Pipeline failed:', err);
});
