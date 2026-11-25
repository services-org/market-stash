import mongoose, { Document, Model, Schema } from "mongoose";

export type TPurchaseItem = {
    productId: string;
    name: string;
    count: number;
    /** Buy price per unit in this purchase. */
    buyPrice: number;
};

export type TPurchase = {
    _id: string;
    supplierName: string;
    phone?: string;
    items: TPurchaseItem[];
    total: number;
    /** Amount paid to the supplier so far. */
    paid: number;
    notes?: string;
    payments?: { amount: number; at: Date }[];
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

type PurchaseDocument = Omit<TPurchase, "_id"> & Document;

const itemSchema = new Schema<TPurchaseItem>(
    {
        productId: { type: String, required: true },
        name: { type: String, required: true, trim: true },
        count: { type: Number, required: true },
        buyPrice: { type: Number, required: true },
    },
    { _id: false },
);

const purchaseSchema = new Schema<PurchaseDocument>(
    {
        supplierName: { type: String, required: true, trim: true },
        phone: { type: String, trim: true },
        items: { type: [itemSchema], required: true },
        total: { type: Number, required: true },
        paid: { type: Number, required: true, default: 0 },
        notes: { type: String, trim: true },
        payments: { type: [new Schema({ amount: Number, at: { type: Date, default: Date.now } }, { _id: false })], default: undefined },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

purchaseSchema.index({ createdAt: -1 });

export const Purchase: Model<PurchaseDocument> = mongoose.models.Purchase || mongoose.model<PurchaseDocument>("Purchase", purchaseSchema);
