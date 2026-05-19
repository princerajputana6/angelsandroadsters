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
      .connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
      .then((m) => {
        console.log(`✅ MongoDB connected: ${m.connection.host}/${m.connection.name}`);
        return m;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
