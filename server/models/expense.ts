import mongoose, { Document, Model, Schema } from "mongoose";

export type TExpense = {
    _id: string;
    userId: string;
    title: string;
    category?: string;
    amount: number;
    date: Date;
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

type ExpenseDocument = Omit<TExpense, "_id"> & Document;

const expenseSchema = new Schema<ExpenseDocument>(
    {
        userId: { type: String, required: true, index: true },
        title: { type: String, required: true, trim: true },
        category: { type: String, trim: true },
        amount: { type: Number, required: true },
        date: { type: Date, required: true, default: Date.now },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

expenseSchema.index({ userId: 1, date: -1 });

export const Expense: Model<ExpenseDocument> = mongoose.models.Expense || mongoose.model<ExpenseDocument>("Expense", expenseSchema);
