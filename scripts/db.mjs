import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'Chemnitz';
const collectionName = 'CulturalSites';

export async function upsertSites(sites) {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const ops = sites.map(site => ({
        updateOne: {
            filter: { externalId: site.externalId },
            update: { $set: site },
            upsert: true,
        },
    }));

    const result = await collection.bulkWrite(ops);
    console.log(`Inserted: ${result.upsertedCount}, Updated: ${result.modifiedCount}`);
    await client.close();
}
