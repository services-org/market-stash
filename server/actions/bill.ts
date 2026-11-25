import { isValidObjectId } from "mongoose";

import { connectDB } from "@/server/config/database";
import { Bill, type TBillItem, type TBillReturn } from "@/server/models/bill";
import { billRemaining, billPaid } from "@/lib/bill";
import { Product } from "@/server/models/product";
import { Counter, nextSequence } from "@/server/models/counter";
import { getUserId } from "@/server/actions/product";
import { AppError } from "@/server/errors";
import { billInput, paymentInput, returnInput, type TBillInput } from "@/server/validation";

// ─── Invoice numbers ──────────────────────────────────────
const numbered = new Set<string>();

/**
 * Gives every bill that has no invoice number one (oldest first) and moves the counter past them.
 * Idempotent and safe to run concurrently: a bill is only numbered if it still has no number, and the
 * numbers are reserved from the counter atomically. Runs once per server process and user.
 */
export async function ensureBillNumbers(userId: string) {
    if (numbered.has(userId)) return;

    const missing = await Bill.find({ userId, number: { $exists: false } }, { _id: 1 }).sort({ createdAt: 1 }).lean();
    if (missing.length > 0) {
        const top = await Bill.findOne({ userId, number: { $exists: true } }, { number: 1 }).sort({ number: -1 }).lean();
        await Counter.updateOne({ userId, key: "bill" }, { $max: { seq: top?.number ?? 0 } }, { upsert: true });
        const counter = await Counter.findOneAndUpdate({ userId, key: "bill" }, { $inc: { seq: missing.length } }, { returnDocument: "after" });
        const first = (counter?.seq ?? missing.length) - missing.length + 1;

        await Bill.bulkWrite(
            missing.map((bill, i) => ({
                updateOne: { filter: { _id: bill._id, number: { $exists: false } }, update: { $set: { number: first + i } } },
            })),
        );
    }

    numbered.add(userId);
}

// ─── Queries ──────────────────────────────────────────────
export async function getBills() {
    await connectDB();
    const userId = await getUserId();
    await ensureBillNumbers(userId);

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const bills = await Bill.find(
        { userId, deletedAt: null, createdAt: { $gte: oneYearAgo } },
        { number: 1, customerName: 1, phone: 1, total: 1, discount: 1, paid: 1, returns: 1, items: 1, createdAt: 1 },
    )
        .sort({ createdAt: -1 })
        .lean();

    return bills;
}

export async function getBill(id: string) {
    await connectDB();
    const userId = await getUserId();
    await ensureBillNumbers(userId);
    if (!isValidObjectId(id)) throw new AppError("Bill not found", 404);

    const bill = await Bill.findOne({ _id: id, userId, deletedAt: null }).lean();
    if (!bill) throw new AppError("Bill not found", 404);
    return bill;
}

/** Distinct representatives used in previous bills, most recent first. */
export async function getRepresentatives() {
    await connectDB();
    const userId = await getUserId();

    const rows = await Bill.aggregate<{ _id: string }>([
        { $match: { userId, deletedAt: null, representative: { $nin: [null, ""] } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: "$representative", last: { $first: "$createdAt" } } },
        { $sort: { last: -1 } },
        { $limit: 50 },
    ]);
    return rows.map((r) => r._id);
}

// ─── Stock helpers ────────────────────────────────────────
function sumByProduct(items: TBillItem[]) {
    const map = new Map<string, number>();
    for (const item of items) {
        if (!item.productId) continue;
        map.set(item.productId, (map.get(item.productId) ?? 0) + item.count);
    }
    return map;
}

/**
 * Moves the stock from `oldItems` to `newItems` in one go: everything is validated first and
 * only then is the net difference per product written, so a failed validation never leaves
 * the stock half-changed.
 *   create  → applyStockChange(userId, [], items)
 *   delete  → applyStockChange(userId, items, [])
 *   update  → applyStockChange(userId, oldItems, newItems)
 */
async function applyStockChange(userId: string, oldItems: TBillItem[], newItems: TBillItem[]) {
    const oldMap = sumByProduct(oldItems);
    const newMap = sumByProduct(newItems);
    const ids = [...new Set([...oldMap.keys(), ...newMap.keys()])];
    if (ids.length === 0) return;

    if (ids.some((id) => !isValidObjectId(id))) throw new AppError("منتج غير صالح");

    const products = await Product.find({ _id: { $in: ids }, userId }).lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // Validate everything before any write
    for (const item of newItems) {
        if (!item.productId) continue;
        const product = productMap.get(item.productId);
        if (!product || product.deletedAt) throw new AppError(`المنتج "${item.name}" غير موجود`);
        if (product.location !== item.location) throw new AppError(`المنتج "${item.name}" غير موجود في "${item.location}"`);
    }
    for (const [id, wanted] of newMap) {
        const product = productMap.get(id)!;
        const available = product.count + (oldMap.get(id) ?? 0);
        if (available < wanted) throw new AppError(`الكمية غير كافية للمنتج "${product.name}" (المتاح: ${available})`);
    }

    const ops = ids
        .map((id) => ({ id, delta: (oldMap.get(id) ?? 0) - (newMap.get(id) ?? 0) }))
        .filter(({ id, delta }) => delta !== 0 && productMap.has(id))
        .map(({ id, delta }) => ({ updateOne: { filter: { _id: id, userId }, update: { $inc: { count: delta } } } }));

    if (ops.length > 0) await Product.bulkWrite(ops);
}

