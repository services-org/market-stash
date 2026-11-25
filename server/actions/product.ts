import { isValidObjectId } from "mongoose";

import { connectDB } from "@/server/config/database";
import { Product } from "@/server/models/product";
import { AppError } from "@/server/errors";
import { productCreateInput, productUpdateInput, transferInput } from "@/server/validation";

// ─── Helpers ──────────────────────────────────────────────
function assertId(id: string) {
    if (!isValidObjectId(id)) throw new AppError("Product not found", 404);
}

const isDuplicateKey = (error: unknown) => typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;

// ─── Queries ──────────────────────────────────────────────
export async function getProducts(location?: string) {
    await connectDB();

    const filter: Record<string, unknown> = { deletedAt: null };
    if (location) filter.location = location;

    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    return products;
}

export async function getCompanies() {
    await connectDB();

    const companies = await Product.aggregate([
        { $match: { deletedAt: null } },
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

    const products = await Product.find({ company, deletedAt: null }).sort({ createdAt: -1 }).lean();
    return products;
}

export async function getLocations() {
    await connectDB();

    const locations = await Product.distinct("location", { deletedAt: null });
    return locations;
}

/** Products at or below their low-stock threshold (out-of-stock first). */
export async function getLowStockProducts() {
    await connectDB();

    const products = await Product.find({
        deletedAt: null,
        minStock: { $exists: true, $ne: null },
        $expr: { $lte: ["$count", "$minStock"] },
    })
        .sort({ count: 1, company: 1, name: 1 })
        .lean();

    return products;
}

// ─── Mutations ────────────────────────────────────────────
export async function createProduct(body: unknown) {
    await connectDB();
    const data = productCreateInput.parse(body);

    try {
        return await Product.create({ ...data });
    } catch (error) {
        if (isDuplicateKey(error)) throw new AppError("هذا المنتج موجود بالفعل في نفس الموقع");
        throw error;
    }
}

export async function updateProduct(id: string, body: unknown) {
    await connectDB();
    assertId(id);
    const { count, minStock, ...fields } = productUpdateInput.parse(body);

    const setFields: Record<string, unknown> = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
    if (typeof minStock === "number") setFields.minStock = minStock;

    const update: Record<string, unknown> = {};
    if (Object.keys(setFields).length > 0) update.$set = setFields;
    // `minStock: null` switches low-stock tracking off for the product
    if (minStock === null) update.$unset = { minStock: "" };
    if (count) update.$inc = { count };
    if (Object.keys(update).length === 0) {
        const existing = await Product.findOne({ _id: id, deletedAt: null }).lean();
        if (!existing) throw new AppError("Product not found", 404);
        return existing;
    }

    // A negative delta must never take the quantity below zero
    const filter: Record<string, unknown> = { _id: id, deletedAt: null };
    if (count && count < 0) filter.count = { $gte: -count };

    try {
        const product = await Product.findOneAndUpdate(filter, update, { returnDocument: "after" }).lean();
        if (product) return product;
    } catch (error) {
        if (isDuplicateKey(error)) throw new AppError("هذا المنتج موجود بالفعل في نفس الموقع");
        throw error;
    }

    const exists = await Product.exists({ _id: id, deletedAt: null });
    if (!exists) throw new AppError("Product not found", 404);
    throw new AppError("لا يمكن أن تكون الكمية النهائية أقل من 0");
}

/** Soft delete: the product can be restored with `restoreProduct`. */
export async function deleteProduct(id: string) {
    await connectDB();
    assertId(id);

    const product = await Product.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date() } }, { returnDocument: "after" });
    if (!product) throw new AppError("Product not found", 404);
    return product;
}

export async function restoreProduct(id: string) {
    await connectDB();
    assertId(id);

    try {
        const product = await Product.findOneAndUpdate({ _id: id, deletedAt: { $ne: null } }, { $set: { deletedAt: null } }, { returnDocument: "after" });
        if (!product) throw new AppError("Product not found", 404);
        return product;
    } catch (error) {
        if (isDuplicateKey(error)) throw new AppError("يوجد منتج بنفس الاسم والموقع، لا يمكن الاسترجاع");
        throw error;
    }
}

export async function transferProduct(id: string, body: unknown) {
    await connectDB();
    assertId(id);
    const { toLocation, count, sellPrice } = transferInput.parse(body);

    const source = await Product.findOne({ _id: id, deletedAt: null }).lean();
    if (!source) throw new AppError("Product not found", 404);
    if (source.location === toLocation) throw new AppError("يجب أن يكون الموقع الجديد مختلفاً عن الموقع الحالي");

    // 1. Take the quantity from the source (only if it is still available)
    const updatedSource = await Product.findOneAndUpdate({ _id: id, deletedAt: null, count: { $gte: count } }, { $inc: { count: -count } }, { returnDocument: "after" });
    if (!updatedSource) throw new AppError(`الكمية غير كافية (المتاح: ${source.count})`);

    // 2. Add it to the target (created on the fly when it does not exist yet)
    try {
        const update: Record<string, unknown> = {
            $inc: { count },
            $setOnInsert: Object.fromEntries(
                Object.entries({
                    buyPrice: source.buyPrice,
                    barcode: source.barcode,
                    minStock: source.minStock,
                    sellPrice: sellPrice === undefined ? source.sellPrice : undefined,
                }).filter(([, value]) => value !== undefined),
            ),
        };
        if (sellPrice !== undefined) update.$set = { sellPrice };

        const target = await Product.findOneAndUpdate(
            { company: source.company, name: source.name, location: toLocation, deletedAt: null },
            update,
            { upsert: true, returnDocument: "after" },
        );
        return { source: updatedSource, target };
    } catch (error) {
        // Put the quantity back so nothing gets lost
        await Product.updateOne({ _id: id }, { $inc: { count } });
        throw error;
    }
}
