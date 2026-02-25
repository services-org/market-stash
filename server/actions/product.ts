import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/server/config/database";
import { Product } from "@/server/models/product";

// ─── Helpers ──────────────────────────────────────────────
export async function getUserId() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    return userId;
}

function ownerFilter(userId: string) {
    return { $or: [{ userId }, { developerId: userId }] };
}

// ─── Queries ──────────────────────────────────────────────
export async function getProducts(location?: string) {
    await connectDB();
    const userId = await getUserId();

    const filter: Record<string, unknown> = { ...ownerFilter(userId) };
    if (location) filter.location = location;

    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    return products;
}

export async function getCompanies() {
    await connectDB();
    const userId = await getUserId();

    const companies = await Product.aggregate([
        { $match: ownerFilter(userId) },
        {
            $group: {
                _id: "$company",
                productCount: { $sum: 1 },
                totalValue: { $sum: { $multiply: ["$sellPrice", "$count"] } },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    return companies;
}

export async function getCompanyProducts(company: string) {
    await connectDB();
    const userId = await getUserId();

    const products = await Product.find({ ...ownerFilter(userId), company })
        .sort({ createdAt: -1 })
        .lean();
    return products;
}

export async function getLocations() {
    await connectDB();
    const userId = await getUserId();

    const locations = await Product.distinct("location", ownerFilter(userId));
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

export async function updateProduct(id: string, data: { buyPrice?: number; sellPrice?: number; count?: number }) {
    await connectDB();
    const userId = await getUserId();

    const product = await Product.findOneAndUpdate({ _id: id, ...ownerFilter(userId) }, data, { new: true }).lean();
    if (!product) throw new Error("Product not found");
    return product;
}

export async function deleteProduct(id: string) {
    await connectDB();
    const userId = await getUserId();

    const product = await Product.findOneAndDelete({ _id: id, ...ownerFilter(userId) });
    if (!product) throw new Error("Product not found");
    return product;
}
