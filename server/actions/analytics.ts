import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/server/config/database";
import { Product } from "@/server/models/product";
import { Bill } from "@/server/models/bill";

export async function getLocationCosts() {
    await connectDB();
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const costs = await Product.aggregate([
        { $match: { userId } },
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
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topProducts = await Bill.aggregate([
        {
            $match: {
                userId,
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
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const profits = await Bill.aggregate([
        { $match: { userId } },
        { $unwind: "$items" },
        // Lookup the current buyPrice from the Product collection
        {
            $lookup: {
                from: "products",
                let: { productId: { $toObjectId: "$items.productId" } },
                pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$productId"] } } }, { $project: { buyPrice: 1 } }],
                as: "productDetails",
            },
        },
        {
            $addFields: {
                product: { $arrayElemAt: ["$productDetails", 0] },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                    day: { $dayOfMonth: "$createdAt" },
                },
                totalRevenue: { $sum: { $multiply: ["$items.count", "$items.price"] } },
                totalCost: {
                    $sum: {
                        $multiply: ["$items.count", { $ifNull: ["$product.buyPrice", 0] }],
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
