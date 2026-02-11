import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';

const UUID = '396a6837-af46-4168-91b6-dda3d6f6a7f6';

export async function GET(request: NextRequest): Promise<Response> {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse(null, { status: 404 });
  }

  const host = request.headers.get('host') ?? '';
  if (!host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.json(
    { workspace: { root: path.resolve(process.cwd()), uuid: UUID } },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
