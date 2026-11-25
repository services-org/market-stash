import { connectDB } from "@/server/config/database";
import { Bill } from "@/server/models/bill";
import { CustomerRecord, saveCustomer } from "@/server/models/customer";
import { customerInput } from "@/server/validation";

export type TCustomer = {
    _id: string;
    phone?: string;
    address?: string;
    billsCount: number;
    totalNet: number;
    totalPaid: number;
    balance: number;
    lastDate: Date;
};

/** Customers are derived from the bills: one row per customer name. */
export async function getCustomers() {
    await connectDB();

    const customers = await Bill.aggregate<TCustomer>([
        { $match: { deletedAt: null } },
        { $sort: { createdAt: -1 } },
        // Legacy bills may carry trailing spaces in the name
        { $addFields: { customerKey: { $trim: { input: "$customerName" } } } },
        {
            $addFields: {
                returned: {
                    $reduce: { input: { $ifNull: ["$returns", []] }, initialValue: 0, in: { $add: ["$$value", { $multiply: ["$$this.count", "$$this.price"] }] } },
                },
            },
        },
        { $addFields: { net: { $max: [0, { $subtract: [{ $subtract: ["$total", { $ifNull: ["$discount", 0] }] }, "$returned"] }] } } },
        { $addFields: { paidAmount: { $min: [{ $ifNull: ["$paid", "$net"] }, "$net"] } } },
        {
            $group: {
                _id: "$customerKey",
                billsCount: { $sum: 1 },
                totalNet: { $sum: "$net" },
                totalPaid: { $sum: "$paidAmount" },
                lastDate: { $first: "$createdAt" },
                phones: { $push: "$phone" },
                addresses: { $push: "$address" },
            },
        },
        {
            $addFields: {
                balance: { $max: [0, { $subtract: ["$totalNet", "$totalPaid"] }] },
                phone: { $arrayElemAt: [{ $filter: { input: "$phones", cond: { $and: [{ $ne: ["$$this", null] }, { $ne: ["$$this", ""] }] } } }, 0] },
                address: { $arrayElemAt: [{ $filter: { input: "$addresses", cond: { $and: [{ $ne: ["$$this", null] }, { $ne: ["$$this", ""] }] } } }, 0] },
            },
        },
        { $project: { phones: 0, addresses: 0 } },
        { $sort: { lastDate: -1 } },
    ]);

    // Customers saved on purpose: their phone / address win, and the ones without bills yet are listed too
    const saved = await CustomerRecord.find({}).lean();
    const byName = new Map(customers.map((c) => [c._id, c]));
    for (const record of saved) {
        const existing = byName.get(record.name);
        if (existing) {
            if (record.phone) existing.phone = record.phone;
            if (record.address) existing.address = record.address;
        } else {
            customers.push({ _id: record.name, phone: record.phone, address: record.address, billsCount: 0, totalNet: 0, totalPaid: 0, balance: 0, lastDate: record.createdAt });
        }
    }

    return customers.sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());
}

/** Adds a customer (or updates his phone / address) without creating a bill. */
export async function createCustomer(body: unknown) {
    await connectDB();
    const data = customerInput.parse(body);
    return saveCustomer(data);
}

/** All bills of a customer (newest first) for the account statement. */
export async function getCustomerBills(name: string) {
    await connectDB();

    return Bill.find({ deletedAt: null, $expr: { $eq: [{ $trim: { input: "$customerName" } }, name.trim()] } })
        .sort({ createdAt: -1 })
        .lean();
}
