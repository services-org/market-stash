// Loads the sample data in server/temp/*.json into a LOCAL database for testing.
// Refuses to run against a remote database, and refuses if the user already has data.
// Usage: bun scripts/seed-local.mjs [userId]
//   The user id defaults to the one inside the JSON files (the app adopts the id that its data already uses).
import { readFileSync } from "node:fs";
import mongoose from "mongoose";

import { BSON, connect } from "./_db.mjs";

const db = await connect({ localOnly: true });

const read = (name) => BSON.EJSON.parse(readFileSync(`server/temp/${name}.json`, "utf8"), { relaxed: true });
const products = read("products");
const bills = read("bills");

const userId = process.argv[2] || products[0].userId;

for (const [name, docs] of [
    ["products", products],
    ["bills", bills],
]) {
    const collection = db.collection(name);
    if ((await collection.countDocuments({ userId })) > 0) {
        console.log(`${name}: user ${userId} already has data, skipping`);
        continue;
    }

    const prepared = docs.map((source) => {
        const doc = { ...source };
        delete doc.developerId;
        return {
        ...doc,
        userId,
        deletedAt: null,
        // Sample products carry no timestamps; make them old enough to show up in the "dead stock" report
        ...(name === "products" ? { createdAt: doc.createdAt ?? new Date(Date.now() - 90 * 864e5), updatedAt: doc.updatedAt ?? new Date() } : {}),
        ...(name === "bills" ? { discount: 0 } : {}),
        };
    });
    await collection.insertMany(prepared);
    console.log(`${name}: inserted ${prepared.length} documents for ${userId}`);
}

console.log("Done. Run `bun scripts/backfill.mjs` to number the bills.");
await mongoose.disconnect();
