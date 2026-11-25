import mongoose, { Document, Model, Schema } from "mongoose";

export type TBillItem = {
    productId?: string;
    name: string;
    count: number;
    price: number;
    location?: string;
};

export type TBill = {
    _id: string;
    userId: string;
    customerName: string;
    phone?: string;
    address?: string;
    deliveryDate?: string;
    representative?: string;
    items: TBillItem[];
    total: number;
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
        location: { type: String, trim: true },
    },
    { _id: false },
);

const billSchema = new Schema<BillDocument>(
    {
        userId: { type: String, required: true, index: true },
        customerName: { type: String, required: true, trim: true },
        phone: { type: String, trim: true },
        address: { type: String, trim: true },
        deliveryDate: { type: String, trim: true },
        representative: { type: String, trim: true },
        items: { type: [billItemSchema], required: true },
        total: { type: Number, required: true },
    },
    { timestamps: true },
);

billSchema.index({ userId: 1, createdAt: -1 });

export const Bill: Model<BillDocument> = mongoose.models.Bill || mongoose.model<BillDocument>("Bill", billSchema);
