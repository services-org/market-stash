import { connectDB } from "@/server/config/database";
import { Bill } from "@/server/models/bill";
import { getUserId } from "@/server/actions/product";

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
    const userId = await getUserId();

    const customers = await Bill.aggregate<TCustomer>([
        { $match: { userId, deletedAt: null } },
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

    return customers;
}

/** All bills of a customer (newest first) for the account statement. */
export async function getCustomerBills(name: string) {
    await connectDB();
    const userId = await getUserId();

    return Bill.find({ userId, deletedAt: null, $expr: { $eq: [{ $trim: { input: "$customerName" } }, name.trim()] } })
        .sort({ createdAt: -1 })
        .lean();
}
