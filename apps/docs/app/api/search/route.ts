import { search } from '@/lib/search/indexer';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const results = await search(query);
  
  return NextResponse.json({ 
    results: results.slice(0, 20) // Limit to 20 results
  });
}
