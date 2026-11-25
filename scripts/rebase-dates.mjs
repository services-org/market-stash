// Local testing helper: shifts all bill dates so the newest bill is "now" (sample data is older than the 1-year window).
import mongoose from "mongoose";

import { connect } from "./_db.mjs";

const db = await connect({ localOnly: true });
const bills = db.collection("bills");

const newest = await bills.find({}).sort({ createdAt: -1 }).limit(1).toArray();
if (!newest[0]) throw new Error("No bills");

const shift = Date.now() - new Date(newest[0].createdAt).getTime();
for await (const bill of bills.find({})) {
    await bills.updateOne(
        { _id: bill._id },
        { $set: { createdAt: new Date(new Date(bill.createdAt).getTime() + shift), updatedAt: new Date(new Date(bill.updatedAt ?? bill.createdAt).getTime() + shift) } },
    );
}
console.log(`Shifted dates by ${(shift / 864e5).toFixed(0)} days`);
await mongoose.disconnect();