const returnKey = (item: { productId?: string; name: string; price: number }) => `${item.productId ?? ""}|${item.name}|${item.price}`;

/** Items in stock terms: what was sold minus what came back. */
function netItems(items: TBillItem[], returns: TBillReturn[] = []): TBillItem[] {
    const back = new Map<string, number>();
    for (const r of returns) back.set(returnKey(r), (back.get(returnKey(r)) ?? 0) + r.count);

    return items
        .map((item) => {
            const key = returnKey(item);
            const give = Math.min(item.count, back.get(key) ?? 0);
            back.set(key, (back.get(key) ?? 0) - give);
            // (explicit fields: spreading a mongoose subdocument would copy its internals instead of its data)
            return { productId: item.productId, name: item.name, price: item.price, buyPrice: item.buyPrice, location: item.location, count: item.count - give };
        })
        .filter((item) => item.count > 0);
}

// ─── Normalisation ────────────────────────────────────────
/** Builds the items to store, snapshotting the buy price of every stock product. */
async function buildItems(userId: string, input: TBillInput["items"], previous: TBillItem[] = []): Promise<TBillItem[]> {
    const ids = [...new Set(input.map((i) => i.productId).filter((id): id is string => !!id))];
    if (ids.some((id) => !isValidObjectId(id))) throw new AppError("منتج غير صالح");

    const products = ids.length ? await Product.find({ _id: { $in: ids }, userId }, { buyPrice: 1 }).lean() : [];
    const buyPrices = new Map(products.map((p) => [p._id.toString(), p.buyPrice]));
    const previousBuyPrices = new Map(previous.filter((p) => p.productId && p.buyPrice !== undefined).map((p) => [p.productId!, p.buyPrice!]));

    return input.map((item) => {
        if (!item.productId) return { name: item.name, count: item.count, price: item.price };
        return {
            productId: item.productId,
            name: item.name,
            count: item.count,
            price: item.price,
            location: item.location,
            buyPrice: previousBuyPrices.get(item.productId) ?? buyPrices.get(item.productId),
        };
    });
}

function calcMoney(data: TBillInput, items: TBillItem[]) {
    const total = items.reduce((sum, item) => sum + item.price * item.count, 0);
    const discount = Math.min(data.discount ?? 0, total);
    const net = total - discount;
    const paid = Math.min(data.paid ?? net, net);
    return { total, discount, paid };
}

// ─── Mutations ────────────────────────────────────────────
export async function createBill(body: unknown) {
    await connectDB();
    const userId = await getUserId();
    const data = billInput.parse(body);
    await ensureBillNumbers(userId);

    const items = await buildItems(userId, data.items);
    await applyStockChange(userId, [], items);

    try {
        const number = await nextSequence(userId, "bill");
        const { total, discount, paid } = calcMoney(data, items);
        return await Bill.create({
            userId,
            number,
            customerName: data.customerName,
            phone: data.phone,
            address: data.address,
            deliveryDate: data.deliveryDate,
            representative: data.representative,
            notes: data.notes,
            items,
            total,
            discount,
            paid,
        });
    } catch (error) {
        // Put the stock back if the bill could not be saved
        await applyStockChange(userId, items, []);
        throw error;
    }
}

export async function updateBill(id: string, body: unknown) {
    await connectDB();
    const userId = await getUserId();
    const data = billInput.parse(body);
    if (!isValidObjectId(id)) throw new AppError("Bill not found", 404);

    const existingBill = await Bill.findOne({ _id: id, userId, deletedAt: null });
    if (!existingBill) throw new AppError("Bill not found", 404);
    if (existingBill.returns?.length) throw new AppError("لا يمكن تعديل فاتورة بها مرتجعات");

    const items = await buildItems(userId, data.items, existingBill.items);
    await applyStockChange(userId, existingBill.items, items);

    const { total, discount, paid } = calcMoney(data, items);
    existingBill.customerName = data.customerName;
    existingBill.phone = data.phone;
    existingBill.address = data.address;
    existingBill.deliveryDate = data.deliveryDate;
    existingBill.representative = data.representative;
    existingBill.notes = data.notes;
    existingBill.items = items;
    existingBill.total = total;
    existingBill.discount = discount;
    existingBill.paid = paid;

    await existingBill.save();
    return existingBill;
}

