// Temporary integration test for the server actions against the LOCAL database.
// Uses a throw-away user id and removes everything it creates.
import { afterAll, beforeAll, expect, mock, test } from "bun:test";

// Safety: this test writes (and deletes) data, so it refuses to run against anything but a local database.
// bun loads .env first; override it explicitly:  DATABASE_URI=mongodb://127.0.0.1:27017/abo-roqia-store bun run test
const dbUri = process.env.DATABASE_URI || process.env.DATABASE_URL || "";
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)[:/]/.test(dbUri)) {
    throw new Error("Refusing to run: DATABASE_URI must point to a local MongoDB (mongodb://127.0.0.1...)");
}

const USER = "test_user_integration_only";
mock.module("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: USER }) }));

const { connectDB } = await import("../server/config/database");
const { Product } = await import("../server/models/product");
const { Bill } = await import("../server/models/bill");
const { Counter } = await import("../server/models/counter");
const bills = await import("../server/actions/bill");
const prods = await import("../server/actions/product");
const customers = await import("../server/actions/customer");
const exp = await import("../server/actions/export");
const analytics = await import("../server/actions/analytics");
const purchasesApi = await import("../server/actions/purchase");
const expensesApi = await import("../server/actions/expense");
const reports = await import("../server/actions/report");
const { Purchase } = await import("../server/models/purchase");
const { Expense } = await import("../server/models/expense");

async function fails(promise: Promise<unknown>, text = "") {
    let message: string | undefined;
    try {
        await promise;
    } catch (error) {
        message = (error as Error).message;
    }
    expect(message).toBeDefined();
    expect(message).toContain(text);
}

async function clean() {
    await Product.deleteMany({ userId: USER });
    await Bill.deleteMany({ userId: USER });
    await Counter.deleteMany({ userId: USER });
    await Purchase.deleteMany({ userId: USER });
    await Expense.deleteMany({ userId: USER });
}

beforeAll(async () => {
    await connectDB();
    await clean();
    await Product.syncIndexes();
});
afterAll(clean);

const count = async (id: string) => (await Product.findById(id).lean())!.count;

test("full flow", async () => {
    const a = await prods.createProduct({ name: "A", company: "C", buyPrice: 10, sellPrice: 15, count: 10, location: "المحل", minStock: 5 });
    const b = await prods.createProduct({ name: "B", company: "C", buyPrice: 20, sellPrice: 30, count: 5, location: "المحل" });
    const A = String(a._id);
    const B = String(b._id);

    // duplicate + validation
    await fails(prods.createProduct({ name: "A", company: "C", buyPrice: 1, sellPrice: 1, count: 1, location: "المحل" }), "موجود بالفعل");
    await fails(prods.createProduct({ name: "X", company: "C", buyPrice: -1, sellPrice: 1, count: 1, location: "المحل" }));

    // create bill: stock subtracted, number, snapshot, paid defaults
    const bill = await bills.createBill({
        customerName: " عميل ",
        phone: "01000000000",
        discount: 10,
        paid: 50,
        items: [
            { productId: A, name: "C - A", count: 4, price: 15, location: "المحل" },
            { name: "خارجي", count: 1, price: 40 },
        ],
    });
    expect(bill.number).toBe(1);
    expect(bill.customerName).toBe("عميل");
    expect(bill.total).toBe(100);
    expect(bill.paid).toBe(50);
    expect(bill.items[0].buyPrice).toBe(10);
    expect(await count(A)).toBe(6);

    // insufficient stock: nothing changes, no bill
    await fails(bills.createBill({ customerName: "x", items: [{ productId: A, name: "n", count: 7, price: 1, location: "المحل" }] }), "الكمية غير كافية");
    expect(await count(A)).toBe(6);
    expect(await Bill.countDocuments({ userId: USER })).toBe(1);

    // negative count rejected
    await fails(bills.createBill({ customerName: "x", items: [{ productId: A, name: "n", count: -3, price: 1, location: "المحل" }] }));

    // update that fails validation must NOT touch stock (the old bug)
    await fails(bills.updateBill(String(bill._id), { customerName: "عميل", items: [{ productId: A, name: "n", count: 11, price: 1, location: "المحل" }] }), "الكمية غير كافية");
    expect(await count(A)).toBe(6);

    // valid update: 4 -> 9 of A (+5 more) and add B
    await prods.updateProduct(B, { sellPrice: 99 });
    const updated = await bills.updateBill(String(bill._id), {
        customerName: "عميل",
        paid: 50,
        items: [
            { productId: A, name: "C - A", count: 9, price: 15, location: "المحل" },
            { productId: B, name: "C - B", count: 2, price: 30, location: "المحل" },
        ],
    });
    expect(await count(A)).toBe(1);
    expect(await count(B)).toBe(3);
    expect(updated.items[0].buyPrice).toBe(10); // snapshot preserved
    expect(updated.number).toBe(1);

    // payments
    const withPayment = await bills.addPayment(String(bill._id), { amount: 20 });
    expect(withPayment.paid).toBe(updated.paid! + 20);
    await fails(bills.addPayment(String(bill._id), { amount: 99999 }), "أكبر من المتبقي");

    // soft delete + restore
    await bills.deleteBill(String(bill._id));
    expect(await count(A)).toBe(10);
    expect((await bills.getBills()).length).toBe(0);
    await bills.restoreBill(String(bill._id));
    expect(await count(A)).toBe(1);
    expect((await bills.getBills()).length).toBe(1);

    // customers + representatives + export + analytics run without errors
    const list = await customers.getCustomers();
    expect(list[0]._id).toBe("عميل");
    expect(list[0].billsCount).toBe(1);
    expect(list[0].phone === undefined || list[0].phone === null).toBe(true); // phone was dropped by the update (no phone sent)
    expect((await exp.exportBillsCsv()).startsWith("﻿")).toBe(true);
    expect((await exp.exportProductsCsv()).includes("C")).toBe(true);
    await analytics.getYearlyMonthlyProfits();
    await analytics.getDeadStock();
    await analytics.getLocationCosts();
    await analytics.getTopSoldProducts();

    // low stock
    const low = await prods.getLowStockProducts();
    expect(low.map((p) => p.name)).toContain("A");
    // opt-in: B has no alert level, so it is never "low" even when empty
    expect(low.map((p) => p.name)).not.toContain("B");
    await prods.updateProduct(A, { minStock: null });
    expect((await prods.getLowStockProducts()).map((p) => p.name)).not.toContain("A");

    // transfer: atomic decrement, target upserted, insufficient rejected
    const t = await prods.transferProduct(B, { toLocation: "مخزن 1", count: 2, sellPrice: 50 });
    expect(t.source.count).toBe(1);
    expect(t.target.count).toBe(2);
    expect(t.target.sellPrice).toBe(50);
    expect(t.target.buyPrice).toBe(20);
    await fails(prods.transferProduct(B, { toLocation: "مخزن 1", count: 5 }), "الكمية غير كافية");
    const t2 = await prods.transferProduct(B, { toLocation: "مخزن 1", count: 1 });
    expect(t2.target.count).toBe(3);

    // product count delta must not go below zero
    await fails(prods.updateProduct(B, { count: -5 }), "أقل من 0");
    await prods.updateProduct(B, { count: 4 });
    expect(await count(B)).toBe(4);

    // product soft delete / restore, and re-adding after delete
    await prods.deleteProduct(B);
    expect((await prods.getProducts()).map((p) => String(p._id))).not.toContain(B);
    const again = await prods.createProduct({ name: "B", company: "C", buyPrice: 1, sellPrice: 2, count: 1, location: "المحل" });
    expect(String(again._id)).not.toBe(B);
    await fails(prods.restoreProduct(B), "بنفس الاسم");

    // profit: items typed straight into a bill (no buy price known) assume the default 5% margin
    const sum = (rows: { totalRevenue: number; profit: number }[]) => ({
        revenue: rows.reduce((s, r) => s + r.totalRevenue, 0),
        profit: rows.reduce((s, r) => s + r.profit, 0),
    });
    const before = sum(await analytics.getYearlyMonthlyProfits());
    await bills.createBill({ customerName: "ربح افتراضي", items: [{ name: "صنف خارجي", count: 2, price: 100 }] });
    const after = sum(await analytics.getYearlyMonthlyProfits());
    expect(after.revenue - before.revenue).toBeCloseTo(200);
    expect(after.profit - before.profit).toBeCloseTo(10); // 5% of 200

    // ── legacy bills (no number) get numbers, oldest first, continuing after the highest existing one ──
    const OLD = "test_user_legacy_numbers";
    const old = (name: string, date: string, extra = {}) => ({ userId: OLD, customerName: name, items: [{ name: "x", count: 1, price: 10 }], total: 10, createdAt: new Date(date), updatedAt: new Date(), deletedAt: null, ...extra });
    await Bill.deleteMany({ userId: OLD });
    await Counter.deleteMany({ userId: OLD });
    await Bill.collection.insertMany([old("ج", "2025-03-01"), old("أ", "2025-01-01"), old("ب", "2025-02-01"), old("موجود", "2025-04-01", { number: 7 })]);
    await bills.ensureBillNumbers(OLD);
    await bills.ensureBillNumbers(OLD); // second call is a no-op
    const numbered = await Bill.find({ userId: OLD }).sort({ number: 1 }).lean();
    expect(numbered.map((b) => [b.customerName, b.number])).toEqual([["موجود", 7], ["أ", 8], ["ب", 9], ["ج", 10]]);
    expect((await Counter.findOne({ userId: OLD, key: "bill" }).lean())!.seq).toBe(10);
    await Bill.deleteMany({ userId: OLD });
    await Counter.deleteMany({ userId: OLD });

    // ── returns ──
    const R = await prods.createProduct({ name: "R", company: "C", buyPrice: 10, sellPrice: 20, count: 10, location: "المحل" });
    const rid = String(R._id);
    const rbill = await bills.createBill({ customerName: "مرتجع", paid: 100, items: [{ productId: rid, name: "C - R", count: 5, price: 20, location: "المحل" }] });
    expect(await count(rid)).toBe(5);
    await fails(bills.returnItems(String(rbill._id), { items: [{ index: 0, count: 6 }] }), "أكبر من المتاح");
    const afterReturn = await bills.returnItems(String(rbill._id), { items: [{ index: 0, count: 2 }] });
    expect(await count(rid)).toBe(7); // stock restored
    expect(afterReturn.paid).toBe(60); // net is 60 now, the extra 40 is handed back in cash
    await fails(bills.returnItems(String(rbill._id), { items: [{ index: 0, count: 4 }] }), "أكبر من المتاح"); // only 3 left to return
    await fails(bills.updateBill(String(rbill._id), { customerName: "مرتجع", items: [{ productId: rid, name: "C - R", count: 1, price: 20, location: "المحل" }] }), "مرتجعات");
    // delete puts back only what is still with the customer (3), not the returned 2 again
    await bills.deleteBill(String(rbill._id));
    expect(await count(rid)).toBe(10);
    await bills.restoreBill(String(rbill._id));
    expect(await count(rid)).toBe(7);

    // ── collecting a lump sum settles the oldest bills first ──
    const c1 = await bills.createBill({ customerName: "محصل", paid: 0, items: [{ name: "a", count: 1, price: 100 }] });
    const c2 = await bills.createBill({ customerName: "محصل", paid: 0, items: [{ name: "b", count: 1, price: 50 }] });
    await fails(bills.collectFromCustomer("محصل", { amount: 151 }), "أكبر من المديونية");
    const collected = await bills.collectFromCustomer("محصل", { amount: 120 });
    expect(collected.owedAfter).toBe(30);
    expect((await Bill.findById(c1._id).lean())!.paid).toBe(100);
    expect((await Bill.findById(c2._id).lean())!.paid).toBe(20);

    // ── purchases: stock up, weighted-average buy price, delete only when not sold ──
    const P = await prods.createProduct({ name: "P", company: "C", buyPrice: 10, sellPrice: 15, count: 10, location: "المحل" });
    const pid = String(P._id);
    const purchase = await purchasesApi.createPurchase({ supplierName: " مورد ", paid: 100, items: [{ productId: pid, name: "C - P", count: 10, buyPrice: 20 }] });
    expect(purchase.supplierName).toBe("مورد");
    expect(purchase.total).toBe(200);
    const afterPurchase = (await Product.findById(pid).lean())!;
    expect(afterPurchase.count).toBe(20);
    expect(afterPurchase.buyPrice).toBe(15); // (10*10 + 10*20) / 20
    await fails(purchasesApi.createPurchase({ supplierName: "x", items: [{ productId: "000000000000000000000000", name: "n", count: 1, buyPrice: 1 }] }), "غير موجود");
    const paidMore = await purchasesApi.addPurchasePayment(String(purchase._id), { amount: 50 });
    expect(paidMore.paid).toBe(150);
    await fails(purchasesApi.addPurchasePayment(String(purchase._id), { amount: 51 }), "أكبر من المتبقي");
    await bills.createBill({ customerName: "x", items: [{ productId: pid, name: "C - P", count: 15, price: 15, location: "المحل" }] });
    await fails(purchasesApi.deletePurchase(String(purchase._id)), "المتاح");
    expect(await count(pid)).toBe(5);

    // ── expenses ──
    await expensesApi.createExpense({ title: "إيجار", amount: 500 });
    await fails(expensesApi.createExpense({ title: "x", amount: 0 }));
    expect((await expensesApi.getExpenses()).length).toBe(1);
    expect((await expensesApi.getMonthlyExpenses())[0].total).toBe(500);

    // ── daily report ──
    const day = await reports.getDailyReport(new Date(Date.now() - 24 * 3600 * 1000).toISOString(), new Date(Date.now() + 3600 * 1000).toISOString());
    expect(day.billsCount).toBeGreaterThan(0);
    expect(day.expenses).toBe(500);
    expect(day.purchases).toBe(200);
    expect(day.returns).toBe(40);
    expect(day.collected).toBeGreaterThanOrEqual(120);

    // ── stocktake ──
    await fails(reports.applyStocktake({ items: [{ id: pid, count: -1 }] }));
    await reports.applyStocktake({ items: [{ id: pid, count: 42 }] });
    expect(await count(pid)).toBe(42);

    // ── profits count returns on the day they came back ──
    const rows = await analytics.getYearlyMonthlyProfits();
    expect(rows.length).toBeGreaterThan(0);
});
