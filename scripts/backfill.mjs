// One-off upgrade for bills created before the new invoice features:
//   - gives every bill without a number a sequential invoice number (oldest first, per user)
//   - snapshots the current product buy price on stock items that have none (stable profit reports)
// Safe to re-run: it only fills what is missing. Usage: bun scripts/backfill.mjs [--dry-run]
import mongoose from "mongoose";

import { connect } from "./_db.mjs";

const dryRun = process.argv.includes("--dry-run");
const db = await connect();
const bills = db.collection("bills");
const products = db.collection("products");
const counters = db.collection("counters");

const userIds = await bills.distinct("userId");

for (const userId of userIds) {
    // Invoice numbers continue after the highest existing one
    const last = await bills.find({ userId, number: { $exists: true } }).sort({ number: -1 }).limit(1).toArray();
    let seq = last[0]?.number ?? 0;

    const missing = await bills.find({ userId, number: { $exists: false } }).sort({ createdAt: 1 }).toArray();
    for (const bill of missing) {
        seq += 1;
        if (!dryRun) await bills.updateOne({ _id: bill._id }, { $set: { number: seq } });
    }
    if (!dryRun) await counters.updateOne({ userId, key: "bill" }, { $set: { seq } }, { upsert: true });
    console.log(`${userId}: numbered ${missing.length} bills (last number ${seq})`);

    // Buy price snapshots
    const productDocs = await products.find({ userId }, { projection: { buyPrice: 1 } }).toArray();
    const buyPrices = new Map(productDocs.map((p) => [String(p._id), p.buyPrice]));

    let patched = 0;
    for await (const bill of bills.find({ userId, "items.productId": { $exists: true } })) {
        let changed = false;
        const items = bill.items.map((item) => {
            if (item.productId && item.buyPrice === undefined && buyPrices.has(item.productId)) {
                changed = true;
                return { ...item, buyPrice: buyPrices.get(item.productId) };
            }
            return item;
        });
        if (changed) {
            patched += 1;
            if (!dryRun) await bills.updateOne({ _id: bill._id }, { $set: { items } });
        }
    }
    console.log(`${userId}: added buy price snapshots to ${patched} bills`);
}

if (dryRun) console.log("Dry run: nothing was written.");
await mongoose.disconnect();