/** Soft delete: the quantities go back to stock and the bill can be restored. */
export async function deleteBill(id: string) {
    await connectDB();
    const userId = await getUserId();
    if (!isValidObjectId(id)) throw new AppError("Bill not found", 404);

    const bill = await Bill.findOne({ _id: id, userId, deletedAt: null });
    if (!bill) throw new AppError("Bill not found", 404);

    await applyStockChange(userId, netItems(bill.items, bill.returns), []);
    bill.deletedAt = new Date();
    await bill.save();

    return bill;
}

export async function restoreBill(id: string) {
    await connectDB();
    const userId = await getUserId();
    if (!isValidObjectId(id)) throw new AppError("Bill not found", 404);

    const bill = await Bill.findOne({ _id: id, userId, deletedAt: { $ne: null } });
    if (!bill) throw new AppError("Bill not found", 404);

    await applyStockChange(userId, [], netItems(bill.items, bill.returns));
    bill.deletedAt = null;
    await bill.save();

    return bill;
}

export async function addPayment(id: string, body: unknown) {
    await connectDB();
    const userId = await getUserId();
    const { amount } = paymentInput.parse(body);
    if (!isValidObjectId(id)) throw new AppError("Bill not found", 404);

    const bill = await Bill.findOne({ _id: id, userId, deletedAt: null });
    if (!bill) throw new AppError("Bill not found", 404);

    const remaining = billRemaining(bill);
    if (amount > remaining) throw new AppError(`المبلغ أكبر من المتبقي (${remaining})`);

    bill.paid = billPaid(bill) + amount;
    bill.payments = [...(bill.payments ?? []), { amount, at: new Date() }];
    await bill.save();
    return bill;
}

/** The customer gives goods back: stock goes up and the bill (and what the customer owes) goes down. */
export async function returnItems(id: string, body: unknown) {
    await connectDB();
    const userId = await getUserId();
    const data = returnInput.parse(body);
    if (!isValidObjectId(id)) throw new AppError("Bill not found", 404);

    const bill = await Bill.findOne({ _id: id, userId, deletedAt: null });
    if (!bill) throw new AppError("Bill not found", 404);

    // What can still be returned per product line
    const available = new Map<string, number>();
    for (const item of bill.items) available.set(returnKey(item), (available.get(returnKey(item)) ?? 0) + item.count);
    for (const r of bill.returns ?? []) available.set(returnKey(r), (available.get(returnKey(r)) ?? 0) - r.count);

    const now = new Date();
    const added: TBillReturn[] = [];
    for (const { index, count } of data.items) {
        const item = bill.items[index];
        if (!item) throw new AppError("صنف غير موجود في الفاتورة");

        const key = returnKey(item);
        const left = available.get(key) ?? 0;
        if (count > left) throw new AppError(`الكمية المرتجعة من "${item.name}" أكبر من المتاح (${left})`);
        available.set(key, left - count);

        added.push({ productId: item.productId, name: item.name, count, price: item.price, buyPrice: item.buyPrice, location: item.location, at: now });
    }

    const stockOps = (sign: 1 | -1) =>
        added
            .filter((r) => r.productId && isValidObjectId(r.productId))
            .map((r) => ({ updateOne: { filter: { _id: r.productId, userId, deletedAt: null }, update: { $inc: { count: sign * r.count } } } }));

    const restore = stockOps(1);
    if (restore.length > 0) await Product.bulkWrite(restore);

    try {
        bill.returns = [...(bill.returns ?? []), ...added];
        bill.paid = billPaid(bill); // anything paid above the new net amount is handed back in cash
        await bill.save();
    } catch (error) {
        const undo = stockOps(-1);
        if (undo.length > 0) await Product.bulkWrite(undo);
        throw error;
    }

    return bill;
}

/** The customer pays a lump sum: it settles his unpaid bills, oldest first. */
export async function collectFromCustomer(name: string, body: unknown) {
    await connectDB();
    const userId = await getUserId();
    const { amount } = paymentInput.parse(body);

    const bills = await Bill.find({ userId, deletedAt: null, $expr: { $eq: [{ $trim: { input: "$customerName" } }, name.trim()] } }).sort({ createdAt: 1 });
    const open = bills.filter((bill) => billRemaining(bill) > 0);
    const owed = open.reduce((sum, bill) => sum + billRemaining(bill), 0);
    if (amount > owed) throw new AppError(`المبلغ أكبر من المديونية (${owed})`);

    let left = amount;
    const applied: { number?: number; amount: number }[] = [];
    for (const bill of open) {
        if (left <= 0) break;
        const take = Math.min(left, billRemaining(bill));
        bill.paid = billPaid(bill) + take;
        bill.payments = [...(bill.payments ?? []), { amount: take, at: new Date() }];
        await bill.save();
        applied.push({ number: bill.number, amount: take });
        left -= take;
    }

    return { applied, owedAfter: owed - amount };
}
