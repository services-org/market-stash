import mongoose, { Document, Model, Schema } from "mongoose";

export type TProduct = {
    _id: string;
    name: string;
    company: string;
    buyPrice: number;
    sellPrice: number;
    count: number;
    location: string;
    barcode?: string;
    /** Low-stock threshold. Falls back to DEFAULT_MIN_STOCK when missing. */
    minStock?: number;
    userId: string;
    deletedAt?: Date | null;
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

        barcode: { type: String, trim: true },
        minStock: { type: Number },

        deletedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

productSchema.index({ userId: 1, location: 1 });
productSchema.index({ userId: 1, company: 1 });
// A product is unique per company / name / location. `deletedAt` is part of the key so a
// soft-deleted product does not block re-adding the same product.
productSchema.index({ userId: 1, company: 1, name: 1, location: 1, deletedAt: 1 }, { unique: true });

export const Product: Model<ProductDocument> = mongoose.models.Product || mongoose.model<ProductDocument>("Product", productSchema);
