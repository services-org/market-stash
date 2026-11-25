import mongoose, { Document, Model, Schema } from "mongoose";

export type TBillItem = {
    productId?: string;
    name: string;
    count: number;
    price: number;
    /** Buy price snapshot at the time of sale (used for accurate profit). */
    buyPrice?: number;
    location?: string;
};

/** Goods the customer gave back after the sale. */
export type TBillReturn = {
    productId?: string;
    name: string;
    count: number;
    price: number;
    buyPrice?: number;
    location?: string;
    at: Date;
};

/** A payment received after the bill was created. */
export type TBillPayment = { amount: number; at: Date };

export type TBill = {
    _id: string;
    userId: string;
    /** Sequential invoice number per user. Missing on legacy bills. */
    number?: number;
    customerName: string;
    phone?: string;
    address?: string;
    deliveryDate?: string;
    representative?: string;
    items: TBillItem[];
    /** Sum of items (before discount). */
    total: number;
    discount?: number;
    /** Amount paid. Missing (legacy) means fully paid. */
    paid?: number;
    notes?: string;
    returns?: TBillReturn[];
    payments?: TBillPayment[];
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

type BillDocument = Omit<TBill, "_id"> & Document;

const billItemSchema = new Schema<TBillItem>(
    {
        productId: { type: String },
        name: { type: String, required: true, trim: true },
        count: { type: Number, required: true },
        price: { type: Number, required: true },
        buyPrice: { type: Number },
        location: { type: String, trim: true },
    },
    { _id: false },
);

const billReturnSchema = new Schema<TBillReturn>(
    {
        productId: { type: String },
        name: { type: String, required: true, trim: true },
        count: { type: Number, required: true },
        price: { type: Number, required: true },
        buyPrice: { type: Number },
        location: { type: String, trim: true },
        at: { type: Date, default: Date.now },
    },
    { _id: false },
);

const billPaymentSchema = new Schema<TBillPayment>({ amount: { type: Number, required: true }, at: { type: Date, default: Date.now } }, { _id: false });

const billSchema = new Schema<BillDocument>(
    {
        userId: { type: String, required: true, index: true },
        number: { type: Number },
        customerName: { type: String, required: true, trim: true },
        phone: { type: String, trim: true },
        address: { type: String, trim: true },
        deliveryDate: { type: String, trim: true },
        representative: { type: String, trim: true },
        items: { type: [billItemSchema], required: true },
        total: { type: Number, required: true },
        discount: { type: Number },
        paid: { type: Number },
        notes: { type: String, trim: true },
        returns: { type: [billReturnSchema], default: undefined },
        payments: { type: [billPaymentSchema], default: undefined },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

billSchema.index({ userId: 1, createdAt: -1 });
billSchema.index({ userId: 1, customerName: 1 });

export const Bill: Model<BillDocument> = mongoose.models.Bill || mongoose.model<BillDocument>("Bill", billSchema);
