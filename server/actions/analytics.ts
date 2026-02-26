import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/server/config/database";
import { Product } from "@/server/models/product";
import { Bill } from "@/server/models/bill";

function ownerFilter(userId: string) {
    return { $or: [{ userId }, { developerId: userId }] };
}

export async function getLocationCosts() {
    await connectDB();
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const costs = await Product.aggregate([
        { $match: ownerFilter(userId) },
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
                ...ownerFilter(userId),
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
