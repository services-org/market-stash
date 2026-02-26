import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/server/config/database";
import { Product } from "@/server/models/product";

// ─── Helpers ──────────────────────────────────────────────
export async function getUserId() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    return userId;
}

// ─── Queries ──────────────────────────────────────────────
export async function getProducts(location?: string) {
    await connectDB();
    const userId = await getUserId();

    const filter: Record<string, unknown> = { userId };
    if (location) filter.location = location;

    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    return products;
}

export async function getCompanies() {
    await connectDB();
    const userId = await getUserId();

    const companies = await Product.aggregate([
        { $match: { userId } },
        {
            $group: {
                _id: "$company",
                productCount: { $sum: 1 },
                totalValue: { $sum: { $multiply: ["$buyPrice", "$count"] } },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    return companies;
}

export async function getCompanyProducts(company: string) {
    await connectDB();
    const userId = await getUserId();

    const products = await Product.find({ userId, company }).sort({ createdAt: -1 }).lean();
    return products;
}

export async function getLocations() {
    await connectDB();
    const userId = await getUserId();

    const locations = await Product.distinct("location", { userId });
    return locations;
}

// ─── Mutations ────────────────────────────────────────────
type CreateProductInput = {
    name: string;
    company: string;
    buyPrice: number;
    sellPrice: number;
    count: number;
    location: string;
};

export async function createProduct(data: CreateProductInput) {
    await connectDB();
    const userId = await getUserId();

    const product = await Product.create({ ...data, userId });
    return product;
}

export async function updateProduct(id: string, data: { name?: string; buyPrice?: number; sellPrice?: number; count?: number }) {
    await connectDB();
    const userId = await getUserId();

    const { count, ...setFields } = data;
    const updateQuery = count !== undefined ? { $set: setFields, $inc: { count } } : { $set: setFields };

    const product = await Product.findOneAndUpdate({ _id: id, userId }, updateQuery, { new: true }).lean();
    if (!product) throw new Error("Product not found");
    return product;
}

export async function deleteProduct(id: string) {
    await connectDB();
    const userId = await getUserId();

    const product = await Product.findOneAndDelete({ _id: id, userId });
    if (!product) throw new Error("Product not found");
    return product;
}

export async function transferProduct(id: string, toLocation: string, count: number, sellPrice?: number) {
    await connectDB();
    const userId = await getUserId();

    const sourceProduct = await Product.findOne({ _id: id, userId });
    if (!sourceProduct) throw new Error("Source product not found");

    if (sourceProduct.count < count) throw new Error("Insufficient quantity in source location");
    if (count <= 0) throw new Error("Count must be greater than zero");
    if (sourceProduct.location === toLocation) throw new Error("Source and target locations must be different");

    // Start a transaction if replica set is running, but mongoose `.session()` can be complex for simple setups.
    // We'll proceed with sequential updates.

    // 1. Decrement source product
    sourceProduct.count -= count;
    await sourceProduct.save();

    // 2. Find or Create target product
    const existingTargetProduct = await Product.findOne({
        userId,
        company: sourceProduct.company,
        name: sourceProduct.name,
        location: toLocation,
    });

    if (existingTargetProduct) {
        // Update existing Target
        existingTargetProduct.count += count;
        if (sellPrice !== undefined) {
            existingTargetProduct.sellPrice = sellPrice;
        }
        await existingTargetProduct.save();
        return { source: sourceProduct, target: existingTargetProduct };
    } else {
        // Create new Target
        const newProductData = {
            userId,
            company: sourceProduct.company,
            name: sourceProduct.name,
            buyPrice: sourceProduct.buyPrice,
            sellPrice: sellPrice ?? sourceProduct.sellPrice,
            count: count,
            location: toLocation,
        };
        const newTargetProduct = await Product.create(newProductData);
        return { source: sourceProduct, target: newTargetProduct };
    }
}
