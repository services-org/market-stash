import { isValidObjectId } from "mongoose";

import { connectDB } from "@/server/config/database";
import { Bill } from "@/server/models/bill";
import { Expense } from "@/server/models/expense";
import { Purchase } from "@/server/models/purchase";
import { Product } from "@/server/models/product";
import { AppError } from "@/server/errors";
import { stocktakeInput } from "@/server/validation";

export type TDailyReport = {
    from: string;
    to: string;
    /** Bills created in the period. */
    billsCount: number;
    /** Sales of those bills after discount (before returns). */
    sales: number;
    /** Money received in the period: down payments of new bills + later payments on any bill. */
    collected: number;
    /** What is still unpaid on the bills created in the period. */
    newDebt: number;
    /** Value of goods returned in the period. */
    returns: number;
    expenses: number;
    purchases: number;
    topItems: { name: string; count: number; total: number }[];
};

const inRange = (date: Date | undefined, from: Date, to: Date) => !!date && date >= from && date < to;

/** Totals for a period (a day, normally). `from` is inclusive, `to` exclusive; both ISO timestamps. */
export async function getDailyReport(fromIso: string, toIso: string): Promise<TDailyReport> {
    await connectDB();

    const from = new Date(fromIso);
    const to = new Date(toIso);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) throw new AppError("فترة غير صالحة");

    const bills = await Bill.find(
        {
            deletedAt: null,
            $or: [{ createdAt: { $gte: from, $lt: to } }, { "payments.at": { $gte: from, $lt: to } }, { "returns.at": { $gte: from, $lt: to } }],
        },
        { total: 1, discount: 1, paid: 1, items: 1, payments: 1, returns: 1, createdAt: 1 },
    ).lean();

    let billsCount = 0;
    let sales = 0;
    let collected = 0;
    let newDebt = 0;
    let returns = 0;
    const items = new Map<string, { name: string; count: number; total: number }>();

    for (const bill of bills) {
        const net = Math.max(0, bill.total - (bill.discount ?? 0));
        const laterPayments = (bill.payments ?? []).reduce((sum, p) => sum + p.amount, 0);
        const returned = (bill.returns ?? []).reduce((sum, r) => sum + r.count * r.price, 0);

        if (inRange(bill.createdAt, from, to)) {
            billsCount += 1;
            sales += net;
            // Whatever was paid beyond the later payments was paid when the bill was made
            collected += Math.max(0, Math.min(bill.paid ?? net, net) - laterPayments);
            newDebt += Math.max(0, net - returned - Math.min(bill.paid ?? net, net - returned));

            for (const item of bill.items) {
                const row = items.get(item.name) ?? { name: item.name, count: 0, total: 0 };
                row.count += item.count;
                row.total += item.count * item.price;
                items.set(item.name, row);
            }
        }

        for (const payment of bill.payments ?? []) if (inRange(payment.at, from, to)) collected += payment.amount;
        for (const r of bill.returns ?? []) if (inRange(r.at, from, to)) returns += r.count * r.price;
    }

    const [expenses, purchases] = await Promise.all([
        Expense.aggregate<{ total: number }>([{ $match: { deletedAt: null, date: { $gte: from, $lt: to } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
        Purchase.aggregate<{ total: number }>([{ $match: { deletedAt: null, createdAt: { $gte: from, $lt: to } } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
    ]);

    return {
        from: from.toISOString(),
        to: to.toISOString(),
        billsCount,
        sales,
        collected,
        newDebt,
        returns,
        expenses: expenses[0]?.total ?? 0,
        purchases: purchases[0]?.total ?? 0,
        topItems: [...items.values()].sort((a, b) => b.total - a.total).slice(0, 5),
    };
}

/** Sets the counted quantity of several products at once (stocktake). */
export async function applyStocktake(body: unknown) {
    await connectDB();
    const { items } = stocktakeInput.parse(body);
    if (items.some(({ id }) => !isValidObjectId(id))) throw new AppError("منتج غير صالح");

    const result = await Product.bulkWrite(
        items.map(({ id, count }) => ({ updateOne: { filter: { _id: id, deletedAt: null }, update: { $set: { count } } } })),
    );
    return { updated: result.modifiedCount };
}
