import mongoose, { Model, Schema } from "mongoose";

type TCounter = { key: string; seq: number };

const counterSchema = new Schema<TCounter>({
    key: { type: String, required: true },
    seq: { type: Number, default: 0 },
});

counterSchema.index({ key: 1 }, { unique: true });

export const Counter: Model<TCounter> = mongoose.models.Counter || mongoose.model<TCounter>("Counter", counterSchema);

/** Atomically returns the next sequence number for the given key. */
export async function nextSequence(key: string) {
    const doc = await Counter.findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
    return doc.seq;
}
