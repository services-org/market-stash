import mongoose, { Document, Model, Schema } from "mongoose";

export type TProduct = {
    _id: string;
    name: string;
    company: string;
    price: number;
    count: number;
    location: string;
    userId: string;
    developerId?: string;
    createdAt: Date;
    updatedAt: Date;
};

type ProductDocument = Omit<TProduct, "_id"> & Document;

const productSchema = new Schema<ProductDocument>(
    {
        userId: { type: String, required: true, index: true },
        developerId: { type: String, index: true },

        company: { type: String, required: true },
        name: { type: String, required: true },

        count: { type: Number, required: true, default: 0 },
        price: { type: Number, required: true, default: 0 },

        location: { type: String, required: true },
    },
    { timestamps: true },
);

productSchema.index({ userId: 1, location: 1 });
productSchema.index({ userId: 1, company: 1 });

export const Product: Model<ProductDocument> = mongoose.models.Product || mongoose.model<ProductDocument>("Product", productSchema);
