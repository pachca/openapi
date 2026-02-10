import { search } from '@/lib/search/indexer';
import { NextResponse } from 'next/server';

const MAX_QUERY_LENGTH = 200;

// Simple in-memory rate limiter: IP → timestamps
const rateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // max requests per window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimit.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  rateLimit.set(ip, recent);

  // Prevent memory leak: clean up old entries periodically
  if (rateLimit.size > 10_000) {
    for (const [key, ts] of rateLimit) {
      if (ts.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) rateLimit.delete(key);
    }
  }

  return recent.length > RATE_LIMIT_MAX;
}

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').slice(0, MAX_QUERY_LENGTH);

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const results = await search(query);

  return NextResponse.json({
    results: results.slice(0, 20),
  });
}
