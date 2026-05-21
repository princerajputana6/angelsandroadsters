// One-time migration: copies every collection from the old database
// into the new "angelsandroadsters" database.
// Run: node scripts/migrate-db.js
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const SOURCE_URI = 'mongodb+srv://biztreck:biztreck@biztreck.xvbxe4g.mongodb.net/trylinqr?retryWrites=true&w=majority';
const TARGET_URI = 'mongodb+srv://angelsandroadsters_db_user:ebODkGI3tgUPXgSR@angelsandroadsters.jnnylw1.mongodb.net/?retryWrites=true&w=majority';
const TARGET_DB = 'angelsandroadsters';

(async () => {
  const src = new MongoClient(SOURCE_URI, { serverSelectionTimeoutMS: 30000 });
  const dst = new MongoClient(TARGET_URI, { serverSelectionTimeoutMS: 30000 });

  await src.connect();
  await dst.connect();
  console.log('✅ Connected to both clusters');

  const srcDb = src.db();
  const dstDb = dst.db(TARGET_DB);

  const collections = await srcDb.listCollections().toArray();
  console.log(`📦 Found ${collections.length} collection(s) in source DB "${srcDb.databaseName}"`);

  for (const { name } of collections) {
    const docs = await srcDb.collection(name).find({}).toArray();
    const target = dstDb.collection(name);

    if (docs.length === 0) {
      console.log(`   ↳ ${name}: 0 docs (skipped)`);
      continue;
    }

    // Replace each doc by _id so the migration is idempotent.
    const ops = docs.map((doc) => ({
      replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true },
    }));
    await target.bulkWrite(ops, { ordered: false });

    // Recreate indexes (best effort).
    try {
      const indexes = await srcDb.collection(name).indexes();
      for (const idx of indexes) {
        if (idx.name === '_id_') continue;
        const { key, name: idxName, v, ns, ...opts } = idx;
        await target.createIndex(key, { name: idxName, ...opts }).catch(() => {});
      }
    } catch { /* ignore index copy errors */ }

    console.log(`   ↳ ${name}: ${docs.length} docs migrated`);
  }

  console.log(`✨ Migration complete → ${TARGET_DB}`);
  await src.close();
  await dst.close();
})().catch((err) => { console.error('❌ Migration failed:', err); process.exit(1); });
