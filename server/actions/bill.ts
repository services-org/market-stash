import { connectDB } from "@/server/config/database";
import { Bill, type TBillItem } from "@/server/models/bill";
import { Product } from "@/server/models/product";
import { getUserId } from "@/server/actions/product";

// ─── Queries ──────────────────────────────────────────────
export async function getBills() {
    await connectDB();
    const userId = await getUserId();

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const bills = await Bill.find({ userId, createdAt: { $gte: oneYearAgo } }, { customerName: 1, total: 1, items: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .lean();

    return bills;
}

export async function getBill(id: string) {
    await connectDB();
    const userId = await getUserId();

    const bill = await Bill.findOne({ _id: id, userId }).lean();
    if (!bill) throw new Error("Bill not found");
    return bill;
}

// ─── Stock helpers ────────────────────────────────────────
async function validateAndSubtractStock(userId: string, items: TBillItem[]) {
    const dbItems = items.filter((item) => item.productId);
    if (dbItems.length === 0) return;

    const productIds = dbItems.map((item) => item.productId as string);
    const products = await Product.find({ _id: { $in: productIds }, userId }).lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // Validate all items first before any writes
    for (const item of dbItems) {
        const product = productMap.get(item.productId!);
        if (!product) throw new Error(`المنتج "${item.name}" غير موجود`);
        if (product.location !== item.location) throw new Error(`المنتج "${item.name}" غير موجود في "${item.location}"`);
        if (product.count < item.count) throw new Error(`الكمية غير كافية للمنتج "${item.name}" (المتاح: ${product.count})`);
    }

    // Batch update all products at once
    await Product.bulkWrite(
        dbItems.map((item) => ({
            updateOne: {
                filter: { _id: item.productId },
                update: { $inc: { count: -item.count } },
            },
        })),
    );
}

async function restoreStock(userId: string, items: TBillItem[]) {
    const dbItems = items.filter((item) => item.productId);
    if (dbItems.length === 0) return;

    await Product.bulkWrite(
        dbItems.map((item) => ({
            updateOne: {
                filter: { _id: item.productId, userId },
                update: { $inc: { count: item.count } },
            },
        })),
    );
}

// ─── Mutations ────────────────────────────────────────────
type CreateBillInput = {
    customerName: string;
    items: TBillItem[];
};

export async function createBill(data: CreateBillInput) {
    await connectDB();
    const userId = await getUserId();

    await validateAndSubtractStock(userId, data.items);

    const total = data.items.reduce((sum, item) => sum + item.price * item.count, 0);
    const bill = await Bill.create({ ...data, userId, total });
    return bill;
}

export async function updateBill(id: string, data: CreateBillInput) {
    await connectDB();
    const userId = await getUserId();

    const existingBill = await Bill.findOne({ _id: id, userId });
    if (!existingBill) throw new Error("Bill not found");

    // Restore old stock, then subtract new stock
    await restoreStock(userId, existingBill.items);
    await validateAndSubtractStock(userId, data.items);

    const total = data.items.reduce((sum, item) => sum + item.price * item.count, 0);
    existingBill.customerName = data.customerName;
    existingBill.items = data.items;
    existingBill.total = total;

    await existingBill.save();
    return existingBill;
}

export async function deleteBill(id: string) {
    await connectDB();
    const userId = await getUserId();

    const bill = await Bill.findOne({ _id: id, userId });
    if (!bill) throw new Error("Bill not found");

    await restoreStock(userId, bill.items);
    await bill.deleteOne();

    return bill;
}
