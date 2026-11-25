import mongoose, { Model, Schema } from "mongoose";

type TCounter = { userId: string; key: string; seq: number };

const counterSchema = new Schema<TCounter>({
    userId: { type: String, required: true },
    key: { type: String, required: true },
    seq: { type: Number, default: 0 },
});

counterSchema.index({ userId: 1, key: 1 }, { unique: true });

export const Counter: Model<TCounter> = mongoose.models.Counter || mongoose.model<TCounter>("Counter", counterSchema);

/** Atomically returns the next sequence number for the given user + key. */
export async function nextSequence(userId: string, key: string) {
    const doc = await Counter.findOneAndUpdate({ userId, key }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
    return doc.seq;
}
