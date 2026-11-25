// Shared helpers for the maintenance scripts (run with `bun scripts/<name>.mjs`; bun loads .env).
import mongoose from "mongoose";

export const BSON = mongoose.mongo.BSON;

export async function connect({ localOnly = false } = {}) {
    const uri = process.env.DATABASE_URI || process.env.DATABASE_URL;
    if (!uri) throw new Error("DATABASE_URI / DATABASE_URL is not set");

    const { hostname, pathname } = new URL(uri);
    const isLocal = ["127.0.0.1", "localhost", "::1"].includes(hostname);
    console.log(`Database: ${hostname}${pathname} (${isLocal ? "local" : "REMOTE"})`);

    if (localOnly && !isLocal) throw new Error("This script only runs against a local database.");

    await mongoose.connect(uri);
    return mongoose.connection.db;
}
