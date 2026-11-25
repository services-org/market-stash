// Dumps every collection to backups/<date>/<collection>.json (Extended JSON, restorable with `restore`).
// Read-only: it never changes the database. Usage: bun run backup
import { mkdirSync, writeFileSync } from "node:fs";
import mongoose from "mongoose";

import { BSON, connect } from "./_db.mjs";

const db = await connect();

const stamp = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
const dir = `backups/${stamp}`;
mkdirSync(dir, { recursive: true });

for (const { name } of await db.listCollections().toArray()) {
    const docs = await db.collection(name).find({}).toArray();
    writeFileSync(`${dir}/${name}.json`, BSON.EJSON.stringify(docs, undefined, 2, { relaxed: false }), "utf8");
    console.log(`${name}: ${docs.length} documents`);
}

console.log(`Backup written to ${dir}`);
await mongoose.disconnect();
