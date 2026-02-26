import mongoose, { Document, Model, Schema } from "mongoose";

export type TProduct = {
    _id: string;
    name: string;
    company: string;
    buyPrice: number;
    sellPrice: number;
    count: number;
    location: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
};

type ProductDocument = Omit<TProduct, "_id"> & Document;

const productSchema = new Schema<ProductDocument>(
    {
        userId: { type: String, required: true, index: true },

        company: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true },

        buyPrice: { type: Number, required: true, default: 0 },
        sellPrice: { type: Number, required: true, default: 0 },

        count: { type: Number, required: true, default: 0 },
        location: { type: String, required: true, trim: true },
    },
    { timestamps: true },
);

productSchema.index({ userId: 1, location: 1 });
productSchema.index({ userId: 1, company: 1 });

export const Product: Model<ProductDocument> = mongoose.models.Product || mongoose.model<ProductDocument>("Product", productSchema);
