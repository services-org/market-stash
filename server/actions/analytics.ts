import { connectDB } from "@/server/config/database";
import { Product } from "@/server/models/product";
import { Bill } from "@/server/models/bill";
import { DEFAULT_PROFIT_RATE, SHOP_TIMEZONE } from "@/lib/constants";
import { Types } from "mongoose";

export async function getLocationCosts() {
    await connectDB();

    const costs = await Product.aggregate([
        { $match: { deletedAt: null } },
        {
            $group: {
                _id: "$location",
                totalBuyCost: { $sum: { $multiply: ["$buyPrice", "$count"] } },
                totalSellCost: { $sum: { $multiply: ["$sellPrice", "$count"] } },
                productCount: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    return costs;
}

export async function getTopSoldProducts() {
    await connectDB();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topProducts = await Bill.aggregate([
        {
            $match: {
                deletedAt: null,
                createdAt: { $gte: thirtyDaysAgo },
            },
        },
        { $unwind: "$items" },
        {
            $group: {
                _id: { productId: "$items.productId", name: "$items.name" },
                totalCountSold: { $sum: "$items.count" },
                totalRevenue: { $sum: { $multiply: ["$items.count", "$items.price"] } },
            },
        },
        { $sort: { totalCountSold: -1 } },
        { $limit: 10 },
        {
            $project: {
                _id: 0,
                productId: "$_id.productId",
                name: "$_id.name",
                totalCountSold: 1,
                totalRevenue: 1,
            },
        },
    ]);

    return topProducts;
}

export async function getYearlyMonthlyProfits() {
    await connectDB();

    const profits = await Bill.aggregate([
        { $match: { deletedAt: null } },
        // Spread the bill discount over its items so revenue is the real amount charged
        {
            $addFields: {
                ratio: {
                    $cond: [{ $gt: ["$total", 0] }, { $divide: [{ $max: [0, { $subtract: ["$total", { $ifNull: ["$discount", 0] }] }] }, "$total"] }, 1],
                },
            },
        },
        // Sold items count +, returned items count - (on the day they came back)
        {
            $addFields: {
                lines: {
                    $concatArrays: [
                        {
                            $map: {
                                input: "$items",
                                as: "i",
                                in: { productId: "$$i.productId", count: "$$i.count", price: "$$i.price", buyPrice: "$$i.buyPrice", at: "$createdAt" },
                            },
                        },
                        {
                            $map: {
                                input: { $ifNull: ["$returns", []] },
                                as: "r",
                                in: { productId: "$$r.productId", count: { $multiply: ["$$r.count", -1] }, price: "$$r.price", buyPrice: "$$r.buyPrice", at: "$$r.at" },
                            },
                        },
                    ],
                },
            },
        },
        { $unwind: "$lines" },
        // Legacy bills have no buyPrice snapshot on their items: fall back to the product's current buyPrice
        {
            $lookup: {
                from: "products",
                // Items typed straight into a bill have no (or an empty) productId: don't fail on them
                let: { productId: { $convert: { input: "$lines.productId", to: "objectId", onError: null, onNull: null } } },
                pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$productId"] } } }, { $project: { buyPrice: 1 } }],
                as: "productDetails",
            },
        },
        {
            $addFields: {
                product: { $arrayElemAt: ["$productDetails", 0] },
            },
        },
        // The known buy price: the snapshot on the item, else the product's current one. 0 / missing = unknown
        {
            $addFields: {
                knownBuyPrice: { $ifNull: ["$lines.buyPrice", { $ifNull: ["$product.buyPrice", 0] }] },
                lineRevenue: { $multiply: ["$lines.count", "$lines.price", "$ratio"] },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: { date: "$lines.at", timezone: SHOP_TIMEZONE } },
                    month: { $month: { date: "$lines.at", timezone: SHOP_TIMEZONE } },
                    day: { $dayOfMonth: { date: "$lines.at", timezone: SHOP_TIMEZONE } },
                },
                totalRevenue: { $sum: "$lineRevenue" },
                totalCost: {
                    $sum: {
                        $cond: [
                            { $gt: ["$knownBuyPrice", 0] },
                            { $multiply: ["$lines.count", "$knownBuyPrice"] },
                            // Unknown buy price: assume the default profit margin on this line
                            { $multiply: ["$lineRevenue", 1 - DEFAULT_PROFIT_RATE] },
                        ],
                    },
                },
            },
        },
        {
            $addFields: {
                profit: { $subtract: ["$totalRevenue", "$totalCost"] },
            },
        },
        {
            $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
        },
        {
            $project: {
                _id: 0,
                year: "$_id.year",
                month: "$_id.month",
                day: "$_id.day",
                totalRevenue: 1,
                totalCost: 1,
                profit: 1,
            },
        },
    ]);

    return profits;
}

/** Products in stock that were not sold during the last 60 days (and are older than that). */
export async function getDeadStock() {
    await connectDB();

    const since = new Date();
    since.setDate(since.getDate() - 60);

    const soldIds = (await Bill.distinct("items.productId", { deletedAt: null, createdAt: { $gte: since } })) as string[];
    const validIds = soldIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));

    const products = await Product.find(
        { deletedAt: null, count: { $gt: 0 }, createdAt: { $lt: since }, _id: { $nin: validIds } },
        { name: 1, company: 1, location: 1, count: 1, buyPrice: 1 },
    ).lean();

    return products
        .map((p) => ({ _id: p._id.toString(), name: p.name, company: p.company, location: p.location, count: p.count, value: p.count * p.buyPrice }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 20);
}
