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
    developerId?: string;
    customerName: string;
    items: TBillItem[];
    total: number;
    createdAt: Date;
    updatedAt: Date;
};

type BillDocument = Omit<TBill, "_id"> & Document;

const billItemSchema = new Schema<TBillItem>(
    {
        productId: { type: String },
        name: { type: String, required: true },
        count: { type: Number, required: true },
        price: { type: Number, required: true },
        location: { type: String },
    },
    { _id: false },
);

const billSchema = new Schema<BillDocument>(
    {
        userId: { type: String, required: true, index: true },
        developerId: { type: String, index: true },
        customerName: { type: String, required: true },
        items: { type: [billItemSchema], required: true },
        total: { type: Number, required: true },
    },
    { timestamps: true },
);

billSchema.index({ userId: 1, createdAt: -1 });

export const Bill: Model<BillDocument> = mongoose.models.Bill || mongoose.model<BillDocument>("Bill", billSchema);
