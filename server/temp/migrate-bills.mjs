import { readFileSync, writeFileSync } from "fs";

const oldBills = JSON.parse(readFileSync("./server/temp/bills.json", "utf-8"));

// You may want to set this to the actual user ID from your DB
const DEFAULT_USER_ID = "REPLACE_WITH_USER_ID";

const newBills = oldBills.map((bill) => {
    const items = bill.products.map((p) => ({
        name: p.name,
        count: p.count,
        price: p.price,
    }));

    const total = items.reduce((sum, item) => sum + item.count * item.price, 0);

    return {
        _id: bill._id,
        userId: DEFAULT_USER_ID,
        customerName: bill.name,
        items,
        total,
        createdAt: bill.createdAt,
        updatedAt: bill.updatedAt,
    };
});

writeFileSync("./server/temp/bills-migrated.json", JSON.stringify(newBills, null, 4), "utf-8");

console.log(`Migrated ${newBills.length} bills`);
