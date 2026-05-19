import { NextResponse } from 'next/server';

export const ok = (data, status = 200) => NextResponse.json(data, { status });
export const fail = (message, status = 400, extra = {}) =>
  NextResponse.json({ message, ...extra }, { status });

export async function handler(fn) {
  try {
    return await fn();
  } catch (err) {
    const status = err.status || 500;
    console.error('[API error]', err.message);
    return fail(err.message || 'Server error', status);
  }
}

export const toJSON = (doc) => JSON.parse(JSON.stringify(doc));
