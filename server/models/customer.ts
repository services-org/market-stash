import mongoose, { Document, Model, Schema } from "mongoose";

/** A customer saved on purpose (from the customers page or from a bill), so it can be picked again later. */
export type TCustomerRecord = {
    _id: string;
    name: string;
    phone?: string;
    address?: string;
    createdAt: Date;
    updatedAt: Date;
};

type CustomerDocument = Omit<TCustomerRecord, "_id"> & Document;

const customerSchema = new Schema<CustomerDocument>(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, trim: true },
        address: { type: String, trim: true },
    },
    { timestamps: true },
);

customerSchema.index({ name: 1 }, { unique: true });

export const CustomerRecord: Model<CustomerDocument> = mongoose.models.CustomerRecord || mongoose.model<CustomerDocument>("CustomerRecord", customerSchema);

/** Saves (or updates) a customer. Empty phone / address never erase what is already saved. */
export async function saveCustomer(data: { name: string; phone?: string; address?: string }) {
    const name = data.name.trim();
    if (!name) return null;

    const set: Record<string, string> = {};
    if (data.phone?.trim()) set.phone = data.phone.trim();
    if (data.address?.trim()) set.address = data.address.trim();

    return CustomerRecord.findOneAndUpdate(
        { name },
        { $setOnInsert: { name },...(Object.keys(set).length ? { $set: set } : {}) },
        { upsert: true, returnDocument: "after" },
    );
}
