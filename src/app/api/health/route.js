import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ status: 'degraded', error: err.message }, { status: 500 });
  }
}
