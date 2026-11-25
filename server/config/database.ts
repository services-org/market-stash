import mongoose from "mongoose";

type MongooseCache = {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
};

declare global {
    var mongoose: MongooseCache | undefined;
}

global.mongoose ??= { conn: null, promise: null };
const cached = global.mongoose;

export async function connectDB() {
    const MONGODB_URI = (process.env.DATABASE_URI || process.env.DATABASE_URL)!;
    if (!MONGODB_URI) throw new Error("Please define the DATABASE_URI (or DATABASE_URL) environment variable");

    if (cached.conn) return cached.conn;

    cached.promise ??= mongoose.connect(MONGODB_URI, {
        bufferCommands: false,
    });

    cached.conn = await cached.promise;
    return cached.conn;
}
