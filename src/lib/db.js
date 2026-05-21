import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

let cached = global.__mongoose;
if (!cached) cached = global.__mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        // Kept under the serverless 10s function limit so a bad connection
        // fails fast with a real error instead of timing out the whole request.
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
      })
      .then((m) => {
        console.log(`✅ MongoDB connected: ${m.connection.host}/${m.connection.name}`);
        return m;
      })
      .catch((err) => {
        // Reset so the next request can retry instead of reusing a rejected promise.
        cached.promise = null;
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
