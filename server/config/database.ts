import mongoose from "mongoose";

const MONGODB_URI = process.env.DATABASE_URI!;

if (!MONGODB_URI) {
    throw new Error("Please define the DATABASE_URI environment variable");
}

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
    if (cached.conn) return cached.conn;

    cached.promise ??= mongoose.connect(MONGODB_URI, {
        bufferCommands: false,
    });

    cached.conn = await cached.promise;
    return cached.conn;
}
