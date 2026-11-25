import { isValidObjectId } from "mongoose";

import { connectDB } from "@/server/config/database";
import { Expense } from "@/server/models/expense";
import { AppError } from "@/server/errors";
import { expenseInput } from "@/server/validation";
import { SHOP_TIMEZONE } from "@/lib/constants";

export async function getExpenses() {
    await connectDB();

    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    return Expense.find({ deletedAt: null, date: { $gte: twoYearsAgo } })
        .sort({ date: -1, createdAt: -1 })
        .lean();
}

/** Expenses per month (for net profit). */
export async function getMonthlyExpenses() {
    await connectDB();

    return Expense.aggregate<{ year: number; month: number; total: number }>([
        { $match: { deletedAt: null } },
        {
            $group: {
                _id: { year: { $year: { date: "$date", timezone: SHOP_TIMEZONE } }, month: { $month: { date: "$date", timezone: SHOP_TIMEZONE } } },
                total: { $sum: "$amount" },
            },
        },
        { $project: { _id: 0, year: "$_id.year", month: "$_id.month", total: 1 } },
        { $sort: { year: 1, month: 1 } },
    ]);
}

export async function createExpense(body: unknown) {
    await connectDB();
    const data = expenseInput.parse(body);

    const date = data.date ? new Date(data.date) : new Date();
    if (Number.isNaN(date.getTime())) throw new AppError("تاريخ غير صالح");

    return Expense.create({ title: data.title, category: data.category, amount: data.amount, date });
}

export async function deleteExpense(id: string) {
    await connectDB();
    if (!isValidObjectId(id)) throw new AppError("Expense not found", 404);

    const expense = await Expense.findOneAndUpdate({ _id: id, deletedAt: null }, { deletedAt: new Date() }, { returnDocument: "after" });
    if (!expense) throw new AppError("Expense not found", 404);
    return expense;
}

export async function restoreExpense(id: string) {
    await connectDB();
    if (!isValidObjectId(id)) throw new AppError("Expense not found", 404);

    const expense = await Expense.findOneAndUpdate({ _id: id, deletedAt: { $ne: null } }, { deletedAt: null }, { returnDocument: "after" });
    if (!expense) throw new AppError("Expense not found", 404);
    return expense;
}
