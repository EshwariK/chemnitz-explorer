import fs from 'fs/promises';
import fetch from 'node-fetch';

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

export async function fetchOverpassData() {
    const query = await fs.readFile('./scripts/query.txt', 'utf-8');
    const response = await fetch(OVERPASS_API, {
        method: 'POST',
        body: query,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!response.ok) {
        throw new Error(`Overpass fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}
