import { isValidObjectId } from "mongoose";

import { connectDB } from "@/server/config/database";
import { Purchase, type TPurchaseItem } from "@/server/models/purchase";
import { Product } from "@/server/models/product";
import { AppError } from "@/server/errors";
import { paymentInput, purchaseInput } from "@/server/validation";

// ─── Queries ──────────────────────────────────────────────
export async function getPurchases() {
    await connectDB();

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    return Purchase.find({ deletedAt: null, createdAt: { $gte: oneYearAgo } })
        .sort({ createdAt: -1 })
        .lean();
}

export async function getPurchase(id: string) {
    await connectDB();
    if (!isValidObjectId(id)) throw new AppError("Purchase not found", 404);

    const purchase = await Purchase.findOne({ _id: id, deletedAt: null }).lean();
    if (!purchase) throw new AppError("Purchase not found", 404);
    return purchase;
}

/** Names of the suppliers used before (for suggestions). */
export async function getSuppliers() {
    await connectDB();

    const rows = await Purchase.aggregate<{ _id: string }>([
        { $match: { deletedAt: null } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: { $trim: { input: "$supplierName" } }, last: { $first: "$createdAt" } } },
        { $sort: { last: -1 } },
        { $limit: 50 },
    ]);
    return rows.map((r) => r._id);
}

// ─── Stock ────────────────────────────────────────────────
/** One entry per product (the same product may be on several lines). */
function groupByProduct(items: TPurchaseItem[]) {
    const map = new Map<string, { count: number; cost: number }>();
    for (const item of items) {
        const row = map.get(item.productId) ?? { count: 0, cost: 0 };
        row.count += item.count;
        row.cost += item.count * item.buyPrice;
        map.set(item.productId, row);
    }
    return map;
}

/** Adds the purchased quantities to stock; the buy price becomes the weighted average of old stock and new goods. */
async function addToStock(items: TPurchaseItem[]) {
    const grouped = groupByProduct(items);
    const ids = [...grouped.keys()];
    if (ids.some((id) => !isValidObjectId(id))) throw new AppError("منتج غير صالح");

    const found = await Product.countDocuments({ _id: { $in: ids }, deletedAt: null });
    if (found !== ids.length) throw new AppError("أحد المنتجات غير موجود");

    await Product.bulkWrite(
        ids.map((id) => {
            const { count, cost } = grouped.get(id)!;
            const newCount = { $add: ["$count", count] };
            return {
                updateOne: {
                    filter: { _id: id },
                    // Aggregation-pipeline update: both fields are computed from the values before the update
                    update: [
                        {
                            $set: {
                                buyPrice: {
                                    $round: [{ $divide: [{ $add: [{ $multiply: [{ $max: ["$count", 0] }, "$buyPrice"] }, cost] }, { $add: [{ $max: ["$count", 0] }, count] }] }, 2],
                                },
                                count: newCount,
                            },
                        },
                    ],
                },
            };
        }),
    );
}

/** Takes the purchased quantities out of stock again (fails if some of it is already sold). */
async function removeFromStock(items: TPurchaseItem[]) {
    const grouped = groupByProduct(items);
    const ids = [...grouped.keys()].filter((id) => isValidObjectId(id));

    const products = await Product.find({ _id: { $in: ids } }, { name: 1, count: 1 }).lean();
    for (const product of products) {
        const need = grouped.get(product._id.toString())!.count;
        if (product.count < need) throw new AppError(`لا يمكن الحذف: "${product.name}" المتاح ${product.count} فقط`);
    }

    await Product.bulkWrite(
        products.map((p) => ({
            updateOne: { filter: { _id: p._id, count: { $gte: grouped.get(p._id.toString())!.count } }, update: { $inc: { count: -grouped.get(p._id.toString())!.count } } },
        })),
    );
}

// ─── Mutations ────────────────────────────────────────────
export async function createPurchase(body: unknown) {
    await connectDB();
    const data = purchaseInput.parse(body);

    const total = data.items.reduce((sum, item) => sum + item.count * item.buyPrice, 0);
    const paid = Math.min(data.paid ?? total, total);

    await addToStock(data.items);

    try {
        return await Purchase.create({ supplierName: data.supplierName, phone: data.phone, notes: data.notes, items: data.items, total, paid });
    } catch (error) {
        await removeFromStock(data.items).catch(() => undefined);
        throw error;
    }
}

/** Soft delete: the goods leave the stock again. The buy price is not reverted. */
export async function deletePurchase(id: string) {
    await connectDB();
    if (!isValidObjectId(id)) throw new AppError("Purchase not found", 404);

    const purchase = await Purchase.findOne({ _id: id, deletedAt: null });
    if (!purchase) throw new AppError("Purchase not found", 404);

    await removeFromStock(purchase.items);
    purchase.deletedAt = new Date();
    await purchase.save();
    return purchase;
}

export async function restorePurchase(id: string) {
    await connectDB();
    if (!isValidObjectId(id)) throw new AppError("Purchase not found", 404);

    const purchase = await Purchase.findOne({ _id: id, deletedAt: { $ne: null } });
    if (!purchase) throw new AppError("Purchase not found", 404);

    await addToStock(purchase.items);
    purchase.deletedAt = null;
    await purchase.save();
    return purchase;
}

/** A payment to the supplier. */
export async function addPurchasePayment(id: string, body: unknown) {
    await connectDB();
    const { amount } = paymentInput.parse(body);
    if (!isValidObjectId(id)) throw new AppError("Purchase not found", 404);

    const purchase = await Purchase.findOne({ _id: id, deletedAt: null });
    if (!purchase) throw new AppError("Purchase not found", 404);

    const remaining = Math.max(0, purchase.total - purchase.paid);
    if (amount > remaining) throw new AppError(`المبلغ أكبر من المتبقي (${remaining})`);

    purchase.paid += amount;
    purchase.payments = [...(purchase.payments ?? []), { amount, at: new Date() }];
    await purchase.save();
    return purchase;
}
